(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* —— Hero city switcher + period bands —— */
  const hero = document.getElementById("hero");
  const cityButtons = [...document.querySelectorAll(".hero-city-btn")];
  const periodStacks = [...document.querySelectorAll(".hero-periods")];
  const exploreLink = document.getElementById("hero-explore");
  const exploreCity = document.getElementById("hero-explore-city");
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
    const selectedBtn = cityButtons.find((btn) => btn.dataset.city === cityId);
    if (exploreLink) {
      exploreLink.href = `/what-to-do-in-${encodeURIComponent(cityId)}-today`;
      exploreLink.dataset.city = cityId;
    }
    if (exploreCity && selectedBtn) {
      exploreCity.textContent = selectedBtn.textContent.trim();
    }
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
  let pinAnimToken = 0;
  function playPinPop() {
    if (!photoGrid) return;
    const token = ++pinAnimToken;
    const pins = [...photoGrid.querySelectorAll(".map-pin")];
    pins.forEach((pin) => pin.classList.remove("is-popped"));
    if (reduceMotion) {
      pins.forEach((pin) => pin.classList.add("is-popped"));
      return;
    }
    void photoGrid.offsetWidth;
    pins.forEach((pin, i) => {
      window.setTimeout(() => {
        if (token !== pinAnimToken) return;
        pin.classList.add("is-popped");
      }, i * 120);
    });
  }
  onceIntersect(document.getElementById("feature-01"), playPinPop);
  document.querySelector("#feature-01 .feature-replay")?.addEventListener("click", playPinPop);

  const matchCard = document.getElementById("match-card");
  const matchSmiley = document.getElementById("match-smiley");
  const matchProgress = document.getElementById("match-smiley-progress");
  const matchSmile = document.getElementById("match-smiley-smile");
  const matchHeart = document.getElementById("match-smiley-heart");
  let matchAnimToken = 0;

  // iOS LeoMagicIndicator: heart when fillPercentage > 0.75, else smile
  // Tone colors: Excellent/Good → green, OK → yellow, Poor → red
  function leoMagicTone(pct) {
    if (pct >= 60) return "good";
    if (pct >= 40) return "ok";
    return "poor";
  }

  function setSmiley(pct) {
    if (!matchSmiley || !matchProgress) return;
    const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
    matchSmiley.dataset.pct = String(clamped);
    matchSmiley.dataset.tone = leoMagicTone(clamped);
    matchProgress.style.strokeDasharray = `${clamped} 100`;
    const useHeart = clamped > 75;
    if (matchSmile) matchSmile.toggleAttribute("hidden", useHeart);
    if (matchHeart) matchHeart.toggleAttribute("hidden", !useHeart);
  }

  function playMatchBars() {
    if (!matchCard) return;
    const token = ++matchAnimToken;
    const fills = [...matchCard.querySelectorAll(".match-fill")];
    const sequence = [
      { fillIndex: 0, width: 100, pct: 30 },
      { fillIndex: 1, width: 70, pct: 65 },
      { fillIndex: 2, width: 80, pct: 85 },
    ];

    fills.forEach((f) => {
      f.style.width = "0%";
    });
    setSmiley(0);

    if (reduceMotion) {
      fills.forEach((f) => {
        f.style.width = `${f.dataset.fill}%`;
      });
      setSmiley(85);
      return;
    }

    void matchCard.offsetWidth;
    sequence.forEach((step, n) => {
      window.setTimeout(() => {
        if (token !== matchAnimToken) return;
        const fill = fills[step.fillIndex];
        if (fill) fill.style.width = `${step.width}%`;
        setSmiley(step.pct);
      }, n * 700);
    });
  }
  onceIntersect(document.getElementById("feature-02"), playMatchBars);
  document.querySelector("#feature-02 .feature-replay")?.addEventListener("click", playMatchBars);

  const PARIS_ACTIVITIES = [
    { title: "Marché des Enfants Rouges", sub: "Covered market · Le Marais", start: "9:00", end: "10:15" },
    { title: "Place des Vosges", sub: "Garden square · Walk", start: "10:45", end: "12:00" },
    { title: "Café de Flore", sub: "Classic café · Saint-Germain", start: "12:15", end: "13:30" },
    { title: "Musée d'Orsay", sub: "Impressionists · Left Bank", start: "14:00", end: "16:00" },
    { title: "Jardin du Luxembourg", sub: "Palace gardens · Stroll", start: "16:15", end: "17:30" },
    { title: "Shakespeare and Company", sub: "Bookstore · Latin Quarter", start: "17:45", end: "18:30" },
    { title: "Seine sunset walk", sub: "Riverbank · Evening", start: "18:45", end: "20:00" },
    { title: "Le Comptoir du Relais", sub: "Bistro dinner · Odéon", start: "20:15", end: "22:00" },
  ];

  const CHIP_ROUNDS = 5;
  const CHIP_MAX_BEHIND = 3;
  const chipWait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const createStackCard = (activity) => {
    const el = document.createElement("div");
    el.className = "chip-card";
    el.innerHTML =
      `<div class="chip-card-photo phatch"></div>` +
      `<div class="chip-card-meta">` +
      `<div class="chip-card-body">` +
      `<div class="chip-card-title"></div>` +
      `<div class="chip-card-sub"></div>` +
      `</div>` +
      `<div class="chip-card-times"><span></span><span></span></div>` +
      `</div>`;
    el.querySelector(".chip-card-title").textContent = activity.title;
    el.querySelector(".chip-card-sub").textContent = activity.sub;
    const times = el.querySelectorAll(".chip-card-times span");
    times[0].textContent = activity.start;
    times[1].textContent = activity.end;
    return el;
  };

  const createOptionRow = (pickIndex) => {
    const row = document.createElement("div");
    row.className = "chip-row";
    for (let i = 0; i < 3; i++) {
      const opt = document.createElement("div");
      opt.className = "chip-option phatch";
      if (i === pickIndex) opt.setAttribute("data-pick", "");
      row.appendChild(opt);
    }
    return row;
  };

  const revealRow = (row) => {
    if (!row) return [];
    row.classList.add("is-active");
    row.classList.remove("is-spent");
    const opts = [...row.querySelectorAll(".chip-option")];
    opts.forEach((opt, i) => {
      window.setTimeout(() => opt.classList.add("is-shown"), i * 110);
    });
    return opts;
  };

  const settleRow = (row) => {
    if (!row) return;
    row.classList.remove("is-active");
    row.classList.add("is-spent");
  };

  const pickFromRow = (opts) => {
    const picked = opts.find((o) => o.hasAttribute("data-pick")) ?? opts[1] ?? opts[0];
    opts.forEach((o) => {
      if (o === picked) o.classList.add("is-picked");
      else o.classList.add("is-rejected");
    });
    return picked;
  };

  const applyStackDepths = (cards) => {
    cards.forEach((card, i) => {
      card.dataset.depth = String(i);
      card.classList.add("is-live");
      card.classList.remove("is-entering", "is-exiting");
    });
  };

  const pushStackCard = async (stack, cards, activity, animate) => {
    const card = createStackCard(activity);
    stack.appendChild(card);

    if (animate) {
      card.classList.add("is-entering");
      void card.offsetHeight;
      cards.unshift(card);
      cards.forEach((c, i) => {
        if (i === 0) return;
        c.dataset.depth = String(i);
        c.classList.add("is-live");
        c.classList.remove("is-entering", "is-exiting");
      });
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            card.classList.remove("is-entering");
            card.dataset.depth = "0";
            card.classList.add("is-live");
            resolve();
          });
        });
      });
    } else {
      cards.unshift(card);
      applyStackDepths(cards);
    }

    while (cards.length > CHIP_MAX_BEHIND + 1) {
      const dropped = cards.pop();
      if (!dropped) break;
      if (animate) {
        dropped.classList.add("is-exiting");
        dropped.removeAttribute("data-depth");
        await chipWait(480);
      }
      dropped.remove();
    }

    if (animate) await chipWait(560);
    return card;
  };

  const renderFinalStack = (stack, stage, pickIndexes) => {
    const cards = [];
    const start = Math.max(0, CHIP_ROUNDS - 1 - CHIP_MAX_BEHIND);
    for (let i = CHIP_ROUNDS - 1; i >= start; i--) {
      const card = createStackCard(PARIS_ACTIVITIES[i]);
      stack.appendChild(card);
      cards.push(card);
    }
    applyStackDepths(cards);

    const row = createOptionRow(pickIndexes[CHIP_ROUNDS % pickIndexes.length]);
    stage.replaceChildren(row);
    row.classList.add("is-active");
    row.querySelectorAll(".chip-option").forEach((c) => c.classList.add("is-shown"));
  };

  let chipAnimToken = 0;
  async function playChipBuilder() {
    const builder = document.getElementById("chip-builder");
    const stack = builder?.querySelector(".chip-stack");
    const stage = builder?.querySelector(".chip-stage");
    if (!builder || !stack || !stage) return;

    const token = ++chipAnimToken;
    stack.replaceChildren();
    stage.replaceChildren();

    const pickIndexes = [1, 0, 2, 1, 0];
    const cards = [];

    if (reduceMotion) {
      renderFinalStack(stack, stage, pickIndexes);
      return;
    }

    for (let i = 0; i < CHIP_ROUNDS; i++) {
      if (token !== chipAnimToken) return;
      const row = createOptionRow(pickIndexes[i % pickIndexes.length]);
      stage.replaceChildren(row);
      const opts = revealRow(row);
      await chipWait(780);
      if (token !== chipAnimToken) return;
      pickFromRow(opts);
      await chipWait(300);
      if (token !== chipAnimToken) return;
      settleRow(row);
      await chipWait(220);
      if (token !== chipAnimToken) return;
      await pushStackCard(stack, cards, PARIS_ACTIVITIES[i], true);
      if (token !== chipAnimToken) return;
      await chipWait(160);
    }

    if (token !== chipAnimToken) return;
    const row = createOptionRow(pickIndexes[CHIP_ROUNDS % pickIndexes.length]);
    stage.replaceChildren(row);
    revealRow(row);
  }
  onceIntersect(document.getElementById("feature-03"), () => {
    void playChipBuilder();
  });
  document.querySelector("#feature-03 .feature-replay")?.addEventListener("click", () => {
    void playChipBuilder();
  });

  const mapCluster = document.getElementById("map-cluster");
  let mapAnimToken = 0;
  function playMapCluster() {
    if (!mapCluster) return;
    const token = ++mapAnimToken;
    const stops = [...mapCluster.querySelectorAll(".map-stop")];
    mapCluster.classList.remove("is-animated");
    stops.forEach((s) => s.classList.remove("is-shown"));

    if (reduceMotion) {
      mapCluster.classList.add("is-animated");
      stops.forEach((s) => s.classList.add("is-shown"));
      return;
    }

    void mapCluster.offsetWidth;
    stops.forEach((stop, i) => {
      window.setTimeout(() => {
        if (token !== mapAnimToken) return;
        stop.classList.add("is-shown");
      }, i * 350);
    });
    window.setTimeout(() => {
      if (token !== mapAnimToken) return;
      mapCluster.classList.add("is-animated");
    }, 100);
  }
  onceIntersect(document.getElementById("feature-04"), playMapCluster);
  document.querySelector("#feature-04 .feature-replay")?.addEventListener("click", playMapCluster);
})();

/* feature-replay-1 */
