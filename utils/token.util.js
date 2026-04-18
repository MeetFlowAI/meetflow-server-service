import jwt from "jsonwebtoken";
import { envConfig } from "../config/env.config.js";
import { TOKEN_EXPIRY } from "../constants/index.js";

/**
 * Generate access + refresh token pair.
 *
 * Payload stored in both tokens:
 *  - userId        : number
 *  - userType      : "master" | schema_name (e.g. "org_acme_com")
 *  - tenantSchema  : null | schema_name
 *  - role          : role name string
 */
export const generateTokens = (payload, rememberMe = false) => {
  const accessToken = jwt.sign(payload, envConfig.ACCESS_TOKEN_SECRET, {
    expiresIn: TOKEN_EXPIRY.ACCESS,
  });

  const refreshExpiry = rememberMe
    ? TOKEN_EXPIRY.REMEMBER_ME
    : TOKEN_EXPIRY.REFRESH;

  const refreshToken = jwt.sign(payload, envConfig.REFRESH_TOKEN_SECRET, {
    expiresIn: refreshExpiry,
  });

  const refreshExpiresAt = rememberMe
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return { accessToken, refreshToken, refreshExpiresAt };
};

/**
 * Verify access token. Throws if invalid/expired.
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, envConfig.ACCESS_TOKEN_SECRET);
};

/**
 * Verify refresh token. Throws if invalid/expired.
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, envConfig.REFRESH_TOKEN_SECRET);
};
