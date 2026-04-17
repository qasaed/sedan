const STORAGE_KEY = 'sedan_reports';
const LAST_ANALYSIS_KEY = 'sedan_last_analysis';

function getReports() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function severityBadge(severity) {
  if (severity === 'حرجة جداً') {
    return '<span class="flex items-center gap-1.5 font-bold text-red-600"><span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> حرجة جداً</span>';
  }
  if (severity === 'متوسطة') {
    return '<span class="flex items-center gap-1.5 font-semibold text-orange-500"><span class="w-2.5 h-2.5 rounded-full bg-orange-400"></span> متوسطة</span>';
  }
  return '<span class="flex items-center gap-1.5 font-semibold text-green-600"><span class="w-2.5 h-2.5 rounded-full bg-green-500"></span> عادية</span>';
}

function incidentBadge(type) {
  if (type.includes('حالة صحية')) return 'bg-red-100 text-red-700 border-red-200';
  if (type.includes('ضياع')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (type.includes('ازدحام')) return 'bg-teal-100 text-teal-700 border-teal-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function openReport(index) {
  const reports = getReports();
  const report = reports[index];
  if (!report) return;
  const analysis = {
    id: report.id,
    transcript: report.transcript,
    incidentType: report.incidentType,
    primaryTag: report.incidentType.split(' + ')[0] || report.incidentType,
    secondaryTag: report.incidentType.split(' + ')[1] || '—',
    severity: report.severity,
    score: report.severity === 'حرجة جداً' ? 95 : report.severity === 'متوسطة' ? 72 : 40,
    priorityText: report.severity === 'حرجة جداً' ? 'أولوية قصوى - حمراء' : report.severity === 'متوسطة' ? 'أولوية متوسطة - برتقالية' : 'أولوية منخفضة - خضراء',
    priorityDesc: report.severity === 'حرجة جداً' ? 'تحتاج استجابة فورية خلال دقائق.' : report.severity === 'متوسطة' ? 'تحتاج متابعة سريعة من الفرق المختصة.' : 'يمكن التعامل معها حسب الأولوية التشغيلية.',
    location: report.location,
    summary: report.summary,
    translatedText: report.translatedText || report.summary,
    detectedLanguage: report.detectedLanguage || 'غير محددة',
    clarity: report.clarity || 'متوسط',
    confidence: report.confidence || '68%',
    note: report.note || 'تم استعادة البلاغ من السجل.',
    actions: report.actions,
  };
  localStorage.setItem(LAST_ANALYSIS_KEY, JSON.stringify(analysis));
  window.location.href = 'home.html#analysis';
}

function renderReports() {
  const tbody = document.getElementById('reportsTableBody');
  if (!tbody) return;
  const reports = getReports();
  if (!reports.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-10 text-center text-gray-500 font-medium">لا توجد بلاغات محفوظة بعد. افتحي صفحة تسجيل البلاغ وسجلي بلاغاً أولاً.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = reports.map((report, index) => `
    <tr class="${index === 0 ? 'bg-blue-50/40 border-r-4 border-r-blue-500' : 'hover:bg-gray-50 border-r-4 border-r-transparent'} transition">
      <td class="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">#${report.id}</td>
      <td class="px-6 py-4"><span class="${incidentBadge(report.incidentType)} py-1.5 px-3 rounded-md text-xs font-bold border">${report.incidentType}</span></td>
      <td class="px-6 py-4">${severityBadge(report.severity)}</td>
      <td class="px-6 py-4 whitespace-nowrap font-medium">${report.time}</td>
      <td class="px-6 py-4 text-center">
        <button onclick="openReport(${index})" class="text-blue-600 font-bold hover:underline bg-white border border-blue-200 px-3 py-1.5 rounded shadow-sm hover:shadow transition">فتح التفاصيل</button>
      </td>
    </tr>
  `).join('');
}

window.openReport = openReport;

document.addEventListener('DOMContentLoaded', () => {
  renderReports();
  const refreshBtn = document.getElementById('refreshLogsBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', renderReports);
});
