// entity-queries.js

// Initialize the entity queries section HTML
function initializeEntityQueriesSection() {
    const section = document.getElementById('entityQueriesSection');
    section.innerHTML = `
        <h3 class="text-lg font-bold mb-4">Entity Queries</h3>
        <div class="flex flex-col md:flex-row gap-4 mb-4">
            <select id="queryType" class="cyber-input flex-grow px-4 py-2">
                ${Object.entries(ENTITY_QUERIES).map(([value, text]) => 
                    `<option value="${value}">${text}</option>`
                ).join('')}
            </select>
            <button onclick="executeEntityQuery()" class="cyber-button whitespace-nowrap">
                <i class="fas fa-play mr-2"></i>Execute Query
            </button>
        </div>
        <div id="entityQueryResults"></div>
    `;
}

// Execute entity query
async function executeEntityQuery() {
    try {
        const queryType = $('#queryType').val();
        const queryText = $('#queryType option:selected').text();  // Get the human-readable query name
        const results = [];
        let hasNextPage = true;
        let cursor = null;

        $('#entityQueryResults').empty().append(
            '<div class="loading-overlay"><i class="fas fa-spinner fa-spin loading-spinner"></i></div>'
        );

        while (hasNextPage) {
            const query = `
                {
                    entities(
                        ${queryType}: true
                        archived: false
                        first: 1000
                        ${cursor ? `after: "${cursor}"` : ''}
                    ) {
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                        nodes {
                            primaryDisplayName
                            secondaryDisplayName
                            isHuman: hasRole(type: HumanUserAccountRole)
                            isProgrammatic: hasRole(type: ProgrammaticUserAccountRole)
                            riskScore
                            riskScoreSeverity
                        }
                    }
                }
            `;
            
            const response = await makeGraphQLRequest(query);
            
            if (response.data.entities.nodes) {
                results.push(...response.data.entities.nodes);
            }
            
            hasNextPage = response.data.entities.pageInfo.hasNextPage;
            cursor = response.data.entities.pageInfo.endCursor;

            // Update progress
            $('.loading-spinner').parent().html(
                `<i class="fas fa-spinner fa-spin loading-spinner"></i> Loading... (${results.length} records)`
            );
        }
        
        initializeDataTable('entityQueryResults', [
            { title: "Display Name", data: "primaryDisplayName" },
            { title: "Secondary Name", data: "secondaryDisplayName" },
            { 
                title: "Type", 
                data: null,
                render: function(data, type, row) {
                    return row.isHuman ? 
                        '<i class="fas fa-user mr-2"></i>Human' : 
                        (row.isProgrammatic ? '<i class="fas fa-robot mr-2"></i>Programmatic' : 
                        '<i class="fas fa-question-circle mr-2"></i>Unknown');
                }
            },
            { title: "Risk Score", data: "riskScore" },
            { 
                title: "Risk Severity", 
                data: "riskScoreSeverity",
                render: function(data, type, row) {
                    const severityColors = {
                        HIGH: 'text-red-500',
                        MEDIUM: 'text-yellow-500',
                        LOW: 'text-green-500'
                    };
                    const color = severityColors[data] || 'text-gray-500';
                    return `<span class="${color}"><i class="fas fa-exclamation-triangle mr-2"></i>${data}</span>`;
                }
            }
        ], results, queryText);  
    } catch (error) {
        alert('Error executing query: ' + error.message);
    } finally {
        $('.loading-overlay').remove();
    }
}

// View management
function showEntityQueries() {
    $('#domainRisksSection').hide();
    $('#serviceAccessSection').hide();
    if (!$('#entityQueriesSection').html()) {
        initializeEntityQueriesSection();
    }
    $('#entityQueriesSection').show();
}