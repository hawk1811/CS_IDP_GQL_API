// service-access.js

// Global variables for service access management
let selectedProtocolsList = new Set();
let selectedServicesList = new Set();

// Initialize the service access section HTML
function initializeServiceAccessSection() {
    const section = document.getElementById('serviceAccessSection');
    section.innerHTML = `
        <h3 class="text-lg font-bold mb-4">Service Access Query</h3>

        <p class="text-gray-400 mb-4">Note: This query can take a long time to execute depending on the amount of data requested.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Protocol Type Selection -->
            <div class="space-y-4">
                <div class="multiselect-dropdown">
                    <button class="cyber-input w-full px-4 py-2 text-left flex justify-between items-center" onclick="toggleProtocolDropdown(event)">
                        <span>Select Protocol Types</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div id="protocolDropdownList" class="multiselect-dropdown-list">
                        <!-- Protocol types will be populated here -->
                    </div>
                </div>
                <div id="selectedProtocols" class="selected-items"></div>
            </div>

            <!-- Service Type Selection -->
            <div class="space-y-4">
                <div class="multiselect-dropdown">
                    <button class="cyber-input w-full px-4 py-2 text-left flex justify-between items-center" onclick="toggleServiceDropdown(event)">
                        <span>Select Service Types</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div id="serviceDropdownList" class="multiselect-dropdown-list">
                        <!-- Service types will be populated here -->
                    </div>
                </div>
                <div id="selectedServices" class="selected-items"></div>
            </div>
        </div>

        <!-- Data Retrieval Options -->
        <div class="mb-6">
            <label for="dataRetrievalLimit" class="block text-gray-300 text-sm font-semibold mb-2">Select Data Retrieval Limit</label>
            <select id="dataRetrievalLimit" class="cyber-input w-full px-4 py-2" onchange="toggleCustomInput()">
                <option value="1000">Last 1,000</option>
                <option value="5000">Last 5,000</option>
                <option value="10000">Last 10,000</option>
                <option value="50000">Last 50,000</option>
                <option value="100000">Last 100,000</option>
                <option value="all">All</option>
                <option value="custom">Custom (in increments of 1000)</option>
            </select>
            <input type="number" id="customDataLimit" class="cyber-input w-full mt-2 hidden" 
                   placeholder="Enter custom limit in increments of 1000">
        </div>

        <button onclick="executeServiceAccessQuery()" class="cyber-button w-full">
            <i class="fas fa-play mr-2"></i>Execute Query
        </button>

        <div id="serviceAccessResults"></div>
    `;

    // Initialize dropdowns
    initializeProtocolDropdown();
    initializeServiceDropdown();
}

// Initialize dropdown contents
function initializeProtocolDropdown() {
    const protocolList = document.getElementById('protocolDropdownList');
    protocolList.innerHTML = `
        <div class="p-2">
            <label class="flex items-center p-2 hover:bg-blue-500/20">
                <input type="checkbox" class="mr-2" onchange="toggleAllProtocols(this)">
                <span>Select All</span>
            </label>
            ${PROTOCOL_TYPES.map(type => `
                <label class="flex items-center p-2 hover:bg-blue-500/20">
                    <input type="checkbox" class="mr-2" value="${type}" onchange="updateProtocolSelection(this)">
                    <span>${type}</span>
                </label>
            `).join('')}
        </div>
    `;
}

function initializeServiceDropdown() {
    const serviceList = document.getElementById('serviceDropdownList');
    serviceList.innerHTML = `
        <div class="p-2">
            <label class="flex items-center p-2 hover:bg-blue-500/20">
                <input type="checkbox" class="mr-2" onchange="toggleAllServices(this)">
                <span>Select All</span>
            </label>
            ${SERVICE_TYPES.map(type => `
                <label class="flex items-center p-2 hover:bg-blue-500/20">
                    <input type="checkbox" class="mr-2" value="${type}" onchange="updateServiceSelection(this)">
                    <span>${type}</span>
                </label>
            `).join('')}
        </div>
    `;
}

