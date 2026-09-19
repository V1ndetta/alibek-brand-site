/**
 * Google Apps Script webhook for Alibek Brand Site leads.
 *
 * Setup:
 * 1) Open the "Alibek Website Leads" spreadsheet.
 * 2) Extensions -> Apps Script.
 * 3) Paste this file.
 * 4) Project Settings -> Script properties:
 *      LEADS_SECRET = <random secret>
 * 5) Deploy -> New deployment -> Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 6) Put the web-app URL into Vercel as GOOGLE_SHEETS_WEBHOOK_URL.
 * 7) Put the same secret into Vercel as GOOGLE_SHEETS_SECRET.
 */

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('LEADS_SECRET') || '';

    if (expectedSecret && data.secret !== expectedSecret) {
      return json_({ ok: false, error: 'Unauthorized' });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Заявки с сайта') || ss.getSheets()[0];

    sheet.appendRow([
      data.submittedAt ? new Date(data.submittedAt) : new Date(),
      data.company || '',
      data.name || '',
      data.phone || '',
      data.email || '',
      data.brandLink || '',
      data.format || '',
      data.budget || '',
      data.date || '',
      data.message || '',
      data.source || 'Сайт Алибек Ермагамбетов',
      data.bitrixId || '',
      data.bitrixStatus || ''
    ]);

    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
