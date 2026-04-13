// --- المتغيرات الأساسية ---
let selectedVoice = null;
let allVoices = [];
let historyData = JSON.parse(localStorage.getItem('speechHistory')) || [];
let favoritesData = JSON.parse(localStorage.getItem('speechFavs')) || [];
const smartData = ["صباح الخير", "مساء الخير", "كيف حالك؟", "أنا بخير", "شكراً جزيلاً"];

// --- 1. محرك الأصوات المطور (الإجبار والانتظار) ---
function loadVoices() {
    allVoices = window.speechSynthesis.getVoices();
    const select = document.getElementById("voiceSelect");
    if (!select) return;

    // فلترة الأصوات (عربي وإنجليزي فقط)
    const filteredVoices = allVoices.filter(v => 
        v.lang.startsWith('ar') || v.lang.startsWith('en')
    );

    if (filteredVoices.length > 0) {
        select.innerHTML = filteredVoices
            .map(v => `<option value="${v.name}">${v.name} (${v.lang})</option>`)
            .join('');
        
        // إعطاء الأولوية لصوت عربي إذا وجد
        const arabicVoice = filteredVoices.find(v => v.lang.startsWith('ar'));
        selectedVoice = arabicVoice || filteredVoices[0];
        select.value = selectedVoice.name;

        // إذا نجحنا في تحميل الأصوات، نوقف المحاولات المتكررة
        if (filteredVoices.some(v => v.lang.startsWith('ar'))) {
            clearInterval(voiceRetryInterval);
        }
    }
}

// محاولة التحميل فوراً وعند التغيير
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// "سر القوة": المحاولة المتكررة كل ثانية لأن أندرويد يتأخر في كشف الأصوات
const voiceRetryInterval = setInterval(loadVoices, 1000);

// --- 2. دالة النطق "الإجبارية" ---
function speak(text) {
    if (!text) return;
    window.speechSynthesis.cancel(); // وقف أي نطق قديم فوراً
    
    setTimeout(() => {
        const utter = new SpeechSynthesisUtterance(text);
        const logo = document.getElementById('appLogo');

        // البحث عن الصوت المختار حالياً
        const currentVoiceName = document.getElementById("voiceSelect")?.value;
        const currentVoice = allVoices.find(v => v.name === currentVoiceName);

        if (currentVoice) {
            utter.voice = currentVoice;
            utter.lang = currentVoice.lang;
        } else {
            // "القوة الضاربة": إذا لم يجد صوتاً في القائمة، أجبر المحرك على البحث عن أي صوت عربي في النظام
            utter.lang = 'ar-SA';
        }

        // إعدادات النطق
        utter.rate = 1.0;  // السرعة
        utter.pitch = 1.0; // النغمة

        // تأثيرات اللوجو
        utter.onstart = () => { if(logo) logo.classList.add('speaking-active'); };
        utter.onend = () => { if(logo) logo.classList.remove('speaking-active'); };

        window.speechSynthesis.speak(utter);
        addToHistory(text);
    }, 50);
}

// --- 3. إدارة الإعدادات والمظهر ---
function setFont(size) {
    document.documentElement.style.setProperty('--main-font-size', size + 'px');
    localStorage.setItem('userFontSize', size);
}

function setTheme(mode) {
    document.body.classList.remove('light-theme');
    if (mode === 'light') document.body.classList.add('light-theme');
    localStorage.setItem('selectedTheme', mode);
}

function toggleSettings() {
    document.getElementById("settings").classList.toggle("hidden");
}

// --- 4. الوظائف الإضافية ---
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
    const box = document.getElementById("favorites");
    if (box) box.innerHTML = favoritesData.map(f => 
        `<div class="card quick-card glass" onclick="speak('${f}')">${f}</div>`).join('');
}

function renderHistory() {
    const box = document.getElementById("history");
    if (box) box.innerHTML = historyData.map(h => 
        `<div class="card glass" style="opacity:0.8; cursor:pointer;" onclick="speak('${h}')">${h}</div>`).join('');
}

// --- 5. التشغيل عند التحميل ---
window.onload = () => {
    loadVoices();
    renderFavs();
    renderHistory();
    
    // استعادة الإعدادات المحفوظة
    const savedSize = localStorage.getItem('userFontSize') || '18';
    setFont(savedSize);
    if(document.getElementById('fontSlider')) document.getElementById('fontSlider').value = savedSize;

    const savedTheme = localStorage.getItem('selectedTheme') || 'dark';
    setTheme(savedTheme);
    if(document.getElementById("themeSelect")) document.getElementById("themeSelect").value = savedTheme;

    // تفعيل الاقتراحات الذكية
    const input = document.getElementById("textInput");
    input.addEventListener("input", (e) => {
        const val = e.target.value;
        const box = document.getElementById("suggestBox");
        if (val.length < 1) { box.innerHTML = ""; return; }
        const filtered = smartData.filter(text => text.includes(val));
        box.innerHTML = filtered.map(item => `<div class="suggestion-chip" onclick="speak('${item}')">${item}</div>`).join('');
    });
};
