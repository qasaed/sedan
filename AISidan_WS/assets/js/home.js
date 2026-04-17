const pageTitles = {
  home: { title: 'سِدان', sub: 'استقبال بلاغات متعددة اللغات وتحليلها فورياً مع ترجمة ذكية وتقدير للثقة.', breadcrumb: 'الرئيسية' },
  report: { title: 'تسجيل البلاغ الصوتي', sub: 'استقبال البلاغات الصوتية متعددة اللغات وتحليلها مع ترجمة عربية موحدة.', breadcrumb: 'تسجيل البلاغ' },
  analysis: { title: 'تحليل الحالة (LLM)', sub: 'تحليل متعدد اللغات مع تقدير الوضوح والثقة والإجراء الميداني المقترح.', breadcrumb: 'التحليل الذكي' },
};

const STORAGE_KEY = 'sedan_reports';
const LAST_ANALYSIS_KEY = 'sedan_last_analysis';
let recognition = null;
let isRecording = false;

function getReports() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveReports(reports) { localStorage.setItem(STORAGE_KEY, JSON.stringify(reports)); }
function saveCurrentAnalysis(analysis) { localStorage.setItem(LAST_ANALYSIS_KEY, JSON.stringify(analysis)); }
function getCurrentAnalysis() {
  try { return JSON.parse(localStorage.getItem(LAST_ANALYSIS_KEY) || 'null'); } catch { return null; }
}

function switchTab(tabId) {
  if (tabId === 'about') return void (window.location.href = 'about.html');
  if (tabId === 'logs') return void (window.location.href = 'logs.html');

  document.querySelectorAll('.tab-view').forEach(el => { el.classList.add('hidden'); el.classList.remove('block'); });
  const view = document.getElementById(`view-${tabId}`);
  if (view) { view.classList.remove('hidden'); view.classList.add('block'); }

  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.remove('bg-blue-600', 'text-white');
    el.classList.add('hover:bg-slate-800', 'hover:text-white', 'text-slate-300');
  });
  const activeNav = document.getElementById(`nav-${tabId}`);
  if (activeNav) {
    activeNav.classList.remove('hover:bg-slate-800', 'hover:text-white', 'text-slate-300');
    activeNav.classList.add('bg-blue-600', 'text-white');
  }

  if (pageTitles[tabId]) {
    document.getElementById('page-title').innerText = pageTitles[tabId].title;
    document.getElementById('page-subtitle').innerText = pageTitles[tabId].sub;
    document.getElementById('breadcrumb-current').innerText = pageTitles[tabId].breadcrumb;
  }
  window.location.hash = tabId;
  if (tabId === 'analysis') renderAnalysis(getCurrentAnalysis());
}

function showToast(message) { alert(message); }
function getSpeechRecognition() { return window.SpeechRecognition || window.webkitSpeechRecognition || null; }

function setRecordingUI(recording) {
  const btn = document.getElementById('recordBtn');
  const indicator = document.getElementById('recordingIndicator');
  const hint = btn?.parentElement?.querySelector('p');
  if (!btn || !indicator) return;
  if (recording) {
    btn.classList.add('animate-pulse', 'border-red-600', 'bg-red-200');
    indicator.classList.remove('hidden'); indicator.classList.add('flex');
    if (hint) hint.textContent = 'جاري التسجيل... اضغط مرة ثانية للإيقاف';
  } else {
    btn.classList.remove('animate-pulse', 'border-red-600', 'bg-red-200');
    indicator.classList.add('hidden'); indicator.classList.remove('flex');
    if (hint) hint.textContent = 'اضغط لبدء التسجيل';
  }
}

function chooseRecognitionLang() {
  const current = (document.getElementById('asrResult')?.value || '').trim();
  if (/[\u0600-\u06FF]/.test(current)) return 'ar-SA';
  return 'en-US';
}

