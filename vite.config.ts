// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

function gemmaDevApiPlugin() {
  return {
    name: "gemma-dev-api-plugin",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === "/api/analyze" && req.method === "POST") {
          let bodyStr = "";
          req.on("data", (chunk: any) => {
            bodyStr += chunk;
          });
          req.on("end", async () => {
            try {
              const { handleAnalyzeApiRequest } = await import("./src/server/api-handler");
              const url = `http://${req.headers.host || "localhost"}${req.url}`;
              const webReq = new Request(url, {
                method: req.method,
                headers: req.headers,
                body: bodyStr,
              });
              const webRes = await handleAnalyzeApiRequest(webReq);
              res.statusCode = webRes.status;
              webRes.headers.forEach((val: string, key: string) => res.setHeader(key, val));
              const resBody = await webRes.text();
              res.end(resBody);
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: err.message, isGemma: false }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [gemmaDevApiPlugin()],
  },
});
