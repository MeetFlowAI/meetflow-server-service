import * as PlanService from "../../services/master/plan.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

// ─── Plan CRUD ────────────────────────────────────────────────────────────────

export const getAllPlans = async (req, res) => {
  try {
    const result = await PlanService.getAllPlans(req.query);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Plans retrieved successfully",
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

export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PlanService.getPlanById(id);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Plan retrieved successfully",
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

export const createPlan = async (req, res) => {
  try {
    const result = await PlanService.createPlan(req.body);
    return successResponse(
      res,
      STATUS_CODES.CREATED,
      RESPONSE_MESSAGES.SUCCESS,
      "Plan created successfully",
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

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PlanService.updatePlan(id, req.body);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Plan updated successfully",
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

export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    await PlanService.deletePlan(id);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Plan deleted successfully",
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

export const bulkCreatePlans = async (req, res) => {
  try {
    const result = await PlanService.bulkCreatePlans(req.body.items);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk create plans completed",
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

export const bulkUpdatePlans = async (req, res) => {
  try {
    const result = await PlanService.bulkUpdatePlans(req.body.items);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk update plans completed",
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

export const bulkDeletePlans = async (req, res) => {
  try {
    const result = await PlanService.bulkDeletePlans(req.body.ids);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk delete plans completed",
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
