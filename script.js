(() => {
  const config = window.SITE_CONFIG || {};
  const { socials = {}, stats = {}, manager = {}, prices = {}, showPrices = false } = config;

  const setHref = (id, href) => {
    const el = document.getElementById(id);
    if (el && href) el.href = href;
  };

  ['instagramLink','footerInstagram','instagramPlatform','instagramMetric'].forEach(id => setHref(id, socials.instagram));
  ['tiktokLink','footerTikTok','tiktokPlatform','tiktokMetric'].forEach(id => setHref(id, socials.tiktok));

  document.querySelectorAll('[data-stat="instagram"]').forEach(el => el.textContent = stats.instagram || '679K+');
  document.querySelectorAll('[data-stat="tiktok"]').forEach(el => el.textContent = stats.tiktok || '259K+');
  document.querySelectorAll('[data-price]').forEach(el => {
    const key = el.dataset.price;
    el.textContent = showPrices ? (prices[key] || 'По запросу') : 'По запросу';
  });

  const currentPage = document.body.dataset.page;
  document.querySelectorAll('[data-nav]').forEach(a => {
    if (a.dataset.nav === currentPage) a.classList.add('active');
  });

  const managerName = document.getElementById('managerName');
  if (managerName) managerName.textContent = manager.name || 'Менеджер';

  const phoneLink = document.getElementById('managerPhoneLink');
  if (phoneLink) {
    phoneLink.textContent = `${manager.phoneDisplay || ''} ↗`;
    phoneLink.href = `https://wa.me/${manager.whatsapp || ''}`;
  }

  const emailLink = document.getElementById('managerEmailLink');
  if (emailLink) {
    emailLink.textContent = `${manager.email || ''} ↗`;
    emailLink.href = `mailto:${manager.email || ''}`;
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }

  const menuBtn = document.querySelector('.menu-button');
  const header = document.querySelector('.site-header');

  menuBtn?.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? '×' : '☰';
  });

  document.querySelectorAll('.desktop-nav a').forEach(a => a.addEventListener('click', () => {
    header.classList.remove('menu-open');
    menuBtn?.setAttribute('aria-expanded','false');
    if (menuBtn) menuBtn.textContent = '☰';
  }));

  const form = document.getElementById('adBriefForm');
  const formStatus = document.getElementById('formStatus');
  const submitBtn = document.getElementById('dynamicSubmitBtn') || form?.querySelector('button[type="submit"]');
  const submissionType = document.getElementById('submissionType');
  const directionCards = [...document.querySelectorAll('[data-submission-type]')];
  const submissionHint = document.getElementById('submissionHint');
  const commonFields = document.getElementById('commonFields');
  const branches = [...document.querySelectorAll('.form-branch')];

  const branchLabels = {
    cooperation: {
      hint: 'Заполните бриф на рекламную интеграцию, амбассадорство, мероприятие или спецпроект.',
      button: 'Отправить предложение'
    },
    narodnoe: {
      hint: 'Предложите материалы, работы или услуги для актуального проекта «Народного строительства».',
      button: 'Предложить участие в проекте'
    }
  };

  const setBranchEnabled = (branch, enabled) => {
    branch.hidden = !enabled;
    branch.querySelectorAll('input, select, textarea').forEach(field => {
      field.disabled = !enabled;
    });
  };

  const updateFormBranch = () => {
    if (!form || !submissionType) return;

    const type = submissionType.value;
    const config = branchLabels[type];

    directionCards.forEach(card => {
      const active = card.dataset.submissionType === type;
      card.classList.toggle('active', active);
      card.setAttribute('aria-checked', String(active));
    });

    if (commonFields) commonFields.hidden = !type;

    branches.forEach(branch => {
      setBranchEnabled(branch, branch.dataset.branch === type);
    });

    if (submissionHint) {
      submissionHint.textContent = config
        ? config.hint
        : 'Выберите направление — ниже появится подходящая форма.';
    }

    if (submitBtn) {
      submitBtn.disabled = !type;
      submitBtn.textContent = config?.button || 'Сначала выберите направление';
    }

    if (formStatus) {
      formStatus.textContent = 'Заявка сохраняется в Google Sheets и после подключения Bitrix24 будет автоматически попадать в CRM.';
    }
  };

  if (submissionType) {
    branches.forEach(branch => setBranchEnabled(branch, false));

    directionCards.forEach(card => {
      card.addEventListener('click', () => {
        submissionType.value = card.dataset.submissionType || '';
        updateFormBranch();

        if (commonFields && !commonFields.hidden) {
          commonFields.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });

    updateFormBranch();
  }

  const buildWhatsAppText = (data) => {
    const common = [
      data.submissionType === 'narodnoe'
        ? 'Новая заявка — Народное строительство'
        : 'Новая заявка на сотрудничество с Алибеком Ермагамбетовым',
      '',
      `Компания / бренд: ${data.company || '—'}`,
      `Контактное лицо: ${data.name || '—'}`,
      `Телефон: ${data.phone || '—'}`,
      `Email: ${data.email || '—'}`,
      `Сайт / Instagram: ${data.brandLink || '—'}`
    ];

    if (data.submissionType === 'narodnoe') {
      return [
        ...common,
        `Проект: ${data.project || '—'}`,
        `Сфера: ${data.supplierCategory || '—'}`,
        `Формат участия: ${data.contributionType || '—'}`,
        `Город: ${data.city || '—'}`,
        `Масштаб предложения: ${data.offerVolume || '—'}`,
        '',
        'Что готовы предоставить:',
        String(data.message || '')
      ].join('\n');
    }

    return [
      ...common,
      `Формат: ${data.format || '—'}`,
      `Бюджет: ${data.budget || '—'}`,
      `Желаемая дата: ${data.date || '—'}`,
      '',
      'Задача:',
      String(data.message || '')
    ].join('\n');
  };

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!submissionType?.value) {
      if (formStatus) formStatus.textContent = 'Сначала выберите направление предложения.';
      document.querySelector('.direction-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!form.reportValidity()) return;

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    const selectedConfig = branchLabels[payload.submissionType];

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
        if (formStatus) {
          formStatus.textContent = payload.submissionType === 'narodnoe'
            ? 'Предложение отправлено. Команда проекта свяжется с вами.'
            : 'Заявка отправлена. Менеджер свяжется с вами.';
        }

        form.reset();
        updateFormBranch();
        return;
      }

      throw new Error(result.error || 'Не удалось отправить заявку');
    } catch (error) {
      const text = buildWhatsAppText(payload);
      window.open(
        `https://wa.me/${manager.whatsapp || ''}?text=${encodeURIComponent(text)}`,
        '_blank',
        'noopener,noreferrer'
      );

      if (formStatus) {
        formStatus.textContent = 'Не удалось сохранить заявку — открыли резервную отправку через WhatsApp.';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = !submissionType?.value;
        submitBtn.textContent = selectedConfig?.button || 'Сначала выберите направление';
      }
    }
  });
})();
