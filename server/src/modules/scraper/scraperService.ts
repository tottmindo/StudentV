import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

function getPythonExecutable(): string {
  if (process.env.PYTHON_EXECUTABLE) {
    return process.env.PYTHON_EXECUTABLE;
  }

  // Check for common local venv paths relative to process.cwd()
  const venvNames = ["venv", ".venv", "env"];
  for (const name of venvNames) {
    const venvPath = process.platform === "win32"
      ? path.join(process.cwd(), name, "Scripts", "python.exe")
      : path.join(process.cwd(), name, "bin", "python");

    if (fs.existsSync(venvPath)) {
      return venvPath;
    }
  }

  return process.platform === "win32" ? "python" : "python3";
}

export function importExternalEvents(): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), "src", "integrations", "event-scrapers", "main.py");
    const pythonExec = getPythonExecutable();

    const python = spawn(pythonExec, [scriptPath], {
      cwd: path.dirname(scriptPath),
      stdio: ["ignore", "pipe", "pipe"],
    });

    python.stdout.on("data", data => {
      process.stdout.write(`[Python] ${data}`);
    });

    python.stderr.on("data", data => {
      process.stderr.write(`[Python] ${data}`);
    });

    python.on("error", reject);

    python.on("close", code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Python script exited with code ${code}`));
      }
    });
  });
}