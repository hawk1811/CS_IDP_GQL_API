// auth.js

let sessionTimer;
let currentTable = null;

// Security Functions
function encryptData(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY.toString()).toString();
}

function decryptData(encryptedData) {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY.toString());
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
}

function setSecureData(key, data) {
    const encrypted = encryptData(data);
    sessionStorage.setItem(key, encrypted);
}

function getSecureData(key) {
    const encrypted = sessionStorage.getItem(key);
    return encrypted ? decryptData(encrypted) : null;
}

// API Request Handler
async function makeProxyRequest(targetUrl, method, headers, body) {
    try {
        const proxyRequest = {
            url: targetUrl,
            method: method,
            headers: headers,
            body: body
        };

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(proxyRequest)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Proxy error:', errorText);
            throw new Error(`Proxy request failed: ${response.status} - ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                return text;
            }
        }
    } catch (error) {
        console.error('Proxy request error:', error);
        throw error;
    }
}

// GraphQL Request Handler
async function makeGraphQLRequest(query) {
    const auth = getSecureData('auth');
    if (!auth) {
        logout();
        return null;
    }

    return makeProxyRequest(
        `${API_REGIONS[auth.region]}/identity-protection/combined/graphql/v1`,
        'POST',
        {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json'
        },
        { query }
    );
}

// Session Management
function startSessionTimer() {
    const endTime = Date.now() + SESSION_TIMEOUT;
    
    sessionTimer = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());
        if (remaining === 0) {
            logout();
            return;
        }
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        $('#sessionTimer').html(
            `<i class="fas fa-clock mr-2"></i>${minutes}:${seconds.toString().padStart(2, '0')}`
        );
    }, 1000);
}

// External IP Fetching
async function fetchExternalIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        $('#externalIP').html(`<i class="fas fa-globe mr-2"></i>External IP: ${data.ip}`);
    } catch (error) {
        console.error('Error fetching IP:', error);
        $('#externalIP').html('<i class="fas fa-exclamation-triangle mr-2"></i>IP Fetch Failed');
    }
}

// Authentication Handler
$('#authForm').on('submit', async function(e) {
    e.preventDefault();
    
    try {
        const clientId = $('#clientId').val();
        const clientSecret = $('#clientSecret').val();
        const region = $('#region').val();
        
        const response = await makeProxyRequest(
            `${API_REGIONS[region]}/oauth2/token`,
            'POST',
            {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`
        );
        
        setSecureData('auth', {
            token: response.access_token,
            region: region
        });
        
        $('#loginForm').hide();
        $('#dashboard').removeClass('hidden');
        startSessionTimer();
        fetchExternalIP();
        await fetchDomains(); // Fetch domains after successful authentication
    } catch (error) {
        $('#loginError')
            .text('Authentication failed. Please verify your credentials.')
            .removeClass('hidden');
    }
});

// Token Refresh Function
async function refreshToken() {
    try {
        const auth = getSecureData('auth');
        if (!auth) {
            logout();
            return;
        }

        const clientId = $('#clientId').val();
        const clientSecret = $('#clientSecret').val();
        const region = auth.region;

        const response = await makeProxyRequest(
            `${API_REGIONS[region]}/oauth2/token`,
            'POST',
            {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`
        );

        setSecureData('auth', {
            token: response.access_token,
            region: region
        });

        // Reset session timer
        clearInterval(sessionTimer);
        startSessionTimer();

        // Show success message
        const successMessage = $('<div class="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">Token refreshed successfully</div>');
        $('body').append(successMessage);
        setTimeout(() => successMessage.remove(), 3000);
    } catch (error) {
        const errorMessage = $('<div class="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg">Failed to refresh token</div>');
        $('body').append(errorMessage);
        setTimeout(() => errorMessage.remove(), 3000);
    }
}

// Logout Handler
function logout() {
    sessionStorage.clear();
    clearInterval(sessionTimer);
    $('#dashboard').addClass('hidden');
    $('#loginForm').show();
    $('#authForm')[0].reset();
    $('#loginError').addClass('hidden');
    currentTable = null;
}

// DataTable initialization utility
function initializeDataTable(tableId, columns, data, queryType = '') {
    if (currentTable) {
        currentTable.destroy();
        $(`#${tableId}`).empty();
    }
    
    const tableContainer = $('<div class="table-responsive"></div>');
    const table = $('<table class="w-full display"></table>').attr('id', `${tableId}-table`);
    tableContainer.append(table);
    $(`#${tableId}`).append(tableContainer);

    // Generate file name based on query type and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `${queryType || tableId}_${timestamp}`;

    const tableConfig = {
        ...DEFAULT_TABLE_CONFIG,
        data: data,
        columns: columns,
        buttons: [{
            extend: 'csv',
            text: '<i class="fas fa-file-csv mr-2"></i>Export CSV',
            className: 'dt-button cyber-button',
            filename: fileName,
            exportOptions: {
                modifier: {
                    search: 'applied',
                    order: 'applied'
                }
            }
        }]
    };

    currentTable = table.DataTable(tableConfig);

    return currentTable;
}

// Session Security Event Handlers
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        const lastActiveTime = Date.now();
        setSecureData('lastActiveTime', lastActiveTime);
    } else {
        const lastActiveTime = getSecureData('lastActiveTime');
        if (lastActiveTime && (Date.now() - lastActiveTime) > SESSION_TIMEOUT) {
            logout();
        }
    }
});

// Page Cleanup
window.addEventListener('beforeunload', () => {
    sessionStorage.clear();
    clearInterval(sessionTimer);
});

// Navigation Protection
window.addEventListener('popstate', () => {
    if (!getSecureData('auth')) {
        history.pushState(null, '', window.location.href);
    }
});