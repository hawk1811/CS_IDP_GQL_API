// domain-assessment.js

// State management for domain assessment
const domainAssessment = {
    availableDomains: [],
    selectedDomains: new Set(),
    currentAssessmentResults: null
};

// Initialize the domain assessment section
function initializeDomainAssessmentSection() {
    // Create the section content
    const sectionContent = `
        <div class="glass-effect p-6">
            <h3 class="text-lg font-bold mb-4">Domain Risks Assessment</h3>
            
            <!-- Domain Selection -->
            <div class="space-y-4 mb-6">
                <div class="multiselect-dropdown">
                    <button class="cyber-input w-full px-4 py-2 text-left flex justify-between items-center" 
                            onclick="domainAssessment.toggleDropdown(event)">
                        <span>Select Domains</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div id="domainDropdownList" class="multiselect-dropdown-list">
                        <!-- Domains populated dynamically -->
                    </div>
                </div>
                
                <!-- Selected domains display -->
                <div id="selectedDomains" class="selected-items"></div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4 mb-6">
                <button onclick="domainAssessment.executeAssessment()" class="cyber-button flex-1">
                    <i class="fas fa-play mr-2"></i>Run Assessment
                </button>
            </div>

            <!-- Results Table -->
            <div id="domainRisksTable" class="w-full"></div>
        </div>
    `;

    // Set the content and initialize the section
    const section = document.getElementById('domainRisksSection');
    section.innerHTML = sectionContent;

    // Initialize event listeners for document clicks
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.multiselect-dropdown')) {
            const dropdownList = document.getElementById('domainDropdownList');
            if (dropdownList) {
                dropdownList.classList.remove('show');
            }
        }
    });
}

// Domain assessment methods
domainAssessment.fetchDomains = async function() {
    try {
        const response = await makeGraphQLRequest(`
            {
                domains(dataSources: [])
            }
        `);

        this.availableDomains = response.data.domains;
        this.populateDropdown();
    } catch (error) {
        console.error('Error fetching domains:', error);
        alert('Failed to fetch domains. Please check your connection and try again.');
    }
};

domainAssessment.populateDropdown = function() {
    const dropdownList = document.getElementById('domainDropdownList');
    if (!dropdownList) return;

    dropdownList.innerHTML = `
        <div class="p-2">
            <label class="flex items-center p-2 hover:bg-blue-500/20">
                <input type="checkbox" class="mr-2" value="all" 
                       onchange="domainAssessment.handleAllSelection(this)">
                <span>All Domains</span>
            </label>
            ${this.availableDomains.map(domain => `
                <label class="flex items-center p-2 hover:bg-blue-500/20">
                    <input type="checkbox" class="mr-2" value="${domain}"
                           onchange="domainAssessment.handleDomainSelection(this)"
                           ${this.selectedDomains.has(domain) ? 'checked' : ''}>
                    <span>${domain}</span>
                </label>
            `).join('')}
        </div>
    `;

    this.updateSelectedDisplay();
};

domainAssessment.toggleDropdown = function(event) {
    event.preventDefault();
    const dropdownList = document.getElementById('domainDropdownList');
    dropdownList.classList.toggle('show');
};

