import fs from "node:fs/promises";
import path from "node:path";

import {
  copyManagedFramework,
  createManifest,
  getFrameworkVersion,
  mergeFrameworkSettings,
  updateFrameworkClaudeBlock,
  updateFrameworkGitignore,
} from "./framework-operations.js";

import {
  assertPathInside,
  copyPath,
  exists,
  readJson,
  writeJson,
} from "./file-utils.js";

export async function update({ target, dryRun = false }) {
  const targetRoot = path.resolve(target);
  const manifestPath = path.join(targetRoot, ".claude", "framework.json");

  if (!(await exists(manifestPath))) {
    throw new Error(
      "Claude SDLC is not installed. " + "Run `claude-sdlc init` first.",
    );
  }

  const previousManifest = await readJson(manifestPath);

  if (previousManifest.framework !== "claude-sdlc") {
    throw new Error("The existing framework manifest is not recognised.");
  }

  const currentVersion = await getFrameworkVersion();

  console.log(`
Updating Claude SDLC

Installed version: ${previousManifest.version}
CLI version:       ${currentVersion}
`);

  const backupRoot = await backupExistingInstallation({
    targetRoot,
    manifest: previousManifest,
    dryRun,
  });

  const managedFiles = await copyManagedFramework({
    targetRoot,
    overwrite: true,
    dryRun,
  });

  await removeStaleManagedFiles({
    targetRoot,
    previousFiles: previousManifest.managedFiles ?? [],
    currentFiles: managedFiles,
    dryRun,
  });

  await mergeFrameworkSettings({
    targetRoot,
    dryRun,
  });

  // Update only the framework block.
  // The project block created by onboarding remains unchanged.
  await updateFrameworkClaudeBlock({
    targetRoot,
    dryRun,
  });

  await updateFrameworkGitignore({
    targetRoot,
    dryRun,
  });

  const manifest = createManifest({
    version: currentVersion,
    managedFiles,
    previousManifest,
  });

  await writeJson(manifestPath, manifest, dryRun);

  console.log(`
Framework update complete.

Backup:
  ${backupRoot}

Preserved:
  .claude/project-knowledge/
  .claude/delivery/
  .claude/skills/stack-*/
  CLAUDE.md project block
`);
}

async function backupExistingInstallation({ targetRoot, manifest, dryRun }) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  const backupRoot = path.join(targetRoot, ".claude", "backups", timestamp);

  const paths = [
    ...(manifest.managedFiles ?? []),
    ...(manifest.sharedFiles ?? []),
  ];

  for (const relativePath of new Set(paths)) {
    const source = path.join(targetRoot, relativePath);
    const destination = path.join(backupRoot, relativePath);

    assertPathInside(targetRoot, source);

    await copyPath({
      source,
      destination,
      dryRun,
    });
  }

  return backupRoot;
}

async function removeStaleManagedFiles({
  targetRoot,
  previousFiles,
  currentFiles,
  dryRun,
}) {
  const currentSet = new Set(currentFiles);

  for (const relativePath of previousFiles) {
    if (currentSet.has(relativePath)) {
      continue;
    }

    const stalePath = path.join(targetRoot, relativePath);

    assertPathInside(targetRoot, stalePath);

    if (!(await exists(stalePath))) {
      continue;
    }

    console.log(
      `${dryRun ? "[dry-run] " : ""}` +
        `Remove obsolete framework file ${stalePath}`,
    );

    if (!dryRun) {
      await fs.rm(stalePath, {
        force: true,
        recursive: true,
      });
    }
  }
}
