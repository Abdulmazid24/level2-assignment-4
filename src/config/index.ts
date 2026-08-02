import { configDotenv } from "dotenv";
import { env } from "process";


configDotenv()

const config = {
NODE_ENV: env.NODE_ENV || "development",
PORT: env.PORT || 3000,
DATABASE_URL: env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres",
}

export default config;