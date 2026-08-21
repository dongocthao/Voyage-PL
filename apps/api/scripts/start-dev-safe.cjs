const { spawn } = require("node:child_process");
const path = require("node:path");

const appRoot = path.resolve(__dirname, "..");
const env = {
  ...process.env,
  HOST: process.env.HOST || "0.0.0.0",
  PORT: process.env.PORT || "3001",
  WEB_ORIGIN:
    process.env.WEB_ORIGIN ||
    [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "http://localhost:5194",
      "http://127.0.0.1:5194",
    ].join(","),
};

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: appRoot,
      env,
      stdio: "inherit",
      shell: true,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });
  });
}

async function main() {
  await run("pnpm", ["build"]);
  await run("node", [".\\dist\\main.js"]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
