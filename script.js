// ================================================
// UPDATED script.js – Full enhanced version
// Only localStorage (no real-time DB)
// Expanded moods + actually helpful interactive tools
// ================================================

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTL8FSmuDcGE8hlGNOpEvTVQbGXBKpOCYv14ZG2Amnqy74QDR8NNWk3eoB6Doag9oZQTK5UjaGYBU-K/pub?output=csv';

let currentUser = "Gardener";
let myChart = null;
let focusInt;
let breathingInterval = null;

// ======================
// 1. EXPANDED MOODS CONFIG
// ======================
const MOODS = {
    stressed: {
        key: "stressed",
        label: "Stressed",
        emoji: "😟",
        color: "#ff9999",
        title: "De-stressing Protocol",
        suggestions: [
            { type: "breathing", text: "Start 4-7-8 Breathing (60 seconds)" },
            { type: "list", text: "Step away from the screen for 5 minutes" },
            { type: "list", text: "Drink a full glass of water slowly" },
            { type: "list", text: "Write down one thing you can control right now" }
        ]
    },
    anxious: {
        key: "anxious",
        label: "Anxious",
        emoji: "😰",
        color: "#ffcc99",
        title: "Grounding Protocol",
        suggestions: [
            { type: "breathing", text: "5-4-3-2-1 Grounding Exercise" },
            { type: "list", text: "Name 5 things you can see right now" },
            { type: "list", text: "Put your feet flat on the floor and breathe" },
            { type: "list", text: "Listen to 3 sounds around you" }
        ]
    },
    happy: {
        key: "happy",
        label: "Happy",
        emoji: "😊",
        color: "#99ff99",
        title: "Spread the Joy",
        suggestions: [
            { type: "list", text: "Message a friend or family member something kind" },
            { type: "list", text: "Put on your favorite upbeat song and dance" },
            { type: "list", text: "Plan a tiny reward for yourself today" },
            { type: "list", text: "Take a photo of something beautiful" }
        ]
    },
    calm: {
        key: "calm",
        label: "Calm",
        emoji: "😌",
        color: "#d4e9d4",
        title: "Mindful Maintenance",
        suggestions: [
            { type: "breathing", text: "Box Breathing (2 minutes)" },
            { type: "list", text: "Light a candle or use your favorite scent" },
            { type: "gratitude", text: "Quick 3 things I'm grateful for" },
            { type: "list", text: "Gentle neck & shoulder stretches" }
        ]
    },
    sad: {
        key: "sad",
        label: "Sad",
        emoji: "😢",
        color: "#a8c4ff",
        title: "Gentle Kindness",
        suggestions: [
            { type: "list", text: "Be kind to yourself – you’re doing your best" },
            { type: "list", text: "Watch a comforting video or read something uplifting" },
            { type: "gratitude", text: "Name one small thing that went okay today" },
            { type: "list", text: "Wrap yourself in a blanket and rest" }
        ]
    },
    tired: {
        key: "tired",
        label: "Tired",
        emoji: "🥱",
        color: "#c2b0ff",
        title: "Energy Restoration",
        suggestions: [
            { type: "list", text: "Take a 10-minute power nap or rest your eyes" },
            { type: "breathing", text: "Energizing Breath (1 minute)" },
            { type: "list", text: "Stand up, stretch, and get fresh air if possible" },
            { type: "list", text: "Have a healthy snack and hydrate" }
        ]
    },
    overwhelmed: {
        key: "overwhelmed",
        label: "Overwhelmed",
        emoji: "😣",
        color: "#ff99cc",
        title: "Brain Dump & Simplify",
        suggestions: [
            { type: "list", text: "Write down EVERYTHING on your mind for 2 minutes" },
            { type: "list", text: "Pick the ONE most important thing right now" },
            { type: "breathing", text: "Long exhale breathing (30 seconds)" },
            { type: "list", text: "Say “This is temporary” out loud" }
        ]
    },
    energized: {
        key: "energized",
        label: "Energized",
        emoji: "⚡",
        color: "#ffee99",
        title: "Channel the Energy",
        suggestions: [
            { type: "list", text: "Move your body – quick walk or dance break" },
            { type: "list", text: "Tackle one small task you’ve been avoiding" },
            { type: "list", text: "Create something creative while the energy lasts" },
            { type: "list", text: "Share your energy – help or compliment someone" }
        ]
    }
};

