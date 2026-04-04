import * as PlanFeatureService from "../../services/master/planFeature.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

// ─── Plan Features Management ─────────────────────────────────────────────────

export const getFeaturesByPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const result = await PlanFeatureService.getFeaturesByPlan(
      planId,
      req.query,
    );
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Plan features retrieved successfully",
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

export const assignFeature = async (req, res) => {
  try {
    const { planId } = req.params;
    const result = await PlanFeatureService.assignFeature(planId, req.body);
    return successResponse(
      res,
      STATUS_CODES.CREATED,
      RESPONSE_MESSAGES.SUCCESS,
      "Feature assigned to plan successfully",
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

export const toggleFeature = async (req, res) => {
  try {
    const { planId, featureId } = req.params;
    const result = await PlanFeatureService.toggleFeature(
      planId,
      featureId,
      req.body,
    );
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Feature toggled successfully",
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

export const removeFeature = async (req, res) => {
  try {
    const { planId, featureId } = req.params;
    await PlanFeatureService.removeFeature(planId, featureId);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Feature removed from plan successfully",
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

export const bulkAssignFeatures = async (req, res) => {
  try {
    const { planId } = req.params;
    const result = await PlanFeatureService.bulkAssignFeatures(
      planId,
      req.body.items,
    );
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk assign features completed",
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

export const bulkRemoveFeatures = async (req, res) => {
  try {
    const { planId } = req.params;
    const result = await PlanFeatureService.bulkRemoveFeatures(
      planId,
      req.body.ids,
    );
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk remove features completed",
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
