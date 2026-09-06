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
  const formStatus = document.getElementById('formStatus');
  const submitBtn = form?.querySelector('button[type="submit"]');

  const buildWhatsAppText = (data) => [
    'Новая заявка на сотрудничество с Алибеком Ермагамбетовым',
    '',
    `Компания / бренд: ${data.company}`,
    `Контактное лицо: ${data.name}`,
    `Телефон: ${data.phone}`,
    `Email: ${data.email || '—'}`,
    `Ссылка на бренд: ${data.brandLink || '—'}`,
    `Формат: ${data.format}`,
    `Бюджет: ${data.budget}`,
    `Желаемая дата: ${data.date || '—'}`,
    '',
    'Задача:',
    String(data.message || '')
  ].join('\n');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправляем…';
    }
    if (formStatus) formStatus.textContent = 'Отправляем заявку…';

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.ok) {
        if (formStatus) formStatus.textContent = 'Заявка отправлена. Менеджер свяжется с вами.';
        form.reset();
        return;
      }

      if (result.code === 'bitrix_not_configured') {
        const text = buildWhatsAppText(payload);
        window.open(`https://wa.me/${manager.whatsapp || ''}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
        if (formStatus) formStatus.textContent = 'CRM ещё не подключена — открыли готовое сообщение в WhatsApp.';
        return;
      }

      throw new Error(result.error || 'Не удалось отправить заявку');
    } catch (error) {
      const text = buildWhatsAppText(payload);
      window.open(`https://wa.me/${manager.whatsapp || ''}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      if (formStatus) formStatus.textContent = 'Не удалось отправить в CRM — открыли резервную отправку через WhatsApp.';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить предложение';
      }
    }
  });
})();
