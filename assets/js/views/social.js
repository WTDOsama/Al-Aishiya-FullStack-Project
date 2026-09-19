/* =====================================================================
   مواقع التواصل الاجتماعي للمدرسة
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.social = function (container) {

  function render() {
    const st = S.settings();
    const so = st.social;

    const channels = [
      { key: 'facebook', title: 'صفحة فيسبوك', desc: 'تابع أخبار المدرسة وفعالياتها على فيسبوك', icon: 'facebook', color: '#1877f2', url: so.facebook, user: so.facebook ? so.facebook.replace('https://', '').replace('http://', '') : 'لم يُضف بعد' },
      { key: 'whatsapp', title: 'واتساب المدرسة', desc: 'تواصل مباشر مع إدارة المدرسة عبر واتساب', icon: 'whatsapp', color: '#1faa53', url: so.whatsapp ? U.waLink('السلام عليكم، أود التواصل مع إدارة المدرسة.', so.whatsapp) : '', user: so.whatsapp || 'لم يُضف بعد' },
      { key: 'telegram', title: 'قناة تيليجرام', desc: 'إعلانات وتعاميم المدرسة عبر قناة تيليجرام', icon: 'telegram', color: '#229ed9', url: so.telegram, user: so.telegram ? so.telegram.replace('https://', '') : 'لم يُضف بعد' },
      { key: 'youtube', title: 'قناة يوتيوب', desc: 'فيديوهات الأنشطة والإذاعة المدرسية', icon: 'youtube', color: '#e62117', url: so.youtube, user: so.youtube ? 'قناة المدرسة' : 'لم يُضف بعد' },
      { key: 'website', title: 'الموقع الإلكتروني', desc: 'بوابة المدرسة الرسمية على الإنترنت', icon: 'globe', color: '#0b7a5c', url: so.website, user: so.website ? so.website.replace('https://', '').replace('http://', '') : 'لم يُضف بعد' },
    ];

    const ph = UI.pageHead({
      title: 'مواقع التواصل الاجتماعي',
      sub: 'روابط التواصل الرسمية للمدرسة وقنواتها الإعلامية',
      actions: [{ label: 'تعديل الروابط', icon: 'settings', kind: 'p', onClick: () => App.go('#/settings#social') }],
    });

    const shareInfo = () => {
      const text = [
        `🏫 *${st.schoolName}*`,
        `${st.directorate}`, '',
        `📍 العنوان: ${st.address}`,
        `📞 الهاتف: ${st.phone}`,
        st.email ? `✉️ البريد: ${st.email}` : '', '',
        `🔗 *تابعونا على:*`,
        so.facebook ? `فيسبوك: ${so.facebook}` : '',
        so.telegram ? `تيليجرام: ${so.telegram}` : '',
        so.youtube ? `يوتيوب: ${so.youtube}` : '',
        so.website ? `الموقع: ${so.website}` : '', '',
        `_صادر عن ${CONFIG.systemName}_`,
      ].filter(Boolean).join('\n');
      U.waShare(text);
      S.log('مشاركة عبر واتساب', 'مشاركة بطاقة وروابط التواصل الخاصة بالمدرسة');
    };

    container.innerHTML = `
      ${ph.html}
      <div class="social-grid">
        ${channels.map(c => `
          <div class="social-card" ${c.url ? `data-url="${U.esc(c.url)}"` : 'data-disabled="1"'} style="${c.url ? '' : 'opacity:.55'}">
            <span class="so-ic" style="background:${c.color}">${UI.icon(c.icon)}</span>
            <div class="so-t">${c.title}</div>
            <div class="small muted">${c.desc}</div>
            <div class="so-u">${U.esc(c.user)}</div>
            ${c.url ? `<span class="btn o sm">${UI.icon('link')} فتح القناة</span>` : `<span class="chip">غير مفعّل — أضفه من الإعدادات</span>`}
          </div>`).join('')}
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">${UI.icon('share')} مشاركة بيانات المدرسة</div></div>
        <div class="card-body">
          <div class="flex-between" style="align-items:flex-start;gap:1.2rem;flex-wrap:wrap">
            <div style="flex:1;min-width:260px">
              <div class="kv"><span class="k">اسم المدرسة</span><span class="v">${U.esc(st.schoolName)}</span></div>
              <div class="kv"><span class="k">المديرية</span><span class="v">${U.esc(st.directorate)}</span></div>
              <div class="kv"><span class="k">العنوان</span><span class="v">${U.esc(st.address)}</span></div>
              <div class="kv"><span class="k">الهاتف</span><span class="v ltr">${U.esc(st.phone)}</span></div>
              <div class="kv"><span class="k">البريد</span><span class="v ltr" style="direction:ltr">${U.esc(st.email)}</span></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:.6rem;min-width:230px">
              <button class="btn wa" id="shareInfoBtn">${UI.icon('whatsapp')} مشاركة بطاقة المدرسة عبر واتساب</button>
              <button class="btn o" id="printInfoBtn">${UI.icon('print')} طباعة بطاقة التواصل</button>
            </div>
          </div>
        </div>
      </div>`;

    ph.bind(container);

    container.querySelectorAll('[data-url]').forEach(c => c.addEventListener('click', () => window.open(c.dataset.url, '_blank')));
    container.querySelectorAll('[data-disabled]').forEach(c => c.addEventListener('click', () => UI.warn('هذه القناة غير مفعّلة بعد — أضف رابطها من الإعدادات')));
    container.querySelector('#shareInfoBtn').addEventListener('click', shareInfo);
    container.querySelector('#printInfoBtn').addEventListener('click', () => {
      U.printDoc({
        title: 'بطاقة قنوات التواصل', sign: false,
        body: `<table class="ptbl"><tbody>
          ${channels.filter(c => c.url).map(c => `<tr><td style="width:32%;background:#f3f8f5;font-weight:800">${c.title}</td><td style="direction:ltr;text-align:left">${U.esc(c.user)}</td></tr>`).join('') || '<tr><td>لم تُضف قنوات بعد</td></tr>'}
          <tr><td style="background:#f3f8f5;font-weight:800">هاتف المدرسة</td><td style="direction:ltr;text-align:left">${U.esc(st.phone)}</td></tr>
          <tr><td style="background:#f3f8f5;font-weight:800">العنوان</td><td>${U.esc(st.address)}</td></tr>
        </tbody></table>`,
      });
      S.log('طباعة بطاقة تواصل', 'طباعة بطاقة قنوات التواصل الاجتماعي');
    });
  }

  render();
};
