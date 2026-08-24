import { getRequiredElement } from "../../lib/dom.js";

const MOBILE_NAVIGATION_QUERY = "(max-width: 960px)";
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initMobileNavigation() {
  const menuToggle = getRequiredElement(".menu-toggle");
  const navigation = getRequiredElement("#primary-navigation");
  const mobileNavigation = window.matchMedia(MOBILE_NAVIGATION_QUERY);
  const backgroundTargets = Array.from(
    document.querySelectorAll(
      ".brand, .contact-link, .hero__identity, #about, #skills, #contact",
    ),
  );
  const previousInertState = new Map();

  function isOpen() {
    return menuToggle.getAttribute("aria-expanded") === "true";
  }

  function setBackgroundInert(inert) {
    backgroundTargets.forEach((element) => {
      if (inert) {
        if (!previousInertState.has(element)) {
          previousInertState.set(element, element.inert);
        }
        element.inert = true;
        return;
      }

      if (previousInertState.has(element)) {
        element.inert = previousInertState.get(element);
      }
    });
    if (!inert) previousInertState.clear();
  }

  function closeMenu({ restoreFocus = false } = {}) {
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-navigation-open");
    setBackgroundInert(false);
    navigation.setAttribute("aria-hidden", String(mobileNavigation.matches));
    if (restoreFocus) menuToggle.focus();
  }

  function openMenu() {
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-navigation-open");
    navigation.setAttribute("aria-hidden", "false");
    setBackgroundInert(true);
    navigation.querySelector(FOCUSABLE_SELECTOR)?.focus();
  }

  function handleToggleClick() {
    if (isOpen()) closeMenu({ restoreFocus: true });
    else openMenu();
  }

  function focusHashTarget(link) {
    const hash = new URL(link.href).hash;
    if (!hash) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;

    const hadTabIndex = target.hasAttribute("tabindex");
    if (!hadTabIndex) target.tabIndex = -1;
    window.requestAnimationFrame(() => {
      target.focus({ preventScroll: true });
      if (!hadTabIndex) {
        target.addEventListener(
          "blur",
          () => target.removeAttribute("tabindex"),
          {
            once: true,
          },
        );
      }
    });
  }

  function handleNavigationClick(event) {
    const link = event.target.closest("a");
    if (!(link instanceof HTMLAnchorElement)) return;
    closeMenu();
    focusHashTarget(link);
  }

  function handleKeydown(event) {
    if (!isOpen()) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu({ restoreFocus: true });
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = [
      menuToggle,
      ...navigation.querySelectorAll(FOCUSABLE_SELECTOR),
    ];
    const first = focusable[0];
    const last = focusable.at(-1);

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleViewportChange(event) {
    closeMenu();
    navigation.setAttribute("aria-hidden", String(event.matches));
  }

  menuToggle.addEventListener("click", handleToggleClick);
  navigation.addEventListener("click", handleNavigationClick);
  window.addEventListener("keydown", handleKeydown);
  mobileNavigation.addEventListener("change", handleViewportChange);
  navigation.setAttribute("aria-hidden", String(mobileNavigation.matches));

  return function dispose() {
    closeMenu();
    menuToggle.removeEventListener("click", handleToggleClick);
    navigation.removeEventListener("click", handleNavigationClick);
    window.removeEventListener("keydown", handleKeydown);
    mobileNavigation.removeEventListener("change", handleViewportChange);
    navigation.removeAttribute("aria-hidden");
  };
}
