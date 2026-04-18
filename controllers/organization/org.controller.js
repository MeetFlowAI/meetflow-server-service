import * as OrgService from "../../services/organization/org.service.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../../constants/response.js";

// ─── Org Overview Controller ──────────────────────────────────────────────────

export const getOrgProfile = async (req, res) => {
  try {
    const data = await OrgService.getOrgProfile({
      tenantSchema: req.user.tenantSchema,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Organization retrieved successfully",
      data,
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};

export const updateOrgSettings = async (req, res) => {
  try {
    const data = await OrgService.updateOrgSettings({
      tenantSchema: req.user.tenantSchema,
      data: req.body,
    });
    return successResponse(
      res,
      STATUS_CODES.OK,
      RESPONSE_MESSAGES.SUCCESS,
      "Organization settings updated successfully",
      data,
    );
  } catch (err) {
    return errorResponse(
      res,
      err.statusCode || STATUS_CODES.BAD_REQUEST,
      RESPONSE_MESSAGES.ERROR,
      err.message,
      err,
    );
  }
};