domainAssessment.handleAllSelection = function(checkbox) {
    const isChecked = checkbox.checked;
    this.selectedDomains.clear();
    
    if (isChecked) {
        this.availableDomains.forEach(domain => this.selectedDomains.add(domain));
    }

    // Update all checkboxes
    const checkboxes = document.querySelectorAll('#domainDropdownList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = isChecked);

    this.updateSelectedDisplay();
};

domainAssessment.handleDomainSelection = function(checkbox) {
    if (checkbox.checked) {
        this.selectedDomains.add(checkbox.value);
    } else {
        this.selectedDomains.delete(checkbox.value);
        // Uncheck "All Domains" if any individual domain is unchecked
        document.querySelector('#domainDropdownList input[value="all"]').checked = false;
    }

    this.updateSelectedDisplay();
};

domainAssessment.updateSelectedDisplay = function() {
    const container = document.getElementById('selectedDomains');
    if (!container) return;

    container.innerHTML = Array.from(this.selectedDomains).map(domain => `
        <div class="selected-item">
            <span>${domain}</span>
            <span class="remove-item" onclick="domainAssessment.removeDomain('${domain}')">×</span>
        </div>
    `).join('');
};

domainAssessment.removeDomain = function(domain) {
    this.selectedDomains.delete(domain);
    const checkbox = document.querySelector(`#domainDropdownList input[value="${domain}"]`);
    if (checkbox) {
        checkbox.checked = false;
    }
    document.querySelector('#domainDropdownList input[value="all"]').checked = false;
    this.updateSelectedDisplay();
};

domainAssessment.executeAssessment = async function() {
    if (this.selectedDomains.size === 0) {
        alert('Please select at least one domain to assess.');
        return;
    }

    try {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<i class="fas fa-spinner fa-spin loading-spinner"></i>';
        document.getElementById('domainRisksSection').appendChild(loadingOverlay);

        const results = [];
        const domains = Array.from(this.selectedDomains);

        for (const domain of domains) {
            const assessmentResponse = await makeGraphQLRequest(`
                {
                    securityAssessment(domain: "${domain}") {
                        overallScore
                        overallScoreLevel
                        assessmentFactors {
                            riskFactorType
                            severity
                            likelihood
                        }
                    }
                }
            `);
            
            if (assessmentResponse.data.securityAssessment) {
                const assessment = assessmentResponse.data.securityAssessment;
                assessment.assessmentFactors.forEach(factor => {
                    results.push({
                        domain: domain,
                        riskFactorType: factor.riskFactorType,
                        severity: factor.severity,
                        likelihood: factor.likelihood,
                        overallScore: assessment.overallScore
                    });
                });
            }
        }

        this.currentAssessmentResults = results;
        this.displayResults(results);
    } catch (error) {
        console.error('Error executing assessment:', error);
        alert('Error executing domain assessment: ' + error.message);
    } finally {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }
};

domainAssessment.displayResults = function(results) {
    const columns = [
        { title: "Domain", data: "domain" },
        { title: "Risk Type", data: "riskFactorType" },
        { 
            title: "Severity", 
            data: "severity",
            render: function(data) {
                const severityColors = {
                    HIGH: 'text-red-500',
                    MEDIUM: 'text-yellow-500',
                    LOW: 'text-green-500'
                };
                const color = severityColors[data] || 'text-gray-500';
                return `<span class="${color}">${data}</span>`;
            }
        },
        { 
            title: "Likelihood", 
            data: "likelihood",
            render: function(data) {
                const likelihoodColors = {
                    HIGH: 'text-red-500',
                    MEDIUM: 'text-yellow-500',
                    LOW: 'text-green-500'
                };
                const color = likelihoodColors[data] || 'text-gray-500';
                return `<span class="${color}">${data}</span>`;
            }
        },
        { 
            title: "Overall Score", 
            data: "overallScore",
            render: function(data) {
                return parseFloat(data).toFixed(2);
            }
        }
    ];

    initializeDataTable('domainRisksTable', columns, results, 'DomainAssessment');
};

// View management function
function showDomainRisks() {
    $('#entityQueriesSection').hide();
    $('#serviceAccessSection').hide();
    
    if (!$('#domainRisksSection').children().length) {
        initializeDomainAssessmentSection();
        domainAssessment.fetchDomains();
    } else {
        // Restore the selected domains display
        domainAssessment.updateSelectedDisplay();
        
        // Restore previous results if they exist
        if (domainAssessment.currentAssessmentResults) {
            domainAssessment.displayResults(domainAssessment.currentAssessmentResults);
        }
    }
    
    $('#domainRisksSection').show();
}