// Dropdown toggle functions
function toggleProtocolDropdown(event) {
    event.preventDefault();
    const list = document.getElementById('protocolDropdownList');
    list.classList.toggle('show');
}

function toggleServiceDropdown(event) {
    event.preventDefault();
    const list = document.getElementById('serviceDropdownList');
    list.classList.toggle('show');
}

// Selection update functions
function updateProtocolSelection(checkbox) {
    if (checkbox.checked) {
        selectedProtocolsList.add(checkbox.value);
    } else {
        selectedProtocolsList.delete(checkbox.value);
        document.querySelector('#protocolDropdownList input[type="checkbox"]:first-child').checked = false;
    }
    updateSelectedProtocolsDisplay();
}

function updateServiceSelection(checkbox) {
    if (checkbox.checked) {
        selectedServicesList.add(checkbox.value);
    } else {
        selectedServicesList.delete(checkbox.value);
        document.querySelector('#serviceDropdownList input[type="checkbox"]:first-child').checked = false;
    }
    updateSelectedServicesDisplay();
}

// Toggle all functions
function toggleAllProtocols(checkbox) {
    const protocolCheckboxes = document.querySelectorAll('#protocolDropdownList input[type="checkbox"]:not(:first-child)');
    protocolCheckboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        if (checkbox.checked) {
            selectedProtocolsList.add(cb.value);
        } else {
            selectedProtocolsList.delete(cb.value);
        }
    });
    updateSelectedProtocolsDisplay();
}

function toggleAllServices(checkbox) {
    const serviceCheckboxes = document.querySelectorAll('#serviceDropdownList input[type="checkbox"]:not(:first-child)');
    serviceCheckboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        if (checkbox.checked) {
            selectedServicesList.add(cb.value);
        } else {
            selectedServicesList.delete(cb.value);
        }
    });
    updateSelectedServicesDisplay();
}

// Display update functions
function updateSelectedProtocolsDisplay() {
    const container = document.getElementById('selectedProtocols');
    container.innerHTML = Array.from(selectedProtocolsList).map(protocol => `
        <div class="selected-item">
            <span>${protocol}</span>
            <span class="remove-item" onclick="removeProtocol('${protocol}')">×</span>
        </div>
    `).join('');
}

function updateSelectedServicesDisplay() {
    const container = document.getElementById('selectedServices');
    container.innerHTML = Array.from(selectedServicesList).map(service => `
        <div class="selected-item">
            <span>${service}</span>
            <span class="remove-item" onclick="removeService('${service}')">×</span>
        </div>
    `).join('');
}

// Remove item functions
function removeProtocol(protocol) {
    selectedProtocolsList.delete(protocol);
    document.querySelector(`#protocolDropdownList input[value="${protocol}"]`).checked = false;
    document.querySelector('#protocolDropdownList input[type="checkbox"]:first-child').checked = false;
    updateSelectedProtocolsDisplay();
}

function removeService(service) {
    selectedServicesList.delete(service);
    document.querySelector(`#serviceDropdownList input[value="${service}"]`).checked = false;
    document.querySelector('#serviceDropdownList input[type="checkbox"]:first-child').checked = false;
    updateSelectedServicesDisplay();
}

// Toggle custom input
function toggleCustomInput() {
    const dataLimitValue = document.getElementById('dataRetrievalLimit').value;
    const customInput = document.getElementById('customDataLimit');
    customInput.classList.toggle('hidden', dataLimitValue !== 'custom');
}

