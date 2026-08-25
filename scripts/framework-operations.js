import fs from "node:fs/promises";
import path from "node:path";

import { frameworkRoot, packageRoot } from "./paths.js";
import {
  copyDirectory,
  deepMerge,
  ensureGitignoreEntries,
  exists,
  readJson,
  relativePortable,
  upsertMarkedBlock,
  writeJson,
} from "./file-utils.js";

export const FRAMEWORK_START = "<!-- claude-sdlc:framework:start -->";

export const FRAMEWORK_END = "<!-- claude-sdlc:framework:end -->";

export const PROJECT_START = "<!-- claude-sdlc:project:start -->";

export const PROJECT_END = "<!-- claude-sdlc:project:end -->";

export async function getFrameworkVersion() {
  const packageJson = await readJson(path.join(packageRoot, "package.json"));

  return packageJson.version;
}

export async function copyManagedFramework({ targetRoot, overwrite, dryRun }) {
  const claudeRoot = path.join(targetRoot, ".claude");

  const mappings = [
    {
      source: path.join(frameworkRoot, "agents"),
      destination: path.join(claudeRoot, "agents"),
    },
    {
      source: path.join(frameworkRoot, "skills"),
      destination: path.join(claudeRoot, "skills"),
    },
    {
      source: path.join(frameworkRoot, "rules"),
      destination: path.join(claudeRoot, "rules"),
    },
  ];

  const managedFiles = [];

  for (const mapping of mappings) {
    const installedFiles = await copyDirectory({
      ...mapping,
      overwrite,
      dryRun,
    });

    managedFiles.push(
      ...installedFiles.map((file) => relativePortable(targetRoot, file)),
    );
  }

  return managedFiles.sort();
}

export async function ensureProjectOwnedDirectories({ targetRoot, dryRun }) {
  const directories = [
    path.join(targetRoot, ".claude", "project-knowledge"),
    path.join(targetRoot, ".claude", "delivery"),
  ];

  for (const directory of directories) {
    console.log(`${dryRun ? "[dry-run] " : ""}Create ${directory}`);

    if (!dryRun) {
      await fs.mkdir(directory, {
        recursive: true,
      });

      const keepFile = path.join(directory, ".gitkeep");

      if (!(await exists(keepFile))) {
        await fs.writeFile(keepFile, "", "utf8");
      }
    }
  }
}

export async function mergeFrameworkSettings({ targetRoot, dryRun }) {
  const settingsPath = path.join(targetRoot, ".claude", "settings.json");

  const template = await readJson(
    path.join(frameworkRoot, "templates", "settings.json"),
  );

  const existing = await readJson(settingsPath, {});
  const merged = deepMerge(existing, template);

  await writeJson(settingsPath, merged, dryRun);
}

export async function updateFrameworkClaudeBlock({ targetRoot, dryRun }) {
  const block = await fs.readFile(
    path.join(frameworkRoot, "templates", "CLAUDE.framework.md"),
    "utf8",
  );

  await upsertMarkedBlock({
    filePath: path.join(targetRoot, "CLAUDE.md"),
    block,
    startMarker: FRAMEWORK_START,
    endMarker: FRAMEWORK_END,
    dryRun,
  });
}

export async function ensureProjectClaudeBlock({ targetRoot, dryRun }) {
  const block = await fs.readFile(
    path.join(frameworkRoot, "templates", "CLAUDE.project.md"),
    "utf8",
  );

  await upsertMarkedBlock({
    filePath: path.join(targetRoot, "CLAUDE.md"),
    block,
    startMarker: PROJECT_START,
    endMarker: PROJECT_END,
    dryRun,
  });
}

export async function updateFrameworkGitignore({ targetRoot, dryRun }) {
  await ensureGitignoreEntries({
    filePath: path.join(targetRoot, ".gitignore"),
    entries: [".claude/backups/"],
    dryRun,
  });
}

export function createManifest({
  version,
  managedFiles,
  previousManifest = undefined,
}) {
  const now = new Date().toISOString();

  return {
    framework: "claude-sdlc",
    version,
    installedAt: previousManifest?.installedAt ?? now,
    updatedAt: now,
    previousVersion: previousManifest?.version ?? null,
    managedFiles,
    sharedFiles: ["CLAUDE.md", ".claude/settings.json", ".gitignore"],
    projectOwnedPaths: [
      ".claude/project-knowledge",
      ".claude/delivery",
      ".claude/skills/stack-*",
    ],
  };
}
