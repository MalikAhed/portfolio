import { getRequiredElement } from "../../lib/dom.js";

const MOBILE_NAVIGATION_QUERY = "(max-width: 850px)";

export function initMobileNavigation() {
  const menuToggle = getRequiredElement(".menu-toggle");
  const navigation = getRequiredElement("#primary-navigation");

  const firstNavigationLink = navigation.querySelector("a");
  const mobileNavigation = window.matchMedia(MOBILE_NAVIGATION_QUERY);

  function closeMenu({ restoreFocus = false } = {}) {
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (restoreFocus) menuToggle.focus();
  }

  function handleToggleClick() {
    const willOpen = menuToggle.getAttribute("aria-expanded") !== "true";

    if (willOpen) {
      menuToggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      firstNavigationLink?.focus();
      return;
    }

    closeMenu({ restoreFocus: true });
  }

  function handleNavigationClick(event) {
    if (event.target instanceof HTMLAnchorElement) {
      closeMenu({ restoreFocus: true });
    }
  }

  function handleKeydown(event) {
    if (
      event.key === "Escape" &&
      menuToggle.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu({ restoreFocus: true });
    }
  }

  function handleViewportChange(event) {
    if (!event.matches) closeMenu();
  }

  menuToggle.addEventListener("click", handleToggleClick);
  navigation.addEventListener("click", handleNavigationClick);
  window.addEventListener("keydown", handleKeydown);
  mobileNavigation.addEventListener("change", handleViewportChange);

  return function dispose() {
    closeMenu();
    menuToggle.removeEventListener("click", handleToggleClick);
    navigation.removeEventListener("click", handleNavigationClick);
    window.removeEventListener("keydown", handleKeydown);
    mobileNavigation.removeEventListener("change", handleViewportChange);
  };
}