function startVoiceRecord() {
  const SpeechRecognition = getSpeechRecognition();
  if (!SpeechRecognition) {
    showToast('المتصفح عندك لا يدعم التعرف على الكلام مباشرة. افتحي المشروع بمتصفح Edge أو Chrome.');
    return;
  }
  const txtArea = document.getElementById('asrResult');
  const analyzeBtn = document.getElementById('analyzeBtn');
  txtArea.value = '';
  analyzeBtn.disabled = true;
  resetPreview();

  recognition = new SpeechRecognition();
  recognition.lang = chooseRecognitionLang();
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 3;

  recognition.onstart = () => { isRecording = true; setRecordingUI(true); };
  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = 0; i < event.results.length; i += 1) transcript += event.results[i][0].transcript + ' ';
    txtArea.value = transcript.trim();
    analyzeBtn.disabled = !txtArea.value.trim();
  };
  recognition.onerror = (event) => {
    console.error(event); setRecordingUI(false); isRecording = false;
    if (event.error !== 'no-speech') showToast(`صار خطأ أثناء التسجيل: ${event.error}`);
  };
  recognition.onend = () => { setRecordingUI(false); isRecording = false; analyzeBtn.disabled = !txtArea.value.trim(); };
  recognition.start();
}
function stopVoiceRecord() { if (recognition && isRecording) recognition.stop(); }
function toggleVoiceRecord() { isRecording ? stopVoiceRecord() : startVoiceRecord(); }

function resetPreview() {
  const resultPreview = document.getElementById('aiResultPreview');
  const emptyPreview = document.getElementById('aiEmptyPreview');
  const loadingPreview = document.getElementById('aiLoadingPreview');
  resultPreview.classList.add('hidden'); resultPreview.classList.remove('flex');
  loadingPreview.classList.add('hidden'); loadingPreview.classList.remove('flex');
  emptyPreview.classList.remove('hidden'); emptyPreview.classList.add('flex');
}

function detectLanguage(text) {
  const lower = text.toLowerCase();
  if (/[\u0600-\u06FF]/.test(text)) return 'العربية';
  const urduWords = ['madad','bimar','bachao','aadmi','pani','gaya','bacha'];
  const englishWords = ['help','crowd','ambulance','lost','fainted','fire','sick','gate','exit'];
  const turkishWords = ['yardım','kalabalık','hasta','kayıp','yangın'];
  const frenchWords = ['aidez','perdu','malade','foule','feu'];
  if (urduWords.some(word => lower.includes(word))) return 'الأردية';
  if (turkishWords.some(word => lower.includes(word))) return 'التركية';
  if (frenchWords.some(word => lower.includes(word))) return 'الفرنسية';
  if (englishWords.some(word => lower.includes(word))) return 'الإنجليزية';
  return 'غير محددة';
}

function translateToArabic(text) {
  let translated = text;
  const dictionary = {
    help: 'مساعدة', ambulance: 'إسعاف', lost: 'ضائع', fire: 'حريق', crowd: 'ازدحام',
    fainted: 'مغمى عليه', sick: 'مريض', water: 'ماء', man: 'رجل', woman: 'امرأة', child: 'طفل',
    madad: 'مساعدة', bimar: 'مريض', bachao: 'أنقذوا', aadmi: 'رجل', pani: 'ماء',
    yardım: 'مساعدة', hasta: 'مريض', 'kayıp': 'ضائع', kalabalık: 'ازدحام', yangın: 'حريق',
    aidez: 'ساعدوا', malade: 'مريض', perdu: 'ضائع', foule: 'ازدحام', feu: 'حريق',
    gate: 'بوابة', exit: 'مخرج', bridge: 'جسر', camp: 'مخيم'
  };
  Object.entries(dictionary).forEach(([word, ar]) => {
    translated = translated.replace(new RegExp(`\\b${word}\\b`, 'gi'), ar);
  });
  return translated;
}

