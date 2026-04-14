const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTL8FSmuDcGE8hlGNOpEvTVQbGXBKpOCYv14ZG2Amnqy74QDR8NNWk3eoB6Doag9oZQTK5UjaGYBU-K/pub?output=csv';
let currentUser = "Gardener";
let myChart = null;

// PWA Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js'); });
}

// 1. Auth & Welcome
async function handleLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    try {
        const response = await fetch(CSV_URL);
        const data = await response.text();
        const rows = data.split('\n').map(r => r.split(','));
        if (rows.some(r => r[0].trim() === user && r[1].trim() === pass)) {
            currentUser = user;
            document.getElementById('welcome-msg').innerText = `Hi, ${user}!`;
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app-screen').style.display = 'block';
            updateGardenUI();
            initChart();
            if (Notification.permission !== "granted") Notification.requestPermission();
        } else { document.getElementById('login-error').innerText = "Invalid Login"; }
    } catch (e) { console.error(e); }
}

// 2. Data Viz: Work-Life Balance
function initChart() {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['Work', 'Social'], datasets: [{ data: [0, 0], backgroundColor: ['#ff9999', '#99ff99'] }] }
    });
}
function updateChart() {
    const w = document.getElementById('work-hrs').value || 0;
    const s = document.getElementById('social-hrs').value || 0;
    myChart.data.datasets[0].data = [w, s];
    myChart.update();
}

// 3. Gamification: Garden Growth
function growPlant() {
    let plants = JSON.parse(localStorage.getItem('garden') || '[]');
    plants.push('🌱');
    localStorage.setItem('garden', JSON.stringify(plants));
    updateGardenUI();
}
function updateGardenUI() {
    const box = document.getElementById('plant-box');
    const plants = JSON.parse(localStorage.getItem('garden') || '[]');
    box.innerText = plants.join(' ');
}

// 4. Notifications & Focus
let focusInt;
function toggleFocusMode() {
    const btn = document.getElementById('focus-btn');
    if (btn.innerText.includes("Active")) {
        clearInterval(focusInt);
        btn.innerText = "Deep Focus Mode";
    } else {
        btn.innerText = "Focus Active (Notifying...)";
        focusInt = setInterval(() => {
            new Notification("ZenGarden Reminder", { body: "Time to blink and look away from the screen! 🌿", icon: "https://via.placeholder.com/192" });
        }, 300000); // 5 mins
    }
}

// 5. Dark Mode / Sunset Toggle
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    document.getElementById('theme-toggle').innerText = body.classList.contains('dark-mode') ? "☀️ Day Mode" : "🌙 Sunset Mode";
}

// 6. Export Journal (Accountability)
function exportJournal() {
    const entries = JSON.parse(localStorage.getItem('journals') || '[]');
    let content = "My ZenGarden Journal\n\n";
    entries.forEach(e => content += `${e.date}: ${e.content}\n`);
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'MyJournal.txt';
    a.click();
}

// Keep existing showSection, setMood, saveJournal functions...
function showSection(id) {
    ['mood', 'journal', 'balance'].forEach(s => document.getElementById(s + '-section').style.display = (s === id) ? 'block' : 'none');
}
function setMood(m) {
    growPlant();
    document.getElementById('todo-area').style.display = 'block';
    const list = document.getElementById('todo-list');
    list.innerHTML = m === 'Stressed' ? "<li>5m Breathing</li><li>Herbal Tea</li>" : "<li>Keep it up!</li>";
}
function saveJournal() {
    const val = document.getElementById('journal-input').value;
    if(!val) return;
    const entries = JSON.parse(localStorage.getItem('journals') || '[]');
    entries.unshift({ date: new Date().toLocaleDateString(), content: val });
    localStorage.setItem('journals', JSON.stringify(entries));
    document.getElementById('journal-input').value = "";
    growPlant();
}
