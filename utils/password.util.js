import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 12;

export const hashPassword = async (plainPassword) => {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Generate a secure random reset token (raw, for email link)
 * and its SHA-256 hash (for DB storage — never store raw tokens in DB)
 */
export const generatePasswordResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  return { rawToken, hashedToken };
};

/**
 * Hash a raw token the same way — used when verifying on reset
 */
export const hashResetToken = (rawToken) => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};
