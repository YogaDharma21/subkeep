// --- DATA ---
const templates = [
    { id: 1, name: 'Netflix', icon: 'fa-brands fa-netflix', color: '#E50914', category: 'entertainment', price: 15.99, currency: 'USD' },
    { id: 2, name: 'Disney+', icon: 'fa-solid fa-d', color: '#113CCF', category: 'entertainment', price: 7.99, currency: 'USD' },
    { id: 3, name: 'HBO Max', icon: 'fa-solid fa-masks-theater', color: '#B535F6', category: 'entertainment', price: 14.99, currency: 'USD' },
    { id: 4, name: 'Hulu', icon: 'fa-solid fa-h', color: '#1CE783', category: 'entertainment', price: 12.99, currency: 'USD' },
    { id: 5, name: 'Prime Video', icon: 'fa-brands fa-amazon', color: '#00A8E1', category: 'entertainment', price: 14.99, currency: 'USD' },
    { id: 6, name: 'Apple TV+', icon: 'fa-brands fa-apple', color: '#555555', category: 'entertainment', price: 6.99, currency: 'USD' },
    { id: 7, name: 'Peacock', icon: 'fa-solid fa-feather', color: '#FDB927', category: 'entertainment', price: 5.99, currency: 'USD' },
    { id: 8, name: 'Paramount+', icon: 'fa-solid fa-mountain-sun', color: '#0064FF', category: 'entertainment', price: 9.99, currency: 'USD' },
    { id: 9, name: 'Spotify', icon: 'fa-brands fa-spotify', color: '#1DB954', category: 'music', price: 9.99, currency: 'USD' },
    { id: 10, name: 'Apple Music', icon: 'fa-solid fa-music', color: '#FC3C44', category: 'music', price: 10.99, currency: 'USD' },
    { id: 11, name: 'YouTube Music', icon: 'fa-brands fa-youtube', color: '#FF0000', category: 'music', price: 10.99, currency: 'USD' },
    { id: 12, name: 'Tidal', icon: 'fa-solid fa-water', color: '#000000', category: 'music', price: 10.99, currency: 'USD' },
    { id: 13, name: 'Microsoft 365', icon: 'fa-brands fa-microsoft', color: '#0078D4', category: 'productivity', price: 6.99, currency: 'USD' },
    { id: 14, name: 'Google Workspace', icon: 'fa-brands fa-google', color: '#4285F4', category: 'productivity', price: 6.99, currency: 'USD' },
    { id: 15, name: 'Notion', icon: 'fa-solid fa-n', color: '#000000', category: 'productivity', price: 8.00, currency: 'USD' },
    { id: 16, name: 'iCloud+', icon: 'fa-solid fa-cloud', color: '#555555', category: 'cloud', price: 2.99, currency: 'USD' },
    { id: 17, name: 'Google One', icon: 'fa-brands fa-google', color: '#4285F4', category: 'cloud', price: 2.99, currency: 'USD' },
    { id: 18, name: 'Dropbox', icon: 'fa-brands fa-dropbox', color: '#0061FF', category: 'cloud', price: 11.99, currency: 'USD' },
    { id: 19, name: 'Xbox Game Pass', icon: 'fa-brands fa-xbox', color: '#107C10', category: 'gaming', price: 14.99, currency: 'USD' },
    { id: 20, name: 'PlayStation Plus', icon: 'fa-brands fa-playstation', color: '#003087', category: 'gaming', price: 9.99, currency: 'USD' },
    { id: 21, name: 'Nintendo Switch Online', icon: 'fa-solid fa-gamepad', color: '#E60012', category: 'gaming', price: 3.99, currency: 'USD' },
    { id: 22, name: 'Duolingo Plus', icon: 'fa-solid fa-graduation-cap', color: '#58CC02', category: 'education', price: 12.99, currency: 'USD' },
    { id: 23, name: 'MasterClass', icon: 'fa-solid fa-chalkboard-user', color: '#000000', category: 'education', price: 10.00, currency: 'USD' },
    { id: 24, name: 'Skillshare', icon: 'fa-solid fa-palette', color: '#00FF84', category: 'education', price: 13.99, currency: 'USD' },
    { id: 25, name: 'Peloton', icon: 'fa-solid fa-bicycle', color: '#E60023', category: 'fitness', price: 12.99, currency: 'USD' },
    { id: 26, name: 'Strava', icon: 'fa-solid fa-person-running', color: '#FC4C02', category: 'fitness', price: 7.99, currency: 'USD' },
    { id: 27, name: 'Headspace', icon: 'fa-solid fa-spa', color: '#F47D31', category: 'fitness', price: 12.99, currency: 'USD' },
    { id: 28, name: 'Calm', icon: 'fa-solid fa-moon', color: '#3B6E8F', category: 'fitness', price: 14.99, currency: 'USD' },
];

