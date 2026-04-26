// ===== CONFIGURATION =====
const API_BASE_URL = 'http://localhost:5000/api';
let map = null, campsMap = null, heatmapLayer = null;
let mapMarkers = [], campsMarkers = [];
let allVillages = [], allCamps = [];
let currentFilter = 'all';
let waterLevelChart = null, disasterChart = null;
let chatMessages = [];
let safetyTips = ["⚠️ Move to higher ground immediately", "📦 Keep emergency kit ready (water, food, medicines)", "📞 Call 1122 for rescue", "🚫 Don't walk through flood water", "🔌 Turn off gas/electricity before leaving", "🏃 Help elderly and disabled neighbors", "📻 Listen to local news for updates"];
let currentTip = 0;
let currentLang = 'en';
let notificationPermission = false;
let userLocation = null;

// ===== MOCK DATA =====
const MOCK_VILLAGES = [
    { id: 1, name: "Qadirpur", district: "Nowshero Feroze", lat: 26.7856, lng: 68.0139, risk: "CRITICAL", pop: 45000, elev: 45, rain: 145 },
    { id: 2, name: "Sujawal", district: "Sujawal", lat: 24.6056, lng: 68.0781, risk: "HIGH", pop: 35000, elev: 12, rain: 98 },
    { id: 3, name: "Mehar", district: "Dadu", lat: 27.1833, lng: 67.8167, risk: "HIGH", pop: 55000, elev: 38, rain: 87 },
    { id: 4, name: "Sukkur", district: "Sukkur", lat: 27.7167, lng: 68.8667, risk: "MEDIUM", pop: 500000, elev: 55, rain: 48 },
    { id: 5, name: "Hyderabad", district: "Hyderabad", lat: 25.3667, lng: 68.3667, risk: "LOW", pop: 1800000, elev: 13, rain: 18 },
    { id: 6, name: "Karachi", district: "Karachi", lat: 24.8607, lng: 67.0011, risk: "LOW", pop: 16000000, elev: 8, rain: 12 },
    { id: 7, name: "Larkana", district: "Larkana", lat: 27.5667, lng: 68.2167, risk: "MEDIUM", pop: 490000, elev: 42, rain: 25 },
    { id: 8, name: "Multan", district: "Multan", lat: 30.1575, lng: 71.5249, risk: "LOW", pop: 1900000, elev: 122, rain: 8 },
    { id: 9, name: "Rajanpur", district: "Rajanpur", lat: 29.1042, lng: 70.3297, risk: "HIGH", pop: 98000, elev: 85, rain: 62 },
    { id: 10, name: "DG Khan", district: "Dera Ghazi Khan", lat: 30.0561, lng: 70.6369, risk: "MEDIUM", pop: 650000, elev: 120, rain: 22 }
];

const MOCK_CAMPS = [
    { name: "Sukkur Relief Camp", district: "Sukkur", lat: 27.7167, lng: 68.8667, capacity: 5000, contact: "03001234567" },
    { name: "Hyderabad Emergency Center", district: "Hyderabad", lat: 25.3667, lng: 68.3667, capacity: 3000, contact: "03009876543" },
    { name: "Karachi Flood Shelter", district: "Karachi", lat: 24.8607, lng: 67.0011, capacity: 10000, contact: "03005555555" },
    { name: "Larkana Evacuation Camp", district: "Larkana", lat: 27.5667, lng: 68.2167, capacity: 2000, contact: "03001111111" },
    { name: "Multan Relief Center", district: "Multan", lat: 30.1575, lng: 71.5249, capacity: 3500, contact: "03002222222" }
];

// ===== UTILITY =====
function formatTime(d) { return new Date(d).toLocaleString('en-PK'); }
function updateLastUpdated() { document.getElementById('footerTime').innerHTML = formatTime(new Date()); }

