// --- المتغيرات الأساسية ---
let allVoices = [];
let selectedVoice = null;
let historyData = JSON.parse(localStorage.getItem('speechHistory')) || [];
let favoritesData = JSON.parse(localStorage.getItem('speechFavs')) || [];
const smartData = ["صباح الخير", "مساء الخير", "كيف حالك؟", "أريد المساعدة", "شكراً جزيلاً"];

// --- 1. محرك الأصوات (تحميل وانتظار الأندرويد) ---
function loadVoices() {
    allVoices = window.speechSynthesis.getVoices();
    const select = document.getElementById("voiceSelect");
    if (!select) return;

    // فلترة الأصوات (عربي وإنجليزي فقط)
    const filtered = allVoices.filter(v => v.lang.startsWith('ar') || v.lang.startsWith('en'));

    if (filtered.length > 0) {
        select.innerHTML = filtered.map(v => 
            `<option value="${v.name}">${v.name} (${v.lang})</option>`
        ).join('');
        
        // محاولة اختيار صوت عربي كافتراضي
        const arabic = filtered.find(v => v.lang.startsWith('ar'));
        selectedVoice = arabic || filtered[0];
        select.value = selectedVoice.name;

        // إذا وجدت أصوات عربية، نتوقف عن المحاولة المتكررة لتوفير البطارية
        if (filtered.some(v => v.lang.startsWith('ar'))) {
            clearInterval(voiceRetryInterval);
        }
    }
}

// محاولة التحميل فوراً وعند التغيير في النظام
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();
// محاولة متكررة كل ثانية (حل سحري للأندرويد)
const voiceRetryInterval = setInterval(loadVoices, 1000);

// --- 2. دالة النطق "الذكية" ---
function speak(text) {
    if (!text || text.trim() === "") return;
    
    // إلغاء أي نطق جاري حالياً لمنع التداخل
    window.speechSynthesis.cancel();
    
    setTimeout(() => {
        const utter = new SpeechSynthesisUtterance(text);
        const logo = document.getElementById('appLogo');

        // البحث عن الصوت المختار في القائمة
        const select = document.getElementById("voiceSelect");
        const currentVoice = allVoices.find(v => v.name === select.value);

        if (currentVoice) {
            utter.voice = currentVoice;
            utter.lang = currentVoice.lang;
        } else {
            utter.lang = 'ar-SA'; // إجبار اللغة العربية كحل أخير
        }

        // سرعة ونغمة الصوت
        utter.rate = 1.0;
        utter.pitch = 1.0;

        // تأثيرات اللوجو النشط (Active Logo)
        utter.onstart = () => { if(logo) logo.classList.add('speaking-active'); };
        utter.onend = () => { if(logo) logo.classList.remove('speaking-active'); };

        window.speechSynthesis.speak(utter);
        addToHistory(text);
    }, 50); 
}

// --- 3. الربط مع المربع (حل مشكلتك هنا) ---
function speakInput() {
    // نجلب المربع ونأخذ قيمته "الحالية" لحظة الضغط
    const inputField = document.getElementById("textInput");
    const textToSpeak = inputField.value;

    if (textToSpeak && textToSpeak.trim() !== "") {
        speak(textToSpeak);
    } else {
        // نطق تنبيه بسيط إذا حاول المستخدم الضغط والمربع فارغ
        speak("برجاء كتابة نص أولاً");
    }
}

function quickSpeak(t) { speak(t); }

// --- 4. إدارة المفضلات والسجل ---
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
    const favBox = document.getElementById("favorites");
    if(favBox) favBox.innerHTML = favoritesData.map(f => 
        `<div class="card quick-card glass" onclick="speak('${f}')">${f}</div>`).join('');
}

function renderHistory() {
    const histBox = document.getElementById("history");
    if(histBox) histBox.innerHTML = historyData.map(h => 
        `<div class="card glass" style="opacity:0.8; cursor:pointer;" onclick="speak('${h}')">${h}</div>`).join('');
}

// --- 5. الإعدادات والمظهر ---
function toggleSettings() { 
    document.getElementById("settings").classList.toggle("hidden"); 
}

function setTheme(mode) {
    if (mode === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    localStorage.setItem('selectedTheme', mode);
}

function setFont(size) {
    document.documentElement.style.setProperty('--main-font-size', size + 'px');
    localStorage.setItem('userFontSize', size);
}

function closeOnboarding() {
    document.getElementById('onboarding').classList.add('hidden');
    localStorage.setItem('instructionsSeen', 'true');
}

// --- 6. التشغيل النهائي عند فتح التطبيق ---
window.onload = () => {
    loadVoices();
    renderFavs();
    renderHistory();
    
    // استعادة الحجم والمظهر
    const savedSize = localStorage.getItem('userFontSize') || '18';
    setFont(savedSize);
    if(document.getElementById('fontSlider')) document.getElementById('fontSlider').value = savedSize;

    const savedTheme = localStorage.getItem('selectedTheme') || 'dark';
    setTheme(savedTheme);
    if(document.getElementById("themeSelect")) document.getElementById("themeSelect").value = savedTheme;

    if (localStorage.getItem('instructionsSeen')) {
        document.getElementById('onboarding').classList.add('hidden');
    }

    // تفعيل الاقتراحات الذكية أثناء الكتابة
    const input = document.getElementById("textInput");
    input.addEventListener("input", (e) => {
        const val = e.target.value;
        const box = document.getElementById("suggestBox");
        if (val.length < 1) { box.innerHTML = ""; return; }
        const filtered = smartData.filter(text => text.includes(val));
        box.innerHTML = filtered.map(item => `<div class="suggestion-chip" onclick="speak('${item}')">${item}</div>`).join('');
    });
};