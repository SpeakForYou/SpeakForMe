let allVoices = [];
let selectedVoice = null;
let historyData = JSON.parse(localStorage.getItem('speechHistory')) || [];
let favoritesData = JSON.parse(localStorage.getItem('speechFavs')) || [];

const smartData = ["صباح الخير", "مساء الخير", "Hello", "How are you?"];

function loadVoices() {
    let voices = window.speechSynthesis.getVoices();
    const select = document.getElementById("voiceSelect");
    if (!select) return;

    // تصفية الأصوات (عربي وإنجليزي)
    let filtered = voices.filter(v => v.lang.startsWith('ar') || v.lang.startsWith('en'));

    if (filtered.length === 0 && voices.length > 0) {
        // إذا وجد أصوات ولكن ليس فيها عربي أو إنجليزي
        select.innerHTML = `<option value="">⚠️ لا يوجد أصوات عربية مثبتة على هاتفك</option>`;
    } else if (filtered.length > 0) {
        select.innerHTML = filtered.map((v, i) => 
            `<option value="${v.name}">${v.name} (${v.lang})</option>`
        ).join('');
        
        // محاولة اختيار صوت عربي تلقائياً
        const arabic = filtered.find(v => v.lang.startsWith('ar'));
        if (arabic) {
            selectedVoice = arabic;
            select.value = arabic.name;
        } else {
            selectedVoice = filtered[0];
        }
    }
}

// حل مشكلة تأخر تحميل الأصوات في أندرويد وكروم
window.speechSynthesis.onvoiceschanged = loadVoices;
// تشغيلها مرة فورية احتياطاً
loadVoices();

// هذا السطر يضمن تشغيل الدالة فور تحميل المتصفح للأصوات
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
}
function speak(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    
    setTimeout(() => {
        const utter = new SpeechSynthesisUtterance(text);
        const logo = document.getElementById('appLogo');

        if (selectedVoice) {
            utter.voice = selectedVoice;
            utter.lang = selectedVoice.lang;
        }

        // Add class when speaking starts
        utter.onstart = () => {
            if (logo) logo.classList.add('speaking-active');
        };

        // Remove class when speaking ends
        utter.onend = () => {
            if (logo) logo.classList.remove('speaking-active');
        };

        window.speechSynthesis.speak(utter);
        addToHistory(text);
    }, 50);
}

function setFont(size) {
    document.documentElement.style.setProperty('--main-font-size', size + 'px');
    localStorage.setItem('userFontSize', size);
}

function speakInput() { speak(document.getElementById("textInput").value); }
function quickSpeak(t) { speak(t); }

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
    document.getElementById("favorites").innerHTML = favoritesData.map(f => 
        `<div class="card quick-card glass" onclick="speak('${f}')">${f}</div>`).join('');
}

function renderHistory() {
    document.getElementById("history").innerHTML = historyData.map(h => 
        `<div class="card glass" style="opacity:0.8; cursor:pointer;" onclick="speak('${h}')">${h}</div>`).join('');
}

function toggleSettings() { document.getElementById("settings").classList.toggle("hidden"); }

function setTheme(mode) {
    if (mode === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
    localStorage.setItem('selectedTheme', mode);
}

function closeOnboarding() {
    document.getElementById('onboarding').style.display = 'none';
    localStorage.setItem('instructionsSeen', 'true');
}

window.onload = () => {
    loadVoices();
    renderFavs();
    renderHistory();
    
    const savedFontSize = localStorage.getItem('userFontSize') || '18';
    setFont(savedFontSize);
    document.getElementById('fontSlider').value = savedFontSize;

    const savedTheme = localStorage.getItem('selectedTheme') || 'dark';
    setTheme(savedTheme);
    document.getElementById("themeSelect").value = savedTheme;

    if (localStorage.getItem('instructionsSeen')) {
        document.getElementById('onboarding').style.display = 'none';
    }

    const input = document.getElementById("textInput");
    input.addEventListener("input", (e) => {
        const val = e.target.value;
        const box = document.getElementById("suggestBox");
        if (val.length < 1) { box.innerHTML = ""; return; }
        const filtered = smartData.filter(text => text.toLowerCase().includes(val.toLowerCase()));
        box.innerHTML = filtered.map(item => `<div class="suggestion-chip" onclick="speak('${item}')">${item}</div>`).join('');
    });
};
