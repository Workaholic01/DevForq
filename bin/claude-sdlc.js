#!/usr/bin/env node

import { parseArgs } from "node:util";

import { doctor } from "../scripts/doctor.js";
import { install } from "../scripts/install.js";
import { update } from "../scripts/update.js";
import { validateProject } from "../scripts/validate-project.js";

function printHelp() {
  console.log(`
Claude SDLC Framework

Usage:
  claude-sdlc init [options]
  claude-sdlc update [options]
  claude-sdlc validate [options]
  claude-sdlc doctor [options]

Commands:
  init       Perform a one-time framework installation
  update     Upgrade framework-managed files safely
  validate   Verify the installed framework structure
  doctor     Diagnose framework and project-knowledge health

Options:
  --target, -t <path>   Target repository; defaults to current directory
  --dry-run             Show changes without writing files
  --force               Replace conflicting framework files during init
  --help, -h            Show this help
`);
}

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      target: {
        type: "string",
        short: "t",
      },
      force: {
        type: "boolean",
        default: false,
      },
      "dry-run": {
        type: "boolean",
        default: false,
      },
      help: {
        type: "boolean",
        short: "h",
        default: false,
      },
    },
  });

  if (values.help) {
    printHelp();
    return;
  }

  const command = positionals[0] ?? "help";

  const options = {
    target: values.target ?? process.cwd(),
    force: values.force,
    dryRun: values["dry-run"],
  };

  switch (command) {
    case "init":
    case "install":
      await install(options);
      break;

    case "update":
      await update(options);
      break;

    case "validate": {
      const result = await validateProject(options.target);

      if (!result.valid) {
        process.exitCode = 1;
      }

      break;
    }

    case "doctor": {
      const result = await doctor(options.target);

      if (!result.healthy) {
        process.exitCode = 1;
      }

      break;
    }

    case "help":
      printHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`\nClaude SDLC failed: ${error.message}`);
  process.exitCode = 1;
});
