import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const scriptsDirectory = path.dirname(currentFile);

export const packageRoot = path.resolve(scriptsDirectory, "..");
export const frameworkRoot = path.join(packageRoot, "framework");
