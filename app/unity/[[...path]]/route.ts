import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import type { NextRequest } from "next/server";

const DEFAULT_FILE = "index.html";

/**
 * Locate the Unity build directory. In a git worktree the Builds/ folder is
 * gitignored and lives in the original project root, not the worktree.
 * Walk up the directory tree until we find it.
 */
function findUnityRoot(): string {
  const rel = path.join("Unity Project", "Soma+", "Builds", "Soma3");
  let dir = process.cwd();
  for (let i = 0; i <= 5; i++) {
    const candidate = path.join(dir, rel);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break; // filesystem root
    dir = parent;
  }
  // Final fallback — will 404 on individual file requests, not crash the server
  return path.join(process.cwd(), rel);
}

const UNITY_ROOT = findUnityRoot();

// Binary file extensions that are large and should be cached aggressively.
const BINARY_EXTS = new Set([".br", ".wasm", ".data", ".js.br", ".wasm.br", ".data.br"]);

function normalizeRequestedPath(requestPath: string) {
  const normalized = path.normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/g, "");
  return normalized || DEFAULT_FILE;
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  // .br files — return the MIME type of the underlying (decompressed) file
  if (ext === ".br") {
    const basePath = filePath.replace(/\.br$/, "");
    const baseExt = path.extname(basePath).toLowerCase();
    const brMimeTypes: Record<string, string> = {
      ".js": "application/javascript",
      ".wasm": "application/wasm",
      ".data": "application/octet-stream",
      ".json": "application/json",
    };
    return brMimeTypes[baseExt] ?? "application/octet-stream";
  }

  const mimeTypes: Record<string, string> = {
    ".js": "application/javascript",
    ".wasm": "application/wasm",
    ".data": "application/octet-stream",
    ".json": "application/json",
    ".css": "text/css",
    ".html": "text/html",
    ".ico": "image/x-icon",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  };
  return mimeTypes[ext] ?? "application/octet-stream";
}

function isBinaryAsset(filePath: string) {
  return BINARY_EXTS.has(path.extname(filePath).toLowerCase());
}

// ── index.html modifications ────────────────────────────────────────────────