// ======================
// 2. AUTHENTICATION & REGISTRATION (unchanged except tiny cleanups)
// ======================
function toggleAuth(showRegister) {
    document.getElementById('login-form').style.display = showRegister ? 'none' : 'block';
    document.getElementById('register-form').style.display = showRegister ? 'block' : 'none';
}

async function handleLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    if (!user || !pass) return;

    const localUsers = JSON.parse(localStorage.getItem('zen_users') || '[]');
    const localMatch = localUsers.find(u => u.username === user && u.password === pass);
    if (localMatch) {
        startApp(user);
        return;
    }

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
        document.getElementById('auth-error').innerText = "Could not reach database.";
    }
}

function handleRegister() {
    const user = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value.trim();
    if (user.length < 3) return alert("Username too short");
    if (pass.length < 4) return alert("Password too short");

    let localUsers = JSON.parse(localStorage.getItem('zen_users') || '[]');
    if (localUsers.some(u => u.username === user)) return alert("Username already taken");

    localUsers.push({ username: user, password: pass });
    localStorage.setItem('zen_users', JSON.stringify(localUsers));
    alert("Account created! 🌱");
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
    loadMoodHistory();        // ← NEW
    updateStreakUI();         // ← NEW
    if (Notification.permission !== "granted") Notification.requestPermission();
}

// ======================
// 3. ENHANCED MOOD LOGIC – now actually helpful
// ======================
function setMood(moodKey) {
    const mood = MOODS[moodKey];
    if (!mood) return;

    const area = document.getElementById('todo-area');
    const list = document.getElementById('todo-list');
    const moodTitle = area.querySelector('h3');

    area.style.display = 'block';
    list.innerHTML = "";

    moodTitle.innerText = `${mood.emoji} ${mood.title}`;
    area.style.borderLeft = `5px solid ${mood.color}`;

    // Save mood to history (for streak + trends)
    saveMoodEntry(mood.label);

    // Render interactive suggestions
    mood.suggestions.forEach(item => {
        const li = document.createElement('li');
        li.style.padding = "8px 0";
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.gap = "10px";

        if (item.type === "breathing") {
            const btn = document.createElement('button');
            btn.className = "small-btn";
            btn.innerText = item.text;
            btn.style.background = mood.color;
            btn.style.color = "#222";
            btn.style.border = "none";
            btn.style.padding = "6px 12px";
            btn.style.borderRadius = "20px";
            btn.style.cursor = "pointer";
            btn.onclick = () => startBreathingExercise(item.text);
            li.appendChild(btn);
        } 
        else if (item.type === "gratitude") {
            const btn = document.createElement('button');
            btn.className = "small-btn";
            btn.innerText = item.text;
            btn.style.background = mood.color;
            btn.style.color = "#222";
            btn.style.border = "none";
            btn.style.padding = "6px 12px";
            btn.style.borderRadius = "20px";
            btn.style.cursor = "pointer";
            btn.onclick = () => quickGratitudeLog();
            li.appendChild(btn);
        } 
        else {
            // normal list item
            li.innerHTML = `• ${item.text}`;
        }
        list.appendChild(li);
    });

    // Reward interaction
    growPlant();
}

function saveMoodEntry(moodLabel) {
    let history = JSON.parse(localStorage.getItem('mood_history') || '[]');
    history.unshift({
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        mood: moodLabel
    });
    // Keep only last 90 days
    history = history.slice(0, 90);
    localStorage.setItem('mood_history', JSON.stringify(history));
}

