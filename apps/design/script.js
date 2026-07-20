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
    { id: 13, name: 'Deezer', icon: 'fa-solid fa-headphones', color: '#A238FF', category: 'music', price: 10.99, currency: 'USD' },
    { id: 14, name: 'SoundCloud', icon: 'fa-brands fa-soundcloud', color: '#FF5500', category: 'music', price: 12.99, currency: 'USD' },
    { id: 15, name: 'Microsoft 365', icon: 'fa-brands fa-microsoft', color: '#0078D4', category: 'productivity', price: 6.99, currency: 'USD' },
    { id: 16, name: 'Google Workspace', icon: 'fa-brands fa-google', color: '#4285F4', category: 'productivity', price: 6.99, currency: 'USD' },
    { id: 17, name: 'Notion', icon: 'fa-solid fa-n', color: '#000000', category: 'productivity', price: 8.00, currency: 'USD' },
    { id: 18, name: 'Todoist', icon: 'fa-solid fa-check-circle', color: '#E44332', category: 'productivity', price: 4.99, currency: 'USD' },
    { id: 19, name: 'Evernote', icon: 'fa-solid fa-note-sticky', color: '#00A82D', category: 'productivity', price: 7.99, currency: 'USD' },
    { id: 20, name: 'Trello', icon: 'fa-brands fa-trello', color: '#0079BF', category: 'productivity', price: 5.00, currency: 'USD' },
    { id: 21, name: 'iCloud+', icon: 'fa-solid fa-cloud', color: '#555555', category: 'cloud', price: 2.99, currency: 'USD' },
    { id: 22, name: 'Google One', icon: 'fa-brands fa-google', color: '#4285F4', category: 'cloud', price: 2.99, currency: 'USD' },
    { id: 23, name: 'Dropbox', icon: 'fa-brands fa-dropbox', color: '#0061FF', category: 'cloud', price: 11.99, currency: 'USD' },
    { id: 24, name: 'OneDrive', icon: 'fa-solid fa-cloud', color: '#0078D4', category: 'cloud', price: 1.99, currency: 'USD' },
    { id: 25, name: 'Xbox Game Pass', icon: 'fa-brands fa-xbox', color: '#107C10', category: 'gaming', price: 14.99, currency: 'USD' },
    { id: 26, name: 'PlayStation Plus', icon: 'fa-brands fa-playstation', color: '#003087', category: 'gaming', price: 9.99, currency: 'USD' },
    { id: 27, name: 'Nintendo Switch Online', icon: 'fa-solid fa-gamepad', color: '#E60012', category: 'gaming', price: 3.99, currency: 'USD' },
    { id: 28, name: 'EA Play', icon: 'fa-solid fa-futbol', color: '#1D1D1D', category: 'gaming', price: 4.99, currency: 'USD' },
    { id: 29, name: 'Apple Arcade', icon: 'fa-solid fa-dice', color: '#555555', category: 'gaming', price: 6.99, currency: 'USD' },
    { id: 30, name: 'Duolingo Plus', icon: 'fa-solid fa-graduation-cap', color: '#58CC02', category: 'education', price: 12.99, currency: 'USD' },
    { id: 31, name: 'MasterClass', icon: 'fa-solid fa-chalkboard-user', color: '#000000', category: 'education', price: 10.00, currency: 'USD' },
    { id: 32, name: 'Skillshare', icon: 'fa-solid fa-palette', color: '#00FF84', category: 'education', price: 13.99, currency: 'USD' },
    { id: 33, name: 'Coursera Plus', icon: 'fa-solid fa-book-open', color: '#0056D2', category: 'education', price: 59.00, currency: 'USD' },
    { id: 34, name: 'LinkedIn Learning', icon: 'fa-brands fa-linkedin', color: '#0A66C2', category: 'education', price: 29.99, currency: 'USD' },
    { id: 35, name: 'Peloton', icon: 'fa-solid fa-bicycle', color: '#E60023', category: 'fitness', price: 12.99, currency: 'USD' },
    { id: 36, name: 'Strava', icon: 'fa-solid fa-person-running', color: '#FC4C02', category: 'fitness', price: 7.99, currency: 'USD' },
    { id: 37, name: 'Headspace', icon: 'fa-solid fa-spa', color: '#F47D31', category: 'fitness', price: 12.99, currency: 'USD' },
    { id: 38, name: 'Calm', icon: 'fa-solid fa-moon', color: '#3B6E8F', category: 'fitness', price: 14.99, currency: 'USD' },
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
    'CLP': '$', 'COP': '$', 'PEN': 'S/', 'ARS': '$', 'UAH': '₴', 'NGN': '₦',
    'EGP': 'E£', 'PKR': '₨', 'BDT': '৳'
};