function assessClarity(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const uncertainHits = (text.match(/\?|\.{3}|ممم|يعني|مو واضح|i think|maybe/gi) || []).length;
  if (words.length < 3) return { clarity: 'ضعيف', confidence: 45 };
  if (words.length < 6 || uncertainHits > 1) return { clarity: 'متوسط', confidence: 68 };
  return { clarity: 'جيد', confidence: 86 };
}

function classifySeverity(text) {
  const t = text.toLowerCase();
  if (/إغماء|فاقد|لا يتنفس|نزيف|توقف|حريق|مات|حرج|طارئة|اختناق|ambulance|fainted|fire|bachao|yangın/.test(t)) {
    return { label: 'حرجة جداً', score: 95, desc: 'تحتاج استجابة فورية خلال دقائق.' };
  }
  if (/ضياع|مفقود|تائه|سقوط|كسر|مشكلة صحية|تعب شديد|lost|perdu|kayıp|bimar|malade/.test(t)) {
    return { label: 'متوسطة', score: 72, desc: 'تحتاج متابعة سريعة من الفرق المختصة.' };
  }
  return { label: 'عادية', score: 40, desc: 'يمكن التعامل معها حسب الأولوية التشغيلية.' };
}

function classifyIncident(text) {
  const t = text.toLowerCase();
  const labels = [];
  if (/إغماء|مريض|إسعاف|مسن|نزيف|اختناق|فاقد|يتنفس|وعي|صحية|طبية|ambulance|fainted|sick|bimar|hasta|malade/.test(t)) labels.push('حالة صحية');
  if (/زحام|ازدحام|تكدس|حشود|اختناق|دفع|crowd|foule|kalabalık/.test(t)) labels.push('ازدحام وتكدس');
  if (/ضياع|مفقود|تائه|ضاع|lost|perdu|kayıp/.test(t)) labels.push('ضياع شخص');
  if (/حريق|fire|feu|yangın/.test(t)) labels.push('خطر حريق');
  if (labels.length === 0) labels.push('بلاغ عام');
  return labels;
}

function extractLocation(text) {
  const patterns = [
    /(?:في|ب|عند|قرب)\s+([^\.،\n]{3,40})/,
    /(gate\s*\d+)/i, /(بوابة\s*\d+)/,
    /(exit\s*\d+)/i, /(bridge\s*\d+)/i,
    /(الجمرات[^\.،\n]{0,25})/, /(منى[^\.،\n]{0,25})/, /(عرفات[^\.،\n]{0,25})/, /(مزدلفة[^\.،\n]{0,25})/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return (match[1] || match[0]).trim();
  }
  return 'لم يتم تحديد الموقع بدقة';
}

function buildActions(incidentLabels, severity, location, clarity) {
  const lines = [];
  if (incidentLabels.includes('حالة صحية')) lines.push(`توجيه أقرب فرقة إسعاف إلى ${location}.`);
  if (incidentLabels.includes('ازدحام وتكدس')) lines.push('إرسال دعم أمني لفك التكدس وفتح ممر وصول آمن.');
  if (incidentLabels.includes('ضياع شخص')) lines.push('إشعار وحدة الإرشاد والبحث عن المفقودين فوراً.');
  if (incidentLabels.includes('خطر حريق')) lines.push('إخلاء المنطقة واستدعاء الدفاع المدني فورًا.');
  if (severity.label === 'حرجة جداً') lines.push('رفع أولوية البلاغ إلى الحالة الحمراء والتعامل الفوري.');
  if (clarity !== 'جيد') lines.push('التأكد ميدانياً من التفاصيل لأن وضوح البلاغ ليس كاملاً.');
  if (!lines.length) lines.push('توجيه أقرب فريق ميداني لمعاينة الحالة.');
  return lines;
}

function summarizeText(translatedText, labels, location, detectedLanguage) {
  const shortText = translatedText.length > 180 ? `${translatedText.slice(0, 180)}...` : translatedText;
  return `البلاغ ${detectedLanguage !== 'العربية' ? 'مترجم' : 'مفهوم'} ويشير إلى ${labels.join(' + ')} في ${location}. ${shortText}`;
}