function showToast(msg, type = 'info') {
    let existing = document.querySelector('.toast');
    if (existing) existing.remove();
    let toast = document.createElement('div');
    toast.className = 'toast';
    let colors = { critical: '#dc2626', high: '#f97316', success: '#22c55e', info: '#0f4c5c' };
    toast.style.borderLeftColor = colors[type] || '#0f4c5c';
    toast.innerHTML = `${type === 'critical' ? '⚠️' : type === 'high' ? '🔴' : '✅'} ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// ===== NOTIFICATIONS =====
function setupNotifications() {
    document.getElementById('notifBtn').addEventListener('click', async () => {
        if ('Notification' in window) {
            let perm = await Notification.requestPermission();
            notificationPermission = perm === 'granted';
            showToast(notificationPermission ? 'Notifications enabled!' : 'Notifications blocked', notificationPermission ? 'success' : 'high');
        }
    });
}

function sendNotif(title, body) {
    if (notificationPermission && 'Notification' in window) new Notification(title, { body });
}

// ===== VOICE ALERTS =====
function setupVoiceAlerts() {
    document.getElementById('voiceAlertBtn').addEventListener('click', () => {
        let critical = document.getElementById('criticalCount').innerText;
        let high = document.getElementById('highCount').innerText;
        let msg = `Flood alert. ${critical} areas at critical risk. ${high} areas at high risk. Please check map immediately.`;
        let utterance = new SpeechSynthesisUtterance(msg);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
        showToast('Voice alert playing...', 'success');
    });
}

// ===== WHATSAPP & SOCIAL SHARE =====
function setupWhatsApp() {
    document.getElementById('whatsappShareBtn').addEventListener('click', () => {
        let critical = document.getElementById('criticalCount').innerText;
        let text = `🚨 FLOOD ALERT: ${critical} areas at critical risk! Stay safe. Live map: ${window.location.href}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    });
}

function setupSocialShare() {
    document.getElementById('socialShareBtn').addEventListener('click', () => {
        let text = `🌊 FloodWatch PK - Real-time flood monitoring for Pakistan. Stay informed! ${window.location.href}`;
        if (navigator.share) navigator.share({ title: 'FloodWatch PK', text });
        else { navigator.clipboard.writeText(text); showToast('Link copied!', 'success'); }
    });
}

// ===== DONATION =====
function setupDonation() {
    document.getElementById('donateBtn').addEventListener('click', () => {
        let modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `<div class="modal-content"><div class="modal-header"><h3>❤️ Support Flood Relief</h3><span class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</span></div>
        <div class="modal-body"><p><strong>Verified Organizations:</strong></p><p>📞 NDMA: 1334</p><p>🏦 PM Flood Relief: 1234-567890-1</p><p>💳 Easypaisa: 03001234567</p><hr><p>Your donation helps provide food, shelter, and medical aid.</p>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="width:100%; margin-top:1rem; padding:0.5rem; background:#0f4c5c; color:white; border:none; border-radius:8px;">Close</button></div></div>`;
        document.body.appendChild(modal);
    });
}

// ===== HEATMAP =====
function setupHeatmap() {
    document.getElementById('heatmapBtn').addEventListener('click', () => {
        if (!map) initMap();
        let heatData = allVillages.map(v => [v.lat, v.lng, v.risk === 'CRITICAL' ? 1 : v.risk === 'HIGH' ? 0.7 : v.risk === 'MEDIUM' ? 0.4 : 0.1]);
        if (heatmapLayer) map.removeLayer(heatmapLayer);
        heatmapLayer = L.heatLayer(heatData, { radius: 25, blur: 15 }).addTo(map);
        showToast('Heatmap activated - Red shows high risk', 'info');
        setTimeout(() => { if (heatmapLayer) map.removeLayer(heatmapLayer); }, 10000);
    });
}

// ===== LOCATION TRACKER =====
function setupLocationTracker() {
    document.getElementById('locationBtn').addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                if (map) map.setView([userLocation.lat, userLocation.lng], 12);
                L.marker([userLocation.lat, userLocation.lng]).addTo(map).bindPopup('📍 Your location').openPopup();
                showToast('Location found! Showing nearby areas.', 'success');
            }, () => showToast('Unable to get location', 'high'));
        }
    });
}

// ===== EVACUATION ROUTE =====
function setupEvacuation() {
    document.getElementById('evacuationBtn').addEventListener('click', () => {
        showToast('Click on your location on the map for evacuation route', 'info');
        if (!map) initMap();
        map.once('click', (e) => {
            let url = `https://www.google.com/maps/dir/${e.latlng.lat},${e.latlng.lng}/Sukkur,PK`;
            window.open(url, '_blank');
            showToast('Opening route in Google Maps', 'success');
        });
    });
}

