import { RESPONSE_MESSAGES, STATUS_CODES } from "../constants/response.js";

const successResponse = (
  res,
  response_code = STATUS_CODES.OK,
  response_message = RESPONSE_MESSAGES.SUCCESS,
  message = "Success",
  data = null,
  pagination = null,
) => {
  const response = {
    status: {
      response_code,
      response_message,
    },
    message,
    data,
  };

  // include pagination only if provided
  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(response_code).json(response);
};

const errorResponse = (
  res,
  response_code = STATUS_CODES.BAD_REQUEST,
  response_message = RESPONSE_MESSAGES.BAD_REQUEST,
  message = "Something went wrong",
  error = null,
) => {
  const response = {
    status: {
      response_code,
      response_message,
    },
    message,
  };

  if (error) {
    response.error = {
      details: error.message || error,
    };
  }

  return res.status(response_code).json(response);
};

export { successResponse, errorResponse };