function buildAnalyticalNote(detectedLanguage, clarity, incidentLabels) {
  const notes = [];
  if (detectedLanguage !== 'العربية' && detectedLanguage !== 'غير محددة') notes.push(`تم اكتشاف أن لغة البلاغ هي ${detectedLanguage} وتمت مواءمة المعنى للعربية.`);
  if (detectedLanguage === 'غير محددة') notes.push('تعذر تحديد اللغة بدقة كاملة؛ تم التحليل بناءً على الكلمات المفهومة والسياق.');
  if (clarity !== 'جيد') notes.push('الصوت أو الصياغة غير واضحة بالكامل، لذلك النتيجة تقريبية وتحتاج تأكيد ميداني.');
  if (incidentLabels.includes('بلاغ عام')) notes.push('لم تظهر كلمات كافية لتصنيف دقيق، لذا تم إبقاء البلاغ ضمن البلاغات العامة.');
  if (!notes.length) notes.push('البلاغ واضح نسبيًا وتم استخراج العناصر الأساسية منه بنجاح.');
  return notes.join(' ');
}

function createAnalysisFromText(text) {
  const detectedLanguage = detectLanguage(text);
  const translatedText = translateToArabic(text);
  const clarityData = assessClarity(text);
  const analysisText = `${text} ${translatedText}`;
  const labels = classifyIncident(analysisText);
  const severity = classifySeverity(analysisText);
  const location = extractLocation(analysisText);
  const actions = buildActions(labels, severity, location, clarityData.clarity);
  const summary = summarizeText(translatedText, labels, location, detectedLanguage);
  const note = buildAnalyticalNote(detectedLanguage, clarityData.clarity, labels);
  const timestamp = new Date();
  return {
    id: `SD-${Date.now()}`,
    transcript: text,
    translatedText,
    detectedLanguage,
    clarity: clarityData.clarity,
    confidence: `${clarityData.confidence}%`,
    incidentType: labels.join(' + '),
    primaryTag: labels[0] || 'بلاغ عام',
    secondaryTag: labels[1] || '—',
    severity: severity.label,
    score: severity.score,
    priorityText: severity.label === 'حرجة جداً' ? 'أولوية قصوى - حمراء' : severity.label === 'متوسطة' ? 'أولوية متوسطة - برتقالية' : 'أولوية منخفضة - خضراء',
    priorityDesc: severity.desc,
    location,
    summary,
    note,
    actions,
    createdAt: timestamp.toISOString(),
    displayTime: timestamp.toLocaleString('ar-SA'),
  };
}

function renderPreview(analysis) {
  document.getElementById('previewIncidentType').textContent = analysis.incidentType;
  document.getElementById('previewSeverity').textContent = analysis.severity;
  document.getElementById('previewSummary').textContent = analysis.translatedText;
  document.getElementById('previewActions').textContent = analysis.actions.join('\n');
  const lang = document.getElementById('previewLanguage'); if (lang) lang.textContent = analysis.detectedLanguage;
  const conf = document.getElementById('previewConfidence'); if (conf) conf.textContent = `${analysis.confidence} • ${analysis.clarity}`;

  document.getElementById('aiEmptyPreview').classList.add('hidden');
  document.getElementById('aiEmptyPreview').classList.remove('flex');
  document.getElementById('aiLoadingPreview').classList.add('hidden');
  document.getElementById('aiLoadingPreview').classList.remove('flex');
  document.getElementById('aiResultPreview').classList.remove('hidden');
  document.getElementById('aiResultPreview').classList.add('flex');
}

