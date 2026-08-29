import { LEARN_OBJECT_WORLD_CONFIG } from "./config.js";
import { createProjectedObjectWorld } from "./projected-object-world.js";

export function createLearnObjectWorld(container, assetUrl) {
  return createProjectedObjectWorld({
    anchorPrefix: "learn",
    assetUrl,
    className: "learn-world-object",
    container,
    groupName: "learn-object-world",
    objects: LEARN_OBJECT_WORLD_CONFIG.objects,
    worldConfig: LEARN_OBJECT_WORLD_CONFIG,
  });
}
