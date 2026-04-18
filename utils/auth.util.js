import { FREE_EMAIL_DOMAINS } from "../constants/index.js";

/**
 * Returns true for gmail.com, yahoo.com etc.
 * Master users always use free email domains currently.
 */
export const isFreeEmailDomain = (domain) => {
  return FREE_EMAIL_DOMAINS.has(domain.toLowerCase());
};

/**
 * Extract domain from email — "adesh@acme.com" → "acme.com"
 */
export const extractDomain = (email) => {
  return email.split("@")[1]?.toLowerCase();
};