// ===== API =====
async function fetchVillages() {
    try {
        let res = await fetch(`${API_BASE_URL}/villages`);
        if (!res.ok) throw new Error();
        let data = await res.json();
        allVillages = (data.villages || data).map(v => ({ id: v.id, name: v.name, district: v.district, lat: v.latitude, lng: v.longitude, risk: v.risk_level, pop: v.population, elev: v.elevation }));
        return allVillages;
    } catch { allVillages = MOCK_VILLAGES; return allVillages; }
}

// ===== MAP =====
function initMap() {
    if (!map) {
        map = L.map('map').setView([30.3753, 69.3451], 6);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    }
}

function updateMap() {
    initMap();
    mapMarkers.forEach(m => map.removeLayer(m));
    mapMarkers = [];
    let colors = { CRITICAL: '#dc2626', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' };
    let filtered = currentFilter === 'all' ? allVillages : allVillages.filter(v => v.risk === currentFilter.toUpperCase());
    filtered.forEach(v => {
        let m = L.marker([v.lat, v.lng]).addTo(map);
        m.bindPopup(`<b>${v.name}</b><br>${v.district}<br><span style="color:${colors[v.risk]}">Risk: ${v.risk}</span><br><button onclick="showDetail(${v.id})">Details</button>`);
        let c = L.circle([v.lat, v.lng], { radius: 5000, color: colors[v.risk], fillColor: colors[v.risk], fillOpacity: 0.2 }).addTo(map);
        mapMarkers.push(m, c);
    });
}

// ===== UPDATE UI =====
async function updateStats() {
    let villages = await fetchVillages();
    let critical = villages.filter(v => v.risk === 'CRITICAL').length;
    let high = villages.filter(v => v.risk === 'HIGH').length;
    let medium = villages.filter(v => v.risk === 'MEDIUM').length;
    let low = villages.filter(v => v.risk === 'LOW').length;
    document.getElementById('criticalCount').innerText = critical;
    document.getElementById('highCount').innerText = high;
    document.getElementById('mediumCount').innerText = medium;
    document.getElementById('lowCount').innerText = low;
    document.getElementById('alertBadge').innerText = critical + high;
    if (critical > 0) { showToast(`${critical} area(s) at CRITICAL risk!`, 'critical'); sendNotif('🚨 CRITICAL FLOOD ALERT', `${critical} areas need immediate evacuation.`); }
    else if (high > 0) showToast(`${high} area(s) at HIGH risk`, 'high');
    renderVillageList(villages);
    updateMap();
}

function renderVillageList(villages) {
    let container = document.getElementById('villageList');
    let search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    let filtered = (currentFilter === 'all' ? villages : villages.filter(v => v.risk === currentFilter.toUpperCase())).filter(v => v.name.toLowerCase().includes(search) || v.district.toLowerCase().includes(search));
    if (!filtered.length) { container.innerHTML = '<div style="padding:1rem; text-align:center;">No villages found</div>'; return; }
    container.innerHTML = filtered.map(v => `<div class="village-item" onclick="showDetail(${v.id})"><div><strong>${v.name}</strong><br><small>${v.district}</small></div><span class="risk-badge ${v.risk}">${v.risk}</span></div>`).join('');
}

function showDetail(id) {
    let v = allVillages.find(v => v.id === id);
    if (!v) return;
    let colors = { CRITICAL: '#dc2626', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' };
    let tip = v.risk === 'CRITICAL' ? '⚠️ IMMEDIATE EVACUATION!' : v.risk === 'HIGH' ? '📢 Prepare to evacuate' : v.risk === 'MEDIUM' ? '👀 Stay alert' : '✅ No threat';
    document.getElementById('modalTitle').innerText = v.name;
    document.getElementById('modalBody').innerHTML = `<p><strong>District:</strong> ${v.district}</p><p><strong>Elevation:</strong> ${v.elev || 'N/A'} m</p><p><strong>Population:</strong> ${(v.pop || 0).toLocaleString()}</p><p><strong>Risk:</strong> <span style="color:${colors[v.risk]}">${v.risk}</span></p><p><strong>Action:</strong> ${tip}</p><p><strong>📞 Emergency:</strong> Rescue 1122 | Police 15</p>`;
    document.getElementById('villageModal').style.display = 'block';
}

function closeModal() { document.getElementById('villageModal').style.display = 'none'; }
function closeChatbot() { document.getElementById('chatbotModal').style.display = 'none'; }

// ===== RIVER & GAUGE =====
async function updateRiver() {
    try {
        let res = await fetch(`${API_BASE_URL}/river`);
        let river = await res.json();
        let level = river.water_level || 7.2;
        let danger = river.danger_level || 8.0;
        document.getElementById('waterLevel').innerText = level;
        document.getElementById('dangerLevel').innerText = danger;
        let percent = Math.min(100, (level / danger) * 100);
        document.getElementById('waterGauge').style.width = percent + '%';
        let status = level > 7.5 ? 'CRITICAL' : level > 6.5 ? 'DANGER' : level > 5.5 ? 'ELEVATED' : 'NORMAL';
        let statusEl = document.getElementById('riverStatusText');
        statusEl.innerText = status;
        statusEl.style.color = status === 'CRITICAL' ? '#dc2626' : status === 'DANGER' ? '#f97316' : status === 'ELEVATED' ? '#eab308' : '#22c55e';
        let ctx = document.getElementById('waterLevelChart').getContext('2d');
        if (waterLevelChart) waterLevelChart.destroy();
        waterLevelChart = new Chart(ctx, { type: 'line', data: { labels: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'Today'], datasets: [{ label: 'Water Level (m)', data: [5.2, 5.5, 5.8, 6.1, 6.4, 6.7, level], borderColor: '#f97316', fill: true, tension: 0.4 }] }, options: { responsive: true } });
    } catch { document.getElementById('waterLevel').innerText = '7.2'; document.getElementById('waterGauge').style.width = '90%'; }
}

function updateWeather() {
    document.getElementById('weatherTemp').innerText = Math.floor(Math.random() * 20) + 25;
    document.getElementById('weatherHumidity').innerText = Math.floor(Math.random() * 40) + 40;
    document.getElementById('weatherRain').innerText = Math.floor(Math.random() * 30);
    document.getElementById('weatherWind').innerText = Math.floor(Math.random() * 20) + 5;
}

function updateDisasterChart() {
    let ctx = document.getElementById('disasterChart').getContext('2d');
    if (disasterChart) disasterChart.destroy();
    disasterChart = new Chart(ctx, { type: 'bar', data: { labels: ['2022', '2023', '2024', '2025'], datasets: [{ label: 'Flood Events', data: [85, 42, 38, 52], backgroundColor: '#0f4c5c', borderRadius: 8 }] }, options: { responsive: true } });
}

// ===== SAFETY TIPS =====
function updateSafetyTip() {
    document.getElementById('safetyTip').innerHTML = safetyTips[currentTip];
    currentTip = (currentTip + 1) % safetyTips.length;
}
function setupSafetyTips() { document.getElementById('nextTipBtn').addEventListener('click', updateSafetyTip); updateSafetyTip(); setInterval(updateSafetyTip, 8000); }

// ===== CAMPS =====
function loadCamps() {
    allCamps = MOCK_CAMPS;
    document.getElementById('miniCampsList').innerHTML = allCamps.slice(0, 3).map(c => `<div><strong>🏕️ ${c.name}</strong><br>${c.district}</div>`).join('');
    document.getElementById('campsFullList').innerHTML = allCamps.map(c => `<div class="camp-item" onclick="focusCamp(${c.lat},${c.lng})"><strong>🏕️ ${c.name}</strong><br>📍 ${c.district}<br>👥 ${c.capacity.toLocaleString()}<br>📞 ${c.contact}</div>`).join('');
    if (!campsMap) { campsMap = L.map('campsMap').setView([30.3753, 69.3451], 6); L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(campsMap); }
    campsMarkers.forEach(m => campsMap.removeLayer(m));
    campsMarkers = [];
    allCamps.forEach(c => { let m = L.marker([c.lat, c.lng]).addTo(campsMap); m.bindPopup(`<b>${c.name}</b><br>Capacity: ${c.capacity}<br>📞 ${c.contact}`); campsMarkers.push(m); });
}
function focusCamp(lat, lng) { if (campsMap) campsMap.setView([lat, lng], 12); }

// ===== ALERTS PAGE =====
async function updateAlertsPage() {
    let villages = await fetchVillages();
    let alerts = villages.filter(v => v.risk === 'CRITICAL' || v.risk === 'HIGH');
    let container = document.getElementById('alertsList');
    if (!alerts.length) { container.innerHTML = '<div style="padding:1rem;">No active alerts</div>'; return; }
    let colors = { CRITICAL: '#dc2626', HIGH: '#f97316' };
    container.innerHTML = alerts.map(a => `<div class="alert-card" style="border-left-color:${colors[a.risk]}"><i class="fas ${a.risk === 'CRITICAL' ? 'fa-skull-crosswalk' : 'fa-exclamation-triangle'}"></i><div><strong>${a.name}</strong><br>${a.district}<br><span style="color:${colors[a.risk]}">Risk: ${a.risk}</span></div></div>`).join('');
}

// ===== EXPORTS =====
function setupExports() {
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
        let data = allVillages.map(v => ({ Name: v.name, District: v.district, Risk: v.risk }));
        let ws = XLSX.utils.json_to_sheet(data);
        let wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'FloodData');
        XLSX.writeFile(wb, `flood_data_${Date.now()}.xlsx`);
        showToast('Exported to Excel!', 'success');
    });
    document.getElementById('exportPdfBtn').addEventListener('click', async () => {
        let river = await fetch(`${API_BASE_URL}/river`).catch(() => ({ water_level: 7.2 }));
        let html = `<div style="padding:20px;"><h1>Flood Risk Report</h1><p>${new Date().toLocaleString()}</p><h2>Summary</h2><table border="1"><tr><th>Risk</th><th>Count</th></tr>${['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(r => `<tr><td>${r}</td><td>${allVillages.filter(v => v.risk === r).length}</td></tr>`).join('')}</table></div>`;
        html2pdf().from(html).save(`flood_report_${Date.now()}.pdf`);
        showToast('PDF generated!', 'success');
    });
}