let subscriptions = [
    { id: 1, name: 'Netflix', icon: 'fa-brands fa-netflix', color: '#E50914', price: 15.99, currency: 'USD', cycle: 'monthly', category: 'entertainment', nextBilling: '2024-02-15' },
    { id: 2, name: 'Spotify', icon: 'fa-brands fa-spotify', color: '#1DB954', price: 9.99, currency: 'USD', cycle: 'monthly', category: 'music', nextBilling: '2024-02-20' },
    { id: 3, name: 'Microsoft 365', icon: 'fa-brands fa-microsoft', color: '#0078D4', price: 6.99, currency: 'USD', cycle: 'monthly', category: 'productivity', nextBilling: '2024-02-25' },
    { id: 4, name: 'Disney+', icon: 'fa-solid fa-d', color: '#113CCF', price: 7.99, currency: 'USD', cycle: 'monthly', category: 'entertainment', nextBilling: '2024-03-01' },
    { id: 5, name: 'iCloud+', icon: 'fa-solid fa-cloud', color: '#555555', price: 2.99, currency: 'USD', cycle: 'monthly', category: 'cloud', nextBilling: '2024-02-28' },
    { id: 6, name: 'Xbox Game Pass', icon: 'fa-brands fa-xbox', color: '#107C10', price: 14.99, currency: 'USD', cycle: 'monthly', category: 'gaming', nextBilling: '2024-02-18' },
];

let currentStep = 1;
let selectedTemplate = null;
let selectedIcon = null;
let selectedColor = '#000000';
let selectedCycle = 'monthly';

const addModal = document.getElementById('addModal');
const iconModal = document.getElementById('iconModal');
const settingsModal = document.getElementById('settingsModal');
const infoModal = document.getElementById('infoModal');

function init() {
    renderSubscriptions();
    renderTemplates();
    renderIcons();
    setupEventListeners();
    updateStats();
}

