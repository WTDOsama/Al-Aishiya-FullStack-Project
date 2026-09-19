/* =====================================================================
   طبقة الرسوم البيانية (تعتمد على Chart.js محلياً مع دعم RTL)
   ===================================================================== */
'use strict';

const CH = (() => {
  let registry = [];

  const available = () => typeof window.Chart !== 'undefined';

  function baseOpts(extra = {}) {
    const st = S.settings();
    const dark = st.theme === 'dark';
    const gridColor = dark ? 'rgba(255,255,255,.07)' : 'rgba(10,50,40,.07)';
    const tickColor = dark ? '#93a99f' : '#5f736c';
    return Object.assign({
      responsive: true,
      maintainAspectRatio: false,
      locale: 'ar',
      plugins: {
        legend: { rtl: true, position: 'bottom', labels: { font: { family: 'Cairo', size: 11, weight: '700' }, color: tickColor, padding: 14, usePointStyle: true, pointStyleWidth: 10, boxHeight: 7 } },
        tooltip: {
          rtl: true, textDirection: 'rtl',
          backgroundColor: dark ? '#1e322b' : '#083f31',
          titleFont: { family: 'Cairo', weight: '800', size: 12 },
          bodyFont: { family: 'Cairo', size: 12 },
          padding: 10, cornerRadius: 8, displayColors: false,
        },
      },
      scales: {
        x: { ticks: { font: { family: 'Cairo', size: 10.5, weight: '700' }, color: tickColor }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { font: { family: 'Cairo', size: 10.5 }, color: tickColor, precision: 0 }, grid: { color: gridColor } },
      },
      animation: { duration: 500 },
    }, extra);
  }

  if (available()) {
    Chart.defaults.font.family = 'Cairo';
  }

  function make(canvas, cfg) {
    if (!available() || !canvas) return null;
    let ctx = null;
    try { ctx = canvas.getContext && canvas.getContext('2d'); } catch (e) { return null; }
    if (!ctx) return null;
    try {
      const c = new Chart(ctx, cfg);
      registry.push(c);
      return c;
    } catch (e) { return null; }
  }

  function doughnut(canvas, labels, data, colors) {
    return make(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors || CONFIG.chartPalette, borderWidth: 2, borderColor: S.settings().theme === 'dark' ? '#101f1a' : '#fff', hoverOffset: 6 }] },
      options: baseOpts({ scales: {}, cutout: '62%' }),
    });
  }

  function bar(canvas, labels, data, opt = {}) {
    const colors = opt.colors || CONFIG.chartPalette;
    const dark = S.settings().theme === 'dark';
    const tick = dark ? '#93a99f' : '#5f736c';
    const grid = dark ? 'rgba(255,255,255,.07)' : 'rgba(10,50,40,.07)';
    const dss = opt.datasets || [{ label: opt.label || '', data }];
    const multi = dss.length > 1;
    return make(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: dss.map((d, i) => Object.assign({
          backgroundColor: opt.singleColor ? opt.singleColor : (multi ? colors[i % colors.length] : colors),
          borderRadius: 7, barPercentage: .62, categoryPercentage: .72, maxBarThickness: 44,
        }, d)),
      },
      options: baseOpts(opt.horizontal ? {
        indexAxis: 'y',
        scales: {
          y: { ticks: { font: { family: 'Cairo', size: 10.5, weight: '700' }, color: tick }, grid: { display: false } },
          x: { beginAtZero: true, ticks: { font: { family: 'Cairo', size: 10.5 }, color: tick, precision: 0 }, grid: { color: grid } },
        },
      } : {}),
    });
  }

  function line(canvas, labels, datasets) {
    return make(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map((d, i) => Object.assign({
          borderColor: CONFIG.chartPalette[i],
          backgroundColor: CONFIG.chartPalette[i] + '22',
          fill: true, tension: .38, borderWidth: 2.5,
          pointRadius: 3.5, pointBackgroundColor: CONFIG.chartPalette[i],
          pointBorderColor: '#fff', pointBorderWidth: 1.5,
        }, d)),
      },
      options: baseOpts(),
    });
  }

  function reset() { registry.forEach(c => { try { c.destroy(); } catch (e) { } }); registry = []; }

  /* بديل مبسط عند غياب مكتبة الرسوم */
  function fallbackMsg(container) {
    if (container) container.innerHTML = `<div class="empty" style="padding:2rem 1rem"><div class="e-s">تعذر تحميل مكتبة الرسوم البيانية</div></div>`;
  }

  return { available, doughnut, bar, line, reset, fallbackMsg };
})();
