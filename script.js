const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTL8FSmuDcGE8hlGNOpEvTVQbGXBKpOCYv14ZG2Amnqy74QDR8NNWk3eoB6Doag9oZQTK5UjaGYBU-K/pub?output=csv';
let currentUser = "Gardener";
let myChart = null;
let focusInt;

// PWA Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js'); });
}

// 1. AUTHENTICATION & REGISTRATION LOGIC
function toggleAuth(showRegister) {
    document.getElementById('login-form').style.display = showRegister ? 'none' : 'block';
    document.getElementById('register-form').style.display = showRegister ? 'block' : 'none';
    document.getElementById('auth-error').innerText = "";
}

async function handleLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    
    // First, check Local Storage (New Registrations)
    const localUsers = JSON.parse(localStorage.getItem('zen_users') || '[]');
    const localMatch = localUsers.find(u => u.username === user && u.password === pass);

    if (localMatch) {
        startApp(user);
        return;
    }

    // Second, check Google CSV
    try {
        const response = await fetch(CSV_URL);
        const data = await response.text();
        const rows = data.split('\n').map(r => r.split(','));
        if (rows.some(r => r[0].trim() === user && r[1].trim() === pass)) {
            startApp(user);
        } else {
            document.getElementById('auth-error').innerText = "Invalid credentials.";
        }
    } catch (e) {
        document.getElementById('auth-error').innerText = "Database connection error.";
    }
}

function handleRegister() {
    const user = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value.trim();

    if (user.length < 3 || pass.length < 3) {
        document.getElementById('auth-error').innerText = "Username/Password too short.";
        return;
    }

    let localUsers = JSON.parse(localStorage.getItem('zen_users') || '[]');
    if (localUsers.some(u => u.username === user)) {
        document.getElementById('auth-error').innerText = "Username already exists.";
        return;
    }

    localUsers.push({ username: user, password: pass });
    localStorage.setItem('zen_users', JSON.stringify(localUsers));
    alert("Account created! You can now log in.");
    toggleAuth(false);
}

function startApp(user) {
    currentUser = user;
    document.getElementById('welcome-msg').innerText = `Hi, ${user}! 🌿`;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    
    updateGardenUI();
    initChart();
    loadEntries();
    if (Notification.permission !== "granted") Notification.requestPermission();
}

// 2. DATA VIZ (CHART.JS)
function initChart() {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Work', 'Social/Rest'],
            datasets: [{ data: [0, 0], backgroundColor: ['#ff9999', '#99ff99'] }]
        }
    });
}
function updateChart() {
    const w = document.getElementById('work-hrs').value || 0;
    const s = document.getElementById('social-hrs').value || 0;
    myChart.data.datasets[0].data = [w, s];
    myChart.update();
}

// 3. MOOD & GARDEN
function setMood(m) {
    growPlant();
    const area = document.getElementById('todo-area');
    const list = document.getElementById('todo-list');
    area.style.display = 'block';
    list.innerHTML = m === 'Stressed' ? "<li>5m Breathing</li><li>Drink Water</li>" : "<li>Keep it up!</li>";
}

function growPlant() {
    let garden = JSON.parse(localStorage.getItem('garden') || '[]');
    garden.push('🌱');
    localStorage.setItem('garden', JSON.stringify(garden));
    updateGardenUI();
}

function updateGardenUI() {
    document.getElementById('plant-box').innerText = JSON.parse(localStorage.getItem('garden') || '[]').join(' ');
}

// 4. JOURNALING
function saveJournal() {
    const val = document.getElementById('journal-input').value;
    if(!val) return;
    const entries = JSON.parse(localStorage.getItem('journals') || '[]');
    entries.unshift({ date: new Date().toLocaleDateString(), content: val });
    localStorage.setItem('journals', JSON.stringify(entries));
    document.getElementById('journal-input').value = "";
    growPlant();
    loadEntries();
}

function loadEntries() {
    const entries = JSON.parse(localStorage.getItem('journals') || '[]');
    document.getElementById('past-entries').innerHTML = entries.map(e => `<div><small>${e.date}</small><p>${e.content}</p></div>`).join('');
}

function exportJournal() {
    const entries = JSON.parse(localStorage.getItem('journals') || '[]');
    let content = "ZenGarden Reflection Log\n\n";
    entries.forEach(e => content += `${e.date}: ${e.content}\n`);
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Journal.txt';
    a.click();
}

// 5. FOCUS & THEME
function toggleFocusMode() {
    const btn = document.getElementById('focus-btn');
    if (btn.innerText.includes("Active")) {
        clearInterval(focusInt);
        btn.innerText = "Deep Focus Mode";
    } else {
        btn.innerText = "Focus Active";
        focusInt = setInterval(() => {
            if (Notification.permission === "granted") new Notification("Blink & Hydrate! 🌿");
        }, 1200000);
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}
