import { envConfig } from "./env.config.js";

// Support both DATABASE_URL (Neon/hosted) and individual vars (local dev)
const parseDatabaseUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return {
      HOST: parsed.hostname,
      USER: parsed.username,
      PASSWORD: parsed.password,
      DB: parsed.pathname.replace("/", ""),
      PORT: parsed.port || 5432,
    };
  } catch {
    return null;
  }
};

const urlCredentials = parseDatabaseUrl(process.env.DATABASE_URL);

export const dbConfig = {
  HOST: urlCredentials?.HOST || envConfig.DATABASE_CREDENTIALS.HOST,
  USER: urlCredentials?.USER || envConfig.DATABASE_CREDENTIALS.USER,
  PASSWORD: urlCredentials?.PASSWORD || envConfig.DATABASE_CREDENTIALS.PASSWORD,
  DB: urlCredentials?.DB || envConfig.DATABASE_CREDENTIALS.DB,
  PORT: urlCredentials?.PORT || envConfig.DATABASE_CREDENTIALS.PORT,
  DIALECT: "postgres",
  // Neon requires SSL — only applied when DATABASE_URL is set
  ...(process.env.DATABASE_URL && {
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  }),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  HOST_FIRST_NAME: envConfig.HOST_CREDENTIALS.FIRST_NAME,
  HOST_LAST_NAME: envConfig.HOST_CREDENTIALS.LAST_NAME,
  HOST_EMAIL: envConfig.HOST_CREDENTIALS.EMAIL,
  HOST_ROLE: envConfig.HOST_CREDENTIALS.ROLE,
  HOST_PASSWORD: envConfig.HOST_CREDENTIALS.PASSWORD,
};
