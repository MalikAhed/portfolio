import { STOCKTHINK_CHESS_WORLD_CONFIG } from "./config.js";
import { createProjectedObjectWorld } from "./projected-object-world.js";

export function createStockthinkChessWorld(container, assetUrl) {
  return createProjectedObjectWorld({
    anchorPrefix: "stockthink-chess-piece",
    assetUrl,
    className: "stockthink-chess-piece",
    container,
    groupName: "stockthink-chess-world",
    objects: STOCKTHINK_CHESS_WORLD_CONFIG.pieces,
    worldConfig: STOCKTHINK_CHESS_WORLD_CONFIG,
  });
}
