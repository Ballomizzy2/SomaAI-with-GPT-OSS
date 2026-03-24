import fs from "fs/promises";
import path from "path";
import type { NextRequest } from "next/server";

const UNITY_ROOT = path.resolve(process.cwd(), "Unity Project", "Soma+", "Builds", "Soma3");
const DEFAULT_FILE = "index.html";

function normalizeRequestedPath(requestPath: string) {
  const normalized = path.normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/g, "");
  return normalized || DEFAULT_FILE;
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  // Handle .br files first - they need the MIME type of the underlying file
  if (ext === '.br') {
    const basePath = filePath.replace(/\.br$/, '');
    const baseExt = path.extname(basePath).toLowerCase();
    
    const brMimeTypes: Record<string, string> = {
      '.js': 'application/javascript',
      '.wasm': 'application/wasm',
      '.data': 'application/octet-stream',
      '.json': 'application/json',
    };
    
    return brMimeTypes[baseExt] || 'application/octet-stream';
  }
  
  // Unity-specific MIME types
  const mimeTypes: Record<string, string> = {
    '.js': 'application/javascript',
    '.wasm': 'application/wasm',
    '.data': 'application/octet-stream',
    '.json': 'application/json',
    '.css': 'text/css',
    '.html': 'text/html',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
  };

  // Check our map first
  if (mimeTypes[ext]) {
    return mimeTypes[ext];
  }

  // Fallback
  return 'application/octet-stream';
}

export async function GET(
  request: NextRequest,
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
      // Double check the index.html exists
      const indexStat = await fs.stat(targetPath);
      if (!indexStat.isFile()) {
        console.error(`[Unity Route] Directory found but index.html is not a file: ${targetPath}`);
        return new Response("Directory index not found", { status: 404 });
      }
    }
  } catch (error) {
    console.error(`[Unity Route] File not found: ${targetPath}`, error);
    return new Response(`File not found: ${safeRelativePath}`, { status: 404 });
  }

  try {
    let file = await fs.readFile(targetPath);
    const contentType = getMimeType(targetPath);
    
    // Modify Unity index.html to make canvas responsive
    if (targetPath.endsWith('index.html')) {
      let htmlContent = file.toString('utf-8');
      
      // Replace fixed canvas dimensions with responsive sizing
      htmlContent = htmlContent.replace(
        /canvas\.style\.width = "960px";\s*canvas\.style\.height = "600px";/g,
        `// Responsive canvas sizing
        function resizeCanvas() {
          const container = document.querySelector("#unity-container");
          if (container && canvas) {
            canvas.style.width = container.clientWidth + "px";
            canvas.style.height = container.clientHeight + "px";
          }
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);`
      );

      // Keep keyboard handling scoped to canvas in iframe mode.
      htmlContent = htmlContent.replace(
        'showBanner: unityShowBanner,',
        `showBanner: unityShowBanner,
        captureAllKeyboardInput: false,
        keyboardListeningElement: canvas,`
      );

      // Expose Unity instance and allow parent window to send Unity SendMessage calls.
      htmlContent = htmlContent.replace(
        '.then((unityInstance) => {',
        `.then((unityInstance) => {
                window.__unityInstance = unityInstance;
                window.addEventListener('message', function(event) {
                  var data = event && event.data ? event.data : null;
                  if (!data) return;
                  if (data.type === 'UNITY_HOST_BLUR') {
                    try {
                      if (document.pointerLockElement && typeof document.exitPointerLock === 'function') {
                        document.exitPointerLock();
                      }
                    } catch (e) {}
                    try {
                      if (canvas && typeof canvas.blur === 'function') {
                        canvas.blur();
                      }
                    } catch (e) {}
                    return;
                  }
                  if (data.type !== 'UNITY_HOST_MESSAGE') return;
                  if (!window.__unityInstance || typeof window.__unityInstance.SendMessage !== 'function') return;
                  window.__unityInstance.SendMessage(
                    data.gameObject || 'App System',
                    data.method || '',
                    data.arg || ''
                  );
                });
                try {
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: 'UNITY_IFRAME_READY' }, '*');
                  }
                } catch (e) {}
`
      );

      htmlContent = htmlContent.replace(
        '}).catch((message) => {',
        `}).catch((message) => {
                try {
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: 'UNITY_IFRAME_ERROR', message: String(message) }, '*');
                  }
                } catch (e) {}
`
      );
      
      // Add responsive CSS styles if not already present
      if (!htmlContent.includes('#unity-container { width: 100%')) {
        const responsiveStyles = `
          <style>
            #unity-container {
              width: 100% !important;
              height: 100% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            #unity-canvas {
              max-width: 100% !important;
              max-height: 100% !important;
              object-fit: contain !important;
            }
            #unity-footer,
            #unity-build-title,
            #unity-logo-title-footer,
            #unity-fullscreen-button {
              display: none !important;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              width: 100% !important;
              height: 100vh !important;
            }
            html {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: 100% !important;
            }
          </style>
        `;
        htmlContent = htmlContent.replace('</head>', responsiveStyles + '</head>');
      }

      // Inject Unity-to-parent bridge so Unity clicks can update Next.js check-in state.
      if (!htmlContent.includes('/unity-bridge.js')) {
        htmlContent = htmlContent.replace('</head>', `\n    <script src="/unity-bridge.js"></script>\n  </head>`);
      }
      
      file = Buffer.from(htmlContent, 'utf-8');
    }
    
    // Create headers with CORS and proper content types
    const headers = new Headers();
    headers.set("content-type", contentType);
    
    // Add CORS headers for Unity WebGL
    headers.set("access-control-allow-origin", "*");
    headers.set("access-control-allow-methods", "GET, OPTIONS");
    headers.set("access-control-allow-headers", "*");
    
    // Handle Brotli compression
    if (targetPath.endsWith(".br")) {
      headers.set("content-encoding", "br");
    }
    
    // In dev mode, don't cache so rebuilds are picked up immediately
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      headers.set("cache-control", "no-store, must-revalidate");
    } else if (!targetPath.endsWith('.html')) {
      headers.set("cache-control", "public, max-age=31536000, immutable");
    } else {
      headers.set("cache-control", "no-cache");
    }

    console.log(`[Unity Route] Serving: ${safeRelativePath} (${contentType})`);
    return new Response(file, { status: 200, headers });
  } catch (error) {
    console.error(`[Unity Route] Failed to read Unity asset: ${targetPath}`, error);
    return new Response(`Error loading Unity build: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
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
