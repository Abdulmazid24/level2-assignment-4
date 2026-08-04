import { configDotenv } from "dotenv";
import { env } from "process";

configDotenv();

function requireEnv(name: string): string {
    const value = env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const config = {
    NODE_ENV: env.NODE_ENV || "development",
    PORT: env.PORT || 3000,
    DATABASE_URL: requireEnv("DATABASE_URL"),

    JWT_ACCESS_SECRET: requireEnv("JWT_ACCESS_SECRET"),
    JWT_REFRESH_SECRET: requireEnv("JWT_REFRESH_SECRET"),

    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY || "",
    STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET || "",

    CLIENT_URL: env.CLIENT_URL ?? "http://localhost:3000",
};

export default config;
