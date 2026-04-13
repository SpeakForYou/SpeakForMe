let allVoices = [];
let historyData = JSON.parse(localStorage.getItem('speechHistory')) || [];

// 1. جلب الأصوات وإصلاح مشكلة الأندرويد
function loadVoices() {
    allVoices = window.speechSynthesis.getVoices();
    const select = document.getElementById("voiceSelect");
    if (!select) return;

    // تصفية الأصوات (عربي وإنجليزي)
    const filtered = allVoices.filter(v => v.lang.startsWith('ar') || v.lang.startsWith('en'));

    if (filtered.length > 0) {
        select.innerHTML = filtered.map(v => `<option value="${v.name}">${v.name}</option>`).join('');
        // إيقاف المحاولات إذا وجدت الأصوات
        if (filtered.some(v => v.lang.startsWith('ar'))) clearInterval(voiceInterval);
    }
}

const voiceInterval = setInterval(loadVoices, 1000);
window.speechSynthesis.onvoiceschanged = loadVoices;

// 2. دالة النطق الأساسية
function speak(text) {
    if (!text || text.trim() === "") return;

    window.speechSynthesis.cancel(); // إلغاء أي نطق سابق فوراً

    setTimeout(() => {
        const utter = new SpeechSynthesisUtterance(text);
        const logo = document.getElementById('appLogo');
        const voiceName = document.getElementById("voiceSelect").value;
        const voice = allVoices.find(v => v.name === voiceName);

        if (voice) {
            utter.voice = voice;
            utter.lang = voice.lang;
        } else {
            utter.lang = 'ar-SA';
        }

        // أنيميشن اللوجو
        utter.onstart = () => logo?.classList.add('speaking-active');
        utter.onend = () => logo?.classList.remove('speaking-active');

        window.speechSynthesis.speak(utter);
        saveToHistory(text);
    }, 100);
}

// 3. نطق النص المكتوب في المربع (الحل الجذري)
function speakInput() {
    const input = document.getElementById("textInput");
    const val = input.value; 
    speak(val);
}

function quickSpeak(t) { speak(t); }

// 4. الإعدادات والسجل
function toggleSettings() { document.getElementById("settings").classList.toggle("hidden"); }

function setFont(size) {
    document.documentElement.style.setProperty('--main-font-size', size + 'px');
}

function saveToHistory(text) {
    if (historyData[0] === text) return;
    historyData.unshift(text);
    if (historyData.length > 10) historyData.pop();
    localStorage.setItem('speechHistory', JSON.stringify(historyData));
    renderHistory();
}

function renderHistory() {
    const box = document.getElementById("history");
    if (box) box.innerHTML = historyData.map(h => `<div class="card glass" onclick="speak('${h}')">${h}</div>`).join('');
}

window.onload = () => {
    loadVoices();
    renderHistory();
};