let allVoices = [];
let historyData = JSON.parse(localStorage.getItem('speechHistory')) || [];
let favoritesData = JSON.parse(localStorage.getItem('speechFavs')) || [];

function loadVoices() {
    allVoices = window.speechSynthesis.getVoices();
    const select = document.getElementById("voiceSelect");
    if (!select) return;
    const filtered = allVoices.filter(v => v.lang.startsWith('en'));
    if (filtered.length > 0) {
        select.innerHTML = filtered.map(v => `<option value="${v.name}">${v.name}</option>`).join('');
    }
}

window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// Add text to input without clearing (Predictive Chips)
function addText(text) {
    const input = document.getElementById("textInput");
    input.value += text;
    input.focus();
}

function speak(text) {
    if (!text || text.trim() === "") return;
    window.speechSynthesis.cancel();
    
    setTimeout(() => {
        const utter = new SpeechSynthesisUtterance(text);
        const logo = document.getElementById('appLogo');
        
        // Voice, Rate, and Pitch Controls
        utter.voice = allVoices.find(v => v.name === document.getElementById("voiceSelect").value);
        utter.rate = document.getElementById("rateSlider").value || 1;
        utter.pitch = document.getElementById("pitchSlider").value || 1;
        utter.lang = 'en-US';

        utter.onstart = () => logo?.classList.add('speaking-active');
        utter.onend = () => {
            logo?.classList.remove('speaking-active');
            // Auto-Clear Feature
            if (document.getElementById("autoClear").checked) {
                document.getElementById("textInput").value = "";
            }
        };

        window.speechSynthesis.speak(utter);
        addToHistory(text);
    }, 50);
}

function speakInput() {
    const inputField = document.getElementById("textInput");
    speak(inputField.value);
}

function saveToFav() {
    const val = document.getElementById("textInput").value;
    if (val && !favoritesData.includes(val)) {
        favoritesData.push(val);
        localStorage.setItem('speechFavs', JSON.stringify(favoritesData));
        renderFavs();
    }
}

function addToHistory(text) {
    if (historyData[0] === text) return;
    historyData.unshift(text);
    if (historyData.length > 10) historyData.pop();
    localStorage.setItem('speechHistory', JSON.stringify(historyData));
    renderHistory();
}

function renderFavs() {
    const box = document.getElementById("favorites");
    if(box) box.innerHTML = favoritesData.map(f => `<div class="card glass" onclick="speak('${f}')">${f}</div>`).join('');
}

function renderHistory() {
    const box = document.getElementById("history");
    if(box) box.innerHTML = historyData.map(h => `<div class="card glass" style="opacity:0.7;" onclick="speak('${h}')">${h}</div>`).join('');
}

function toggleSettings() { document.getElementById("settings").classList.toggle("hidden"); }

function setTheme(mode) {
    document.body.className = (mode === 'light') ? 'light-theme' : '';
    localStorage.setItem('selectedTheme', mode);
}

window.onload = () => {
    loadVoices();
    renderFavs();
    renderHistory();
    setTheme(localStorage.getItem('selectedTheme') || 'dark');
};
function setFont(size) {
    const newSize = size + 'px';
    
    // 1. Update the global variable (covers the whole app)
    document.documentElement.style.setProperty('--main-font-size', newSize);
    
    // 2. Direct Recovery: Force update the input box specifically
    const inputField = document.getElementById("textInput");
    if (inputField) {
        inputField.style.fontSize = newSize;
    }
    
    // 3. Save to memory
    localStorage.setItem('userFontSize', size);
}

