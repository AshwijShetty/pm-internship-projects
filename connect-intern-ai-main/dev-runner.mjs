import { spawn } from "node:child_process";
import { setInterval } from "node:timers";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = __dirname; // repo root

// Helper to log with prefixes
function log(prefix, msg) {
  const time = new Date().toISOString();
  console.log(`[${time}] [${prefix}] ${msg}`);
}

function runPipeline() {
  log("PIPELINE", "Starting Python pipeline: scripts/pipeline.py");
  const py = spawn("python", [path.join("scripts", "pipeline.py")], {
    cwd: projectRoot,
    env: { 
      ...process.env,
      PYTHONIOENCODING: "utf-8",
      PYTHONUTF8: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  py.stdout.on("data", (d) => process.stdout.write(`[PIPELINE] ${d}`));
  py.stderr.on("data", (d) => process.stderr.write(`[PIPELINE:ERR] ${d}`));

  py.on("exit", (code) => {
    if (code === 0) {
      log("PIPELINE", "Completed successfully.");
    } else {
      log(
        "PIPELINE",
        `Exited with code ${code}. If this is the first run, ensure Python deps are installed (requests, beautifulsoup4, numpy, scikit-learn, spacy, and spacy model en_core_web_sm).`
      );
    }
  });
}

function startVite() {
  log("VITE", "Starting dev server...");
  // Spawn via shell to support Windows .cmd launch reliably
  const vite = spawn("vite", [], {
    cwd: projectRoot,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    shell: true,
  });

  vite.stdout.on("data", (d) => process.stdout.write(`[VITE] ${d}`));
  vite.stderr.on("data", (d) => process.stderr.write(`[VITE:ERR] ${d}`));

  vite.on("exit", (code) => {
    log("VITE", `Dev server exited with code ${code}`);
    process.exit(code ?? 1);
  });

  return vite;
}

// Start vite
const viteProc = startVite();

// Kick off pipeline once on startup
runPipeline();

// Schedule every 30 minutes
const THIRTY_MIN_MS = 30 * 60 * 1000;
const interval = setInterval(runPipeline, THIRTY_MIN_MS);
log("SCHEDULER", "Pipeline scheduled to run every 30 minutes.");

// Graceful shutdown
function shutdown() {
  log("DEV-RUNNER", "Shutting down...");
  clearInterval(interval);
  try {
    viteProc && viteProc.kill();
  } catch {}
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
