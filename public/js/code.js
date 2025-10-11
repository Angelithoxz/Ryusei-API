document.addEventListener('DOMContentLoaded', () => {
    // --- FUNGSI GLOBAL YANG BERJALAN DI SEMUA HALAMAN ---

    // 1. Inisialisasi semua ikon Lucide di halaman
    lucide.createIcons();

    // 2. Logika untuk menu navigasi hamburger/drawer
    const hamburger = document.getElementById('navHamburger');
    const drawerMenu = document.getElementById('drawerMenu');

    if (hamburger && drawerMenu) {
        hamburger.addEventListener('click', () => {
            drawerMenu.classList.add('active');
        });

        // Menutup menu jika area luar atau link di dalam menu diklik
        drawerMenu.addEventListener('click', (e) => {
            if (e.target === drawerMenu || e.target.closest('.drawer-link')) {
                drawerMenu.classList.remove('active');
            }
        });
    }

    // --- FUNGSI SPESIFIK PER HALAMAN ---

    // Hanya jalankan kode statistik jika elemen 'stats-grid' ada (di halaman utama)
    if (document.getElementById('stats-grid')) {
        const loadServerStats = async () => {
            try {
                const response = await fetch('/api/stats');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                const displayStat = (elementId, value) => {
                    const element = document.getElementById(elementId);
                    if (element) {
                        element.textContent = value || 'N/A';
                    }
                };

                displayStat('user-ip', data.ip);
                displayStat('total-requests', data.totalRequests);
                displayStat('unique-visitors', data.uniqueVisitors);

                if (data.server) {
                    displayStat('cpu-model', data.server.cpu);
                    displayStat('memory-usage', data.server.memory?.usage);
                    displayStat('os-info', data.server.os);
                    displayStat('server-uptime', data.server.uptime);
                }

            } catch (error) {
                console.error("Gagal memuat statistik server:", error);
                const statCards = document.querySelectorAll('.stat-card-value');
                statCards.forEach(card => card.textContent = 'Error');
            }
        };
        loadServerStats();
        setInterval(loadServerStats, 30000); // Refresh setiap 30 detik
    }

    // Hanya inisialisasi API Tester jika elemennya ada (di halaman docs/history)
    if (document.getElementById('endpointsContainer') || document.getElementById('historyList')) {
        if (typeof APITester !== 'undefined') {
            window.apiTester = new APITester();
        }
    }
});


