(() => {
  const nav = document.getElementById("leo-nav");
  const sentinel = document.getElementById("leo-nav-sentinel");
  const menu = document.getElementById("leo-nav-menu");
  if (!nav || !menu) return;

  const variant = nav.getAttribute("data-variant") || "home";
  document.body.classList.add("has-leo-nav");
  document.body.setAttribute("data-leo-nav-variant", variant);

  const openBtns = [...document.querySelectorAll("[data-leo-nav-open]")];
  const closeEls = [...document.querySelectorAll("[data-leo-nav-close]")];
  const aboutBlocks = [...document.querySelectorAll(".leo-nav-about")];
  const cityToggle = document.getElementById("leo-nav-city-toggle");
  const cityMenu = document.getElementById("leo-nav-city-menu");
  const searchInput = document.getElementById("leo-nav-search");

  function setMenuOpen(open) {
    if (open) {
      menu.removeAttribute("hidden");
      document.body.classList.add("is-leo-nav-menu-open");
    } else {
      menu.setAttribute("hidden", "");
      document.body.classList.remove("is-leo-nav-menu-open");
    }
    openBtns.forEach((btn) => btn.setAttribute("aria-expanded", String(open)));
    if (open && searchInput) {
      window.requestAnimationFrame(() => searchInput.focus());
    }
  }

  function closeOverlays() {
    setMenuOpen(false);
    closeCitySwitcher();
    aboutBlocks.forEach(closeAbout);
  }

  openBtns.forEach((btn) => {
    btn.addEventListener("click", () => setMenuOpen(true));
  });
  closeEls.forEach((el) => {
    el.addEventListener("click", () => setMenuOpen(false));
  });
  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeOverlays();
  });

  /* —— Scroll state via sentinel —— */
  function placeSentinel() {
    if (!sentinel) return;
    /* Measure top-of-page nav height without scrolled class affecting layout */
    const wasScrolled = nav.classList.contains("is-scrolled");
    if (wasScrolled) nav.classList.remove("is-scrolled");
    const topBlock = nav.querySelector(".leo-nav-top");
    const height = topBlock
      ? topBlock.getBoundingClientRect().height
      : nav.getBoundingClientRect().height;
    if (wasScrolled) nav.classList.add("is-scrolled");
    /* Spacer in document flow equal to top-of-page nav; leaving it triggers scrolled state */
    sentinel.style.height = "1px";
    sentinel.style.marginTop = `${Math.max(height - 1, 0)}px`;
    document.documentElement.style.setProperty("--leo-nav-offset", `${height}px`);
  }

  placeSentinel();
  window.addEventListener("resize", placeSentinel);

  if (sentinel && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const scrolled = !entry.isIntersecting;
        nav.classList.toggle("is-scrolled", scrolled);
      },
      { root: null, threshold: 0, rootMargin: "0px" }
    );
    observer.observe(sentinel);
  } else {
    const onScroll = () => {
      const topBlock = nav.querySelector(".leo-nav-top");
      const height = topBlock ? topBlock.offsetHeight : 56;
      nav.classList.toggle("is-scrolled", window.scrollY > height);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* —— About dropdowns —— */
  function closeAbout(block) {
    const trigger = block.querySelector(".leo-nav-about-trigger");
    const dropdown = block.querySelector(".leo-nav-dropdown");
    if (dropdown) dropdown.setAttribute("hidden", "");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }

  function openAbout(block) {
    aboutBlocks.forEach((other) => {
      if (other !== block) closeAbout(other);
    });
    const trigger = block.querySelector(".leo-nav-about-trigger");
    const dropdown = block.querySelector(".leo-nav-dropdown");
    if (dropdown) dropdown.removeAttribute("hidden");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
  }

  aboutBlocks.forEach((block) => {
    const trigger = block.querySelector(".leo-nav-about-trigger");
    if (!trigger) return;

    block.addEventListener("mouseenter", () => openAbout(block));
    block.addEventListener("mouseleave", () => closeAbout(block));
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const dropdown = block.querySelector(".leo-nav-dropdown");
      const open = dropdown && dropdown.hasAttribute("hidden");
      if (open) openAbout(block);
      else closeAbout(block);
    });
    trigger.addEventListener("focus", () => openAbout(block));
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".leo-nav-about")) {
      aboutBlocks.forEach(closeAbout);
    }
    if (
      cityMenu &&
      cityToggle &&
      !event.target.closest(".leo-nav-city-switcher") &&
      !event.target.closest(".leo-nav-city-chevron")
    ) {
      closeCitySwitcher();
    }
  });

  /* —— City switcher (Today pages) —— */
  function closeCitySwitcher() {
    if (!cityMenu || !cityToggle) return;
    cityMenu.setAttribute("hidden", "");
    cityToggle.setAttribute("aria-expanded", "false");
  }

  function openCitySwitcher() {
    if (!cityMenu || !cityToggle) return;
    cityMenu.removeAttribute("hidden");
    cityToggle.setAttribute("aria-expanded", "true");
  }

  if (cityToggle && cityMenu) {
    cityToggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const open = cityMenu.hasAttribute("hidden");
      if (open) openCitySwitcher();
      else closeCitySwitcher();
    });
  }
})();
