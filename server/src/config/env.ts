import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = join(currentDir, "..", "..", "..", ".env");

// Resolve from this module rather than process.cwd(): production starts the
// compiled server from `server/`, while workspace scripts usually start at the
// repository root. Both must load the same non-Vite configuration.
dotenv.config({ path: rootEnvPath });
