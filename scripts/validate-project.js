import fs from "node:fs/promises";
import path from "node:path";

import {
  FRAMEWORK_END,
  FRAMEWORK_START,
  PROJECT_END,
  PROJECT_START,
  getFrameworkVersion,
} from "./framework-operations.js";

import { exists, readJson } from "./file-utils.js";

const REQUIRED_PATHS = [
  ".claude/framework.json",
  ".claude/settings.json",
  ".claude/agents/requirements-analyst.md",
  ".claude/agents/solution-architect.md",
  ".claude/agents/software-developer.md",
  ".claude/agents/qa-engineer.md",
  ".claude/skills/project-onboarding/SKILL.md",
  ".claude/skills/deliver-requirement/SKILL.md",
  ".claude/skills/refresh-project-knowledge/SKILL.md",
  ".claude/rules/architecture.md",
  ".claude/rules/development.md",
  ".claude/rules/testing.md",
  ".claude/rules/security.md",
  ".claude/project-knowledge",
  ".claude/delivery",
  "CLAUDE.md",
];

export async function validateProject(
  target = process.cwd(),
  { print = true } = {},
) {
  const targetRoot = path.resolve(target);
  const errors = [];
  const warnings = [];

  for (const relativePath of REQUIRED_PATHS) {
    if (!(await exists(path.join(targetRoot, relativePath)))) {
      errors.push(`Missing required path: ${relativePath}`);
    }
  }

  let manifest;

  const manifestPath = path.join(targetRoot, ".claude", "framework.json");

  if (await exists(manifestPath)) {
    try {
      manifest = await readJson(manifestPath);

      if (manifest.framework !== "claude-sdlc") {
        errors.push("Unexpected framework identifier in framework.json");
      }

      if (!manifest.version) {
        errors.push("framework.json does not contain a version");
      }

      for (const managedFile of manifest.managedFiles ?? []) {
        if (!(await exists(path.join(targetRoot, managedFile)))) {
          errors.push(`Missing framework-managed file: ${managedFile}`);
        }
      }

      const cliVersion = await getFrameworkVersion();

      if (manifest.version !== cliVersion) {
        warnings.push(
          `Installed version ${manifest.version} differs from ` +
            `CLI version ${cliVersion}. Run \`claude-sdlc update\`.`,
        );
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  const settingsPath = path.join(targetRoot, ".claude", "settings.json");

  if (await exists(settingsPath)) {
    try {
      await readJson(settingsPath);
    } catch (error) {
      errors.push(error.message);
    }
  }

  const claudePath = path.join(targetRoot, "CLAUDE.md");

  if (await exists(claudePath)) {
    const content = await fs.readFile(claudePath, "utf8");

    validateMarkerPair({
      content,
      start: FRAMEWORK_START,
      end: FRAMEWORK_END,
      name: "framework",
      errors,
    });

    validateMarkerPair({
      content,
      start: PROJECT_START,
      end: PROJECT_END,
      name: "project",
      errors,
    });
  }

  const result = {
    valid: errors.length === 0,
    errors,
    warnings,
    manifest,
  };

  if (print) {
    printValidationResult(result);
  }

  return result;
}

function validateMarkerPair({ content, start, end, name, errors }) {
  const hasStart = content.includes(start);
  const hasEnd = content.includes(end);

  if (!hasStart || !hasEnd) {
    errors.push(`CLAUDE.md has an incomplete or missing ${name} block`);
  }
}

function printValidationResult({ valid, errors, warnings }) {
  if (valid) {
    console.log("\nClaude SDLC validation passed.");
  } else {
    console.error("\nClaude SDLC validation failed.");
  }

  for (const error of errors) {
    console.error(`  ✗ ${error}`);
  }

  for (const warning of warnings) {
    console.warn(`  ! ${warning}`);
  }
}