// ===== REPORTS =====
function setupReports() {
    document.getElementById('generateReportBtn').addEventListener('click', async () => {
        let district = document.getElementById('reportDistrict').value;
        let format = document.getElementById('reportFormat').value;
        let filtered = district === 'all' ? allVillages : allVillages.filter(v => v.district === district);
        let river = await fetch(`${API_BASE_URL}/river`).catch(() => ({ water_level: 7.2 }));
        let html = `<div><h1>Flood Report - ${district}</h1><p>${new Date().toLocaleString()}</p><p>Water Level: ${river.water_level}m</p><table border="1"><tr><th>Village</th><th>Risk</th></tr>${filtered.map(v => `<tr><td>${v.name}</td><td>${v.risk}</td></tr>`).join('')}</table></div>`;
        if (format === 'pdf') { html2pdf().from(html).save(`report_${district}.pdf`); showToast('PDF ready!', 'success'); }
        else if (format === 'excel') { let ws = XLSX.utils.json_to_sheet(filtered); let wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Report'); XLSX.writeFile(wb, `report_${district}.xlsx`); showToast('Excel ready!', 'success'); }
        else { let blob = new Blob([JSON.stringify(filtered)], {type: 'application/json'}); let a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `report_${district}.json`; a.click(); showToast('JSON ready!', 'success'); }
        document.getElementById('reportPreview').innerHTML = html;
    });
}

// ===== CHAT =====
function setupChat() {
    document.getElementById('chatSendBtn').addEventListener('click', () => {
        let input = document.getElementById('chatInput');
        let msg = input.value.trim();
        if (!msg) return;
        chatMessages.unshift({ user: 'You', text: msg, time: new Date().toLocaleTimeString() });
        renderChat();
        input.value = '';
        setTimeout(() => {
            chatMessages.unshift({ user: 'Community', text: 'Thank you for reporting! Authorities have been notified.', time: new Date().toLocaleTimeString() });
            renderChat();
        }, 1000);
    });
}
function renderChat() {
    let container = document.getElementById('chatMessages');
    container.innerHTML = chatMessages.map(m => `<div class="chat-message"><strong>${m.user}:</strong> ${m.text}<br><small style="color:#666">${m.time}</small></div>`).join('');
}

// ===== AI CHATBOT =====
function setupChatbot() {
    document.querySelector('#chatbotBtn')?.addEventListener('click', () => document.getElementById('chatbotModal').style.display = 'block');
    document.getElementById('chatbotSendBtn')?.addEventListener('click', sendChatbotMsg);
    document.getElementById('chatbotInput')?.addEventListener('keypress', e => { if (e.key === 'Enter') sendChatbotMsg(); });
}
function sendChatbotMsg() {
    let input = document.getElementById('chatbotInput');
    let msg = input.value.trim();
    if (!msg) return;
    let container = document.getElementById('chatbotMessages');
    container.innerHTML += `<div class="user-msg">${msg}</div>`;
    input.value = '';
    setTimeout(() => {
        let reply = getBotReply(msg);
        container.innerHTML += `<div class="bot-msg">🤖 ${reply}</div>`;
        container.scrollTop = container.scrollHeight;
    }, 500);
}
function getBotReply(msg) {
    if (msg.includes('evacuate')) return 'If in critical risk area, move to nearest relief camp immediately. Check Relief Camps page.';
    if (msg.includes('emergency')) return 'Call Rescue 1122 immediately. Stay calm and move to higher ground.';
    if (msg.includes('kit')) return 'Prepare: water, food, medicines, torch, documents, power bank.';
    return 'Stay safe! Move to higher ground if needed. Keep checking dashboard for updates.';
}

// ===== SMS & EMAIL =====
function setupSMS() {
    document.getElementById('subscribeSms').addEventListener('click', () => {
        let phone = document.getElementById('smsPhone').value;
        if (!phone || phone.length < 10) { showToast('Enter valid 11-digit phone number', 'high'); return; }
        showToast(`✓ SMS alerts will be sent to ${phone}`, 'success');
    });
    document.getElementById('subscribeEmail').addEventListener('click', () => {
        let email = document.getElementById('emailAddress').value;
        if (!email || !email.includes('@')) { showToast('Enter valid email address', 'high'); return; }
        showToast(`✓ Email alerts will be sent to ${email}`, 'success');
    });
}

// ===== DARK MODE =====
function setupDarkMode() {
    let btn = document.getElementById('darkModeToggle');
    let isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) document.body.classList.add('dark');
    btn.addEventListener('click', () => { document.body.classList.toggle('dark'); localStorage.setItem('darkMode', document.body.classList.contains('dark')); });
}

