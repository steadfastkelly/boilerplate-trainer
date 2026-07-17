export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getAllowedEmailDomain() {
  return process.env.ALLOWED_EMAIL_DOMAIN || "steadfast.design";
}

export function isAllowedEmail(email: string) {
  const domain = getAllowedEmailDomain().toLowerCase();
  return email.trim().toLowerCase().endsWith(`@${domain}`);
}

export function getBooleanEnv(name: string, fallback = false) {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
