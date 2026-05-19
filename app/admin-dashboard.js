// ════════════════════════════════════════════════════════════════════════════
// ADMINISTRATION PORTAL JS - PFE BTP SOLUTION
// ════════════════════════════════════════════════════════════════════════════

// Set current date
document.getElementById('current-date').textContent = new Date().toLocaleDateString('fr-DZ', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

// Section showing/navigation
window.showSection = function(sectionId, element) {
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    if (element) {
        element.classList.add('active');
    }

    // Refresh dashboard if clicked, otherwise just update badges
    if (sectionId === 'dashboard') {
        loadDashboardData();
    } else {
        loadAlertsAndBadges();
    }
};

// Logout helper
window.logout = function() {
    document.cookie = "pfe_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "pfe_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/portal/index.html';
};

// Global variables
window.lastCounts = null;
window.refreshActiveIframe = function() {
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        const activeIframe = activeSection.querySelector('iframe');
        if (activeIframe) {
            try {
                const iframeDoc = activeIframe.contentDocument || activeIframe.contentWindow.document;
                if (iframeDoc) {
                    const goButton = iframeDoc.querySelector('[id$="FilterBar-btnSearch"]');
                    if (goButton) goButton.click();
                }
            } catch (e) {
                // Ignore cross-origin issues
            }
        }
    }
};

let salesChart = null;

// Populate the year filter select with the current year and 8 years back
function populateYearFilter() {
    const yearSelect = document.getElementById('filter-year-select');
    if (!yearSelect) return;
    
    const currentYear = new Date().getFullYear(); // e.g. 2026
    yearSelect.innerHTML = '';
    
    // We add 9 options: currentYear down to currentYear - 8
    for (let i = 0; i <= 8; i++) {
        const year = currentYear - i;
        const option = document.createElement('option');
        option.value = year.toString();
        option.textContent = year.toString();
        yearSelect.appendChild(option);
    }
}

// Get selected year/month from UI double select
function getSelectedMonth() {
    const monthSelect = document.getElementById('filter-month-select');
    const yearSelect = document.getElementById('filter-year-select');
    if (monthSelect && yearSelect) {
        return `${yearSelect.value}-${monthSelect.value}`;
    }
    return new Date().toISOString().substring(0, 7);
}

