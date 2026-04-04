const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
};

const RESPONSE_MESSAGES = {
  SUCCESS: "Success!",
  ERROR: "Something went wrong!",
  BAD_REQUEST: "Bad Request!",
  UNAUTHORIZED: "Unauthorized!",
  FORBIDDEN: "Forbidden!",
  NOT_FOUND: "Not Found!",
  SERVER_ERROR: "Internal Server Error!",

  SUCCESS_MESSAGES: {
    HEALTH_CHECK: "Server is running",
    LOGIN: "Login successful",
    LOGOUT: "Logout successful",
    TOKEN_REFRESH: "Token refreshed successfully",
    PASSWORD_RESET: "Password reset successfully",
    RESET_LINK_SENT: "Reset link sent successfully",
    PROFILE_UPDATED: "Profile updated successfully",
    PASSWORD_CHANGED: "Password changed successfully",

    MASTER: {
      ROLE: {
        GET_ALL: "Roles retrieved successfully",
        CREATE: "Role created successfully",
        UPDATE: "Role updated successfully",
        DELETE: "Role deleted successfully",
      },
      USER: {
        CREATE: "User created successfully",
        UPDATE: "User updated successfully",
        DELETE: "User deleted successfully",
        ACTIVATE: "User activated successfully",
        DEACTIVATE: "User deactivated successfully",
      },
      PLAN: {
        GET_ALL: "Plans retrieved successfully",
        CREATE: "Plan created successfully",
        UPDATE: "Plan updated successfully",
        DELETE: "Plan deleted successfully",
      },
      FEATURE: {
        GET_ALL: "Features retrieved successfully",
        CREATE: "Feature created successfully",
        UPDATE: "Feature updated successfully",
        DELETE: "Feature deleted successfully",
      },
      PLAN_FEATURE: {
        GET_ALL: "Plan features retrieved successfully",
        CREATE: "Plan feature created successfully",
        UPDATE: "Plan feature updated successfully",
        DELETE: "Plan feature deleted successfully",
      },
      PLAN_LIMIT: {
        GET_ALL: "Plan limits retrieved successfully",
        CREATE: "Plan limit created successfully",
        UPDATE: "Plan limit updated successfully",
        DELETE: "Plan limit deleted successfully",
      },
      ACCOUNT: {
        GET_PROFILE: "Profile retrieved successfully",
        UPDATE_PROFILE: "Profile updated successfully",
        CHANGE_PASSWORD: "Password changed successfully",
      },
      ORGANIZATION: {
        GET_ALL: "Organizations retrieved successfully",
        CREATE: "Organization created successfully",
        UPDATE: "Organization updated successfully",
        DELETE: "Organization deleted successfully",
        ACTIVATE: "Organization activated successfully",
        DEACTIVATE: "Organization deactivated successfully",
        ASSIGN_PLAN: "Plan assigned to organization successfully",
      },
    },
  },

  ERROR_MESSAGES: {
    USER_NOT_FOUND: "User not found",
    INVALID_CREDENTIALS: "Invalid email or password",
    TOKEN_INVALID: "Invalid or expired token",
    TOKEN_EXPIRED: "Token expired",
    USER_INACTIVE: "User is inactive",
  },
};

export { STATUS_CODES, RESPONSE_MESSAGES };
