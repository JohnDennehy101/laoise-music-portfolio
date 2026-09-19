const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");

menuToggle.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("is-active");
  menuToggle.setAttribute("aria-expanded", isOpen);
});
