import fs from "node:fs/promises";
import path from "node:path";

export async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson(filePath, fallback = undefined) {
  if (!(await exists(filePath))) {
    if (fallback !== undefined) {
      return structuredClone(fallback);
    }

    throw new Error(`JSON file does not exist: ${filePath}`);
  }

  const content = await fs.readFile(filePath, "utf8");

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
  }
}

export async function writeJson(filePath, value, dryRun = false) {
  console.log(`${dryRun ? "[dry-run] " : ""}Write ${filePath}`);

  if (dryRun) {
    return;
  }

  await fs.mkdir(path.dirname(filePath), {
    recursive: true,
  });

  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function listFiles(rootDirectory) {
  const files = [];

  async function visit(currentDirectory) {
    const entries = await fs.readdir(currentDirectory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const absolutePath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        await visit(absolutePath);
      } else if (entry.isFile()) {
        files.push(path.relative(rootDirectory, absolutePath));
      }
    }
  }

  await visit(rootDirectory);
  return files;
}

export async function copyDirectory({
  source,
  destination,
  overwrite = false,
  dryRun = false,
}) {
  const relativeFiles = await listFiles(source);
  const installedFiles = [];

  for (const relativeFile of relativeFiles) {
    const sourceFile = path.join(source, relativeFile);
    const destinationFile = path.join(destination, relativeFile);

    if ((await exists(destinationFile)) && !overwrite) {
      throw new Error(
        `Installation conflict: ${destinationFile} already exists. ` +
          "Use `claude-sdlc init --force` to repair a partial installation.",
      );
    }

    console.log(
      `${dryRun ? "[dry-run] " : ""}` +
        `${overwrite ? "Replace" : "Copy"} ${destinationFile}`,
    );

    if (!dryRun) {
      await fs.mkdir(path.dirname(destinationFile), {
        recursive: true,
      });

      await fs.copyFile(sourceFile, destinationFile);
    }

    installedFiles.push(destinationFile);
  }

  return installedFiles;
}

export async function copyPath({ source, destination, dryRun = false }) {
  if (!(await exists(source))) {
    return;
  }

  console.log(`${dryRun ? "[dry-run] " : ""}Backup ${source}`);

  if (dryRun) {
    return;
  }

  const stat = await fs.stat(source);

  await fs.mkdir(path.dirname(destination), {
    recursive: true,
  });

  if (stat.isDirectory()) {
    await fs.cp(source, destination, {
      recursive: true,
    });
  } else {
    await fs.copyFile(source, destination);
  }
}

export function deepMerge(target, source) {
  if (Array.isArray(target) && Array.isArray(source)) {
    return [...new Set([...target, ...source])];
  }

  if (isObject(target) && isObject(source)) {
    const merged = { ...target };

    for (const [key, value] of Object.entries(source)) {
      merged[key] =
        key in merged ? deepMerge(merged[key], value) : structuredClone(value);
    }

    return merged;
  }

  return structuredClone(source);
}

export async function upsertMarkedBlock({
  filePath,
  block,
  startMarker,
  endMarker,
  dryRun = false,
}) {
  const original = (await exists(filePath))
    ? await fs.readFile(filePath, "utf8")
    : "";

  const startIndex = original.indexOf(startMarker);
  const endIndex =
    startIndex === -1 ? -1 : original.indexOf(endMarker, startIndex);

  if (
    (startIndex === -1 && endIndex !== -1) ||
    (startIndex !== -1 && endIndex === -1)
  ) {
    throw new Error(`Incomplete managed block markers in ${filePath}`);
  }

  let updated;

  if (startIndex !== -1) {
    const afterEnd = endIndex + endMarker.length;

    updated =
      original.slice(0, startIndex) + block.trim() + original.slice(afterEnd);
  } else {
    const separator = original.trim() ? "\n\n" : "";

    updated = `${original.trimEnd()}${separator}${block.trim()}\n`;
  }

  console.log(`${dryRun ? "[dry-run] " : ""}Update ${filePath}`);

  if (!dryRun) {
    await fs.mkdir(path.dirname(filePath), {
      recursive: true,
    });

    await fs.writeFile(filePath, updated, "utf8");
  }
}

export async function ensureGitignoreEntries({
  filePath,
  entries,
  dryRun = false,
}) {
  const original = (await exists(filePath))
    ? await fs.readFile(filePath, "utf8")
    : "";

  const existingLines = new Set(
    original
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );

  const missing = entries.filter((entry) => !existingLines.has(entry));

  if (missing.length === 0) {
    return;
  }

  console.log(`${dryRun ? "[dry-run] " : ""}Update ${filePath}`);

  if (!dryRun) {
    const separator =
      original.length > 0 && !original.endsWith("\n") ? "\n" : "";

    const comment = existingLines.has("# Claude SDLC framework")
      ? ""
      : "# Claude SDLC framework\n";

    await fs.appendFile(
      filePath,
      `${separator}${comment}${missing.join("\n")}\n`,
      "utf8",
    );
  }
}

export function relativePortable(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

export function assertPathInside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Unsafe path outside target repository: ${candidate}`);
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
