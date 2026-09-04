(() => {
  const config = window.SITE_CONFIG || {};
  const { socials = {}, stats = {}, manager = {}, prices = {}, showPrices = false } = config;
  const setHref = (id, href) => { const el = document.getElementById(id); if (el && href) el.href = href; };
  ['instagramLink','footerInstagram','instagramPlatform'].forEach(id => setHref(id, socials.instagram));
  ['tiktokLink','footerTikTok','tiktokPlatform'].forEach(id => setHref(id, socials.tiktok));

  document.querySelectorAll('[data-stat="instagram"]').forEach(el => el.textContent = stats.instagram || '679K+');
  document.querySelectorAll('[data-stat="tiktok"]').forEach(el => el.textContent = stats.tiktok || '259K+');
  document.querySelectorAll('[data-price]').forEach(el => { const key = el.dataset.price; el.textContent = showPrices ? (prices[key] || 'По запросу') : 'По запросу'; });

  const currentPage = document.body.dataset.page;
  document.querySelectorAll('[data-nav]').forEach(a => { if (a.dataset.nav === currentPage) a.classList.add('active'); });

  const managerName = document.getElementById('managerName');
  if (managerName) managerName.textContent = manager.name || 'Менеджер';
  const phoneLink = document.getElementById('managerPhoneLink');
  if (phoneLink) { phoneLink.textContent = `${manager.phoneDisplay || ''} ↗`; phoneLink.href = `https://wa.me/${manager.whatsapp || ''}`; }
  const emailLink = document.getElementById('managerEmailLink');
  if (emailLink) { emailLink.textContent = `${manager.email || ''} ↗`; emailLink.href = `mailto:${manager.email || ''}`; }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); }); }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } else document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));

  const menuBtn = document.querySelector('.menu-button');
  const header = document.querySelector('.site-header');
  menuBtn?.addEventListener('click', () => { const open = header.classList.toggle('menu-open'); menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.textContent = open ? '×' : '☰'; });
  document.querySelectorAll('.desktop-nav a').forEach(a => a.addEventListener('click', () => { header.classList.remove('menu-open'); menuBtn?.setAttribute('aria-expanded','false'); if (menuBtn) menuBtn.textContent='☰'; }));

  const form = document.getElementById('adBriefForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const text = ['Новая заявка на сотрудничество с Алибеком Ермагамбетовым','',`Компания / бренд: ${fd.get('company')}`,`Контактное лицо: ${fd.get('name')}`,`Телефон: ${fd.get('phone')}`,`Email: ${fd.get('email') || '—'}`,`Ссылка на бренд: ${fd.get('brandLink') || '—'}`,`Формат: ${fd.get('format')}`,`Бюджет: ${fd.get('budget')}`,`Желаемая дата: ${fd.get('date') || '—'}`,'','Задача:',String(fd.get('message') || '')].join('\n');
    window.open(`https://wa.me/${manager.whatsapp || ''}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  });
})();
