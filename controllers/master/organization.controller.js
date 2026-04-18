import * as OrganizationService from "../../services/master/organization.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

// ─── Organization CRUD ────────────────────────────────────────────────────────

export const getAllOrganizations = async (req, res) => {
  try {
    const result = await OrganizationService.getAllOrganizations(req.query);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Organizations retrieved successfully",
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

export const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await OrganizationService.getOrganizationById(id);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Organization retrieved successfully",
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

export const createOrganization = async (req, res) => {
  try {
    console.log("in controller");
    const result = await OrganizationService.createOrganization(req.body);
    return successResponse(
      res,
      STATUS_CODES.CREATED,
      RESPONSE_MESSAGES.SUCCESS,
      "Organization created successfully",
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

export const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await OrganizationService.updateOrganization(id, req.body);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Organization updated successfully",
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

export const activateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await OrganizationService.activateOrganization(id);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Organization activated successfully",
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

export const deactivateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await OrganizationService.deactivateOrganization(id);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Organization deactivated successfully",
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

export const assignPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await OrganizationService.assignPlan(id, req.body);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Plan assigned to organization successfully",
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

export const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    await OrganizationService.deleteOrganization(id);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Organization deleted successfully",
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

export const bulkCreateOrganizations = async (req, res) => {
  try {
    const result = await OrganizationService.bulkCreateOrganizations(
      req.body.items,
    );
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk create organizations completed",
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

export const bulkUpdateOrganizations = async (req, res) => {
  try {
    const result = await OrganizationService.bulkUpdateOrganizations(
      req.body.items,
    );
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk update organizations completed",
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

export const bulkDeleteOrganizations = async (req, res) => {
  try {
    const result = await OrganizationService.bulkDeleteOrganizations(
      req.body.ids,
    );
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk delete organizations completed",
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

export const bulkActivateOrganizations = async (req, res) => {
  try {
    const result = await OrganizationService.bulkActivateOrganizations(
      req.body.ids,
    );
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk activate organizations completed",
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

export const bulkDeactivateOrganizations = async (req, res) => {
  try {
    const result = await OrganizationService.bulkDeactivateOrganizations(
      req.body.ids,
    );
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk deactivate organizations completed",
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

export const bulkAssignPlans = async (req, res) => {
  try {
    const result = await OrganizationService.bulkAssignPlans(req.body.items);
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Bulk assign plans completed",
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
