(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* —— Nav fade + mobile drawer —— */
  const nav = document.getElementById("site-nav");
  const menuBtn = document.getElementById("nav-menu");
  const drawer = document.getElementById("nav-drawer");

  function onScrollNav() {
    if (!nav) return;
    nav.classList.toggle("is-solid", window.scrollY > 24);
  }

  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  if (menuBtn && drawer) {
    menuBtn.addEventListener("click", () => {
      const open = drawer.hasAttribute("hidden");
      if (open) drawer.removeAttribute("hidden");
      else drawer.setAttribute("hidden", "");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        drawer.setAttribute("hidden", "");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* —— Hero city switcher + period bands —— */
  const hero = document.getElementById("hero");
  const cityButtons = [...document.querySelectorAll(".hero-city-btn")];
  const periodStacks = [...document.querySelectorAll(".hero-periods")];
  const BAND_MS = 360;
  const BAND_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  /* Reverse of BAND_EASE so collapse is expand played backwards */
  const BAND_EASE_REVERSE = "cubic-bezier(0.64, 0, 0.78, 0)";
  const bandIntent = new WeakMap();
  const bandFlipToken = new WeakMap();

  function setExpanded(band, open) {
    band.classList.toggle("is-expanded", open);
    band.setAttribute("aria-expanded", String(open));
    bandIntent.set(band, open);
    const toggle = band.querySelector(".band-toggle");
    if (toggle) {
      toggle.setAttribute("aria-label", open ? "Collapse period" : "Expand period");
    }
  }

  function isBandOpen(band) {
    if (!band) return false;
    return bandIntent.has(band)
      ? bandIntent.get(band)
      : band.classList.contains("is-expanded");
  }

  function collapseBandsIn(root, { animate = false, except = null } = {}) {
    if (!root) return;
    root.querySelectorAll(".hero-band--period").forEach((band) => {
      if (except && band === except) return;
      if (!isBandOpen(band)) return;
      if (animate) flipBand(band, false);
      else setExpanded(band, false);
    });
  }

  function expandBand(band) {
    if (!band || !hero?.contains(band)) return;
    const stack = band.closest(".hero-periods");
    if (!stack || stack.hasAttribute("hidden")) return;
    collapseBandsIn(hero, { animate: true, except: band });
    flipBand(band, true);
  }

  /**
   * FLIP expand/collapse: band height + card size share one timeline.
   * Card hinges from its top-right (next to the period label).
   *
   * Expand: commit expanded layout, invert from the small rect, play to identity.
   * Collapse: keep expanded chrome, animate to the small rect, then commit —
   * so shrink is the same morph as expand, run in reverse (not a different path).
   */
  function flipBand(band, open) {
    if (!band) return Promise.resolve();
    const already = bandIntent.has(band)
      ? bandIntent.get(band)
      : band.classList.contains("is-expanded");
    if (already === open) return Promise.resolve();
    bandIntent.set(band, open);

    const card = band.querySelector(".calling-card");
    if (!card || reduceMotion) {
      setExpanded(band, open);
      return Promise.resolve();
    }

    const token = (bandFlipToken.get(band) || 0) + 1;
    bandFlipToken.set(band, token);

    band.getAnimations().forEach((a) => a.cancel());
    card.getAnimations().forEach((a) => a.cancel());

    const firstBand = band.getBoundingClientRect();
    const firstCard = card.getBoundingClientRect();

    band.classList.add("is-flipping");
    card.style.transformOrigin = "top right";

    let bandAnim;
    let cardAnim;

    if (open) {
      /* Expand: last layout first, invert small→large, ease out into open */
      setExpanded(band, true);
      const lastBand = band.getBoundingClientRect();
      const lastCard = card.getBoundingClientRect();
      const dx = firstCard.right - lastCard.right;
      const dy = firstCard.top - lastCard.top;
      const sx = firstCard.width / Math.max(lastCard.width, 1);
      const sy = firstCard.height / Math.max(lastCard.height, 1);
      const opts = { duration: BAND_MS, easing: BAND_EASE, fill: "none" };

      bandAnim = band.animate(
        [{ height: `${firstBand.height}px` }, { height: `${lastBand.height}px` }],
        opts
      );
      cardAnim = card.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
          { transform: "none" },
        ],
        opts
      );
    } else {
      /*
       * Collapse: peek the collapsed rects, restore expanded chrome, then
       * animate large→small (reverse of expand). Commit collapsed only after.
       */
      setExpanded(band, false);
      const lastBand = band.getBoundingClientRect();
      const lastCard = card.getBoundingClientRect();
      setExpanded(band, true);
      /* Re-assert intent: still closing even while chrome stays expanded */
      bandIntent.set(band, false);
      band.getBoundingClientRect();

      const dx = lastCard.right - firstCard.right;
      const dy = lastCard.top - firstCard.top;
      const sx = lastCard.width / Math.max(firstCard.width, 1);
      const sy = lastCard.height / Math.max(firstCard.height, 1);
      const opts = {
        duration: BAND_MS,
        easing: BAND_EASE_REVERSE,
        fill: "forwards",
      };

      bandAnim = band.animate(
        [{ height: `${firstBand.height}px` }, { height: `${lastBand.height}px` }],
        opts
      );
      cardAnim = card.animate(
        [
          { transform: "none" },
          { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        ],
        opts
      );
    }

    return Promise.all([bandAnim.finished, cardAnim.finished])
      .catch(() => {})
      .finally(() => {
        if (bandFlipToken.get(band) !== token) return;
        setExpanded(band, open);
        band.classList.remove("is-flipping");
        band.style.height = "";
        card.style.transform = "";
        card.style.transformOrigin = "";
        bandAnim.cancel();
        cardAnim.cancel();
      });
  }

  function selectCity(cityId) {
    if (!cityId) return;
    const already =
      cityButtons.find((btn) => btn.classList.contains("is-selected"))?.dataset
        .city === cityId;
    if (already) return;
    cityButtons.forEach((btn) => {
      const selected = btn.dataset.city === cityId;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-selected", String(selected));
    });
    periodStacks.forEach((stack) => {
      const match = stack.dataset.city === cityId;
      if (match) {
        stack.removeAttribute("hidden");
      } else {
        collapseBandsIn(stack);
        stack.setAttribute("hidden", "");
      }
    });
  }

  if (cityButtons.length) {
    cityButtons.forEach((btn) => {
      btn.addEventListener("click", () => selectCity(btn.dataset.city));
      btn.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        selectCity(btn.dataset.city);
      });
    });
  }

  if (hero) {
    document.addEventListener("click", (e) => {
      const band = e.target.closest(".hero-band--period");
      const onToggle = Boolean(e.target.closest(".band-toggle"));

      if (band && hero.contains(band)) {
        const stack = band.closest(".hero-periods");
        if (!stack || stack.hasAttribute("hidden")) return;

        if (onToggle) {
          if (isBandOpen(band)) flipBand(band, false);
          else expandBand(band);
          return;
        }

        /* Collapsed band: click anywhere opens. Expanded body: stay open. */
        if (!isBandOpen(band)) expandBand(band);
        return;
      }

      /* Click/tap outside period bands collapses any open band. */
      collapseBandsIn(hero, { animate: true });
    });

    hero.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        collapseBandsIn(hero, { animate: true });
        return;
      }
      if (e.key !== "Enter" && e.key !== " ") return;
      const band = e.target.closest(".hero-band--period");
      if (!band || !hero.contains(band)) return;
      e.preventDefault();
      if (e.target.closest(".band-toggle")) {
        if (isBandOpen(band)) flipBand(band, false);
        else expandBand(band);
        return;
      }
      if (!isBandOpen(band)) expandBand(band);
    });
  }

  /* —— FAQ: one open at a time —— */
  const faqList = document.getElementById("faq-list");
  if (faqList) {
    faqList.querySelectorAll("details").forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        faqList.querySelectorAll("details").forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  /* —— Scroll-triggered feature animations —— */
  function onceIntersect(el, cb, opts = {}) {
    if (!el) return;
    if (reduceMotion) {
      cb();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            cb();
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.35, ...opts }
    );
    io.observe(el);
  }

  const photoGrid = document.getElementById("photo-grid");
  onceIntersect(document.getElementById("feature-01"), () => {
    if (!photoGrid || reduceMotion) return;
    const cells = [...photoGrid.querySelectorAll(".photo-grid-cell")];
    let i = 0;
    function pulseNext() {
      if (i >= cells.length) return;
      const cell = cells[i];
      cell.classList.add("is-pulse");
      window.setTimeout(() => {
        cell.classList.remove("is-pulse");
        i += 1;
        window.setTimeout(pulseNext, 80);
      }, 400);
    }
    pulseNext();
  });

  const matchCard = document.getElementById("match-card");
  const matchSmiley = document.getElementById("match-smiley");
  const matchFace = document.getElementById("match-smiley-face");

  function setSmiley(pct, face, color) {
    if (!matchSmiley || !matchFace) return;
    const deg = Math.round((pct / 100) * 360);
    matchSmiley.style.background = `conic-gradient(var(--leo-blue) 0deg ${deg}deg, #ece7dc ${deg}deg 360deg)`;
    matchFace.textContent = face;
    matchFace.style.color = color;
  }

  onceIntersect(document.getElementById("feature-02"), () => {
    if (!matchCard) return;
    const fills = [...matchCard.querySelectorAll(".match-fill")];
    const sequence = [
      { fillIndex: 0, width: 100, pct: 30, face: "☹", color: "#999" },
      { fillIndex: 1, width: 70, pct: 65, face: "☺", color: "var(--leo-gold)" },
      { fillIndex: 2, width: 80, pct: 85, face: "♥‿♥", color: "var(--leo-red)" },
    ];

    if (reduceMotion) {
      fills.forEach((f) => {
        f.style.width = `${f.dataset.fill}%`;
      });
      setSmiley(85, "♥‿♥", "var(--leo-red)");
      return;
    }

    setSmiley(0, "☹", "#999");
    sequence.forEach((step, n) => {
      window.setTimeout(() => {
        const fill = fills[step.fillIndex];
        if (fill) fill.style.width = `${step.width}%`;
        setSmiley(step.pct, step.face, step.color);
      }, n * 700);
    });
  });

  const chipExpanded = document.getElementById("chip-expanded");
  const chipRow1 = document.getElementById("chip-row-1");
  const chipRow2 = document.getElementById("chip-row-2");
  const chipPlaceholder = document.getElementById("chip-placeholder");

  onceIntersect(document.getElementById("feature-03"), () => {
    if (reduceMotion) {
      chipExpanded?.classList.remove("is-hidden");
      chipRow1?.querySelectorAll(".chip-option").forEach((c) => c.classList.add("is-shown"));
      chipRow2?.classList.remove("is-hidden");
      chipRow2?.querySelectorAll(".chip-option").forEach((c) => c.classList.add("is-shown"));
      return;
    }

    const opts1 = [...(chipRow1?.querySelectorAll(".chip-option") ?? [])];
    opts1.forEach((opt, i) => {
      window.setTimeout(() => opt.classList.add("is-shown"), i * 120);
    });

    window.setTimeout(() => {
      chipExpanded?.classList.remove("is-hidden");
      opts1.forEach((o) => {
        o.style.opacity = "0.35";
      });
    }, 900);

    window.setTimeout(() => {
      chipRow2?.classList.remove("is-hidden");
      const opts2 = [...(chipRow2?.querySelectorAll(".chip-option") ?? [])];
      opts2.forEach((opt, i) => {
        window.setTimeout(() => opt.classList.add("is-shown"), i * 120);
      });
    }, 1600);

    window.setTimeout(() => {
      chipPlaceholder?.classList.remove("is-hidden");
    }, 2400);
  });

  const mapCluster = document.getElementById("map-cluster");
  onceIntersect(document.getElementById("feature-04"), () => {
    if (!mapCluster) return;
    const stops = [...mapCluster.querySelectorAll(".map-stop")];
    if (reduceMotion) {
      mapCluster.classList.add("is-animated");
      stops.forEach((s) => s.classList.add("is-shown"));
      return;
    }
    stops.forEach((stop, i) => {
      window.setTimeout(() => stop.classList.add("is-shown"), i * 350);
    });
    window.setTimeout(() => mapCluster.classList.add("is-animated"), 100);
  });
})();

/* band-toggle-1 */
