// config.js

// Security Configuration
const ENCRYPTION_KEY = CryptoJS.lib.WordArray.random(32);
const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

// API Configuration
const API_REGIONS = {
    us1: 'https://api.crowdstrike.com',
    us2: 'https://api.us-2.crowdstrike.com',
    eu1: 'https://api.eu-1.crowdstrike.com',
    gov1: 'https://api.laggar.gcw.crowdstrike.com'
};

const PROXY_URL = 'http://localhost:8000';

// Protocol Types Configuration
const PROTOCOL_TYPES = ['KERBEROS', 'LDAP', 'NTLM', 'DCE_RPC', 'SSL', 'UNKNOWN'];

// Service Types Configuration
const SERVICE_TYPES = [
    'LDAP', 'WEB', 'FILE_SHARE', 'DB', 'RPCSS', 'REMOTE_DESKTOP', 
    'SCCM', 'SIP', 'DNS', 'MAIL', 'NTLM', 'COMPUTER_ACCESS', 
    'GENERIC_CLOUD', 'SERVICE_ACCOUNT', 'UNKNOWN'
];

// Entity Queries Configuration
const ENTITY_QUERIES = {
    'accountLocked': 'Find locked accounts',
    'cloudEnabled': 'Find accounts with SSO enabled',
    'cloudOnly': 'Find cloud-only accounts',
    'hasAgedPassword': 'Find accounts with old passwords',
    'hasAgent': 'Find accounts with Falcon sensor',
    'hasExposedPassword': 'Find accounts with exposed passwords',
    'hasNeverExpiringPassword': 'Find accounts with non-expiring passwords',
    'hasOpenIncidents': 'Find accounts with open incidents',
    'hasVulnerableOs': 'Find endpoints with vulnerable OS',
    'hasWeakPassword': 'Find accounts with weak passwords',
    'inactive': 'Find inactive accounts',
    'learned': 'Find learned entities',
    'marked': 'Find marked entities',
    'shared': 'Find shared accounts',
    'stale': 'Find stale accounts',
    'unmanaged': 'Find unmanaged endpoints',
    'watched': 'Find watched entities'
};

// DataTable Configuration
const DEFAULT_TABLE_CONFIG = {
    processing: true,
    dom: 'Blfrtip',
    pageLength: 50,
    lengthMenu: [[10, 25, 50, 100, 250, 500], [10, 25, 50, 100, 250, 500]],
    responsive: true,
    language: {
        processing: '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...',
        search: "<i class='fas fa-search mr-2'></i>Filter records:",
        lengthMenu: "<i class='fas fa-list mr-2'></i>Show _MENU_ entries",
        info: "<i class='fas fa-info-circle mr-2'></i>Showing _START_ to _END_ of _TOTAL_ entries",
        paginate: {
            first: '<i class="fas fa-angle-double-left"></i>',
            last: '<i class="fas fa-angle-double-right"></i>',
            next: '<i class="fas fa-angle-right"></i>',
            previous: '<i class="fas fa-angle-left"></i>'
        }
    },
    buttons: {
        dom: {
            button: {
                className: 'dt-button cyber-button'
            }
        },
        buttons: []  // We'll add buttons dynamically based on context
    },
    initComplete: function() {
        // Style the length menu
        $('.dataTables_length select').addClass('cyber-input');
        $('.dataTables_filter input').addClass('cyber-input');
    }
};