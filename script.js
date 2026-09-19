(() => {
  const config = window.SITE_CONFIG || {};
  const { socials = {}, stats = {}, manager = {}, prices = {}, showPrices = false } = config;
  const leadApiUrl = config.leadApiUrl || '/api/lead';

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
  const submissionSummary = document.getElementById('submissionSummary');
  const submissionSummaryGrid = document.getElementById('submissionSummaryGrid');
  const changeDirectionBtn = document.getElementById('changeDirectionBtn');
  const phoneInput = document.getElementById('phoneInput');
  const emailInput = document.getElementById('emailInput');

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

  const formatPhoneLocal = (value) => {
    let digits = String(value || '').replace(/\D/g, '');

    if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
      digits = digits.slice(1);
    }

    digits = digits.slice(0, 10);

    const a = digits.slice(0, 3);
    const b = digits.slice(3, 6);
    const c = digits.slice(6, 8);
    const d = digits.slice(8, 10);

    let result = '';
    if (a) result += `(${a}`;
    if (a.length === 3) result += ') ';
    if (b) result += b;
    if (b.length === 3 && c) result += '-';
    if (c) result += c;
    if (c.length === 2 && d) result += '-';
    if (d) result += d;

    return result;
  };

  const validatePhone = () => {
    if (!phoneInput) return true;
    const digits = phoneInput.value.replace(/\D/g, '');

    if (!digits.length) {
      phoneInput.setCustomValidity('');
      return false;
    }

    const valid = digits.length === 10;
    phoneInput.setCustomValidity(valid ? '' : 'Введите 10 цифр номера после +7');
    return valid;
  };

  const validateEmail = () => {
    if (!emailInput) return true;
    const value = emailInput.value.trim();

    if (!value) {
      emailInput.setCustomValidity('');
      return false;
    }

    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    emailInput.setCustomValidity(valid ? '' : 'Введите корректный email, например name@company.kz');
    return valid;
  };

  const refreshSubmitState = () => {
    if (!form || !submitBtn || !submissionType) return;

    const type = submissionType.value;
    const config = branchLabels[type];
    const valid = Boolean(type) && form.checkValidity();

    submitBtn.disabled = !valid;
    submitBtn.textContent = !type
      ? 'Сначала выберите направление'
      : (valid ? config?.button : 'Заполните все поля');
  };

  const summaryLabel = (label, value) => `
    <div class="submission-summary-item">
      <span>${label}</span>
      <strong>${value || '—'}</strong>
    </div>
  `;

  const updateSubmissionSummary = () => {
    if (!form || !submissionType || !submissionSummary || !submissionSummaryGrid) return;

    const type = submissionType.value;

    if (!type) {
      submissionSummary.hidden = true;
      submissionSummaryGrid.innerHTML = '';
      return;
    }

    const getValue = (name) => {
      const field = form.elements[name];
      return field && !field.disabled ? String(field.value || '').trim() : '';
    };

    const company = getValue('company');

    if (type === 'narodnoe') {
      submissionSummaryGrid.innerHTML = [
        summaryLabel('Направление', 'Народное строительство'),
        summaryLabel('Проект', getValue('project')),
        summaryLabel('Сфера', getValue('supplierCategory')),
        summaryLabel('Формат участия', getValue('contributionType')),
        summaryLabel('Компания', company)
      ].join('');
    } else {
      submissionSummaryGrid.innerHTML = [
        summaryLabel('Направление', 'Сотрудничество / реклама'),
        summaryLabel('Формат', getValue('format')),
        summaryLabel('Бюджет', getValue('budget')),
        summaryLabel('Желаемая дата', getValue('date')),
        summaryLabel('Компания', company)
      ].join('');
    }

    submissionSummary.hidden = false;
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

    if (formStatus) {
      formStatus.textContent = 'Все поля обязательны. Заявка сохраняется в Google Sheets и после подключения Bitrix24 будет автоматически попадать в CRM.';
    }

    updateSubmissionSummary();
    refreshSubmitState();
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

  phoneInput?.addEventListener('input', () => {
    phoneInput.value = formatPhoneLocal(phoneInput.value);
    validatePhone();
    updateSubmissionSummary();
    refreshSubmitState();
  });

  phoneInput?.addEventListener('blur', validatePhone);

  emailInput?.addEventListener('input', () => {
    validateEmail();
    updateSubmissionSummary();
    refreshSubmitState();
  });

  emailInput?.addEventListener('blur', validateEmail);

  form?.addEventListener('input', () => {
    updateSubmissionSummary();
    refreshSubmitState();
  });

  form?.addEventListener('change', () => {
    updateSubmissionSummary();
    refreshSubmitState();
  });

  changeDirectionBtn?.addEventListener('click', () => {
    document.querySelector('.direction-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    directionCards[0]?.focus({ preventScroll: true });
  });

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

    validatePhone();
    validateEmail();

    if (!form.reportValidity()) return;

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    payload.phone = payload.phone ? `+7 ${payload.phone}` : '';
    const selectedConfig = branchLabels[payload.submissionType];

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправляем…';
    }

    if (formStatus) formStatus.textContent = 'Отправляем заявку…';

    try {
      const response = await fetch(leadApiUrl, {
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
        if (phoneInput) {
          phoneInput.value = '';
          phoneInput.setCustomValidity('');
        }
        if (emailInput) emailInput.setCustomValidity('');
        if (submissionType) submissionType.value = '';
        updateFormBranch();
        updateSubmissionSummary();
        refreshSubmitState();
        return;
      }

      throw new Error(result.error || 'Не удалось отправить заявку');
    } catch (error) {
      console.error('Lead submission failed:', error);

      if (formStatus) {
        formStatus.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с менеджером вручную по WhatsApp.';
      }
    } finally {
      refreshSubmitState();
    }
  });
})();
