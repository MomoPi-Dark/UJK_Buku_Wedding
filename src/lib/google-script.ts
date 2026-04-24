import { getGoogleScriptFileProxyUrl, getGoogleScriptToken, getGoogleScriptUploadUrl } from "@/lib/env";

type UploadPayload = {
  name: string;
  purpose: string;
  mimeType: string;
  extension: string;
  base64Data: string;
  visitAt: string;
};

type UploadResult = {
  fileId: string;
  fileName: string;
  folderPath: string;
  uploadedAt: string;
};

type FileProxyResult = {
  fileName: string;
  mimeType: string;
  base64Data: string;
};

type DeletePhotoResult = {
  fileId: string;
  deleted: boolean;
  alreadyDeleted?: boolean;
  deletedAt?: string;
};

function getWebAppConfigHint(): string {
  return "Periksa URL Apps Script pakai /exec (bukan /dev) dan akses deployment Web App diset ke Anyone";
}

async function getHttpErrorMessage(response: Response, serviceName: string): Promise<string> {
  const bodyText = (await response.text()).trim();
  const lowerBody = bodyText.toLowerCase();
  const looksLikeHtml = lowerBody.includes("<html") || lowerBody.includes("<!doctype");

  if ([401, 403, 404].includes(response.status) && looksLikeHtml) {
    return `${serviceName} gagal (${response.status}). ${getWebAppConfigHint()}`;
  }

  if (bodyText) {
    try {
      const parsed = JSON.parse(bodyText) as { error?: { message?: string } };
      if (parsed.error?.message) {
        return parsed.error.message;
      }
    } catch {
      // Ignore non-JSON error bodies.
    }
  }

  return `${serviceName} failed with status ${response.status}`;
}

export async function uploadVisitPhoto(payload: UploadPayload): Promise<UploadResult> {
  const response = await fetch(getGoogleScriptUploadUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      token: getGoogleScriptToken(),
      ...payload,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getHttpErrorMessage(response, "Upload service"));
  }

  const json = (await response.json()) as {
    ok?: boolean;
    data?: UploadResult;
    error?: { code?: string; message?: string };
  };

  if (!json.ok || !json.data) {
    const message = json.error?.message ?? "Upload foto gagal";
    throw new Error(message);
  }

  return json.data;
}

export async function fetchPrivatePhoto(fileId: string): Promise<FileProxyResult> {
  const response = await fetch(getGoogleScriptFileProxyUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      token: getGoogleScriptToken(),
      fileId,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getHttpErrorMessage(response, "Photo proxy"));
  }

  const json = (await response.json()) as {
    ok?: boolean;
    data?: FileProxyResult;
    error?: { code?: string; message?: string };
  };

  if (!json.ok || !json.data) {
    const message = json.error?.message ?? "Gagal mengambil foto private";
    throw new Error(message);
  }

  return json.data;
}

export async function deleteVisitPhoto(fileId: string): Promise<DeletePhotoResult> {
  const response = await fetch(getGoogleScriptUploadUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      token: getGoogleScriptToken(),
      action: "delete",
      fileId,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getHttpErrorMessage(response, "Delete photo service"));
  }

  const json = (await response.json()) as {
    ok?: boolean;
    data?: DeletePhotoResult;
    error?: { code?: string; message?: string };
  };

  if (!json.ok || !json.data) {
    const message = json.error?.message ?? "Gagal menghapus foto";
    throw new Error(message);
  }

  return json.data;
}

export function mimeTypeToExtension(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized === "image/jpeg" || normalized === "image/jpg") {
    return "jpg";
  }
  if (normalized === "image/png") {
    return "png";
  }
  if (normalized === "image/webp") {
    return "webp";
  }
  return "jpg";
}
