import { verifyAccessToken } from "../utils/token.util.js";
import { errorResponse } from "../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../constants/response.js";

/**
 * Protect any route — verifies JWT access token and attaches decoded context to req.
 *
 * req.user after this middleware:
 * {
 *   userId      : number,
 *   userType    : "master" | schema_name,
 *   tenantSchema: null | schema_name,
 *   role        : string,
 * }
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(
        res,
        STATUS_CODES.UNAUTHORIZED,
        RESPONSE_MESSAGES.UNAUTHORIZED,
        "Access token is required.",
        null,
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      userType: decoded.userType,
      tenantSchema: decoded.tenantSchema,
      role: decoded.role,
    };

    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Access token has expired."
        : "Invalid access token.";

    return errorResponse(
      res,
      STATUS_CODES.UNAUTHORIZED,
      RESPONSE_MESSAGES.UNAUTHORIZED,
      message,
      null,
    );
  }
};

/**
 * Role guard — use after authenticate().
 * Usage: authorize(["role_a", "role_b"])
 */
export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        STATUS_CODES.UNAUTHORIZED,
        RESPONSE_MESSAGES.UNAUTHORIZED,
        "Not authenticated.",
        null,
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        STATUS_CODES.FORBIDDEN,
        RESPONSE_MESSAGES.FORBIDDEN,
        "You do not have permission to perform this action.",
        null,
      );
    }

    next();
  };
};

/**
 * Org-only guard — rejects master users trying to access org routes.
 * Use after authenticate().
 */
export const requireOrgContext = (req, res, next) => {
  if (!req.user?.tenantSchema) {
    return errorResponse(
      res,
      STATUS_CODES.FORBIDDEN,
      RESPONSE_MESSAGES.FORBIDDEN,
      "This route is only accessible to organisation users.",
      null,
    );
  }
  next();
};

/**
 * Master-only guard — rejects org users trying to access master routes.
 * Use after authenticate().
 */
export const requireMasterContext = (req, res, next) => {
  if (req.user?.userType !== "master") {
    return errorResponse(
      res,
      STATUS_CODES.FORBIDDEN,
      RESPONSE_MESSAGES.FORBIDDEN,
      "This route is only accessible to master users.",
      null,
    );
  }
  next();
};
