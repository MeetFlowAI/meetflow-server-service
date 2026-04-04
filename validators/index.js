/**
 * validators/index.js
 *
 * Lightweight request validator middleware factory.
 * No external library needed — keeps dependencies lean.
 *
 * Usage:
 *   import { validate } from "../validators/index.js";
 *   import { loginSchema } from "../validators/common/auth.validator.js";
 *   router.post("/login", validate(loginSchema), AuthController.login);
 *
 * Each schema is a plain object:
 *   { fieldName: { required, type, minLength, maxLength, isEmail, isEnum, min } }
 */

import { errorResponse } from "../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../constants/response.js";

export const validate = (schema) => (req, res, next) => {
  const errors = [];
  const body = req.body || {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];
    const isEmpty = value === undefined || value === null || value === "";

    if (rules.required && isEmpty) {
      errors.push(`${field} is required`);
      continue; // skip further checks for this field
    }

    if (isEmpty) continue; // optional field not provided — skip

    if (rules.type === "string" && typeof value !== "string") {
      errors.push(`${field} must be a string`);
    }

    if (rules.type === "number" && typeof value !== "number") {
      errors.push(`${field} must be a number`);
    }

    if (rules.type === "boolean" && typeof value !== "boolean") {
      errors.push(`${field} must be a boolean`);
    }

    if (rules.isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${field} must be a valid email address`);
      }
    }

    if (
      rules.minLength &&
      typeof value === "string" &&
      value.length < rules.minLength
    ) {
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    }

    if (
      rules.maxLength &&
      typeof value === "string" &&
      value.length > rules.maxLength
    ) {
      errors.push(`${field} must be at most ${rules.maxLength} characters`);
    }

    if (
      rules.min !== undefined &&
      typeof value === "number" &&
      value < rules.min
    ) {
      errors.push(`${field} must be at least ${rules.min}`);
    }

    if (rules.isEnum && !rules.isEnum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.isEnum.join(", ")}`);
    }
  }

  if (errors.length > 0) {
    return errorResponse(
      res,
      STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.BAD_REQUEST,
      errors[0], // return first error — clean UX
      { details: errors.join(" | ") },
    );
  }

  next();
};

/**
 * validateBulk(itemSchema)
 *
 * Middleware factory for bulk endpoints.
 * Expects req.body to have either:
 *   - { items: [...] }   — for create / update / assign operations
 *   - { ids:   [...] }   — for delete / activate / deactivate operations
 *
 * Options:
 *   itemSchema — same schema shape as validate(); applied to each item in `items[]`
 *   mode       — "items" (default) | "ids"
 *   maxItems   — hard cap (default 100)
 *
 * On validation failure the entire request is rejected (400) before any DB work.
 */
export const validateBulk =
  (itemSchema = null, { mode = "items", maxItems = 100 } = {}) =>
  (req, res, next) => {
    const body = req.body || {};

    if (mode === "ids") {
      // ── ids-mode ─────────────────────────────────────────────────────────────
      const { ids } = body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          RESPONSE_MESSAGES.BAD_REQUEST,
          "ids must be a non-empty array",
          { details: "Provide { ids: [1, 2, 3] }" },
        );
      }
      if (ids.length > maxItems) {
        return errorResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          RESPONSE_MESSAGES.BAD_REQUEST,
          `Batch size exceeds the maximum of ${maxItems}`,
          null,
        );
      }
      for (let i = 0; i < ids.length; i++) {
        if (
          typeof ids[i] !== "number" ||
          !Number.isInteger(ids[i]) ||
          ids[i] < 1
        ) {
          return errorResponse(
            res,
            STATUS_CODES.BAD_REQUEST,
            RESPONSE_MESSAGES.BAD_REQUEST,
            `ids[${i}] must be a positive integer`,
            null,
          );
        }
      }
      return next();
    }

    // ── items-mode ──────────────────────────────────────────────────────────────
    const { items } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        RESPONSE_MESSAGES.BAD_REQUEST,
        "items must be a non-empty array",
        { details: "Provide { items: [{...}, {...}] }" },
      );
    }
    if (items.length > maxItems) {
      return errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        RESPONSE_MESSAGES.BAD_REQUEST,
        `Batch size exceeds the maximum of ${maxItems}`,
        null,
      );
    }

    if (!itemSchema) return next(); // no per-item schema — just structural check

    const allErrors = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i] || {};
      const itemErrors = [];

      for (const [field, rules] of Object.entries(itemSchema)) {
        const value = item[field];
        const isEmpty = value === undefined || value === null || value === "";

        if (rules.required && isEmpty) {
          itemErrors.push(`${field} is required`);
          continue;
        }
        if (isEmpty) continue;

        if (rules.type === "string" && typeof value !== "string")
          itemErrors.push(`${field} must be a string`);
        if (rules.type === "number" && typeof value !== "number")
          itemErrors.push(`${field} must be a number`);
        if (rules.type === "boolean" && typeof value !== "boolean")
          itemErrors.push(`${field} must be a boolean`);
        if (rules.isEmail) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value))
            itemErrors.push(`${field} must be a valid email address`);
        }
        if (
          rules.minLength &&
          typeof value === "string" &&
          value.length < rules.minLength
        )
          itemErrors.push(
            `${field} must be at least ${rules.minLength} characters`,
          );
        if (
          rules.maxLength &&
          typeof value === "string" &&
          value.length > rules.maxLength
        )
          itemErrors.push(
            `${field} must be at most ${rules.maxLength} characters`,
          );
        if (
          rules.min !== undefined &&
          typeof value === "number" &&
          value < rules.min
        )
          itemErrors.push(`${field} must be at least ${rules.min}`);
        if (rules.isEnum && !rules.isEnum.includes(value))
          itemErrors.push(
            `${field} must be one of: ${rules.isEnum.join(", ")}`,
          );
      }

      if (itemErrors.length > 0) {
        allErrors.push({ index: i, errors: itemErrors });
      }
    }

    if (allErrors.length > 0) {
      return errorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        RESPONSE_MESSAGES.BAD_REQUEST,
        `Validation failed for ${allErrors.length} item(s)`,
        { details: allErrors },
      );
    }

    next();
  };
