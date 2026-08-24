import { writeFile } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const positionFile = new URL(
  "./src/sections/about/about-copy-position.json",
  import.meta.url,
);
const sceneEditorEntryFile = fileURLToPath(
  new URL("./src/scene-editor.js", import.meta.url),
);
const sceneEditorVirtualId = "virtual:scene-editor";
const resolvedSceneEditorVirtualId = `\0${sceneEditorVirtualId}`;

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

function developmentSceneEditors(command) {
  return {
    name: "development-scene-editors",
    resolveId(source) {
      if (source !== sceneEditorVirtualId) return null;
      return command === "serve"
        ? sceneEditorEntryFile
        : resolvedSceneEditorVirtualId;
    },
    load(id) {
      if (id !== resolvedSceneEditorVirtualId) return null;
      return "export async function loadSceneEditorModules() { return null; }";
    },
    transformIndexHtml: {
      order: "pre",
      handler(html, context) {
        if (context.server) return html;
        return html.replace(
          /\s*<!-- DEV_SCENE_EDITORS_START -->[\s\S]*?<!-- DEV_SCENE_EDITORS_END -->/,
          "",
        );
      },
    },
  };
}

export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE_PATH ?? "/",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    developmentSceneEditors(command),
    ...(command === "serve" ? [vue(), aboutCopyPositionEditor()] : []),
  ],
}));
