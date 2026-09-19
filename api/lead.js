module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

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
    const required = ['company', 'name', 'phone', 'message'];
    const missing = required.filter((key) => !String(body[key] || '').trim());

    if (missing.length) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: `Missing fields: ${missing.join(', ')}` }));
    }

    if (!bitrixWebhookBase && !googleSheetsWebhookUrl) {
      res.statusCode = 503;
      return res.end(JSON.stringify({ ok: false, code: 'lead_sinks_not_configured' }));
    }

    const submittedAt = new Date().toISOString();
    const comments = [
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
          TITLE: `Сотрудничество — ${body.company}`,
          NAME: body.name,
          SOURCE_DESCRIPTION: 'Сайт Алибек Ермагамбетов',
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
        if (!response.ok || result.error) throw new Error(result.error_description || result.error || 'Bitrix24 rejected the request');

        delivery.bitrix.ok = true;
        delivery.bitrix.id = result.result || null;
      } catch (error) {
        delivery.bitrix.error = String(error?.message || error);
        console.error('Bitrix24 delivery error:', error);
      }
    }

    if (googleSheetsWebhookUrl) {
      try {
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
            format: body.format || '',
            budget: body.budget || '',
            date: body.date || '',
            message: body.message || '',
            source: 'Сайт Алибек Ермагамбетов',
            bitrixId: delivery.bitrix.id || '',
            bitrixStatus: delivery.bitrix.ok ? 'Создан' : (delivery.bitrix.configured ? 'Ошибка' : 'Не подключён')
          })
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.ok === false) throw new Error(result.error || 'Google Sheets rejected the request');

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
      partial: !(delivery.bitrix.ok && delivery.googleSheets.ok),
      delivery
    }));
  } catch (error) {
    console.error('Lead endpoint error:', error);
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: 'Internal server error' }));
  }
};