function patchUnityIndexHtml(raw: string): string {
  let html = raw;

  // 1. Responsive canvas — use requestAnimationFrame so layout is settled first.
  html = html.replace(
    /canvas\.style\.width = "960px";\s*canvas\.style\.height = "600px";/g,
    `// Responsive canvas — wait one frame so parent layout is complete
        function resizeCanvas() {
          var container = document.querySelector("#unity-container");
          var w = container ? container.clientWidth : window.innerWidth;
          var h = container ? container.clientHeight : window.innerHeight;
          if (canvas && w > 0 && h > 0) {
            canvas.style.width  = w + "px";
            canvas.style.height = h + "px";
          }
        }
        requestAnimationFrame(resizeCanvas);
        window.addEventListener("resize", function() { requestAnimationFrame(resizeCanvas); });`
  );

  // 2. Scope keyboard input to canvas; expose Unity instance; post READY to parent.
  html = html.replace(
    "showBanner: unityShowBanner,",
    `showBanner: unityShowBanner,
        captureAllKeyboardInput: false,
        keyboardListeningElement: canvas,`
  );

  html = html.replace(
    ".then((unityInstance) => {",
    `.then((unityInstance) => {
                window.__unityInstance = unityInstance;
                window.addEventListener("message", function(event) {
                  var data = event && event.data ? event.data : null;
                  if (!data) return;
                  if (data.type === "UNITY_HOST_BLUR") {
                    try { if (document.pointerLockElement) document.exitPointerLock(); } catch(e) {}
                    try { if (canvas) canvas.blur(); } catch(e) {}
                    return;
                  }
                  if (data.type !== "UNITY_HOST_MESSAGE") return;
                  if (!window.__unityInstance || typeof window.__unityInstance.SendMessage !== "function") return;
                  window.__unityInstance.SendMessage(
                    data.gameObject || "App System",
                    data.method   || "",
                    data.arg      || ""
                  );
                });
                try {
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: "UNITY_IFRAME_READY" }, "*");
                  }
                } catch(e) {}`
  );

  html = html.replace(
    "}).catch((message) => {",
    `}).catch((message) => {
                try {
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: "UNITY_IFRAME_ERROR", message: String(message) }, "*");
                  }
                } catch(e) {}`
  );

  // 3. Responsive container + hide chrome elements.
  if (!html.includes("#unity-container { width: 100%")) {
    const styles = `
      <style>
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
        #unity-container {
          width: 100% !important; height: 100% !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
        }
        #unity-canvas { display: block; }
        #unity-footer, #unity-build-title, #unity-logo-title-footer, #unity-fullscreen-button { display: none !important; }
      </style>`;
    html = html.replace("</head>", styles + "\n  </head>");
  }

  // 4. Inject bridge script if missing.
  if (!html.includes("/unity-bridge.js")) {
    html = html.replace("</head>", `\n    <script src="/unity-bridge.js"></script>\n  </head>`);
  }

  return html;
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  context: { params: { path?: string[] } }
) {
  const segments = context.params?.path ?? [];
  const requested = segments.length ? segments.join("/") : DEFAULT_FILE;
  const safeRelativePath = normalizeRequestedPath(requested);
  let targetPath = path.join(UNITY_ROOT, safeRelativePath);

  // Resolve directories to index.html
  try {
    const stat = await fsp.stat(targetPath);
    if (stat.isDirectory()) {
      targetPath = path.join(targetPath, DEFAULT_FILE);
      await fsp.stat(targetPath); // throws if not found
    }
  } catch {
    console.error(`[Unity Route] Not found: ${targetPath}`);
    return new Response(`File not found: ${safeRelativePath}`, { status: 404 });
  }

  // File stats (for Content-Length)
  let fileSize: number;
  try {
    const stat = await fsp.stat(targetPath);
    fileSize = stat.size;
  } catch {
    return new Response("Error reading file", { status: 500 });
  }

  const contentType = getMimeType(targetPath);
  const headers = new Headers();
  headers.set("content-type", contentType);
  headers.set("content-length", String(fileSize));

  // CORS
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET, OPTIONS");
  headers.set("access-control-allow-headers", "*");

  // Encoding
  if (targetPath.endsWith(".br")) {
    headers.set("content-encoding", "br");
  }

  // Cache — binary assets are immutable per build; cache them hard even in dev
  // so the 22 MB of .br files don't re-download on every reload.
  if (isBinaryAsset(targetPath)) {
    headers.set("cache-control", "public, max-age=3600, stale-while-revalidate=86400");
  } else if (targetPath.endsWith(".html")) {
    headers.set("cache-control", "no-cache");   // always revalidate HTML
  } else {
    headers.set("cache-control", "public, max-age=60");
  }

  // index.html — patch synchronously (small file)
  if (targetPath.endsWith("index.html")) {
    try {
      const raw = await fsp.readFile(targetPath, "utf-8");
      const patched = patchUnityIndexHtml(raw);
      const buf = Buffer.from(patched, "utf-8");
      headers.set("content-length", String(buf.byteLength));
      headers.delete("content-encoding"); // HTML is never brotli-encoded
      console.log(`[Unity Route] Serving patched HTML: ${safeRelativePath}`);
      return new Response(buf, { status: 200, headers });
    } catch (err) {
      console.error(`[Unity Route] Failed to patch index.html`, err);
      return new Response("Error patching Unity HTML", { status: 500 });
    }
  }

  // All other files — stream directly from disk, no buffering.
  console.log(`[Unity Route] Streaming: ${safeRelativePath} (${contentType}, ${fileSize} bytes)`);
  const nodeStream = fs.createReadStream(targetPath);
  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      nodeStream.on("end",  ()              => controller.close());
      nodeStream.on("error", (err: Error)   => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });
  return new Response(webStream, { status: 200, headers });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "*",
    },
  });
}
