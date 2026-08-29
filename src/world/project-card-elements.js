export function createButton(label, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  return button;
}

export function createModeIcon(type) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.classList.add("project-card__mode-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "1.8");
  path.setAttribute(
    "d",
    type === "preview"
      ? "M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z M9.5 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0Z"
      : "m8.5 7-5 5 5 5 M15.5 7l5 5-5 5 M13.5 4l-3 16",
  );
  icon.append(path);
  return icon;
}

export function createFullscreenIcon() {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.classList.add("project-card__fullscreen-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "1.8");
  icon.append(path);
  return { element: icon, path };
}

export function createActionIcon(type) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.classList.add("project-card__action-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "1.8");
  path.setAttribute(
    "d",
    type === "github"
      ? "M9 19c-4.5 1.4-4.5-2.5-6.3-3 M15.3 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.7-1.4 5.7-6.2A4.8 4.8 0 0 0 19.2 6a4.4 4.4 0 0 0-.1-3.3S18 2.4 15.5 4a12.1 12.1 0 0 0-6.5 0C6.5 2.4 5.4 2.7 5.4 2.7A4.4 4.4 0 0 0 5.3 6 4.8 4.8 0 0 0 4 9.3c0 4.8 2.9 5.9 5.7 6.2-.5.5-.6 1.2-.5 2V21"
      : "M14 4h6v6 M20 4 11 13 M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6",
  );
  icon.append(path);
  return icon;
}

function createTechMark(technology) {
  const item = document.createElement("span");
  item.className = "project-card__tech";
  item.setAttribute("aria-label", technology.label);
  if (technology.hideLabel) item.classList.add("is-logo-only");
  if (technology.fillLogo) item.classList.add("is-logo-fill");
  item.style.setProperty("--tech-background", technology.background ?? "#fff");
  item.style.setProperty(
    "--tech-foreground",
    technology.foreground ?? "#1c1b19",
  );
  item.style.setProperty("--tech-logo-scale", technology.logoScale ?? 1);
  if (technology.markSize) {
    item.style.setProperty("--tech-mark-size", technology.markSize);
  }

  const mark = document.createElement("span");
  mark.className = "project-card__tech-mark";
  mark.textContent = technology.mark;

  if (technology.logo) {
    const logo = document.createElement("img");
    logo.className = "project-card__tech-logo";
    if (technology.invertLogo) logo.classList.add("is-inverted");
    logo.src = technology.logo;
    logo.alt = "";
    logo.loading = "lazy";
    logo.decoding = "async";
    mark.textContent = "";
    logo.addEventListener(
      "error",
      () => {
        logo.remove();
        mark.textContent = technology.mark;
      },
      { once: true },
    );
    mark.append(logo);
  }

  const label = document.createElement("span");
  label.className = "project-card__tech-label";
  label.textContent = technology.label;
  if (technology.hideLabel) label.setAttribute("aria-hidden", "true");
  item.append(mark, label);
  return item;
}

export function createTechMarquee(project) {
  const marquee = document.createElement("div");
  marquee.className = "project-card__tech-marquee";
  marquee.setAttribute(
    "aria-label",
    `Technologies used: ${project.technologies.map(({ label }) => label).join(", ")}`,
  );

  const track = document.createElement("div");
  track.className = "project-card__tech-track";
  [false, true].forEach((duplicate) => {
    const group = document.createElement("div");
    group.className = "project-card__tech-group";
    if (duplicate) group.setAttribute("aria-hidden", "true");
    project.technologies.forEach((technology) =>
      group.append(createTechMark(technology)),
    );
    track.append(group);
  });
  marquee.append(track);
  return marquee;
}

export function createPreviewLoader(projectTitle, theme) {
  const element = document.createElement("div");
  element.className = "project-card__preview-loader";
  if (theme) {
    element.classList.add(`project-card__preview-loader--${theme}`);
  }
  element.setAttribute("role", "status");
  element.setAttribute("aria-live", "polite");
  element.setAttribute("aria-label", `Preparing ${projectTitle} preview`);

  const spinner = document.createElement("span");
  spinner.className = "project-card__preview-loader-spinner";
  spinner.setAttribute("aria-hidden", "true");

  const message = document.createElement("span");
  message.className = "project-card__preview-loader-message";
  message.textContent = "Preparing preview…";

  element.append(spinner, message);
  return element;
}