// Format Month Name for French display (ex: "2026-05" -> "Mai 2026")
function formatMonthName(yearMonthStr) {
    const [year, month] = yearMonthStr.split('-');
    const date = new Date(year, month - 1, 1);
    const formatted = date.toLocaleDateString('fr-DZ', { month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// Load all metrics & charts
async function loadDashboardData() {
    try {
        const selectedMonth = getSelectedMonth();
        const formattedMonth = formatMonthName(selectedMonth);

        // Update titles with selected month
        document.getElementById('ca-subtitle').textContent = `Ventes de ${formattedMonth}`;
        document.getElementById('chart-header').textContent = `📈 CA Journalier — Évolution (${formattedMonth})`;
        document.getElementById('top-clients-header').textContent = `🏆 Top 5 Clients (${formattedMonth})`;
        document.getElementById('top-products-header').textContent = `📦 Top 5 Produits (${formattedMonth})`;
        document.getElementById('top-suppliers-header').textContent = `🤝 Top 5 Fournisseurs (${formattedMonth})`;

        await Promise.all([
            loadKPIs(selectedMonth),
            loadAlertsAndBadges(),
            loadTopLists(selectedMonth),
            loadSalesChart(selectedMonth)
        ]);
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
}

// ─── 1. LOAD KPIs ────────────────────────────────────────────────────────────
async function loadKPIs(selectedMonth) {
    try {
        // Fetch KPIs, Pending Invoices, and Sales (filtered by month)
        const kpiResponse = await fetch('/odata/v4/analytics/KPIView');
        const invoicesResponse = await fetch('/odata/v4/analytics/PendingInvoicesView');
        const salesResponse = await fetch(`/odata/v4/analytics/SalesView?$filter=month eq '${selectedMonth}'`);

        if (!kpiResponse.ok || !invoicesResponse.ok || !salesResponse.ok) return;

        const kpiData = await kpiResponse.json();
        const invoicesData = await invoicesResponse.json();
        const salesData = await salesResponse.json();

        // Calculate Totals for Approved Business Partners
        let clientsCount = 0;
        let suppliersCount = 0;
        
        kpiData.value.forEach(item => {
            if (item.status === 'Approved') {
                if (item.bpRole === 'Client' || item.bpRole === 'Both') {
                    clientsCount += item.totalCount;
                }
                if (item.bpRole === 'Supplier' || item.bpRole === 'Both') {
                    suppliersCount += item.totalCount;
                }
            }
        });

        // Sum Pending Invoices Amount (Encours Clients) - globally pending
        let totalEncours = 0;
        let currency = 'DA';
        invoicesData.value.forEach(item => {
            totalEncours += Number(item.amount || 0);
            if (item.currency) currency = item.currency;
        });

        // Sum Sales of the selected month
        let totalSales = 0;
        salesData.value.forEach(item => {
            totalSales += Number(item.totalAmount || 0);
        });

        // Populate elements
        document.getElementById('kpi-clients').textContent = clientsCount;
        document.getElementById('kpi-suppliers').textContent = suppliersCount;
        document.getElementById('kpi-encours').textContent = `${totalEncours.toLocaleString('fr-DZ')} ${currency}`;
        document.getElementById('kpi-ca').textContent = `${totalSales.toLocaleString('fr-DZ')} ${currency}`;

    } catch (e) {
        console.error("Error loading KPIs:", e);
    }
}

// ─── 2. LOAD ALERTS AND BADGES ───────────────────────────────────────────────
async function loadAlertsAndBadges() {
    try {
        let currentNotifsCount = 0;
        let pendingKYCCount = 0;
        let lowStockCount = 0;
        let approvedRFQsCount = 0;

        // 1. Fetch unread notifications for the Alerts Card
        const notificationsResponse = await fetch('/odata/v4/admin/Notifications?$filter=isRead eq false&$orderby=createdAt desc');
        
        // 2. Fetch direct counts for Sidebar Badges
        const inscriptionsResponse = await fetch('/odata/v4/admin/Inscriptions?$filter=status eq \'Pending\'');
        const lowStockResponse = await fetch('/odata/v4/analytics/LowStockView');
        
        try {
            const rfqsResponse = await fetch('/odata/v4/srm/RFQs?$filter=status eq \'Approved\'');
            if (rfqsResponse.ok) {
                const rfqsData = await rfqsResponse.json();
                approvedRFQsCount = (rfqsData.value || []).length;
            }
        } catch (rfqErr) {
            console.error("Error fetching approved RFQs:", rfqErr);
        }

        if (notificationsResponse.ok) {
            const notificationsData = await notificationsResponse.json();
            const notifications = notificationsData.value || [];
            currentNotifsCount = notifications.length;
            
            // Render Alerts List using the actual system notifications
            const alertsList = document.getElementById('alerts-list');
            if (alertsList) {
                alertsList.innerHTML = '';
                let alertItemsHTML = '';

                notifications.forEach(item => {
                    let dotClass = 'info';
                    let targetSection = 'notifs';
                    let targetNavItem = 'nav-notifs';
                    let dotStyle = '';
                    
                    if (item.notifType === 'KYC') {
                        dotClass = 'info';
                        targetSection = 'inscriptions';
                        targetNavItem = 'nav-inscriptions';
                    } else if (item.notifType === 'RFQ') {
                        dotClass = 'success';
                        targetSection = 'rfqs';
                        targetNavItem = 'nav-rfqs';
                        dotStyle = 'style="background:var(--sap-green);"';
                    } else if (item.notifType === 'Alert') {
                        dotClass = 'warn';
                        targetSection = 'products';
                        targetNavItem = 'nav-products';
                    }

                    alertItemsHTML += `
                        <div class="alert-item" onclick="showSection('${targetSection}', document.getElementById('${targetNavItem}'))" style="cursor:pointer;">
                            <div class="alert-dot ${dotClass}" ${dotStyle}></div>
                            <div class="alert-text">
                                <strong>${item.title}</strong>
                                <span>${item.message}</span>
                            </div>
                        </div>
                    `;
                });

                if (alertItemsHTML === '') {
                    alertsList.innerHTML = '<div class="empty-state">✅ Aucune alerte en attente. Tout est sous contrôle !</div>';
                } else {
                    alertsList.innerHTML = alertItemsHTML;
                }
            }

            // Update Notifications Badge (Total unread notifications count)
            const badgeNotifs = document.getElementById('badge-notifs');
            if (badgeNotifs) {
                badgeNotifs.textContent = currentNotifsCount;
                badgeNotifs.style.display = currentNotifsCount > 0 ? 'inline-block' : 'none';
                if (currentNotifsCount > 0) {
                    badgeNotifs.classList.add('badge-blink');
                } else {
                    badgeNotifs.classList.remove('badge-blink');
                }
            }
        }

        // Update Inscriptions Badge
        if (inscriptionsResponse.ok) {
            const inscriptionsData = await inscriptionsResponse.json();
            pendingKYCCount = (inscriptionsData.value || []).length;
            const badgeInscriptions = document.getElementById('badge-inscriptions');
            if (badgeInscriptions) {
                badgeInscriptions.textContent = pendingKYCCount;
                badgeInscriptions.style.display = pendingKYCCount > 0 ? 'inline-block' : 'none';
                if (pendingKYCCount > 0) {
                    badgeInscriptions.classList.add('badge-blink');
                } else {
                    badgeInscriptions.classList.remove('badge-blink');
                }
            }
        }

        // Update RFQs Badge
        const badgeRFQs = document.getElementById('badge-rfqs');
        if (badgeRFQs) {
            badgeRFQs.textContent = approvedRFQsCount;
            badgeRFQs.style.display = approvedRFQsCount > 0 ? 'inline-block' : 'none';
            if (approvedRFQsCount > 0) {
                badgeRFQs.classList.add('badge-blink');
            } else {
                badgeRFQs.classList.remove('badge-blink');
            }
        }

        // Update Stock Badge
        if (lowStockResponse.ok) {
            const lowStockData = await lowStockResponse.json();
            lowStockCount = (lowStockData.value || []).length;
            const badgeStock = document.getElementById('badge-stock');
            if (badgeStock) {
                badgeStock.textContent = lowStockCount;
                badgeStock.style.display = lowStockCount > 0 ? 'inline-block' : 'none';
                if (lowStockCount > 0) {
                    badgeStock.classList.add('badge-blink');
                } else {
                    badgeStock.classList.remove('badge-blink');
                }
            }
        }

        // Detect if anything changed to trigger auto-refresh
        const currentCounts = {
            notifs: currentNotifsCount,
            inscriptions: pendingKYCCount,
            rfqs: approvedRFQsCount,
            stock: lowStockCount
        };

        let hasChanged = false;
        if (window.lastCounts) {
            if (window.lastCounts.notifs !== currentCounts.notifs ||
                window.lastCounts.inscriptions !== currentCounts.inscriptions ||
                window.lastCounts.rfqs !== currentCounts.rfqs ||
                window.lastCounts.stock !== currentCounts.stock) {
                hasChanged = true;
            }
        }
        window.lastCounts = currentCounts;

        if (hasChanged) {
            // Refresh Fiori App instantly
            window.refreshActiveIframe();
            
            // Refresh KPI Dashboard if visible
            const dashSection = document.getElementById('section-dashboard');
            if (dashSection && dashSection.classList.contains('active')) {
                loadDashboardData();
            }
        }

    } catch (e) {
        console.error("Error loading alerts & badges:", e);
    }
}

// ─── 3. LOAD TOP LISTS ───────────────────────────────────────────────────────
async function loadTopLists(selectedMonth) {
    try {
        const clientsResponse = await fetch(`/odata/v4/analytics/TopClientsView?$filter=month eq '${selectedMonth}'&$orderby=totalSales desc&$top=5`);
        const suppliersResponse = await fetch(`/odata/v4/analytics/TopSuppliersView?$filter=month eq '${selectedMonth}'&$orderby=totalPurchases desc&$top=5`);
        const productsResponse = await fetch(`/odata/v4/analytics/TopProductsView?$filter=month eq '${selectedMonth}'&$orderby=totalQty desc&$top=5`);

        if (!clientsResponse.ok || !suppliersResponse.ok || !productsResponse.ok) return;

        const clients = await clientsResponse.json();
        const suppliers = await suppliersResponse.json();
        const products = await productsResponse.json();

        // Render Top Clients
        const clientList = document.getElementById('top-clients');
        clientList.innerHTML = '';
        if (clients.value.length === 0) {
            clientList.innerHTML = '<div class="empty-state">Aucune vente ce mois-ci</div>';
        } else {
            clients.value.forEach((item, index) => {
                const rankClass = index === 0 ? 'gold' : (index === 1 ? 'silver' : '');
                clientList.innerHTML += `
                    <div class="top-row">
                        <div class="top-rank ${rankClass}">${index + 1}</div>
                        <div class="top-name">${item.clientName || 'Client Particulier'} <small style="color:#888;">(${item.wilaya || '—'})</small></div>
                        <div class="top-value">${Number(item.totalSales).toLocaleString('fr-DZ')} ${item.currency || 'DA'}</div>
                    </div>
                `;
            });
        }

        // Render Top Suppliers
        const supplierList = document.getElementById('top-suppliers');
        supplierList.innerHTML = '';
        if (suppliers.value.length === 0) {
            supplierList.innerHTML = '<div class="empty-state">Aucun achat ce mois-ci</div>';
        } else {
            suppliers.value.forEach((item, index) => {
                const rankClass = index === 0 ? 'gold' : (index === 1 ? 'silver' : '');
                supplierList.innerHTML += `
                    <div class="top-row">
                        <div class="top-rank ${rankClass}">${index + 1}</div>
                        <div class="top-name">${item.supplierName || 'Fournisseur Anonyme'} <small style="color:#888;">(${item.wilaya || '—'})</small></div>
                        <div class="top-value">${Number(item.totalPurchases).toLocaleString('fr-DZ')} ${item.currency || 'DA'}</div>
                    </div>
                `;
            });
        }

        // Render Top Products
        const productList = document.getElementById('top-products');
        productList.innerHTML = '';
        if (products.value.length === 0) {
            productList.innerHTML = '<div class="empty-state">Aucun produit vendu ce mois-ci</div>';
        } else {
            products.value.forEach((item, index) => {
                const rankClass = index === 0 ? 'gold' : (index === 1 ? 'silver' : '');
                productList.innerHTML += `
                    <div class="top-row">
                        <div class="top-rank ${rankClass}">${index + 1}</div>
                        <div class="top-name">${item.productName} <small style="color:#888;">(${item.category})</small></div>
                        <div class="top-value">${item.totalQty} U. (CA: ${Number(item.totalRevenue).toLocaleString('fr-DZ')} DA)</div>
                    </div>
                `;
            });
        }

    } catch (e) {
        console.error("Error loading top lists:", e);
    }
}

// ─── 4. LOAD SALES CHART ─────────────────────────────────────────────────────
async function loadSalesChart(selectedMonth) {
    try {
        const response = await fetch(`/odata/v4/analytics/SalesView?$filter=month eq '${selectedMonth}'`);
        if (!response.ok) return;

        const data = await response.json();
        const dailySales = {};

        // Parse selected month
        const [year, month] = selectedMonth.split('-');
        const monthIndex = parseInt(month) - 1;
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

        // Prepopulate all days of the selected month
        for (let day = 1; day <= daysInMonth; day++) {
            const formattedDay = `${selectedMonth}-${String(day).padStart(2, '0')}`;
            dailySales[formattedDay] = 0;
        }

        // Sum totals for actual sales dates
        data.value.forEach(item => {
            if (item.day && item.day.startsWith(selectedMonth)) {
                dailySales[item.day] = (dailySales[item.day] || 0) + Number(item.totalAmount || 0);
            }
        });

        // Prepare labels and values
        const labels = Object.keys(dailySales).map(dateStr => dateStr.split('-')[2]); // Just keep the day part (01, 02, etc.)
        const values = Object.values(dailySales);

        // Render Chart.js
        const ctx = document.getElementById('chart-sales').getContext('2d');

        if (salesChart) {
            salesChart.destroy();
        }

        salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: "Chiffre d'Affaires Journalier (DA)",
                    data: values,
                    backgroundColor: 'rgba(10, 110, 209, 0.75)',
                    borderColor: 'rgba(10, 110, 209, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('fr-DZ') + ' DA';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw.toLocaleString('fr-DZ')} DA`;
                            }
                        }
                    }
                }
            }
        });

    } catch (e) {
        console.error("Error loading sales chart:", e);
    }
}