function renderSubscriptions() {
    const list = document.getElementById('subscriptionsList');
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
                <div class="sub-amount">${currencySymbols[sub.currency]}${sub.price}</div>
                <div class="sub-cycle">/${sub.cycle}</div>
            </div>
        </div>
    `).join('');
}

function renderTemplates(category = 'all', search = '') {
    let filtered = templates;
    if (category !== 'all') filtered = filtered.filter(t => t.category === category);
    if (search) filtered = filtered.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    
    const list = document.getElementById('templatesList');
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

function renderIcons(search = '') {
    let filtered = icons;
    if (search) filtered = icons.filter(i => i.toLowerCase().includes(search.toLowerCase()));
    
    const grid = document.getElementById('iconGrid');
    grid.innerHTML = filtered.map(icon => `
        <div class="icon-item ${selectedIcon === icon ? 'selected' : ''}" data-icon="${icon}">
            <i class="${icon}"></i>
        </div>
    `).join('');
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function updateStats() {
    document.getElementById('totalSubs').textContent = subscriptions.length;
    const monthly = subscriptions.reduce((sum, s) => sum + s.price, 0);
    document.getElementById('monthlyTotal').textContent = `$${monthly.toFixed(2)}`;
    document.getElementById('yearlyTotal').textContent = `$${(monthly * 12).toFixed(2)}`;
}

function goToStep(step) {
    currentStep = step;
    document.querySelectorAll('.step-content').forEach((el, i) => {
        el.classList.toggle('active', i + 1 === step);
    });
    document.getElementById('modalTitle').textContent = step === 1 ? 'Add Subscription' : 'Subscription Details';
    document.getElementById('modalBackBtn').style.display = step === 1 ? 'none' : 'flex';
    document.getElementById('nextBtn').textContent = step === 1 ? 'Continue' : 'Add Subscription';
}

function selectTemplate(id) {
    selectedTemplate = templates.find(t => t.id === id);
    selectedIcon = selectedTemplate.icon;
    selectedColor = selectedTemplate.color;
    document.getElementById('subName').value = selectedTemplate.name;
    document.getElementById('subPrice').value = selectedTemplate.price;
    document.getElementById('subCategory').value = selectedTemplate.category;
    goToStep(2);
    updateIconPreview();
}

function updateIconPreview() {
    const preview = document.getElementById('iconPreview');
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
    document.getElementById('subName').value = '';
    document.getElementById('subPrice').value = '';
    document.getElementById('subStartDate').value = '';
    document.getElementById('templateSearch').value = '';
    document.querySelectorAll('.cycle-btn').forEach(b => b.classList.toggle('active', b.dataset.cycle === 'monthly'));
    const preview = document.getElementById('iconPreview');
    preview.innerHTML = '<i class="fas fa-plus"></i>';
    preview.style.background = '';
    preview.classList.remove('has-icon');
    renderTemplates();
}

function addSubscription() {
    const name = document.getElementById('subName').value;
    const price = parseFloat(document.getElementById('subPrice').value) || 0;
    const currency = document.getElementById('currencySelect').value;
    const cycle = selectedCycle;
    const category = document.getElementById('subCategory').value;
    const startDate = document.getElementById('subStartDate').value || new Date().toISOString().split('T')[0];
    
    subscriptions.unshift({
        id: Date.now(),
        name,
        icon: selectedIcon || 'fas fa-receipt',
        color: selectedColor,
        price,
        currency,
        cycle,
        category,
        nextBilling: startDate
    });
    
    renderSubscriptions();
    updateStats();
    addModal.classList.remove('active');
    resetForm();
}

function setupEventListeners() {
    document.getElementById('addSubBtn').addEventListener('click', () => {
        resetForm();
        goToStep(1);
        addModal.classList.add('active');
    });
    
    document.getElementById('closeModal').addEventListener('click', () => addModal.classList.remove('active'));
    document.getElementById('modalBackBtn').addEventListener('click', () => goToStep(1));
    
    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentStep === 1 && !selectedTemplate) return;
        if (currentStep === 2) addSubscription();
        else goToStep(2);
    });
    
    document.getElementById('customSubBtn').addEventListener('click', () => {
        selectedTemplate = null;
        goToStep(2);
    });
    
    document.getElementById('templateSearch').addEventListener('input', (e) => {
        const cat = document.querySelector('.pill.active')?.dataset.category || 'all';
        renderTemplates(cat, e.target.value);
    });
    
    document.querySelectorAll('.pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            renderTemplates(pill.dataset.category, document.getElementById('templateSearch').value);
        });
    });
    
    document.getElementById('templatesList').addEventListener('click', (e) => {
        const item = e.target.closest('.template-item');
        if (item) selectTemplate(parseInt(item.dataset.id));
    });
    
    document.getElementById('iconSelector').addEventListener('click', () => iconModal.classList.add('active'));
    document.getElementById('closeIconModal').addEventListener('click', () => iconModal.classList.remove('active'));
    
    document.getElementById('iconGrid').addEventListener('click', (e) => {
        const item = e.target.closest('.icon-item');
        if (item) {
            selectedIcon = item.dataset.icon;
            updateIconPreview();
            renderIcons(document.getElementById('iconSearch').value);
            iconModal.classList.remove('active');
        }
    });
    
    document.getElementById('iconSearch').addEventListener('input', (e) => renderIcons(e.target.value));
    
    document.querySelectorAll('.cycle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cycle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedCycle = btn.dataset.cycle;
        });
    });
    
    document.getElementById('settingsBtn').addEventListener('click', () => settingsModal.classList.add('active'));
    document.getElementById('closeSettings').addEventListener('click', () => settingsModal.classList.remove('active'));
    
    document.getElementById('infoBtn').addEventListener('click', () => infoModal.classList.add('active'));
    document.getElementById('closeInfo').addEventListener('click', () => infoModal.classList.remove('active'));
    
    document.getElementById('darkModeToggle').addEventListener('change', (e) => {
        document.documentElement.setAttribute('data-theme', e.target.checked ? 'dark' : 'light');
    });
    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });
    
    document.querySelectorAll('.bottom-nav').forEach(nav => {
        nav.addEventListener('click', () => {
            if (!nav.classList.contains('add-btn')) {
                document.querySelectorAll('.bottom-nav').forEach(n => n.classList.remove('active'));
                nav.classList.add('active');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', init);
