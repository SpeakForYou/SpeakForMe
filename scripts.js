// --- 1. المتغيرات الأساسية وذاكرة التخزين ---
let allVoices = [];
let historyData = JSON.parse(localStorage.getItem('speechHistory')) || [];
let favoritesData = JSON.parse(localStorage.getItem('speechFavs')) || [];

// --- 2. محرك الأصوات (حل مشكلة القائمة الفارغة في APK) ---
function loadVoices() {
    allVoices = window.speechSynthesis.getVoices();
    const select = document.getElementById("voiceSelect");
    
    if (!select) return;

    // تصفية الأصوات الإنجليزية فقط
    const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));

    if (englishVoices.length > 0) {
        select.innerHTML = englishVoices.map(v => 
            `<option value="${v.name}">${v.name}</option>`
        ).join('');
        
        // إذا وجدنا الأصوات، نوقف المحاولة المتكررة لتوفير البطارية
        if (typeof voiceRetryInterval !== 'undefined') clearInterval(voiceRetryInterval);
    }
}

// محاولة جلب الأصوات فوراً وعند تغيرها
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// "الحل السحري" لـ Median.co والأندرويد: محاولة متكررة كل نصف ثانية
const voiceRetryInterval = setInterval(loadVoices, 500);

// --- 3. وظائف النطق والتحكم ---
function speak(text) {
    if (!text || text.trim() === "") return;
    
    // إلغاء أي نطق جاري لمنع التداخل
    window.speechSynthesis.cancel();
    
    setTimeout(() => {
        const utter = new SpeechSynthesisUtterance(text);
        const logo = document.getElementById('appLogo');
        const voiceSelect = document.getElementById("voiceSelect");
        
        // جلب الإعدادات الحالية من الواجهة
        const selectedVoiceName = voiceSelect.value;
        utter.voice = allVoices.find(v => v.name === selectedVoiceName);
        
        utter.rate = document.getElementById("rateSlider")?.value || 1;
        utter.pitch = document.getElementById("pitchSlider")?.value || 1;
        utter.lang = 'en-US';

        // تأثيرات اللوجو أثناء النطق
        utter.onstart = () => logo?.classList.add('speaking-active');
        utter.onend = () => {
            logo?.classList.remove('speaking-active');
            // ميزة المسح التلقائي بعد النطق
            if (document.getElementById("autoClear")?.checked) {
                document.getElementById("textInput").value = "";
            }
        };

        window.speechSynthesis.speak(utter);
        addToHistory(text);
    }, 50);
}

// نطق النص الموجود في مربع الكتابة
function speakInput() {
    const inputField = document.getElementById("textInput");
    if (inputField.value.trim() !== "") {
        speak(inputField.value);
    } else {
        // تنبيه صوتي بسيط في حال كان المربع فارغاً
        const warning = new SpeechSynthesisUtterance("Please type something first");
        warning.lang = 'en-US';
        window.speechSynthesis.speak(warning);
    }
}

// إضافة نص من الكلمات المتوقعة (Chips)
function addText(text) {
    const input = document.getElementById("textInput");
    input.value += text;
    input.focus();
}

// --- 4. إدارة البيانات (سجل ومفضلات) ---
function saveToFav() {
    const val = document.getElementById("textInput").value.trim();
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
    if(box) {
        box.innerHTML = favoritesData.map(f => 
            `<div class="card glass animate-in" onclick="speak('${f}')">${f}</div>`
        ).join('');
    }
}

function renderHistory() {
    const box = document.getElementById("history");
    if(box) {
        box.innerHTML = historyData.map(h => 
            `<div class="card glass animate-in" style="opacity:0.7; font-size: 0.9em;" onclick="speak('${h}')">${h}</div>`
        ).join('');
    }
}

// --- 5. الإعدادات والمظهر ---
function toggleSettings() { 
    document.getElementById("settings").classList.toggle("hidden"); 
}

function setTheme(mode) {
    document.body.className = (mode === 'light') ? 'light-theme' : '';
    localStorage.setItem('selectedTheme', mode);
}

function setFont(size) {
    const newSize = size + 'px';
    // تحديث المتغير العام في CSS
    document.documentElement.style.setProperty('--main-font-size', newSize);
    
    // تحديث مباشر لمربع النص لضمان الاستجابة (Recovery)
    const inputField = document.getElementById("textInput");
    if (inputField) inputField.style.fontSize = newSize;
    
    localStorage.setItem('userFontSize', size);
}

// --- 6. التشغيل عند فتح التطبيق ---
window.onload = () => {
    // تحميل البيانات
    renderFavs();
    renderHistory();
    
    // استعادة حجم الخط
    const savedSize = localStorage.getItem('userFontSize') || '18';
    setFont(savedSize);
    if(document.getElementById('fontSlider')) document.getElementById('fontSlider').value = savedSize;

    // استعادة المظهر (داكن/فاتح)
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark';
    setTheme(savedTheme);
    if(document.getElementById("themeSelect")) document.getElementById("themeSelect").value = savedTheme;

    // محاولة أولية لتحميل الأصوات
    loadVoices();
};