function getRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getOptional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function normalizeGoogleScriptWebAppUrl(url: string): string {
  return url.trim().replace(/\/dev\/?$/, "/exec");
}

function normalizeAdminIdentifier(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function getGoogleScriptUploadUrl(): string {
  return normalizeGoogleScriptWebAppUrl(
    getRequired("GOOGLE_SCRIPT_UPLOAD_URL"),
  );
}

export function getGoogleScriptToken(): string {
  return getRequired("GOOGLE_SCRIPT_TOKEN");
}

export function getGoogleScriptFileProxyUrl(): string {
  return normalizeGoogleScriptWebAppUrl(
    getRequired("GOOGLE_SCRIPT_FILE_PROXY_URL"),
  );
}

export function getAdminUsername(): string {
  return getRequired("ADMIN_USERNAME");
}

export function getAdminEmail(): string {
  const configured = getOptional("ADMIN_EMAIL");
  if (configured) {
    return configured.toLowerCase();
  }

  return `${normalizeAdminIdentifier(getAdminUsername())}@admin.local`;
}

export function getAdminDisplayName(): string {
  return getOptional("ADMIN_NAME") ?? "Admin TU";
}

export function getAdminPasswordHash(): string {
  return getRequired("ADMIN_PASSWORD_HASH");
}

export function getAdminSessionSecret(): string {
  return getRequired("ADMIN_SESSION_SECRET");
}

export function getBetterAuthSecret(): string {
  return getRequired("BETTER_AUTH_SECRET");
}

export function getBetterAuthUrl(): string | undefined {
  return getOptional("BETTER_AUTH_URL");
}
