// Configuration
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTL8FSmuDcGE8hlGNOpEvTVQbGXBKpOCYv14ZG2Amnqy74QDR8NNWk3eoB6Doag9oZQTK5UjaGYBU-K/pub?output=csv';
let currentUser = "Gardener";

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('PWA Registered'))
            .catch(err => console.log('PWA Setup Failed', err));
    });
}

// 1. Authentication Logic
async function handleLogin() {
    const userField = document.getElementById('username');
    const passField = document.getElementById('password');
    const user = userField.value.trim();
    const pass = passField.value.trim();
    
    try {
        const response = await fetch(CSV_URL);
        const data = await response.text();
        const rows = data.split('\n').map(row => row.split(','));
        
        // Match user and password from CSV
        const isValid = rows.some(row => row[0].trim() === user && row[1].trim() === pass);
        
        if (isValid) {
            currentUser = user; 
            document.getElementById('welcome-msg').innerText = `Hi, ${currentUser}! 🌿`;
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app-screen').style.display = 'block';
            loadEntries();
        } else {
            document.getElementById('login-error').innerText = "Invalid credentials. Please try again.";
        }
    } catch (e) {
        console.error("Auth failed", e);
        document.getElementById('login-error').innerText = "Connection error. Check CSV settings.";
    }
}

// 2. Navigation
function showSection(id) {
    ['mood', 'journal', 'balance'].forEach(s => {
        document.getElementById(s + '-section').style.display = (s === id) ? 'block' : 'none';
    });
}

// 3. Mood Tracking & Suggestions Logic
function setMood(mood) {
    const todoArea = document.getElementById('todo-area');
    const todoList = document.getElementById('todo-list');
    const sectionTitle = todoArea.querySelector('h3');
    
    todoList.innerHTML = "";
    todoArea.style.display = 'block';

    let suggestions = [];

    if (mood === 'Stressed') {
        sectionTitle.innerText = "Calming Activities for You:";
        suggestions = ['5 min deep breathing', 'Listen to nature sounds', 'Stretch your neck and shoulders'];
    } else if (mood === 'Happy') {
        sectionTitle.innerText = "Keep the Momentum:";
        suggestions = ['Message a friend', 'Go for a quick walk', 'Note down what made you smile'];
    } else if (mood === 'Calm') {
        sectionTitle.innerText = "Mindful Moments:";
        suggestions = ['Read one chapter of a book', 'Water your plants', 'Practice 2 minutes of silence'];
    }

    suggestions.forEach(task => {
        const li = document.createElement('li');
        li.innerText = task;
        li.style.marginBottom = "5px";
        todoList.appendChild(li);
    });
}

// 4. Journaling Logic (LocalStorage)
function saveJournal() {
    const text = document.getElementById('journal-input').value;
    if (!text) return;
    
    const entries = JSON.parse(localStorage.getItem('journals') || '[]');
    entries.unshift({ date: new Date().toLocaleString(), content: text }); // Newest first
    localStorage.setItem('journals', JSON.stringify(entries));
    document.getElementById('journal-input').value = "";
    loadEntries();
}

function loadEntries() {
    const display = document.getElementById('past-entries');
    const entries = JSON.parse(localStorage.getItem('journals') || '[]');
    display.innerHTML = entries.map(e => `
        <div style="border-bottom:1px solid #eee; margin-top:10px; padding-bottom:5px;">
            <small style="color:#888;">${e.date}</small>
            <p style="margin:5px 0;">${e.content}</p>
        </div>`).join('');
}

// 5. Focus Mode
let focusInterval;
function toggleFocusMode() {
    const btn = document.getElementById('focus-btn');
    if (btn.classList.contains('focus-active')) {
        btn.classList.remove('focus-active');
        btn.innerText = "Enable Deep Focus Mode";
        clearInterval(focusInterval);
    } else {
        btn.classList.add('focus-active');
        btn.innerText = "Focus Mode On";
        alert("Deep focus started. Reminders will appear every 5 minutes.");
        focusInterval = setInterval(() => {
            alert("Time for a quick wellness check: Drink some water! 💧");
        }, 300000); 
    }
}
