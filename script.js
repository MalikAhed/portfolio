const menuButton = document.querySelector("[data-menu-button]")
const menu = document.querySelector("[data-menu]")
const header = document.querySelector("[data-header]")

function closeMenu({ restoreFocus = false } = {}) {
  if (!menuButton || !menu) return
  menuButton.setAttribute("aria-expanded", "false")
  menu.removeAttribute("data-open")
  document.body.classList.remove("menu-open")
  if (restoreFocus) menuButton.focus()
}

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true"
  if (isOpen) return closeMenu({ restoreFocus: true })
  menuButton.setAttribute("aria-expanded", "true")
  menu?.setAttribute("data-open", "")
  document.body.classList.add("menu-open")
  menu?.querySelector("a")?.focus()
})

menu?.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu()
})

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu?.hasAttribute("data-open")) closeMenu({ restoreFocus: true })
})

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) closeMenu()
})

const updateHeader = () => header?.toggleAttribute("data-scrolled", window.scrollY > 24)
updateHeader()
window.addEventListener("scroll", updateHeader, { passive: true })
document.querySelector("[data-year]").textContent = new Date().getFullYear()