function loadMoodHistory() {
    const container = document.getElementById('mood-history');
    const history = JSON.parse(localStorage.getItem('mood_history') || '[]');
    
    if (history.length === 0) {
        container.innerHTML = `<small style="color:#888">No mood entries yet. Log your first mood above! 🌱</small>`;
        return;
    }

    // Simple visual streak line
    let html = `<strong>Recent mood trend:</strong><br>`;
    html += history.slice(0, 14).map(entry => {
        const moodObj = Object.values(MOODS).find(m => m.label === entry.mood);
        return `<span style="font-size:1.4em;margin-right:4px" title="${entry.date}">${moodObj ? moodObj.emoji : '🌿'}</span>`;
    }).join('');
    container.innerHTML = html;
}

function updateStreakUI() {
    const streakEl = document.getElementById('streak-counter');
    const daysEl = document.getElementById('streak-days');
    
    const history = JSON.parse(localStorage.getItem('mood_history') || '[]');
    if (history.length === 0) {
        streakEl.style.display = 'none';
        return;
    }

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let lastDate = today;

    for (let entry of history) {
        if (entry.date === lastDate) {
            streak++;
            // move to previous day
            const d = new Date(lastDate);
            d.setDate(d.getDate() - 1);
            lastDate = d.toISOString().split('T')[0];
        } else if (new Date(entry.date) < new Date(lastDate)) {
            break; // streak broken
        }
    }

    if (streak >= 2) {
        daysEl.textContent = streak;
        streakEl.style.display = 'block';
    } else {
        streakEl.style.display = 'none';
    }
}

// ======================
// INTERACTIVE SELF-CARE TOOLS
// ======================
function startBreathingExercise(title) {
    // Create temporary breathing UI
    let overlay = document.getElementById('breathing-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'breathing-overlay';
        overlay.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.85); display:flex; align-items:center;
            justify-content:center; z-index:9999; color:white; font-family:sans-serif;
        `;
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div style="text-align:center; max-width:320px;">
            <h3 style="margin:0 0 20px;">${title}</h3>
            <div id="breath-circle" style="
                width:180px; height:180px; margin:20px auto;
                border-radius:50%; background:#99ff99; 
                display:flex; align-items:center; justify-content:center;
                font-size:1.1em; font-weight:bold; box-shadow:0 0 30px #99ff99;
            ">Inhale...</div>
            <p id="breath-instruction" style="margin:15px 0; font-size:1.2em;"></p>
            <button onclick="stopBreathing()" style="background:#ff9999;color:#222;padding:10px 20px;border:none;border-radius:30px;cursor:pointer;">
                End Exercise
            </button>
        </div>
    `;

    let phase = 0;
    const phases = [
        { text: "Inhale slowly...", color: "#99ff99", time: 4000 },
        { text: "Hold gently...", color: "#ffee99", time: 7000 },
        { text: "Exhale slowly...", color: "#ff9999", time: 8000 }
    ];

    if (breathingInterval) clearInterval(breathingInterval);

    breathingInterval = setInterval(() => {
        const circle = document.getElementById('breath-circle');
        const instruction = document.getElementById('breath-instruction');
        
        circle.style.background = phases[phase].color;
        instruction.textContent = phases[phase].text;
        
        // simple scale animation
        circle.style.transform = 'scale(1.3)';
        setTimeout(() => { circle.style.transform = 'scale(1)'; }, phases[phase].time * 0.4);

        phase = (phase + 1) % 3;
    }, 4000); // cycle every phase
}

function stopBreathing() {
    if (breathingInterval) {
        clearInterval(breathingInterval);
        breathingInterval = null;
    }
    const overlay = document.getElementById('breathing-overlay');
    if (overlay) overlay.remove();
    alert("Great job! 🌿 How do you feel now?");
}

