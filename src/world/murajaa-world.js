import { MURAJAA_SCREEN_WORLD_CONFIG } from "./config.js";
import { createProjectedObjectWorld } from "./projected-object-world.js";

export function createMurajaaScreenWorld(container, assetUrl) {
  return createProjectedObjectWorld({
    anchorPrefix: "murajaa-screen",
    assetUrl,
    className: "murajaa-world-screen",
    container,
    defaultAspect: 3 / 2,
    groupName: "murajaa-screen-world",
    objects: MURAJAA_SCREEN_WORLD_CONFIG.screens,
    worldConfig: MURAJAA_SCREEN_WORLD_CONFIG,
  });
}