const icons = [
    'fa-brands fa-netflix', 'fa-brands fa-spotify', 'fa-brands fa-youtube', 'fa-brands fa-amazon',
    'fa-brands fa-apple', 'fa-brands fa-google', 'fa-brands fa-microsoft', 'fa-brands fa-dropbox',
    'fa-brands fa-trello', 'fa-brands fa-xbox', 'fa-brands fa-playstation', 'fa-brands fa-steam',
    'fa-brands fa-discord', 'fa-brands fa-slack', 'fa-brands fa-figma', 'fa-brands fa-github',
    'fa-solid fa-video', 'fa-solid fa-music', 'fa-solid fa-gamepad', 'fa-solid fa-podcast',
    'fa-solid fa-tv', 'fa-solid fa-film', 'fa-solid fa-camera', 'fa-solid fa-microphone',
    'fa-solid fa-headphones', 'fa-solid fa-book', 'fa-solid fa-graduation-cap', 'fa-solid fa-laptop-code',
    'fa-solid fa-cloud', 'fa-solid fa-shield-halved', 'fa-solid fa-robot', 'fa-solid fa-brain',
    'fa-solid fa-rocket', 'fa-solid fa-bolt', 'fa-solid fa-fire', 'fa-solid fa-star',
    'fa-solid fa-heart', 'fa-solid fa-gem', 'fa-solid fa-crown', 'fa-solid fa-trophy',
    'fa-solid fa-puzzle-piece', 'fa-solid fa-dice', 'fa-solid fa-chess', 'fa-solid fa-paintbrush',
    'fa-solid fa-palette', 'fa-solid fa-wand-magic-sparkles', 'fa-solid fa-dumbbell',
    'fa-solid fa-heart-pulse', 'fa-solid fa-person-running', 'fa-solid fa-bicycle',
    'fa-solid fa-spa', 'fa-solid fa-moon', 'fa-solid fa-sun', 'fa-solid fa-cloud-sun',
    'fa-solid fa-globe', 'fa-solid fa-earth-americas', 'fa-solid fa-compass', 'fa-solid fa-location-dot',
    'fa-solid fa-wallet', 'fa-solid fa-credit-card', 'fa-solid fa-receipt', 'fa-solid fa-chart-line',
    'fa-solid fa-briefcase', 'fa-solid fa-building', 'fa-solid fa-store', 'fa-solid fa-cart-shopping',
    'fa-solid fa-gift', 'fa-solid fa-tag', 'fa-solid fa-percent', 'fa-solid fa-truck',
    'fa-solid fa-plane', 'fa-solid fa-train', 'fa-solid fa-car', 'fa-solid fa-taxi',
    'fa-solid fa-hotel', 'fa-solid fa-umbrella-beach', 'fa-solid fa-map', 'fa-solid fa-passport',
    'fa-solid fa-phone', 'fa-solid fa-envelope', 'fa-solid fa-comment', 'fa-solid fa-users',
    'fa-solid fa-child', 'fa-solid fa-cat', 'fa-solid fa-dog', 'fa-solid fa-paw',
    'fa-solid fa-seedling', 'fa-solid fa-tree', 'fa-solid fa-leaf', 'fa-solid fa-water',
    'fa-solid fa-fire-flame-curved', 'fa-solid fa-temperature-high', 'fa-solid fa-snowflake', 'fa-solid fa-wind'
];

const currencySymbols = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'AUD': 'A$', 'CAD': 'C$',
    'INR': '₹', 'BRL': 'R$', 'KRW': '₩', 'MXN': '$', 'SGD': 'S$', 'HKD': 'HK$',
    'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr', 'PLN': 'zł', 'CZK': 'Kč', 'HUF': 'Ft',
    'RUB': '₽', 'TRY': '₺', 'ZAR': 'R', 'AED': 'د.إ', 'SAR': '﷼', 'THB': '฿',
    'IDR': 'Rp', 'MYR': 'RM', 'PHP': '₱', 'VND': '₫', 'TWD': 'NT$', 'NZD': 'NZ$',
};

