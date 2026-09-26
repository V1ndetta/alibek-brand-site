module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowedOrigin =
    origin === 'https://aliermagambetov.kz' ||
    origin === 'https://www.aliermagambetov.kz' ||
    origin.endsWith('.vercel.app');

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = allowedOrigin ? 204 : 403;
    return res.end();
  }

  if (origin && !allowedOrigin) {
    res.statusCode = 403;
    return res.end(JSON.stringify({ ok: false, error: 'Origin not allowed' }));
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
  }

  const bitrixWebhookBase = process.env.BITRIX_WEBHOOK_BASE_URL;
  const bitrixMethod = process.env.BITRIX_METHOD || 'crm.lead.add.json';
  const googleSheetsWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbzs174VMsQVGnBjqjjxTmyYUI7gYj6PHeXGA9tOnDQHeridKNEuB4XwD2LzwuSSWN2l/exec';
  const googleSheetsSecret = process.env.GOOGLE_SHEETS_SECRET || '';

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!['narodnoe', 'cooperation', 'business'].includes(body.submissionType)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: 'Invalid submission type' }));
    }

    const submissionType = body.submissionType;
    const required = ['company', 'name', 'phone', 'email', 'brandLink', 'message'];

    if (submissionType === 'narodnoe') {
      required.push('project', 'supplierCategory', 'contributionType', 'city', 'offerVolume');
    } else {
      required.push('format', 'budget', 'date');
    }

    const missing = required.filter((key) => !String(body[key] || '').trim());

    if (missing.length) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: `Missing fields: ${missing.join(', ')}` }));
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email || '').trim());
    if (!emailValid) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: 'Invalid email' }));
    }

    const phoneDigits = String(body.phone || '').replace(/\D/g, '');
    const normalizedPhoneDigits = phoneDigits.length === 11 && phoneDigits.startsWith('7')
      ? phoneDigits
      : (phoneDigits.length === 10 ? `7${phoneDigits}` : '');

    if (!normalizedPhoneDigits || normalizedPhoneDigits.length !== 11) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: 'Invalid phone' }));
    }

    body.phone = `+7 (${normalizedPhoneDigits.slice(1, 4)}) ${normalizedPhoneDigits.slice(4, 7)}-${normalizedPhoneDigits.slice(7, 9)}-${normalizedPhoneDigits.slice(9, 11)}`;

    if (!bitrixWebhookBase && !googleSheetsWebhookUrl) {
      res.statusCode = 503;
      return res.end(JSON.stringify({ ok: false, code: 'lead_sinks_not_configured' }));
    }

    const submittedAt = new Date().toISOString();
    const isProjectLead = submissionType === 'narodnoe';
    const isBusinessLead = submissionType === 'business';

    const title = isProjectLead
      ? `Народное строительство — ${body.company}`
      : `${isBusinessLead ? 'Бизнес и недвижимость' : 'Сотрудничество'} — ${body.company}`;

    const source = isProjectLead
      ? 'Сайт Алибек Ермагамбетов — Народное строительство'
      : `Сайт Алибек Ермагамбетов — ${isBusinessLead ? 'Бизнес и недвижимость' : 'Сотрудничество'}`;

    const comments = isProjectLead
      ? [
          'Тип обращения: Народное строительство',
          `Проект: ${body.project || '—'}`,
          `Бренд / компания: ${body.company}`,
          `Сайт / Instagram: ${body.brandLink || '—'}`,
          `Сфера: ${body.supplierCategory || '—'}`,
          `Формат участия: ${body.contributionType || '—'}`,
          `Город компании: ${body.city || '—'}`,
          `Масштаб предложения: ${body.offerVolume || '—'}`,
          '',
          'Что готовы предоставить:',
          body.message || '—'
        ].join('\n')
      : [
          isBusinessLead ? 'Тип обращения: Бизнес и недвижимость' : 'Тип обращения: Сотрудничество / реклама',
          `Бренд / компания: ${body.company}`,
          `Ссылка на бренд: ${body.brandLink || '—'}`,
          `Формат сотрудничества: ${body.format || '—'}`,
          `Бюджет: ${body.budget || '—'}`,
          `Желаемая дата: ${body.date || '—'}`,
          '',
          'Задача:',
          body.message || '—'
        ].join('\n');

    const delivery = {
      bitrix: { configured: Boolean(bitrixWebhookBase), ok: false, id: null },
      googleSheets: { configured: Boolean(googleSheetsWebhookUrl), ok: false }
    };

    if (bitrixWebhookBase) {
      try {
        const fields = {
          TITLE: title,
          NAME: body.name,
          SOURCE_DESCRIPTION: source,
          COMMENTS: comments,
          PHONE: [{ VALUE: body.phone, VALUE_TYPE: 'WORK' }]
        };

        if (body.email) fields.EMAIL = [{ VALUE: body.email, VALUE_TYPE: 'WORK' }];

        const base = bitrixWebhookBase.endsWith('/') ? bitrixWebhookBase : `${bitrixWebhookBase}/`;
        const response = await fetch(`${base}${bitrixMethod}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields, params: { REGISTER_SONET_EVENT: 'Y' } })
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.error) {
          throw new Error(result.error_description || result.error || 'Bitrix24 rejected the request');
        }

        delivery.bitrix.ok = true;
        delivery.bitrix.id = result.result || null;
      } catch (error) {
        delivery.bitrix.error = String(error?.message || error);
        console.error('Bitrix24 delivery error:', error);
      }
    }

    if (googleSheetsWebhookUrl) {
      try {
        const sheetFormat = isProjectLead
          ? `Народное строительство · ${body.supplierCategory || '—'}`
          : (isBusinessLead ? `Бизнес и недвижимость · ${body.format || ''}` : (body.format || ''));

        const sheetMessage = isProjectLead
          ? [
              `Проект: ${body.project || '—'}`,
              `Сфера: ${body.supplierCategory || '—'}`,
              `Формат участия: ${body.contributionType || '—'}`,
              `Город: ${body.city || '—'}`,
              `Масштаб: ${body.offerVolume || '—'}`,
              '',
              'Предложение:',
              body.message || '—'
            ].join('\n')
          : (body.message || '');

        const response = await fetch(googleSheetsWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            secret: googleSheetsSecret,
            submittedAt,
            company: body.company,
            name: body.name,
            phone: body.phone,
            email: body.email || '',
            brandLink: body.brandLink || '',
            format: sheetFormat,
            budget: isProjectLead ? '' : (body.budget || ''),
            date: isProjectLead ? '' : (body.date || ''),
            message: sheetMessage,
            source,
            bitrixId: delivery.bitrix.id || '',
            bitrixStatus: delivery.bitrix.ok ? 'Создан' : (delivery.bitrix.configured ? 'Ошибка' : 'Не подключён')
          })
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.ok === false) {
          throw new Error(result.error || 'Google Sheets rejected the request');
        }

        delivery.googleSheets.ok = true;
      } catch (error) {
        delivery.googleSheets.error = String(error?.message || error);
        console.error('Google Sheets delivery error:', error);
      }
    }

    const delivered = delivery.bitrix.ok || delivery.googleSheets.ok;

    if (!delivered) {
      res.statusCode = 502;
      return res.end(JSON.stringify({ ok: false, code: 'lead_delivery_failed', delivery }));
    }

    return res.end(JSON.stringify({
      ok: true,
      id: delivery.bitrix.id,
      type: submissionType,
      partial: !(delivery.bitrix.ok && delivery.googleSheets.ok),
      delivery
    }));
  } catch (error) {
    console.error('Lead endpoint error:', error);
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: 'Internal server error' }));
  }
};