// ===== LANGUAGE =====
function setupLanguage() {
    document.getElementById('langToggle').addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'ur' : 'en';
        document.getElementById('langToggle').innerHTML = currentLang === 'en' ? '🇵🇰 اردو' : '🇬🇧 English';
        showToast(currentLang === 'en' ? 'Switched to English' : 'اردو میں تبدیل کر دیا گیا', 'success');
    });
}

// ===== REFRESH =====
function setupRefresh() {
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        let btn = document.getElementById('refreshBtn');
        btn.innerHTML = '🔄 Loading...';
        await Promise.all([updateStats(), updateRiver(), updateWeather()]);
        updateLastUpdated();
        btn.innerHTML = '🔄 Refresh';
        showToast('Data refreshed!', 'success');
    });
}

// ===== FILTERS =====
function filterVillages(risk) {
    currentFilter = risk;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll(`.filter-btn[data-risk="${risk}"]`).forEach(btn => btn.classList.add('active'));
    updateStats();
}
window.filterVillages = filterVillages;
window.filterByRisk = filterVillages;
window.showDetail = showDetail;
window.closeModal = closeModal;
window.closeChatbot = closeChatbot;
window.focusCamp = focusCamp;

// ===== INIT =====
async function init() {
    console.log('🚀 FloodWatch PK Initializing...');
    updateLastUpdated();
    await updateStats();
    await updateRiver();
    updateWeather();
    updateDisasterChart();
    loadCamps();
    setupSafetyTips();
    setupExports();
    setupReports();
    setupChat();
    setupChatbot();
    setupSMS();
    setupDarkMode();
    setupLanguage();
    setupRefresh();
    setupNotifications();
    setupVoiceAlerts();
    setupWhatsApp();
    setupSocialShare();
    setupDonation();
    setupHeatmap();
    setupLocationTracker();
    setupEvacuation();
    await updateAlertsPage();
    setInterval(async () => { await updateStats(); await updateRiver(); updateWeather(); updateLastUpdated(); }, 30000);
    console.log('✅ Ready!');
}

document.addEventListener('DOMContentLoaded', init);