// ─── INITIALIZATION ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // 1. Populate the Year select list (Current year + 8 years back)
    populateYearFilter();

    // 2. Set current date month/year as default in filters
    const currentDate = new Date();
    const currentMonthNum = String(currentDate.getMonth() + 1).padStart(2, '0'); // e.g. "05"
    const currentYearNum = currentDate.getFullYear().toString(); // e.g. "2026"
    
    const monthSelect = document.getElementById('filter-month-select');
    const yearSelect = document.getElementById('filter-year-select');
    
    if (monthSelect) monthSelect.value = currentMonthNum;
    if (yearSelect) yearSelect.value = currentYearNum;

    // 3. Load actual dashboard data
    loadDashboardData();

    // 4. Auto-chargement automatique des données pour tous les iframes Fiori (simule le clic sur "Lancer")
    document.querySelectorAll('iframe').forEach(iframe => {
        iframe.addEventListener('load', () => {
            let attempts = 0;
            const interval = setInterval(() => {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc) {
                        const goButton = iframeDoc.querySelector('[id$="FilterBar-btnSearch"]');
                        if (goButton) {
                            goButton.click();
                            clearInterval(interval);
                        }
                    }
                } catch (e) {
                    // Ignorer les erreurs d'initialisation temporaires
                }
                attempts++;
                if (attempts > 30) clearInterval(interval); // Arrêt après 15 secondes
            }, 500);
        });
    });

    // 5. Polling automatique toutes les 3 secondes pour un affichage instantané
    setInterval(() => {
        loadAlertsAndBadges();
    }, 3000);
});
