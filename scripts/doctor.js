import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

import { getFrameworkVersion } from "./framework-operations.js";

import { exists, readJson } from "./file-utils.js";

import { validateProject } from "./validate-project.js";

const execFileAsync = promisify(execFile);

const KNOWLEDGE_FILES = [
  "PROJECT_PROFILE.md",
  "TECHNOLOGY_STACK.md",
  "ARCHITECTURE.md",
  "REPOSITORY_MAP.md",
  "COMMANDS.md",
  "CONVENTIONS.md",
  "TESTING_STRATEGY.md",
  "INTEGRATIONS.md",
  "ONBOARDING_REPORT.md",
];

export async function doctor(target = process.cwd()) {
  const targetRoot = path.resolve(target);
  const problems = [];
  const warnings = [];
  const recommendations = [];

  console.log(`\nClaude SDLC Doctor\n`);
  console.log(`Repository: ${targetRoot}\n`);

  const validation = await validateProject(targetRoot, { print: false });

  problems.push(...validation.errors);
  warnings.push(...validation.warnings);

  await inspectVersions({
    targetRoot,
    warnings,
    recommendations,
  });

  await inspectProjectKnowledge({
    targetRoot,
    problems,
    warnings,
    recommendations,
  });

  await inspectStackSkills({
    targetRoot,
    warnings,
    recommendations,
  });

  await inspectGitState({
    targetRoot,
    warnings,
  });

  printDoctorResult({
    problems,
    warnings,
    recommendations,
  });

  return {
    healthy: problems.length === 0,
    problems,
    warnings,
    recommendations,
  };
}

async function inspectVersions({ targetRoot, warnings, recommendations }) {
  const manifestPath = path.join(targetRoot, ".claude", "framework.json");

  if (!(await exists(manifestPath))) {
    return;
  }

  const manifest = await readJson(manifestPath);
  const cliVersion = await getFrameworkVersion();

  console.log(`Framework installed: ${manifest.version}`);
  console.log(`Framework CLI:       ${cliVersion}`);

  if (manifest.version !== cliVersion) {
    warnings.push(
      "The installed framework is not the same version as the running CLI.",
    );

    recommendations.push("Run `claude-sdlc update`.");
  }
}

async function inspectProjectKnowledge({
  targetRoot,
  problems,
  warnings,
  recommendations,
}) {
  const knowledgeRoot = path.join(targetRoot, ".claude", "project-knowledge");

  const missingFiles = [];

  for (const fileName of KNOWLEDGE_FILES) {
    const filePath = path.join(knowledgeRoot, fileName);

    if (!(await exists(filePath))) {
      missingFiles.push(fileName);
    }
  }

  if (missingFiles.length > 0) {
    warnings.push(
      `Project onboarding is incomplete. Missing: ` + missingFiles.join(", "),
    );

    recommendations.push("Start Claude Code and run `/project-onboarding`.");

    return;
  }

  console.log("Project knowledge:   available");

  const reportPath = path.join(knowledgeRoot, "ONBOARDING_REPORT.md");

  const reportStat = await fs.stat(reportPath);
  const ageMilliseconds = Date.now() - reportStat.mtimeMs;
  const ageDays = Math.floor(ageMilliseconds / (1000 * 60 * 60 * 24));

  console.log(`Knowledge age:       ${ageDays} day(s)`);

  if (ageDays > 30) {
    warnings.push(`Project knowledge was last updated ${ageDays} days ago.`);

    recommendations.push("Run `/refresh-project-knowledge`.");
  }

  const report = await fs.readFile(reportPath, "utf8");

  const sourceCommitMatch = report.match(
    /source\s+commit\s*:\s*`?([0-9a-f]{7,40})`?/i,
  );

  if (!sourceCommitMatch) {
    warnings.push(
      "The onboarding report does not contain a recognisable source commit.",
    );

    return;
  }

  const sourceCommit = sourceCommitMatch[1];
  const currentCommit = await runGit(targetRoot, ["rev-parse", "HEAD"]);

  if (!currentCommit) {
    return;
  }

  if (!currentCommit.startsWith(sourceCommit)) {
    const commitsAhead = await runGit(targetRoot, [
      "rev-list",
      "--count",
      `${sourceCommit}..HEAD`,
    ]);

    warnings.push(
      `Repository is ${commitsAhead ?? "several"} commit(s) ` +
        "ahead of the onboarding source commit.",
    );

    recommendations.push(
      "Run `/refresh-project-knowledge` when those commits changed " +
        "the stack, commands, modules, architecture or integrations.",
    );
  }
}

async function inspectStackSkills({ targetRoot, warnings, recommendations }) {
  const skillsRoot = path.join(targetRoot, ".claude", "skills");

  if (!(await exists(skillsRoot))) {
    return;
  }

  const entries = await fs.readdir(skillsRoot, {
    withFileTypes: true,
  });

  const stackSkills = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("stack-")) {
      continue;
    }

    const skillFile = path.join(skillsRoot, entry.name, "SKILL.md");

    if (await exists(skillFile)) {
      stackSkills.push(entry.name);
    }
  }

  console.log(`Generated stack skills: ${stackSkills.length}`);

  if (stackSkills.length === 0) {
    warnings.push("No generated stack-specific skills were found.");

    recommendations.push(
      "Run `/project-onboarding` or `/refresh-project-knowledge`.",
    );
  }
}

async function inspectGitState({ targetRoot, warnings }) {
  const status = await runGit(targetRoot, ["status", "--short"]);

  if (status) {
    const count = status.split(/\r?\n/).filter(Boolean).length;

    console.log(`Uncommitted paths:   ${count}`);

    warnings.push(`Repository currently has ${count} uncommitted path(s).`);
  } else {
    console.log("Uncommitted paths:   0 or Git unavailable");
  }
}

async function runGit(cwd, args) {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      encoding: "utf8",
    });

    return stdout.trim();
  } catch {
    return null;
  }
}

function printDoctorResult({ problems, warnings, recommendations }) {
  console.log("\nDiagnosis");

  if (problems.length === 0 && warnings.length === 0) {
    console.log("  ✓ Installation and project knowledge look healthy.");
  }

  for (const problem of problems) {
    console.error(`  ✗ ${problem}`);
  }

  for (const warning of warnings) {
    console.warn(`  ! ${warning}`);
  }

  if (recommendations.length > 0) {
    console.log("\nRecommendations");

    for (const recommendation of new Set(recommendations)) {
      console.log(`  - ${recommendation}`);
    }
  }
}
