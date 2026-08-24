import { playElementAnimation } from "../../lib/animate.js";
import { getRequiredElement } from "../../lib/dom.js";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function initContactDialog() {
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
  const contactTrigger = getRequiredElement(".contact-link");
  const contactTriggerPlane = getRequiredElement(
    ".contact-link__plane",
    contactTrigger,
  );
  const contactModal = getRequiredElement("#contact-modal");
  const contactVeil = getRequiredElement(".contact-modal__veil", contactModal);
  const contactFlight = getRequiredElement(".contact-flight", contactModal);
  const contactFlightPlane = getRequiredElement(
    ".contact-flight__plane",
    contactModal,
  );
  const contactFlightDot = getRequiredElement(
    ".contact-flight__dot",
    contactModal,
  );
  const contactCard = getRequiredElement(".contact-card", contactModal);
  const contactClose = getRequiredElement(".contact-card__close", contactModal);
  const contactCopy = getRequiredElement(".contact-card__copy", contactModal);
  const contactContentGroups = Array.from(
    contactModal.querySelectorAll(
      ".contact-card__topline, .contact-card__body, .contact-card__footer",
    ),
  );
  let contactState = "closed";
  let closeContactAfterOpening = false;
  let copyResetTimer;

  function moveFlightTo(x, y) {
    return `translate3d(${x - 12}px, ${y - 12}px, 0)`;
  }

  function getContactFlightGeometry() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const triggerBounds = contactTriggerPlane?.getBoundingClientRect();
    const origin = triggerBounds
      ? {
          x: triggerBounds.left + triggerBounds.width / 2,
          y: triggerBounds.top + triggerBounds.height / 2,
        }
      : { x: viewportWidth - 40, y: 40 };
    const center = { x: viewportWidth / 2, y: viewportHeight / 2 };
    const largePlaneSize = viewportWidth * 0.5;

    return {
      center,
      largePlaneSize,
      largeScale: largePlaneSize / 24,
      origin,
      viewportHeight,
      viewportWidth,
    };
  }

  function resetContactScene(origin) {
    if (
      !contactFlight ||
      !contactFlightPlane ||
      !contactFlightDot ||
      !contactCard ||
      !contactVeil
    ) {
      return;
    }

    contactFlight.style.opacity = "1";
    contactFlight.style.transform = moveFlightTo(origin.x, origin.y);
    contactFlightPlane.style.opacity = "1";
    contactFlightPlane.style.transform = "rotate(42deg) scale(1)";
    contactFlightDot.style.opacity = "0";
    contactFlightDot.style.transform = "translate(-50%, -50%) scale(0.55)";
    contactVeil.style.opacity = "0";
    contactCard.style.opacity = "0";
    contactCard.style.transform = "scale(0.025)";
    contactCard.style.clipPath = "inset(49.2% round 999px)";
    contactContentGroups.forEach((group) => {
      group.style.opacity = "0";
      group.style.transform = "translate3d(0, 1rem, 0)";
    });
  }

  function revealContactImmediately() {
    contactFlight.style.opacity = "0";
    contactFlightDot.style.opacity = "0";
    contactFlightPlane.style.opacity = "0";
    contactVeil.style.opacity = "1";
    contactCard.style.opacity = "1";
    contactCard.style.transform = "scale(1)";
    contactCard.style.clipPath = "inset(0 round 2rem)";
    contactContentGroups.forEach((group) => {
      group.style.opacity = "1";
      group.style.transform = "translate3d(0, 0, 0)";
    });
  }

  async function openContactExperience(event) {
    event?.preventDefault();

    if (
      contactState !== "closed" ||
      !contactTrigger ||
      !contactModal ||
      !contactCard
    ) {
      return;
    }

    contactState = "opening";
    closeContactAfterOpening = false;
    const geometry = getContactFlightGeometry();
    contactCard.inert = true;
    resetContactScene(geometry.origin);
    contactTrigger.classList.add("is-flight-active");
    document.body.classList.add("is-contact-open");
    contactModal.showModal();
    contactModal.focus({ preventScroll: true });

    if (reducedMotion.matches) {
      revealContactImmediately();
    } else {
      await Promise.all([
        playElementAnimation(
          contactFlight,
          [
            {
              opacity: "1",
              transform: moveFlightTo(geometry.origin.x, geometry.origin.y),
            },
            {
              opacity: "1",
              offset: 0.72,
              transform: moveFlightTo(
                geometry.viewportWidth + 20,
                geometry.origin.y - 14,
              ),
            },
            {
              opacity: "0",
              transform: moveFlightTo(
                geometry.viewportWidth + 64,
                geometry.origin.y - 20,
              ),
            },
          ],
          { duration: 360, easing: "cubic-bezier(.55,.05,.8,.35)" },
        ),
        playElementAnimation(
          contactFlightPlane,
          [
            { transform: "rotate(42deg) scale(1)" },
            { transform: "rotate(48deg) scale(0.78)" },
          ],
          { duration: 360, easing: "ease-in" },
        ),
      ]);

      const entryY =
        geometry.center.y + Math.min(72, geometry.viewportHeight * 0.08);
      contactFlight.style.opacity = "0";
      contactFlight.style.transform = moveFlightTo(
        -geometry.largePlaneSize * 0.58,
        entryY,
      );
      contactFlightPlane.style.opacity = "0";
      contactFlightPlane.style.transform = `rotate(42deg) scale(${geometry.largeScale})`;

      await Promise.all([
        playElementAnimation(
          contactFlight,
          [
            {
              opacity: "0",
              transform: moveFlightTo(-geometry.largePlaneSize * 0.58, entryY),
            },
            {
              opacity: "1",
              offset: 0.14,
              transform: moveFlightTo(
                -geometry.largePlaneSize * 0.06,
                entryY - 18,
              ),
            },
            {
              opacity: "1",
              offset: 0.62,
              transform: moveFlightTo(
                geometry.viewportWidth * 0.28,
                geometry.center.y - 28,
              ),
            },
            {
              opacity: "1",
              transform: moveFlightTo(geometry.center.x, geometry.center.y),
            },
          ],
          { duration: 940, easing: "cubic-bezier(.16,.72,.2,1)" },
        ),
        playElementAnimation(
          contactFlightPlane,
          [
            {
              opacity: "0",
              transform: `rotate(38deg) scale(${geometry.largeScale})`,
            },
            {
              opacity: "1",
              offset: 0.16,
              transform: `rotate(42deg) scale(${geometry.largeScale})`,
            },
            {
              opacity: "1",
              transform: `rotate(46deg) scale(${geometry.largeScale})`,
            },
          ],
          { duration: 940, easing: "ease-out" },
        ),
      ]);

      await Promise.all([
        playElementAnimation(
          contactFlightPlane,
          [
            {
              opacity: "1",
              transform: `rotate(46deg) scale(${geometry.largeScale})`,
            },
            { opacity: "0", transform: "rotate(132deg) scale(0.36)" },
          ],
          { duration: 430, easing: "cubic-bezier(.65,0,.3,1)" },
        ),
        playElementAnimation(
          contactFlightDot,
          [
            { opacity: "0", transform: "translate(-50%, -50%) scale(0.45)" },
            {
              opacity: "0",
              offset: 0.48,
              transform: "translate(-50%, -50%) scale(0.45)",
            },
            { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          ],
          { duration: 430, easing: "cubic-bezier(.2,.8,.2,1)" },
        ),
      ]);

      await Promise.all([
        playElementAnimation(
          contactVeil,
          [{ opacity: "0" }, { opacity: "1" }],
          { duration: 520, easing: "ease-out" },
        ),
        playElementAnimation(
          contactCard,
          [
            {
              clipPath: "inset(49.2% round 999px)",
              opacity: "0.7",
              transform: "scale(0.025)",
            },
            {
              clipPath: "inset(20% 14% round 999px)",
              opacity: "1",
              offset: 0.42,
              transform: "scale(0.44)",
            },
            {
              clipPath: "inset(0 round 2rem)",
              opacity: "1",
              transform: "scale(1)",
            },
          ],
          { duration: 680, easing: "cubic-bezier(.16,1,.3,1)" },
        ),
        playElementAnimation(
          contactFlightDot,
          [{ opacity: "1" }, { opacity: "0" }],
          { duration: 240, delay: 170, easing: "ease-out" },
        ),
      ]);

      await Promise.all(
        contactContentGroups.map((group, index) =>
          playElementAnimation(
            group,
            [
              { opacity: "0", transform: "translate3d(0, 1rem, 0)" },
              { opacity: "1", transform: "translate3d(0, 0, 0)" },
            ],
            {
              duration: 460,
              delay: index * 70,
              easing: "cubic-bezier(.22,1,.36,1)",
            },
          ),
        ),
      );
    }

    contactFlight.style.opacity = "0";
    contactCard.inert = false;
    contactState = "open";
    contactClose?.focus({ preventScroll: true });

    if (closeContactAfterOpening) closeContactExperience();
  }

  async function closeContactExperience() {
    if (contactState === "opening") {
      closeContactAfterOpening = true;
      return;
    }
    if (contactState !== "open" || !contactModal || !contactCard) return;

    contactState = "closing";
    contactCard.inert = true;

    if (reducedMotion.matches) {
      contactCard.style.opacity = "0";
      contactVeil.style.opacity = "0";
    } else {
      await Promise.all(
        contactContentGroups.map((group, index) =>
          playElementAnimation(
            group,
            [
              { opacity: "1", transform: "translate3d(0, 0, 0)" },
              { opacity: "0", transform: "translate3d(0, 0.65rem, 0)" },
            ],
            { duration: 180, delay: index * 25, easing: "ease-in" },
          ),
        ),
      );

      const geometry = getContactFlightGeometry();
      contactFlight.style.opacity = "1";
      contactFlight.style.transform = moveFlightTo(
        geometry.center.x,
        geometry.center.y,
      );
      contactFlightPlane.style.opacity = "0";
      contactFlightPlane.style.transform = "rotate(132deg) scale(0.36)";
      contactFlightDot.style.opacity = "0";

      await Promise.all([
        playElementAnimation(
          contactCard,
          [
            {
              clipPath: "inset(0 round 2rem)",
              opacity: "1",
              transform: "scale(1)",
            },
            {
              clipPath: "inset(20% 14% round 999px)",
              opacity: "1",
              offset: 0.58,
              transform: "scale(0.44)",
            },
            {
              clipPath: "inset(49.2% round 999px)",
              opacity: "0",
              transform: "scale(0.025)",
            },
          ],
          { duration: 560, easing: "cubic-bezier(.65,0,.35,1)" },
        ),
        playElementAnimation(
          contactFlightDot,
          [
            { opacity: "0", transform: "translate(-50%, -50%) scale(0.5)" },
            { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          ],
          { duration: 280, delay: 260, easing: "ease-out" },
        ),
      ]);

      await Promise.all([
        playElementAnimation(
          contactFlightDot,
          [{ opacity: "1" }, { opacity: "0" }],
          { duration: 220, easing: "ease-in" },
        ),
        playElementAnimation(
          contactFlightPlane,
          [
            { opacity: "0", transform: "rotate(132deg) scale(0.36)" },
            { opacity: "1", transform: "rotate(42deg) scale(0.78)" },
          ],
          { duration: 300, easing: "cubic-bezier(.2,.8,.2,1)" },
        ),
      ]);

      await Promise.all([
        playElementAnimation(
          contactFlight,
          [
            {
              opacity: "1",
              transform: moveFlightTo(geometry.center.x, geometry.center.y),
            },
            {
              opacity: "1",
              offset: 0.78,
              transform: moveFlightTo(
                geometry.viewportWidth + geometry.largePlaneSize * 0.25,
                geometry.center.y - 58,
              ),
            },
            {
              opacity: "0",
              transform: moveFlightTo(
                geometry.viewportWidth + geometry.largePlaneSize * 0.62,
                geometry.center.y - 72,
              ),
            },
          ],
          { duration: 860, easing: "cubic-bezier(.42,0,.76,.34)" },
        ),
        playElementAnimation(
          contactFlightPlane,
          [
            { opacity: "1", transform: "rotate(42deg) scale(0.78)" },
            {
              opacity: "1",
              transform: `rotate(46deg) scale(${geometry.largeScale})`,
            },
          ],
          { duration: 860, easing: "cubic-bezier(.16,.7,.3,1)" },
        ),
        playElementAnimation(
          contactVeil,
          [{ opacity: "1" }, { opacity: "0" }],
          {
            duration: 760,
            delay: 80,
            easing: "ease-in",
          },
        ),
      ]);

      const returnGeometry = getContactFlightGeometry();
      contactFlight.style.opacity = "0";
      contactFlight.style.transform = moveFlightTo(
        returnGeometry.origin.x - 52,
        returnGeometry.origin.y,
      );
      contactFlightPlane.style.opacity = "0";
      contactFlightPlane.style.transform = "rotate(42deg) scale(1)";

      await Promise.all([
        playElementAnimation(
          contactFlight,
          [
            {
              opacity: "0",
              transform: moveFlightTo(
                returnGeometry.origin.x - 52,
                returnGeometry.origin.y,
              ),
            },
            {
              opacity: "1",
              offset: 0.28,
              transform: moveFlightTo(
                returnGeometry.origin.x - 32,
                returnGeometry.origin.y,
              ),
            },
            {
              opacity: "1",
              transform: moveFlightTo(
                returnGeometry.origin.x,
                returnGeometry.origin.y,
              ),
            },
          ],
          { duration: 360, easing: "cubic-bezier(.22,1,.36,1)" },
        ),
        playElementAnimation(
          contactFlightPlane,
          [{ opacity: "0" }, { opacity: "1" }],
          { duration: 260, delay: 70, easing: "ease-out" },
        ),
      ]);
    }

    contactModal.close();
    contactTrigger?.classList.remove("is-flight-active");
    document.body.classList.remove("is-contact-open");
    contactState = "closed";
    closeContactAfterOpening = false;
    contactTrigger?.focus({ preventScroll: true });
  }

  async function copyContactEmail() {
    if (!contactCopy) return;
    const email = contactCopy.dataset.email;
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      contactCopy.textContent = "Copied";
      window.clearTimeout(copyResetTimer);
      copyResetTimer = window.setTimeout(() => {
        contactCopy.textContent = "Copy email";
      }, 1800);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

  function handleContactCancel(event) {
    event.preventDefault();
    closeContactExperience();
  }

  function handleContactKeydown(event) {
    if (event.key !== "Escape" || !contactModal?.open) return;
    event.preventDefault();
    closeContactExperience();
  }

  contactTrigger?.addEventListener("click", openContactExperience);
  contactClose?.addEventListener("click", closeContactExperience);
  contactVeil?.addEventListener("click", closeContactExperience);
  contactCopy?.addEventListener("click", copyContactEmail);
  contactModal?.addEventListener("cancel", handleContactCancel);
  window.addEventListener("keydown", handleContactKeydown);

  function dispose() {
    contactTrigger?.removeEventListener("click", openContactExperience);
    contactClose?.removeEventListener("click", closeContactExperience);
    contactVeil?.removeEventListener("click", closeContactExperience);
    contactCopy?.removeEventListener("click", copyContactEmail);
    contactModal?.removeEventListener("cancel", handleContactCancel);
    window.removeEventListener("keydown", handleContactKeydown);
    window.clearTimeout(copyResetTimer);
  }

  return dispose;
}
