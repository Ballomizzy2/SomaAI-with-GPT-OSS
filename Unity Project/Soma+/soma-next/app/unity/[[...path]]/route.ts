import fs from "fs/promises";
import path from "path";
import type { NextRequest } from "next/server";

const UNITY_ROOT = path.resolve(process.cwd(), "..", "Builds", "SoraAI_HTML");
const DEFAULT_FILE = "index.html";

function normalizeRequestedPath(requestPath: string) {
  const normalized = path.normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/g, "");
  return normalized || DEFAULT_FILE;
}

export async function GET(
  _request: NextRequest,
  context: { params: { path?: string[] } }
) {
  const segments = context.params?.path ?? [];
  const requested = segments.length ? segments.join("/") : DEFAULT_FILE;
  const safeRelativePath = normalizeRequestedPath(requested);
  let targetPath = path.join(UNITY_ROOT, safeRelativePath);

  try {
    const stat = await fs.stat(targetPath);
    if (stat.isDirectory()) {
      targetPath = path.join(targetPath, DEFAULT_FILE);
    }
  } catch {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await fs.readFile(targetPath);
    const contentType = "application/octet-stream";
    const headers = new Headers({ "content-type": contentType });

    if (targetPath.endsWith(".br")) {
      headers.set("content-encoding", "br");
    }

    return new Response(file, { status: 200, headers });
  } catch (error) {
    console.error("Failed to read Unity asset", error);
    return new Response("Error loading Unity build", { status: 500 });
  }
}