const categoryColors = {
    'entertainment': '#E50914',
    'music': '#1DB954',
    'productivity': '#0078D4',
    'cloud': '#5ac8fa',
    'gaming': '#107C10',
    'education': '#FF9500',
    'fitness': '#FF2D55',
    'news': '#AF52DE',
    'finance': '#34C759',
    'other': '#8E8E93'
};

const defaultSubscriptions = [
    { id: 1, name: 'Netflix', icon: 'fa-brands fa-netflix', color: '#E50914', price: 15.99, currency: 'USD', cycle: 'monthly', category: 'entertainment', nextBilling: '2026-07-15' },
    { id: 2, name: 'Spotify', icon: 'fa-brands fa-spotify', color: '#1DB954', price: 9.99, currency: 'USD', cycle: 'monthly', category: 'music', nextBilling: '2026-07-20' },
    { id: 3, name: 'Microsoft 365', icon: 'fa-brands fa-microsoft', color: '#0078D4', price: 6.99, currency: 'USD', cycle: 'monthly', category: 'productivity', nextBilling: '2026-07-25' },
    { id: 4, name: 'Disney+', icon: 'fa-solid fa-d', color: '#113CCF', price: 7.99, currency: 'USD', cycle: 'monthly', category: 'entertainment', nextBilling: '2026-08-01' },
    { id: 5, name: 'iCloud+', icon: 'fa-solid fa-cloud', color: '#555555', price: 2.99, currency: 'USD', cycle: 'monthly', category: 'cloud', nextBilling: '2026-07-28' },
    { id: 6, name: 'Xbox Game Pass', icon: 'fa-brands fa-xbox', color: '#107C10', price: 14.99, currency: 'USD', cycle: 'monthly', category: 'gaming', nextBilling: '2026-07-18' },
];

// --- LOCAL STORAGE ---
function loadSubscriptions() {
    const stored = localStorage.getItem('subkeep_subscriptions');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('subkeep_subscriptions', JSON.stringify(defaultSubscriptions));
    return defaultSubscriptions;
}

function saveSubscriptions() {
    localStorage.setItem('subkeep_subscriptions', JSON.stringify(subscriptions));
}

let subscriptions = loadSubscriptions();

