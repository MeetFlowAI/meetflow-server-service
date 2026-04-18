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

    ORG: {
      GET_MY_ORG: "Organization retrieved successfully",
      UPDATE_SETTINGS: "Organization settings updated successfully",

      USER: {
        GET_ALL: "Users retrieved successfully",
        GET_ONE: "User retrieved successfully",
        ROLE_UPDATE: "User role updated successfully",
        DEACTIVATE: "User deactivated successfully",
        ACTIVATE: "User activated successfully",
        REMOVE: "User removed successfully",
      },

      INVITATION: {
        GET_ALL: "Invitations retrieved successfully",
        SEND: "Invitation sent successfully",
        RESEND: "Invitation resent successfully",
        CANCEL: "Invitation cancelled successfully",
        ACCEPT: "Invitation accepted. Account created successfully.",
      },

      ROLE: {
        GET_ALL: "Roles retrieved successfully",
        GET_ONE: "Role retrieved successfully",
        CREATE: "Role created successfully",
        UPDATE: "Role updated successfully",
        DELETE: "Role deleted successfully",
      },
    },

    WORKSPACE: {
      GET_ALL: "Workspaces retrieved successfully",
      GET_ONE: "Workspace retrieved successfully",
      CREATE: "Workspace created successfully",
      UPDATE: "Workspace updated successfully",
      DELETE: "Workspace deleted successfully",
      MY_WORKSPACES: "Your workspaces retrieved successfully",

      MEMBER: {
        GET_ALL: "Members retrieved successfully",
        ADD: "Member added to workspace successfully",
        ROLE_UPDATE: "Member role updated successfully",
        REMOVE: "Member removed successfully",
      },

      CHANNEL: {
        GET_ALL: "Channels retrieved successfully",
        GET_ONE: "Channel retrieved successfully",
        CREATE: "Channel created successfully",
        UPDATE: "Channel updated successfully",
        DELETE: "Channel deleted successfully",
      },

      CHANNEL_MEMBER: {
        GET_ALL: "Channel members retrieved successfully",
        ADD: "Member added to channel successfully",
        REMOVE: "Member removed from channel successfully",
        JOIN: "Joined channel successfully",
        LEAVE: "Left channel successfully",
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