function quickGratitudeLog() {
    const entry = prompt("What are you grateful for right now? (1–3 things)");
    if (!entry) return;

    let gratitudes = JSON.parse(localStorage.getItem('gratitudes') || '[]');
    gratitudes.unshift({
        date: new Date().toLocaleDateString(),
        text: entry
    });
    localStorage.setItem('gratitudes', JSON.stringify(gratitudes.slice(0, 30)));

    alert("Gratitude saved! 🌼 Your garden just grew a little more.");
    growPlant(); // extra reward
}

// ======================
// 4. GARDEN GAMIFICATION – now with streak awareness
// ======================
function growPlant() {
    let garden = JSON.parse(localStorage.getItem('garden') || '[]');
    
    const plantTypes = ['🌱', '🌿', '🍀', '🍃', '🌸', '🌼', '🌺', '🪴'];
    const randomPlant = plantTypes[Math.floor(Math.random() * plantTypes.length)];
    
    garden.push(randomPlant);
    // Keep only last 60 plants for visual cleanliness
    if (garden.length > 60) garden = garden.slice(-60);
    
    localStorage.setItem('garden', JSON.stringify(garden));
    updateGardenUI();
}

function updateGardenUI() {
    const box = document.getElementById('plant-box');
    const garden = JSON.parse(localStorage.getItem('garden') || '[]');
    box.innerText = garden.join(' ');
}

// ======================
// 5. REMAINING ORIGINAL FUNCTIONS (cleaned + minor improvements)
// ======================
function initChart() {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Work', 'Social/Rest'],
            datasets: [{ 
                data: [1, 1], 
                backgroundColor: ['#ff9999', '#99ff99'],
                borderWidth: 3
            }]
        },
        options: { cutout: "70%" }
    });
}

function updateChart() {
    const w = parseFloat(document.getElementById('work-hrs').value) || 0;
    const s = parseFloat(document.getElementById('social-hrs').value) || 0;
    myChart.data.datasets[0].data = [w, s];
    myChart.update();
}

function showSection(id) {
    ['mood', 'journal', 'balance'].forEach(s => {
        document.getElementById(s + '-section').style.display = (s === id) ? 'block' : 'none';
    });
}

function saveJournal() {
    const val = document.getElementById('journal-input').value.trim();
    if (!val) return;

    const entries = JSON.parse(localStorage.getItem('journals') || '[]');
    entries.unshift({ 
        date: new Date().toLocaleDateString(), 
        content: val 
    });
    localStorage.setItem('journals', JSON.stringify(entries));
    document.getElementById('journal-input').value = "";
    
    growPlant();
    loadEntries();
}

function loadEntries() {
    const entries = JSON.parse(localStorage.getItem('journals') || '[]');
    document.getElementById('past-entries').innerHTML = entries.map(e => `
        <div style="border-bottom:1px solid #eee; margin-top:15px; padding-bottom:10px;">
            <small>${e.date}</small>
            <p style="margin:5px 0;">${e.content}</p>
        </div>`).join('');
}

function exportJournal() {
    const entries = JSON.parse(localStorage.getItem('journals') || '[]');
    let content = "ZenGarden Reflection Log\n\n";
    entries.forEach(e => content += `${e.date}: ${e.content}\n`);
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ZenGarden_Journal_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
}

function toggleFocusMode() {
    const btn = document.getElementById('focus-btn');
    if (btn.innerText.includes("Active")) {
        clearInterval(focusInt);
        btn.innerText = "Deep Focus Mode";
    } else {
        btn.innerText = "Focus Active 🌿";
        focusInt = setInterval(() => {
            if (Notification.permission === "granted") {
                new Notification("ZenGarden: Check your posture & breathe 🌱", { body: "You’ve been focused for 20 minutes!" });
            }
        }, 1200000); // 20 minutes
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('zen_dark_mode', document.body.classList.contains('dark-mode'));
}

// Restore dark mode on load
if (localStorage.getItem('zen_dark_mode') === 'true') {
    document.body.classList.add('dark-mode');
}