// --- HELPERS ---
function getSymbol(cur) { return currencySymbols[cur] || '$'; }

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateFull(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatMonthYear(date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getMonthlyTotal() {
    return subscriptions.reduce((sum, s) => {
        if (s.cycle === 'monthly') return sum + s.price;
        if (s.cycle === 'yearly') return sum + (s.price / 12);
        if (s.cycle === 'weekly') return sum + (s.price * 4.33);
        if (s.cycle === 'daily') return sum + (s.price * 30);
        return sum + s.price;
    }, 0);
}

function generatePaymentHistory(subs) {
    const history = [];
    const now = new Date();
    for (let m = 0; m < 6; m++) {
        const month = new Date(now.getFullYear(), now.getMonth() - m, 1);
        subs.forEach(sub => {
            if (sub.cycle === 'monthly' || sub.cycle === 'weekly') {
                history.push({
                    name: sub.name,
                    icon: sub.icon,
                    color: sub.color,
                    amount: sub.price,
                    currency: sub.currency,
                    date: new Date(month.getFullYear(), month.getMonth(), Math.min(28, parseInt(sub.nextBilling.split('-')[2]) || 15)),
                    category: sub.category
                });
            }
        });
    }
    return history.sort((a, b) => b.date - a.date);
}

// --- RENDER TEMPLATES ---
function renderTemplates(category = 'all', search = '') {
    let filtered = templates;
    if (category !== 'all') filtered = filtered.filter(t => t.category === category);
    if (search) filtered = filtered.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    const list = document.getElementById('templatesList');
    if (!list) return;
    list.innerHTML = filtered.map(t => `
        <div class="template-item" data-id="${t.id}">
            <div class="template-icon" style="background: ${t.color}">
                <i class="${t.icon}"></i>
            </div>
            <div class="template-info">
                <div class="template-name">${t.name}</div>
                <div class="template-price">$${t.price}/mo</div>
            </div>
        </div>
    `).join('');
}

// --- RENDER ICONS ---
function renderIcons(search = '') {
    let filtered = icons;
    if (search) filtered = icons.filter(i => i.toLowerCase().includes(search.toLowerCase()));
    const grid = document.getElementById('iconGrid');
    if (!grid) return;
    grid.innerHTML = filtered.map(icon => `
        <div class="icon-item ${selectedIcon === icon ? 'selected' : ''}" data-icon="${icon}">
            <i class="${icon}"></i>
        </div>
    `).join('');
}

// --- MODAL STATE ---
let currentStep = 1;
let selectedTemplate = null;
let selectedIcon = null;
let selectedColor = '#000000';
let selectedCycle = 'monthly';

function goToStep(step) {
    currentStep = step;
    const s1 = document.getElementById('step1');
    const s2 = document.getElementById('step2');
    if (s1) s1.style.display = step === 1 ? 'block' : 'none';
    if (s2) s2.style.display = step === 2 ? 'block' : 'none';
    const title = document.getElementById('modalTitle');
    const back = document.getElementById('modalBackBtn');
    const next = document.getElementById('nextBtn');
    if (title) title.textContent = step === 1 ? 'Add Subscription' : 'Subscription Details';
    if (back) back.style.display = step === 1 ? 'none' : 'flex';
    if (next) next.textContent = step === 1 ? 'Continue' : 'Add Subscription';
}

function selectTemplate(id) {
    selectedTemplate = templates.find(t => t.id === id);
    selectedIcon = selectedTemplate.icon;
    selectedColor = selectedTemplate.color;
    const nameEl = document.getElementById('subName');
    const priceEl = document.getElementById('subPrice');
    const catEl = document.getElementById('subCategory');
    if (nameEl) nameEl.value = selectedTemplate.name;
    if (priceEl) priceEl.value = selectedTemplate.price;
    if (catEl) catEl.value = selectedTemplate.category;
    goToStep(2);
    updateIconPreview();
}

function updateIconPreview() {
    const preview = document.getElementById('iconPreview');
    if (!preview) return;
    if (selectedIcon) {
        preview.innerHTML = `<i class="${selectedIcon}"></i>`;
        preview.style.background = selectedColor;
        preview.classList.add('has-icon');
    }
}

function resetForm() {
    selectedTemplate = null;
    selectedIcon = null;
    selectedColor = '#000000';
    selectedCycle = 'monthly';
    const nameEl = document.getElementById('subName');
    const priceEl = document.getElementById('subPrice');
    const dateEl = document.getElementById('subStartDate');
    const searchEl = document.getElementById('templateSearch');
    if (nameEl) nameEl.value = '';
    if (priceEl) priceEl.value = '';
    if (dateEl) dateEl.value = '';
    if (searchEl) searchEl.value = '';
    document.querySelectorAll('.cycle-btn').forEach(b => b.classList.toggle('active', b.dataset.cycle === 'monthly'));
    const preview = document.getElementById('iconPreview');
    if (preview) {
        preview.innerHTML = '<i class="fas fa-plus"></i>';
        preview.style.background = '';
        preview.classList.remove('has-icon');
    }
    renderTemplates();
}

function addSubscription() {
    const nameEl = document.getElementById('subName');
    const priceEl = document.getElementById('subPrice');
    const curEl = document.getElementById('currencySelect');
    const catEl = document.getElementById('subCategory');
    const dateEl = document.getElementById('subStartDate');

    const name = nameEl ? nameEl.value : '';
    const price = priceEl ? parseFloat(priceEl.value) || 0 : 0;
    const currency = curEl ? curEl.value : 'USD';
    const category = catEl ? catEl.value : 'other';
    const startDate = dateEl && dateEl.value ? dateEl.value : new Date().toISOString().split('T')[0];

    subscriptions.unshift({
        id: Date.now(),
        name,
        icon: selectedIcon || 'fas fa-receipt',
        color: selectedColor,
        price,
        currency,
        cycle: selectedCycle,
        category,
        nextBilling: startDate
    });

    saveSubscriptions();
    const list = document.getElementById('subscriptionsList');
    if (list) renderSubscriptions();
    const addModal = document.getElementById('addModal');
    if (addModal) addModal.classList.remove('active');
    resetForm();
}

function renderSubscriptions() {
    const list = document.getElementById('subscriptionsList');
    if (!list) return;
    list.innerHTML = subscriptions.map(sub => `
        <div class="subscription-card" data-id="${sub.id}">
            <div class="sub-icon" style="background: ${sub.color}">
                <i class="${sub.icon}"></i>
            </div>
            <div class="sub-info">
                <div class="sub-name">${sub.name}</div>
                <div class="sub-meta">${sub.category} · ${formatDate(sub.nextBilling)}</div>
            </div>
            <div class="sub-price">
                <div class="sub-amount">${getSymbol(sub.currency)}${sub.price}</div>
                <div class="sub-cycle">/${sub.cycle}</div>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const totalSubs = document.getElementById('totalSubs');
    const monthlyTotal = document.getElementById('monthlyTotal');
    const yearlyTotal = document.getElementById('yearlyTotal');
    if (totalSubs) totalSubs.textContent = subscriptions.length;
    const monthly = getMonthlyTotal();
    if (monthlyTotal) monthlyTotal.textContent = `$${monthly.toFixed(2)}`;
    if (yearlyTotal) yearlyTotal.textContent = `$${(monthly * 12).toFixed(2)}`;
}

function showSubDetail(id) {
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return;
    const content = document.getElementById('detailContent');
    if (!content) return;
    content.innerHTML = `
        <div class="detail-header">
            <div class="detail-icon" style="background: ${sub.color}">
                <i class="${sub.icon}"></i>
            </div>
            <div class="detail-title">
                <h2>${sub.name}</h2>
                <p>${sub.category.charAt(0).toUpperCase() + sub.category.slice(1)}</p>
            </div>
        </div>
        <div class="detail-stats">
            <div class="detail-stat">
                <div class="detail-stat-value">${getSymbol(sub.currency)}${sub.price}</div>
                <div class="detail-stat-label">Price</div>
            </div>
            <div class="detail-stat">
                <div class="detail-stat-value">${sub.cycle.charAt(0).toUpperCase() + sub.cycle.slice(1)}</div>
                <div class="detail-stat-label">Cycle</div>
            </div>
            <div class="detail-stat">
                <div class="detail-stat-value">${getSymbol(sub.currency)}${(sub.price * 12).toFixed(2)}</div>
                <div class="detail-stat-label">Yearly</div>
            </div>
        </div>
        <div class="detail-section">
            <h4>Details</h4>
            <div class="detail-row">
                <span class="detail-row-label">Next Billing</span>
                <span class="detail-row-value">${new Date(sub.nextBilling).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div class="detail-row">
                <span class="detail-row-label">Billing Cycle</span>
                <span class="detail-row-value">${sub.cycle.charAt(0).toUpperCase() + sub.cycle.slice(1)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-row-label">Currency</span>
                <span class="detail-row-value">${sub.currency}</span>
            </div>
        </div>
        <div class="detail-actions">
            <button class="btn btn-danger" onclick="deleteSub(${sub.id})">
                <i class="fas fa-trash"></i> Delete
            </button>
            <button class="btn btn-primary" onclick="document.getElementById('detailModal').classList.remove('active')">
                Close
            </button>
        </div>
    `;
    document.getElementById('detailModal').classList.add('active');
}

function deleteSub(id) {
    subscriptions = subscriptions.filter(s => s.id !== id);
    saveSubscriptions();
    renderSubscriptions();
    updateStats();
    document.getElementById('detailModal').classList.remove('active');
}

// --- COMMON EVENT LISTENERS ---
function setupCommonListeners() {
    // Add subscription
    const addSubBtn = document.getElementById('addSubBtn');
    if (addSubBtn) {
        addSubBtn.addEventListener('click', () => {
            resetForm();
            goToStep(1);
            document.getElementById('addModal').classList.add('active');
        });
    }

    const closeModal = document.getElementById('closeModal');
    if (closeModal) closeModal.addEventListener('click', () => document.getElementById('addModal').classList.remove('active'));
    const modalBackBtn = document.getElementById('modalBackBtn');
    if (modalBackBtn) modalBackBtn.addEventListener('click', () => goToStep(1));

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentStep === 1 && !selectedTemplate) return;
            if (currentStep === 2) addSubscription();
            else goToStep(2);
        });
    }

    const customSubBtn = document.getElementById('customSubBtn');
    if (customSubBtn) {
        customSubBtn.addEventListener('click', () => {
            selectedTemplate = null;
            goToStep(2);
        });
    }

    const templateSearch = document.getElementById('templateSearch');
    if (templateSearch) {
        templateSearch.addEventListener('input', (e) => {
            const cat = document.querySelector('.pill.active')?.dataset.category || 'all';
            renderTemplates(cat, e.target.value);
        });
    }

    document.querySelectorAll('.category-pills .pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.category-pills .pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            renderTemplates(pill.dataset.category, document.getElementById('templateSearch')?.value || '');
        });
    });

    const templatesList = document.getElementById('templatesList');
    if (templatesList) {
        templatesList.addEventListener('click', (e) => {
            const item = e.target.closest('.template-item');
            if (item) selectTemplate(parseInt(item.dataset.id));
        });
    }

    const iconSelector = document.getElementById('iconSelector');
    if (iconSelector) iconSelector.addEventListener('click', () => document.getElementById('iconModal').classList.add('active'));
    const closeIconModal = document.getElementById('closeIconModal');
    if (closeIconModal) closeIconModal.addEventListener('click', () => document.getElementById('iconModal').classList.remove('active'));

    const iconGrid = document.getElementById('iconGrid');
    if (iconGrid) {
        iconGrid.addEventListener('click', (e) => {
            const item = e.target.closest('.icon-item');
            if (item) {
                selectedIcon = item.dataset.icon;
                updateIconPreview();
                renderIcons(document.getElementById('iconSearch')?.value || '');
                document.getElementById('iconModal').classList.remove('active');
            }
        });
    }

    const iconSearch = document.getElementById('iconSearch');
    if (iconSearch) iconSearch.addEventListener('input', (e) => renderIcons(e.target.value));

    document.querySelectorAll('.cycle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cycle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedCycle = btn.dataset.cycle;
        });
    });

    // Settings / Info
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', () => document.getElementById('settingsModal').classList.add('active'));
    const closeSettings = document.getElementById('closeSettings');
    if (closeSettings) closeSettings.addEventListener('click', () => document.getElementById('settingsModal').classList.remove('active'));
    const infoBtn = document.getElementById('infoBtn');
    if (infoBtn) infoBtn.addEventListener('click', () => document.getElementById('infoModal').classList.add('active'));
    const closeInfo = document.getElementById('closeInfo');
    if (closeInfo) closeInfo.addEventListener('click', () => document.getElementById('infoModal').classList.remove('active'));

    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            document.documentElement.setAttribute('data-theme', e.target.checked ? 'dark' : 'light');
        });
    }

    // Detail modal
    const closeDetail = document.getElementById('closeDetail');
    if (closeDetail) closeDetail.addEventListener('click', () => document.getElementById('detailModal').classList.remove('active'));

    // Subscription card click
    const subscriptionsList = document.getElementById('subscriptionsList');
    if (subscriptionsList) {
        subscriptionsList.addEventListener('click', (e) => {
            const card = e.target.closest('.subscription-card');
            if (card) showSubDetail(parseInt(card.dataset.id));
        });
    }

    // Sort button
    const sortBtn = document.getElementById('sortBtn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            subscriptions.sort((a, b) => a.price - b.price);
            saveSubscriptions();
            renderSubscriptions();
        });
    }

    // More page items
    const moreSettings = document.getElementById('moreSettings');
    if (moreSettings) moreSettings.addEventListener('click', () => document.getElementById('settingsModal').classList.add('active'));
    const moreAbout = document.getElementById('moreAbout');
    if (moreAbout) moreAbout.addEventListener('click', () => document.getElementById('infoModal').classList.add('active'));
    const moreDelete = document.getElementById('moreDelete');
    if (moreDelete) {
        moreDelete.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all subscriptions?')) {
                subscriptions = [];
                saveSubscriptions();
                renderSubscriptions();
                updateStats();
            }
        });
    }

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });
}

// --- INIT ---
function initCommon() {
    renderTemplates();
    renderIcons();
    setupCommonListeners();
}
