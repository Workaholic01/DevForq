import fs from "node:fs/promises";
import path from "node:path";

import {
  copyManagedFramework,
  createManifest,
  ensureProjectClaudeBlock,
  ensureProjectOwnedDirectories,
  getFrameworkVersion,
  mergeFrameworkSettings,
  updateFrameworkClaudeBlock,
  updateFrameworkGitignore,
} from "./framework-operations.js";

import { exists, writeJson } from "./file-utils.js";

export async function install({ target, force = false, dryRun = false }) {
  const targetRoot = path.resolve(target);
  const manifestPath = path.join(targetRoot, ".claude", "framework.json");

  await assertTargetDirectory(targetRoot);

  if (await exists(manifestPath)) {
    throw new Error(
      "Claude SDLC is already installed. " +
        "Use `claude-sdlc update` instead.",
    );
  }

  console.log(`Installing Claude SDLC into ${targetRoot}`);

  if (force) {
    console.warn(
      "\nForce mode will replace conflicting framework-owned files.",
    );
  }

  const managedFiles = await copyManagedFramework({
    targetRoot,
    overwrite: force,
    dryRun,
  });

  await ensureProjectOwnedDirectories({
    targetRoot,
    dryRun,
  });

  await mergeFrameworkSettings({
    targetRoot,
    dryRun,
  });

  await updateFrameworkClaudeBlock({
    targetRoot,
    dryRun,
  });

  await ensureProjectClaudeBlock({
    targetRoot,
    dryRun,
  });

  await updateFrameworkGitignore({
    targetRoot,
    dryRun,
  });

  const manifest = createManifest({
    version: await getFrameworkVersion(),
    managedFiles,
  });

  await writeJson(manifestPath, manifest, dryRun);

  console.log(`
Installation complete.

Next:

  cd ${targetRoot}
  claude

Then run:

  /project-onboarding
`);
}

async function assertTargetDirectory(targetRoot) {
  let stat;

  try {
    stat = await fs.stat(targetRoot);
  } catch {
    throw new Error(`Target directory does not exist: ${targetRoot}`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`Target is not a directory: ${targetRoot}`);
  }

  const indicators = [
    ".git",
    "package.json",
    "pyproject.toml",
    "requirements.txt",
    "pom.xml",
    "build.gradle",
    "go.mod",
    "Cargo.toml",
  ];

  const checks = await Promise.all(
    indicators.map((indicator) => exists(path.join(targetRoot, indicator))),
  );

  if (!checks.some(Boolean)) {
    console.warn(
      "Warning: target does not look like a conventional repository.",
    );
  }
}
