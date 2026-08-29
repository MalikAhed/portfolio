import { CUBE_BURGER_INGREDIENT_WORLD_CONFIG } from "./config.js";
import { createProjectedObjectWorld } from "./projected-object-world.js";

function createIngredientElement(config, assetUrl) {
  const element = document.createElement("div");
  element.className = "cube-burger-ingredient";
  element.setAttribute("aria-hidden", "true");

  const crop = document.createElement("span");
  crop.style.backgroundSize = config.backgroundSize;
  crop.style.backgroundPosition = config.backgroundPosition;
  element.append(crop);

  return {
    element,
    load() {
      crop.style.backgroundImage = `url("${assetUrl(CUBE_BURGER_INGREDIENT_WORLD_CONFIG.asset)}")`;
    },
  };
}

export function createCubeBurgerIngredientWorld(container, assetUrl) {
  return createProjectedObjectWorld({
    anchorPrefix: "cube-burger",
    assetUrl,
    container,
    createElement: createIngredientElement,
    groupName: "cube-burger-ingredient-world",
    objects: CUBE_BURGER_INGREDIENT_WORLD_CONFIG.pieces,
    worldConfig: CUBE_BURGER_INGREDIENT_WORLD_CONFIG,
  });
}
