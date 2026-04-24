/**
 * Google Apps Script - Private file proxy endpoint for Buku Tamu MAN 2
 * Deploy as Web App, then set URL to GOOGLE_SCRIPT_FILE_PROXY_URL
 */

function doPost(e) {
  try {
    const body = parseJsonBody(e);
    const token = getScriptPropertyOrThrow_('BOOK_GUEST_TOKEN');

    if (!body || body.token !== token) {
      return jsonResponse_({
        ok: false,
        error: { code: 'INVALID_TOKEN', message: 'Unauthorized request' },
      });
    }

    const fileId = requireString_(body.fileId, 'fileId');
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const bytes = blob.getBytes();
    const base64Data = Utilities.base64Encode(bytes);

    return jsonResponse_({
      ok: true,
      data: {
        fileId: file.getId(),
        fileName: file.getName(),
        mimeType: blob.getContentType(),
        base64Data: base64Data,
      },
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

function parseJsonBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return null;
  }
  return JSON.parse(e.postData.contents);
}

function getScriptPropertyOrThrow_(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error('Missing script property: ' + key);
  }
  return value;
}

function requireString_(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Invalid field: ' + fieldName);
  }
  return value.trim();
}

function jsonResponse_(payload) {
  const out = ContentService.createTextOutput(JSON.stringify(payload));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}