// ===================================================================================
// KELAS API TESTER
// ===================================================================================
class APITester {
    constructor() {
        this.categories = [];
        this.history = JSON.parse(localStorage.getItem('apiHistory') || '[]');
        this.currentRequest = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        if (document.getElementById('endpointsContainer')) {
            this.loadEndpoints();
        }
        if (document.getElementById('historyList')) {
            this.renderHistory();
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchEndpoints');
        if (searchInput) searchInput.addEventListener('input', (e) => this.filterEndpoints(e.target.value));

        const refreshButton = document.getElementById('refreshEndpoints');
        if (refreshButton) refreshButton.addEventListener('click', () => this.loadEndpoints());

        const clearHistoryButton = document.getElementById('clearHistory');
        if(clearHistoryButton) clearHistoryButton.addEventListener('click', () => this.clearHistory());

        const modal = document.getElementById('responseModal');
        if (modal) {
            document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
            document.getElementById('copyResponse').addEventListener('click', () => this.copyResponse());
            document.getElementById('exportCurl').addEventListener('click', () => this.exportCurl());
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'responseModal') this.closeModal();
            });
        }
    }

    async loadEndpoints() {
        const container = document.getElementById('endpointsContainer');
        if (!container) return;
        container.innerHTML = `<div class="loading-state"><i data-lucide="loader-2" class="animate-spin"></i><p>Loading endpoints...</p></div>`;
        lucide.createIcons();

        try {
            const response = await fetch('/public/api.json');
            const data = await response.json();

            // PERBAIKAN: Mengakses array categories dari dalam properti 'content'
            this.categories = data.content.categories; 

            this.renderEndpoints();
        } catch (error) {
            container.innerHTML = `<div class="empty-state"><i data-lucide="server-crash"></i><p>Error: ${error.message}</p></div>`;
            lucide.createIcons();
        }
    }

    renderEndpoints(filteredCategories = null) {
        const container = document.getElementById('endpointsContainer');
        if (!container) return;

        const categoriesToRender = filteredCategories || this.categories;

        if (!categoriesToRender || categoriesToRender.length === 0) {
            container.innerHTML = `<div class="empty-state"><i data-lucide="search-x"></i><p>No endpoints found.</p></div>`;
            lucide.createIcons();
            return;
        }

        const outputHtml = categoriesToRender.map(category => {
            if (!category.items || category.items.length === 0) return '';

            const itemsHtml = category.items.map(endpoint => this.createEndpointCard(endpoint)).join('');

            return `
                <div class="category-section">
                    <h2 class="category-title">${category.name}</h2>
                    ${itemsHtml}
                </div>
            `;
        }).join('');

        if (outputHtml.trim() === '') {
            container.innerHTML = `<div class="empty-state"><i data-lucide="search-x"></i><p>No endpoints found matching your search.</p></div>`;
        } else {
            container.innerHTML = outputHtml;
        }

        lucide.createIcons();
    }

    createEndpointCard(endpoint) {
        const hasParams = (endpoint.params && (endpoint.params.query || endpoint.params.body)) || endpoint.path.includes(':');

        let bodyParams = '';
        if (endpoint.params && endpoint.params.body) {
            bodyParams = this.createParamInputs(endpoint.params.body, 'body');
        }

        let queryParams = '';
        if (endpoint.params && endpoint.params.query) {
            queryParams = this.createParamInputs(endpoint.params.query, 'query');
        }

        let pathParams = '';
        const pathParamList = endpoint.path.match(/:(\w+)/g);
        if (pathParamList) {
            pathParams = this.createParamInputs(pathParamList, 'path');
        }

        return `
            <div class="endpoint-card">
                <div class="endpoint-header" onclick="this.nextElementSibling.classList.toggle('active'); this.querySelector('.endpoint-toggle').classList.toggle('active')">
                    <div style="display: flex; align-items: center; flex-grow: 1; min-width: 0;">
                        <i data-lucide="${endpoint.icon || 'file-code-2'}" class="endpoint-icon"></i>
                        <div>
                            <div class="endpoint-name-container">
                                 <span class="endpoint-method method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                                 <span class="endpoint-path">${endpoint.path.split('?')[0]}</span>
                            </div>
                            <p class="endpoint-desc-small">${endpoint.desc}</p>
                        </div>
                    </div>
                    <button class="endpoint-toggle"><i data-lucide="chevron-down"></i></button>
                </div>
                <div class="endpoint-body">
                    <form class="endpoint-form" onsubmit="window.apiTester.testEndpoint(event, '${endpoint.method}', '${endpoint.path}')">
                        ${pathParams}
                        ${queryParams}
                        ${bodyParams}
                        ${!hasParams ? '<p class="no-params">This endpoint requires no parameters. Just hit Test!</p>' : ''}
                        <button type="submit" class="test-button"><i data-lucide="send"></i> Test Request</button>
                    </form>
                </div>
            </div>`;
    }

    createParamInputs(params, type) {
        const title = type.charAt(0).toUpperCase() + type.slice(1) + ' Parameters';
        const inputs = params.map(param => {
            const paramName = (typeof param === 'string') ? param.substring(1) : param.name;
            const paramType = param.type || 'text';
            const paramDesc = param.desc || '';
            const required = param.required ? 'required' : '';
            const requiredLabel = param.required ? '<span class="param-required">*</span>' : '';
            const inputName = (paramType === 'file') ? paramName : `param-${type}-${paramName}`;

            return `
                <div class="form-group">
                    <label for="param-${type}-${paramName}">${paramName} ${requiredLabel} <span class="param-type">(${paramType})</span></label>
                    <input type="${paramType}" id="param-${type}-${paramName}" name="${inputName}" class="form-input" placeholder="${paramDesc}" ${required}>
                </div>`;
        }).join('');
        return `<div class="param-section"><h3>${title}</h3>${inputs}</div>`;
    }

    async testEndpoint(event, method, path) {
        event.preventDefault();
        const form = event.target;
        const submitButton = form.querySelector('.test-button');
        submitButton.disabled = true;
        submitButton.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i> Testing...`;
        lucide.createIcons();

        let finalUrl = path.split('?')[0];
        try {
            const fetchOptions = { method, headers: {} };

            finalUrl = finalUrl.replace(/:(\w+)/g, (match, paramName) => {
                return encodeURIComponent(form[`param-path-${paramName}`]?.value || '');
            });

            const queryParams = new URLSearchParams();
            for (const element of form.elements) {
                if (element.name.startsWith('param-query-') && element.value) {
                    queryParams.append(element.name.replace('param-query-', ''), element.value);
                }
            }
            if (queryParams.toString()) {
                finalUrl += `?${queryParams.toString()}`;
            }

            const fileInput = form.querySelector('input[type="file"]');

            if (method.toUpperCase() === 'POST' && fileInput) {
                const formData = new FormData(form);
                fetchOptions.body = formData;
            } else {
                const bodyData = {};
                let hasBodyData = false;
                for (const element of form.elements) {
                    if (element.name.startsWith('param-body-')) {
                        bodyData[element.name.replace('param-body-', '')] = element.value;
                        hasBodyData = true;
                    }
                }
                if (hasBodyData) {
                    fetchOptions.body = JSON.stringify(bodyData);
                    fetchOptions.headers['Content-Type'] = 'application/json';
                }
            }

            const startTime = Date.now();
            const response = await fetch(finalUrl, fetchOptions);
            const endTime = Date.now();

            const contentType = response.headers.get('content-type');
            let responseBody;

            if (contentType && contentType.includes('application/json')) {
                responseBody = await response.json();
            } else if (contentType && (contentType.includes('image') || contentType.includes('video') || contentType.includes('audio'))) {
                responseBody = await response.blob();
            } else {
                responseBody = await response.text();
            }

            const historyItem = {
                id: Date.now(), method, url: finalUrl,
                status: response.status, statusText: response.statusText,
                responseTime: endTime - startTime, timestamp: new Date().toISOString(),
                response: responseBody, contentType
            };

            this.addToHistory(historyItem);
            this.showResponse(historyItem);

        } catch (error) {
            console.error("Test Error:", error);
            alert(`An error occurred: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = `<i data-lucide="send"></i> Test Request`;
            lucide.createIcons();
        }
    }

    showResponse(data) {
        this.currentRequest = data;
        const { status, statusText, responseTime, response, contentType } = data;
        const modal = document.getElementById('responseModal');
        const responseInfo = document.getElementById('responseInfo');
        const responseContent = document.getElementById('responseContent');
        responseContent.innerHTML = '';

        const statusClass = status >= 200 && status < 300 ? 'status-success' : 'status-error';
        responseInfo.innerHTML = `<span class="response-status ${statusClass}">${status} ${statusText}</span><span class="response-time"><i data-lucide="timer"></i> ${responseTime}ms</span>`;

        const objectURL = (response instanceof Blob) ? URL.createObjectURL(response) : null;

        if (contentType && contentType.includes('image')) {
            const img = document.createElement('img');
            img.src = objectURL;
            img.alt = 'API Image Response';
            responseContent.appendChild(img);
        } else if (contentType && contentType.includes('video')) {
            const video = document.createElement('video');
            video.src = objectURL;
            video.controls = true;
            responseContent.appendChild(video);
        } else if (contentType && contentType.includes('audio')) {
            const audio = document.createElement('audio');
            audio.src = objectURL;
            audio.controls = true;
            responseContent.appendChild(audio);
        } else {
            responseContent.innerHTML = this.syntaxHighlight(JSON.stringify(response, null, 2));
        }

        modal.classList.add('active');
        lucide.createIcons();
    }

    syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                cls = /:$/.test(match) ? 'json-key' : 'json-string';
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        });
    }

    closeModal() {
        document.getElementById('responseModal').classList.remove('active');
    }

    copyResponse() {
        if (!this.currentRequest) return;
        const { response, contentType } = this.currentRequest;
        let textToCopy = '';

        if (contentType && (contentType.includes('image') || contentType.includes('video') || contentType.includes('audio'))) {
            textToCopy = 'Cannot copy media data as text.';
        } else {
            textToCopy = JSON.stringify(response, null, 2);
        }

        navigator.clipboard.writeText(textToCopy).then(() => {
            const button = document.getElementById('copyResponse');
            const buttonSpan = button.querySelector('span');
            const originalText = buttonSpan.textContent;
            buttonSpan.textContent = 'Copied!';
            setTimeout(() => {
                buttonSpan.textContent = originalText;
            }, 2000);
        });
    }

    exportCurl() {
        if (!this.currentRequest) return;
        const { method, url } = this.currentRequest;
        const curlCommand = `${window.location.origin}${url}`;
        navigator.clipboard.writeText(curlCommand).then(() => {
            const button = document.getElementById('exportCurl');
            const buttonSpan = button.querySelector('span');
            const originalText = buttonSpan.textContent;
            buttonSpan.textContent = 'Copied!';
            setTimeout(() => {
                buttonSpan.textContent = originalText;
            }, 2000);
        });
    }

    addToHistory(item) {
        let serializableItem = { ...item };
        if (item.response instanceof Blob) {
            serializableItem.response = 'Blob data (not serializable)';
        }
        this.history.unshift(serializableItem);
        if (this.history.length > 50) {
            this.history.pop();
        }
        localStorage.setItem('apiHistory', JSON.stringify(this.history));
        this.renderHistory();
    }

    renderHistory() {
        const container = document.getElementById('historyList');
        if (!container) return;

        if (this.history.length === 0) {
            container.innerHTML = `<div class="empty-state"><i data-lucide="history"></i><p>No requests have been made yet.</p></div>`;
            lucide.createIcons();
            return;
        }
        container.innerHTML = this.history.map(item => this.createHistoryItem(item)).join('');
        lucide.createIcons();
    }

    createHistoryItem(item) {
        const statusClass = item.status >= 200 && item.status < 300 ? 'status-success' : 'status-error';
        return `
            <div class="history-item" onclick='window.apiTester.showResponseFromHistory(${JSON.stringify(item).replace(/'/g, "&apos;")})'>
                <div class="history-item-header">
                    <div style="display: flex; align-items: center; gap: 1rem; overflow: hidden;">
                        <span class="endpoint-method method-${item.method.toLowerCase()}">${item.method}</span>
                        <span class="endpoint-path" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.url}</span>
                    </div>
                    <span class="response-status ${statusClass}">${item.status}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-secondary); font-size: 0.9rem;">
                    <span><i data-lucide="timer" style="width:14px; height:14px; vertical-align: middle;"></i> ${item.responseTime}ms</span>
                    <span class="history-timestamp">${new Date(item.timestamp).toLocaleString()}</span>
                </div>
            </div>`;
    }

    showResponseFromHistory(item) {
        if (item.response === 'Blob data (not serializable)') {
            alert('Cannot display media content from history. Please make the request again.');
            return;
        }
        this.showResponse(item);
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all request history?')) {
            this.history = [];
            localStorage.removeItem('apiHistory');
            this.renderHistory();
        }
    }

    filterEndpoints(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        if (!term) {
            this.renderEndpoints();
            return;
        }
        const filteredCategories = this.categories
            .map(category => {
                const filteredItems = category.items.filter(
                    e =>
                        e.name.toLowerCase().includes(term) ||
                        e.path.toLowerCase().includes(term) ||
                        e.desc.toLowerCase().includes(term)
                );
                return { ...category, items: filteredItems };
            })
            .filter(category => category.items.length > 0);

        this.renderEndpoints(filteredCategories);
    }
}