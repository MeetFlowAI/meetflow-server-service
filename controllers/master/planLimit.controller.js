import * as PlanLimitService from "../../services/master/planLimit.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

// ─── Plan Limits Management ───────────────────────────────────────────────────

export const getLimitsByPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const result = await PlanLimitService.getLimitsByPlan(planId, req.query);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Plan limits retrieved successfully",
      result,
    );
  } catch (err) {
    const statusCode = err.statusCode || STATUS_CODES.BAD_REQUEST;
    return errorResponse(
      res,
      statusCode,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

export const addLimit = async (req, res) => {
  try {
    const { planId } = req.params;
    const result = await PlanLimitService.addLimit(planId, req.body);
    return successResponse(
      res,
      STATUS_CODES.CREATED,
      RESPONSE_MESSAGES.SUCCESS,
      "Limit added to plan successfully",
      result,
    );
  } catch (err) {
    const statusCode = err.statusCode || STATUS_CODES.BAD_REQUEST;
    return errorResponse(
      res,
      statusCode,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

export const updateLimit = async (req, res) => {
  try {
    const { planId, limitId } = req.params;
    const result = await PlanLimitService.updateLimit(
      planId,
      limitId,
      req.body,
    );
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Limit updated successfully",
      result,
    );
  } catch (err) {
    const statusCode = err.statusCode || STATUS_CODES.BAD_REQUEST;
    return errorResponse(
      res,
      statusCode,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

export const deleteLimit = async (req, res) => {
  try {
    const { planId, limitId } = req.params;
    await PlanLimitService.deleteLimit(planId, limitId);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Limit deleted successfully",
    );
  } catch (err) {
    const statusCode = err.statusCode || STATUS_CODES.BAD_REQUEST;
    return errorResponse(
      res,
      statusCode,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

// ─── Bulk Controllers ─────────────────────────────────────────────────────────

export const bulkAddLimits = async (req, res) => {
  try {
    const { planId } = req.params;
    const result = await PlanLimitService.bulkAddLimits(planId, req.body.items);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk add limits completed",
      result,
    );
  } catch (err) {
    const statusCode = err.statusCode || STATUS_CODES.BAD_REQUEST;
    return errorResponse(
      res,
      statusCode,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

export const bulkDeleteLimits = async (req, res) => {
  try {
    const { planId } = req.params;
    const result = await PlanLimitService.bulkDeleteLimits(
      planId,
      req.body.ids,
    );
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk delete limits completed",
      result,
    );
  } catch (err) {
    const statusCode = err.statusCode || STATUS_CODES.BAD_REQUEST;
    return errorResponse(
      res,
      statusCode,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};
