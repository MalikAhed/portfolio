import { writeFile } from "node:fs/promises";
import { defineConfig } from "vite";

const positionFile = new URL(
  "./src/sections/about/about-copy-position.json",
  import.meta.url,
);

function aboutCopyPositionEditor() {
  return {
    name: "about-copy-position-editor",
    configureServer(server) {
      server.middlewares.use("/__about-copy-position", (request, response) => {
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end("Method not allowed");
          return;
        }

        let body = "";
        request.on("data", (chunk) => {
          body += chunk;
          if (body.length > 10_000) request.destroy();
        });
        request.on("end", async () => {
          try {
            const input = JSON.parse(body);
            const next = {
              x: Math.max(-800, Math.min(800, Number(input.x))),
              y: Math.max(-600, Math.min(800, Number(input.y))),
              width: Math.max(240, Math.min(1000, Number(input.width))),
              size: Math.max(-8, Math.min(24, Number(input.size))),
              weight: Math.max(400, Math.min(800, Number(input.weight))),
            };
            if (Object.values(next).some((value) => !Number.isFinite(value))) {
              throw new Error("Invalid position value");
            }
            await writeFile(positionFile, `${JSON.stringify(next, null, 2)}\n`);
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify({ ok: true }));
          } catch {
            response.statusCode = 400;
            response.end("Invalid position payload");
          }
        });
      });
    },
  };
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/portfolio/" : "/",
  plugins: [aboutCopyPositionEditor()],
});