// Execute service access query
async function executeServiceAccessQuery() {
    if (selectedProtocolsList.size === 0 && selectedServicesList.size === 0) {
        alert('Please select at least one protocol type or service type.');
        return;
    }

    try {
        $('#serviceAccessResults').empty().append(
            '<div class="loading-overlay"><i class="fas fa-spinner fa-spin loading-spinner"></i></div>'
        );

        // Build query filters
        let filterPart = 'all:{';
        if (selectedProtocolsList.size > 0) {
            filterPart += ` protocolTypes: [${Array.from(selectedProtocolsList).join(', ')}]`;
        }
        if (selectedServicesList.size > 0) {
            if (selectedProtocolsList.size > 0) filterPart += ',';
            filterPart += ` targetServiceTypes: [${Array.from(selectedServicesList).join(', ')}]`;
        }
        filterPart += ' }';

        // Get data retrieval limit
        const dataLimitValue = $('#dataRetrievalLimit').val();
        let dataLimit = 1000;
        if (dataLimitValue === 'custom') {
            const customLimit = parseInt($('#customDataLimit').val(), 10);
            if (isNaN(customLimit) || customLimit <= 0) {
                alert('Please enter a valid custom data limit.');
                $('.loading-overlay').remove();
                return;
            }
            dataLimit = customLimit;
        } else if (dataLimitValue !== 'all') {
            dataLimit = parseInt(dataLimitValue, 10);
        }

        const allResults = [];
        let hasNextPage = true;
        let cursor = null;

        while (hasNextPage && (!dataLimit || allResults.length < dataLimit)) {
            const query = `{
                timeline(
                    types: [SERVICE_ACCESS]
                    activityQuery: { ${filterPart} }
                    first: 1000
					sortOrder: DESCENDING
                    ${cursor ? `after: "${cursor}"` : ''}
                ) {
                    pageInfo {
                        hasNextPage
                        startCursor
                    }
                    nodes {
                        timestamp
                        eventType
                        eventLabel
                        ... on TimelineServiceAccessEvent {
                            protocolType
                            ipAddress
                            userEntity {
                                primaryDisplayName
                                secondaryDisplayName
                            }
                            targetEndpointEntity {
                                hostName
                                lastIpAddress
                            }
                        }
                    }
                }
            }`;

            const response = await makeGraphQLRequest(query);

            if (response.data.timeline.nodes) {
                const pageResults = response.data.timeline.nodes.map(node => ({
                    timestamp: new Date(node.timestamp),
                    ipAddress: node.ipAddress,
                    primaryDisplayName: node.userEntity.primaryDisplayName,
                    secondaryDisplayName: node.userEntity.secondaryDisplayName,
                    hostName: node.targetEndpointEntity.hostName,
                    targetIp: node.targetEndpointEntity.lastIpAddress,
                    eventLabel: node.eventLabel,
                    protocolType: node.protocolType,
                }));

                allResults.push(...pageResults);

                // Update progress
                $('.loading-spinner').parent().html(
                    `<i class="fas fa-spinner fa-spin loading-spinner"></i> Loading... (${allResults.length} records)`
                );
            }

            hasNextPage = response.data.timeline.pageInfo.hasNextPage;
            cursor = response.data.timeline.pageInfo.startCursor;

            if (dataLimit && allResults.length >= dataLimit) break;
        }

        if (allResults.length > 0) {
            initializeDataTable('serviceAccessResults', [
                { title: "Time", data: "timestamp", render: data => data.toLocaleString() },
                { title: "Source IP", data: "ipAddress" },
                { title: "Source Name", data: "primaryDisplayName" },
                { title: "Source User", data: "secondaryDisplayName" },
                { title: "Target Host", data: "hostName" },
                { title: "Target IP", data: "targetIp" },
                { title: "Event Name", data: "eventLabel" },
                { title: "Protocol Type", data: "protocolType" }
            ], allResults, 'ServiceAccess'); 

            currentTable.order([0, 'desc']).draw();
        }
    } catch (error) {
        alert('Error executing service access query: ' + error.message);
    } finally {
        $('.loading-overlay').remove();
    }
}

// View management
function showServiceAccess() {
    $('#domainRisksSection').hide();
    $('#entityQueriesSection').hide();
    if (!$('#serviceAccessSection').html()) {
        initializeServiceAccessSection();
    }
    $('#serviceAccessSection').show();
}
