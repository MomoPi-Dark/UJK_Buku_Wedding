/**
 * Google Apps Script - Upload endpoint for Buku Tamu MAN 2
 * Deploy as Web App, then set URL to GOOGLE_SCRIPT_UPLOAD_URL
 */

const TIMEZONE = 'Asia/Jakarta';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function doPost(e) {
  try {
    const body = parseJsonBody(e);
    const token = getScriptPropertyOrThrow_('BOOK_GUEST_TOKEN');

    if (!body || body.token !== token) {
      return jsonResponse_(401, {
        ok: false,
        error: { code: 'INVALID_TOKEN', message: 'Unauthorized request' },
      });
    }

    const action =
      typeof body.action === 'string' && body.action.trim()
        ? body.action.trim().toLowerCase()
        : 'upload';

    if (action === 'delete') {
      return handleDelete_(body);
    }

    if (action !== 'upload') {
      return jsonResponse_(400, {
        ok: false,
        error: { code: 'INVALID_ACTION', message: 'Unsupported action' },
      });
    }

    const rootFolderId = getScriptPropertyOrThrow_('BOOK_GUEST_ROOT_FOLDER_ID');
    return handleUpload_(body, rootFolderId);
  } catch (error) {
    return jsonResponse_(500, {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

function handleUpload_(body, rootFolderId) {
  try {
    const name = requireString_(body.name, 'name');
    const purpose = requireString_(body.purpose, 'purpose');
    const mimeType = requireString_(body.mimeType, 'mimeType');
    const extension = normalizeExtension_(requireString_(body.extension, 'extension'));
    const base64Data = requireString_(body.base64Data, 'base64Data');
    const visitAtInput = typeof body.visitAt === 'string' && body.visitAt ? body.visitAt : new Date().toISOString();

    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(mimeType)) {
      return jsonResponse_(400, {
        ok: false,
        error: { code: 'INVALID_MIME', message: 'Unsupported mimeType' },
      });
    }

    const bytes = Utilities.base64Decode(base64Data);
    if (!bytes || bytes.length === 0) {
      return jsonResponse_(400, {
        ok: false,
        error: { code: 'EMPTY_FILE', message: 'File content is empty' },
      });
    }

    if (bytes.length > MAX_IMAGE_SIZE_BYTES) {
      return jsonResponse_(413, {
        ok: false,
        error: { code: 'FILE_TOO_LARGE', message: 'File size exceeds 5MB limit' },
      });
    }

    const visitDate = parseDateSafe_(visitAtInput);
    const path = buildPath_(visitDate);
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    const yearFolder = getOrCreateFolder_(rootFolder, path.year);
    const monthFolder = getOrCreateFolder_(yearFolder, path.month);
    const dayFolder = getOrCreateFolder_(monthFolder, path.day);

    const fileName = buildFileName_(visitDate, name, purpose, extension);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const file = dayFolder.createFile(blob);

    return jsonResponse_(200, {
      ok: true,
      data: {
        fileId: file.getId(),
        fileName: file.getName(),
        folderPath: [path.year, path.month, path.day].join('/'),
        uploadedAt: Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      },
    });
  } catch (error) {
    return jsonResponse_(500, {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

function handleDelete_(body) {
  const fileId = requireString_(body.fileId, 'fileId');
  try {
    const file = DriveApp.getFileById(fileId);
    if (!file.isTrashed()) {
      file.setTrashed(true);
    }

    return jsonResponse_(200, {
      ok: true,
      data: {
        fileId: fileId,
        deleted: true,
        alreadyDeleted: false,
        deletedAt: Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      },
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const normalizedMessage = rawMessage.toLowerCase();
    const notFoundPattern = /not found|cannot find|file does not exist|no item/;

    if (notFoundPattern.test(normalizedMessage)) {
      return jsonResponse_(200, {
        ok: true,
        data: {
          fileId: fileId,
          deleted: true,
          alreadyDeleted: true,
          deletedAt: Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        },
      });
    }

    return jsonResponse_(500, {
      ok: false,
      error: {
        code: 'DELETE_FAILED',
        message: rawMessage,
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

function normalizeExtension_(value) {
  const ext = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (ext === 'jpeg') return 'jpg';
  if (ext === 'jpg' || ext === 'png' || ext === 'webp') return ext;
  return 'jpg';
}

function parseDateSafe_(value) {
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

function buildPath_(date) {
  const year = Utilities.formatDate(date, TIMEZONE, 'yyyy');
  const monthNumber = Utilities.formatDate(date, TIMEZONE, 'MM');
  const monthNames = {
    '01': 'Januari',
    '02': 'Februari',
    '03': 'Maret',
    '04': 'April',
    '05': 'Mei',
    '06': 'Juni',
    '07': 'Juli',
    '08': 'Agustus',
    '09': 'September',
    '10': 'Oktober',
    '11': 'November',
    '12': 'Desember',
  };

  const month = monthNumber + '-' + monthNames[monthNumber];
  const day = Utilities.formatDate(date, TIMEZONE, 'yyyy-MM-dd');

  return { year: year, month: month, day: day };
}

function buildFileName_(date, name, purpose, extension) {
  const datePart = Utilities.formatDate(date, TIMEZONE, 'yyyy-MM-dd_HH-mm-ss');
  const safeName = slugify_(name, 50);
  const safePurpose = slugify_(purpose, 60);
  return [datePart, safeName, safePurpose].join('_') + '.' + extension;
}

function slugify_(input, maxLen) {
  const normalized = String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen);

  return normalized || 'unknown';
}

function getOrCreateFolder_(parent, folderName) {
  const existing = parent.getFoldersByName(folderName);
  if (existing.hasNext()) {
    return existing.next();
  }
  return parent.createFolder(folderName);
}

function jsonResponse_(status, payload) {
  const out = ContentService.createTextOutput(
    JSON.stringify(
      {
        ...payload,
        status: status,
      },
      null,
      2,
    ),
  );
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}