function renderAnalysis(analysis) {
  if (!analysis) return;
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  setText('analysisTranscript', analysis.transcript);
  setText('analysisTranslated', analysis.translatedText);
  setText('analysisLanguage', analysis.detectedLanguage);
  setText('analysisClarity', analysis.clarity);
  setText('analysisConfidence', analysis.confidence);
  setText('analysisSummary', analysis.summary);
  setText('analysisLocation', analysis.location);
  setText('analysisNote', analysis.note);
  setText('analysisActions', analysis.actions.join(' '));
  setText('analysisTagPrimary', analysis.primaryTag);
  setText('analysisTagSecondary', analysis.secondaryTag);
  setText('analysisScore', `${analysis.score}%`);
  setText('analysisPriorityText', analysis.priorityText);
  setText('analysisPriorityDesc', analysis.priorityDesc);
}

function persistReport(analysis) {
  const reports = getReports();
  reports.unshift({
    id: analysis.id,
    incidentType: analysis.incidentType,
    severity: analysis.severity,
    time: analysis.displayTime,
    transcript: analysis.transcript,
    translatedText: analysis.translatedText,
    detectedLanguage: analysis.detectedLanguage,
    clarity: analysis.clarity,
    confidence: analysis.confidence,
    summary: analysis.summary,
    note: analysis.note,
    location: analysis.location,
    actions: analysis.actions,
    status: 'مفتوح',
  });
  saveReports(reports.slice(0, 50));
  saveCurrentAnalysis(analysis);
}

function analyzeCurrentReport() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const text = document.getElementById('asrResult').value.trim();
  if (!text) return void showToast('سجلي أو اكتبي نص البلاغ أولاً.');

  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = '<div class="loader border-t-white inline-block w-4 h-4 ml-2 border-2"></div> جاري التحليل...';
  document.getElementById('aiEmptyPreview').classList.add('hidden');
  document.getElementById('aiEmptyPreview').classList.remove('flex');
  document.getElementById('aiResultPreview').classList.add('hidden');
  document.getElementById('aiResultPreview').classList.remove('flex');
  document.getElementById('aiLoadingPreview').classList.remove('hidden');
  document.getElementById('aiLoadingPreview').classList.add('flex');

  setTimeout(() => {
    const analysis = createAnalysisFromText(text);
    persistReport(analysis);
    renderPreview(analysis);
    renderAnalysis(analysis);
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = 'تم التحليل بنجاح';
    switchTab('analysis');
  }, 1200);
}

function playTTS() {
  const player = document.getElementById('ttsPlayer');
  const analysis = getCurrentAnalysis();
  if (!analysis) return void showToast('لا يوجد تحليل جاهز للتشغيل الصوتي.');
  player.classList.remove('hidden'); player.classList.add('flex');
  const utterance = new SpeechSynthesisUtterance(`نوع الحالة ${analysis.incidentType}. ${analysis.actions.join(' ')}`);
  utterance.lang = 'ar-SA';
  utterance.onend = () => { player.classList.add('hidden'); player.classList.remove('flex'); };
  speechSynthesis.cancel(); speechSynthesis.speak(utterance);
}

window.switchTab = switchTab;
window.toggleVoiceRecord = toggleVoiceRecord;
window.playTTS = playTTS;
window.analyzeCurrentReport = analyzeCurrentReport;
window.simulateVoiceRecord = toggleVoiceRecord;
window.simulateLLMAnalysis = analyzeCurrentReport;
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.substring(1);
  if (['home','report','analysis'].includes(hash)) switchTab(hash);
});
document.addEventListener('DOMContentLoaded', () => {
  const recordBtn = document.getElementById('recordBtn');
  const analyzeBtn = document.getElementById('analyzeBtn');
  if (recordBtn) recordBtn.setAttribute('onclick', 'toggleVoiceRecord()');
  if (analyzeBtn) analyzeBtn.setAttribute('onclick', 'analyzeCurrentReport()');
  const savedAnalysis = getCurrentAnalysis();
  if (savedAnalysis) {
    renderAnalysis(savedAnalysis); renderPreview(savedAnalysis);
    document.getElementById('asrResult').value = savedAnalysis.transcript;
    document.getElementById('analyzeBtn').disabled = false;
  }
  const hash = window.location.hash.substring(1);
  switchTab(['home','report','analysis'].includes(hash) ? hash : 'home');
});
