module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
  }

  const webhookBase = process.env.BITRIX_WEBHOOK_BASE_URL;
  const method = process.env.BITRIX_METHOD || 'crm.lead.add.json';

  if (!webhookBase) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ ok: false, code: 'bitrix_not_configured' }));
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const required = ['company', 'name', 'phone', 'message'];
    const missing = required.filter((key) => !String(body[key] || '').trim());

    if (missing.length) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: `Missing fields: ${missing.join(', ')}` }));
    }

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

    const fields = {
      TITLE: `Сотрудничество — ${body.company}`,
      NAME: body.name,
      SOURCE_DESCRIPTION: 'Сайт Алибек Ермагамбетов',
      COMMENTS: comments,
      PHONE: [{ VALUE: body.phone, VALUE_TYPE: 'WORK' }]
    };

    if (body.email) fields.EMAIL = [{ VALUE: body.email, VALUE_TYPE: 'WORK' }];

    const base = webhookBase.endsWith('/') ? webhookBase : `${webhookBase}/`;
    const response = await fetch(`${base}${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields, params: { REGISTER_SONET_EVENT: 'Y' } })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.error) {
      console.error('Bitrix24 error:', result);
      res.statusCode = 502;
      return res.end(JSON.stringify({ ok: false, error: 'Bitrix24 rejected the request' }));
    }

    return res.end(JSON.stringify({ ok: true, id: result.result || null }));
  } catch (error) {
    console.error('Lead endpoint error:', error);
    res.statusCode = 500;
    return res.end(JSON.stringify({ ok: false, error: 'Internal server error' }));
  }
};
