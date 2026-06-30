import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = join(currentDir, "..", "..", "..", ".env");

dotenv.config({ path: rootEnvPath });
