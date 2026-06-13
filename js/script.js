/* ============================================================
   VELMONT ASSOCIATES — interactions
   Lenis smooth scroll + GSAP (ScrollTrigger, SplitText, DrawSVG)
   ============================================================ */

(function () {
  "use strict";

  var body = document.body;
  var docEl = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gsapReady = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* ---------- Hard fallback: no GSAP or reduced motion ---------- */
  if (!gsapReady || reduceMotion) {
    docEl.classList.add("no-anim");
    var loaderEl = document.querySelector(".loader");
    if (loaderEl) loaderEl.style.display = "none";
    initAccordion();
    initMobileMenu(null);
    initAnchors(null);
    initContactModal(null);
    initOrbit();
    initRotator();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  if (window.DrawSVGPlugin) gsap.registerPlugin(DrawSVGPlugin);

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Scroll direction (hide nav on scroll down) ---------- */
  var lastY = window.scrollY;
  function onScrollDirection(y) {
    body.dataset.scrollingStarted = y > 60 ? "true" : "false";
    if (Math.abs(y - lastY) > 4 && !body.classList.contains("menu-open")) {
      body.dataset.scrollingDirection = y > lastY ? "down" : "up";
    }
    lastY = y;
  }
  if (lenis) {
    lenis.on("scroll", function (e) { onScrollDirection(e.scroll); });
  } else {
    window.addEventListener("scroll", function () { onScrollDirection(window.scrollY); }, { passive: true });
  }

  /* ---------- Nav theme switching per section ---------- */
  gsap.utils.toArray("[data-theme-section]").forEach(function (sec) {
    ScrollTrigger.create({
      trigger: sec,
      start: "top 90px",
      end: "bottom 90px",
      onToggle: function (self) {
        if (self.isActive) body.dataset.themeNav = sec.getAttribute("data-theme-section");
      }
    });
  });

  /* ---------- Hero intro timeline (plays after loader) ---------- */
  function buildHeroIntro() {
    var tl = gsap.timeline({ paused: true, defaults: { ease: "power4.out" } });

    tl.from(".nav-container", { y: -24, autoAlpha: 0, duration: 0.9 }, 0);

    tl.fromTo(".section_hero .hero-badge",
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.8 }, 0.1);

    tl.from(".hero-line__inner", {
      yPercent: 118,
      duration: 1.25,
      stagger: 0.11
    }, 0.18);

    tl.fromTo(".hero-p", { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.75);
    tl.fromTo(".hero-ctas", { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.9);
    tl.fromTo(".hero-stats", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 1.05);
    tl.fromTo(".hero-scroll-cue", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 1.4);

    /* Draw the shelf */
    if (window.DrawSVGPlugin) {
      tl.from(".hero-art .draw", {
        drawSVG: "0%",
        duration: 1.5,
        stagger: 0.035,
        ease: "power2.inOut"
      }, 0.35);
    } else {
      tl.fromTo(".hero-art", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2 }, 0.5);
    }
    tl.fromTo(".hero-art text", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9 }, 1.6);

    return tl;
  }
  var heroIntro = buildHeroIntro();

  /* Gentle float on the shelf art + rings */
  gsap.to(".hero-art svg", { y: "-0.6em", duration: 4.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
  gsap.to(".hero-glow--1", { x: "-2em", y: "1.5em", duration: 7, ease: "sine.inOut", yoyo: true, repeat: -1 });
  gsap.to(".hero-glow--2", { x: "1.5em", y: "-1.5em", duration: 8, ease: "sine.inOut", yoyo: true, repeat: -1 });

  /* ---------- Loader ---------- */
  var loader = document.querySelector(".loader");
  var barFill = document.querySelector(".loader__bar-fill");
  var loaderDone = false;

  gsap.to(barFill, { scaleX: 0.72, duration: 1.1, ease: "power2.out" });

  function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;

    var tl = gsap.timeline();
    tl.to(barFill, { scaleX: 1, duration: 0.35, ease: "power2.inOut" });
    tl.to(".loader__inner", { yPercent: -16, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "+=0.12");
    tl.to(loader, { yPercent: -100, duration: 0.95, ease: "power4.inOut" });
    tl.add(function () { heroIntro.play(); }, "-=0.55");
    tl.set(loader, { display: "none" });
  }

  if (document.readyState === "complete") {
    setTimeout(finishLoader, 700);
  } else {
    window.addEventListener("load", function () { setTimeout(finishLoader, 350); });
  }
  setTimeout(finishLoader, 3000); /* safety net */

  /* ---------- Split-text reveals ---------- */
  function initSplits() {
    var targets = document.querySelectorAll("[data-split]");
    targets.forEach(function (el) {
      try {
        if (!window.SplitText) throw new Error("no SplitText");
        var split = new SplitText(el, { type: "lines", mask: "lines", linesClass: "split-line" });
        gsap.set(el, { visibility: "visible" });
        gsap.from(split.lines, {
          yPercent: 115,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        });
      } catch (e) {
        el.style.visibility = "visible";
      }
    });
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initSplits);
  } else {
    initSplits();
  }

  /* ---------- Generic reveals ---------- */
  gsap.utils.toArray("[data-reveal]").forEach(function (el, i) {
    gsap.from(el, {
      y: 46,
      autoAlpha: 0,
      duration: 1.1,
      ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true }
    });
  });

  /* .will-anim outside the hero — simple fade-up on scroll */
  gsap.utils.toArray(".will-anim").forEach(function (el) {
    if (el.closest(".section_hero")) return;
    gsap.fromTo(el,
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1, y: 0, duration: 1, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true }
      });
  });

  /* ---------- Parallax floats ---------- */
  gsap.utils.toArray("[data-parallax]").forEach(function (el) {
    var startP = parseFloat(el.getAttribute("data-parallax-start") || 30);
    var endP = parseFloat(el.getAttribute("data-parallax-end") || -30);
    gsap.fromTo(el,
      { yPercent: startP * 0.3 },
      {
        yPercent: endP * 0.3,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("section") || el,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
  });

  /* ---------- Footer wordmark ---------- */
  gsap.from(".footer-logo__char", {
    yPercent: 70,
    autoAlpha: 0,
    duration: 1.1,
    ease: "power4.out",
    stagger: 0.055,
    scrollTrigger: { trigger: ".footer-logo", start: "top 94%", once: true }
  });
  gsap.from(".footer-logo-sub", {
    autoAlpha: 0,
    duration: 1,
    delay: 0.4,
    scrollTrigger: { trigger: ".footer-logo", start: "top 94%", once: true }
  });

  /* ---------- Ledger rows ---------- */
  gsap.from(".ledger-row", {
    autoAlpha: 0,
    y: 18,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.12,
    scrollTrigger: { trigger: ".ledger-card", start: "top 80%", once: true }
  });

  /* ---------- Interactions ---------- */
  initAccordion();
  initMobileMenu(lenis);
  initAnchors(lenis);
  initContactModal(lenis);
  initOrbit();
  initRotator();

  /* ============================================================
     Shared interaction helpers
     ============================================================ */
  function initAccordion() {
    var items = document.querySelectorAll(".accordion__item");
    items.forEach(function (item) {
      var head = item.querySelector(".accordion__head");
      head.addEventListener("click", function () {
        var isActive = item.getAttribute("data-accordion-status") === "active";
        items.forEach(function (other) {
          other.setAttribute("data-accordion-status", "not-active");
          other.querySelector(".accordion__head").setAttribute("aria-expanded", "false");
        });
        if (!isActive) {
          item.setAttribute("data-accordion-status", "active");
          head.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  function initMobileMenu(lenisInstance) {
    var btn = document.querySelector(".menu-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var open = body.classList.toggle("menu-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (lenisInstance) { open ? lenisInstance.stop() : lenisInstance.start(); }
      else { body.style.overflow = open ? "hidden" : ""; }
    });
  }

  function initAnchors(lenisInstance) {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();

        var go = function () {
          if (lenisInstance) {
            lenisInstance.scrollTo(target, { offset: -70, duration: 1.4 });
          } else {
            target.scrollIntoView({ behavior: "smooth" });
          }
        };

        if (body.classList.contains("menu-open")) {
          body.classList.remove("menu-open");
          var btn = document.querySelector(".menu-btn");
          if (btn) btn.setAttribute("aria-expanded", "false");
          if (lenisInstance) lenisInstance.start();
          setTimeout(go, 450);
        } else {
          go();
        }
      });
    });
  }

  /* ---------- Contact modal ---------- */
  function initContactModal(lenisInstance) {
    var modal = document.querySelector(".contact-modal");
    if (!modal) return;

    var closeBtn = modal.querySelector(".contact-modal__close");
    var firstInput = modal.querySelector(".contact-form input");
    var form = modal.querySelector(".contact-form");
    var done = modal.querySelector(".contact-form__done");
    var lastFocus = null;
    var animOk = typeof window.gsap !== "undefined" && !docEl.classList.contains("no-anim");

    function isOpen() {
      return modal.getAttribute("data-modal-status") === "active";
    }

    function openModal() {
      if (isOpen()) return;
      lastFocus = document.activeElement;
      modal.setAttribute("data-modal-status", "active");
      modal.setAttribute("aria-hidden", "false");
      body.classList.add("modal-open");
      if (lenisInstance) { lenisInstance.stop(); } else { body.style.overflow = "hidden"; }

      if (animOk) {
        gsap.fromTo(modal.querySelectorAll(".contact-modal__copy > *"),
          { y: 30, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.95, ease: "power4.out", stagger: 0.07, delay: 0.2, overwrite: "auto", clearProps: "all" });
        gsap.fromTo(modal.querySelector(".contact-modal__card"),
          { y: 44, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 1.05, ease: "power4.out", delay: 0.38, overwrite: "auto", clearProps: "all" });
      }

      setTimeout(function () {
        if (firstInput) firstInput.focus({ preventScroll: true });
      }, animOk ? 700 : 80);
    }

    function closeModal() {
      if (!isOpen()) return;
      modal.setAttribute("data-modal-status", "not-active");
      modal.setAttribute("aria-hidden", "true");
      body.classList.remove("modal-open");
      if (lenisInstance) { lenisInstance.start(); } else { body.style.overflow = ""; }
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    document.querySelectorAll("[data-contact-trigger]").forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        if (body.classList.contains("menu-open")) {
          body.classList.remove("menu-open");
          var btn = document.querySelector(".menu-btn");
          if (btn) btn.setAttribute("aria-expanded", "false");
          setTimeout(openModal, 400);
        } else {
          openModal();
        }
      });
    });

    closeBtn.addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) closeModal();
    });

    var submitBtn = form.querySelector(".contact-form__submit");
    var btnText = form.querySelector(".btn__text");
    var errorEl = modal.querySelector(".contact-form__error");
    var sending = false;

    function val(sel) {
      var el = form.querySelector(sel);
      return el ? el.value.trim() : "";
    }

    function showError(msg) {
      if (!errorEl) return;
      errorEl.textContent = msg;
      errorEl.classList.add("is--visible");
    }

    function clearError() {
      if (!errorEl) return;
      errorEl.textContent = "";
      errorEl.classList.remove("is--visible");
    }

    function setSending(on) {
      sending = on;
      if (submitBtn) submitBtn.disabled = on;
      form.classList.toggle("is--sending", on);
      if (btnText) btnText.textContent = on ? "Sending…" : "Send & Book";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;
      clearError();
      if (!form.reportValidity()) return;

      var payload = {
        name: val("#cf-name"),
        email: val("#cf-email"),
        company: val("#cf-company"),
        phone: val("#cf-phone"),
        message: val("#cf-message"),
        company_website: val("#cf-company-website") // honeypot
      };

      setSending(true);

      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            return { ok: res.ok && data.ok, data: data };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            throw new Error((result.data && result.data.error) || "Something went wrong.");
          }
          form.classList.add("is--hidden");
          if (done) {
            done.classList.add("is--visible");
            if (animOk) {
              gsap.fromTo(done, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" });
            }
          }
        })
        .catch(function (err) {
          setSending(false);
          showError(
            (err && err.message ? err.message + " " : "") +
            "Please try again, or email sapehiaofficial@gmail.com directly."
          );
        });
    });
  }

  /* ============================================================
     ORBIT — placement journey (ported from radial-orbital-timeline)
     Auto-rotates; click a node to open its card and pause the spin;
     related nodes glow. Owns transform + opacity on each node so it
     stays independent of GSAP.
     ============================================================ */
  function initOrbit() {
    var root = document.querySelector("[data-orbit]");
    if (!root) return;
    var stage = root.querySelector(".orbit__stage");
    var nodes = Array.prototype.slice.call(root.querySelectorAll(".orbit__node"));
    if (!stage || !nodes.length) return;

    var total = nodes.length;
    var angle = 0;
    var auto = true;
    var openId = null;
    var radius = 0;

    function measure() {
      var r = stage.getBoundingClientRect();
      radius = Math.min(r.width, r.height) * 0.40;
    }

    function position() {
      for (var i = 0; i < total; i++) {
        var node = nodes[i];
        var a = ((i / total) * 360 + angle) % 360;
        var rad = (a * Math.PI) / 180;
        var x = radius * Math.cos(rad);
        var y = radius * Math.sin(rad);
        var open = node.classList.contains("is--open");
        var z = Math.round(100 + 50 * Math.cos(rad));
        var op = Math.max(0.45, Math.min(1, 0.45 + 0.55 * ((1 + Math.sin(rad)) / 2)));
        node.style.transform = "translate(-50%,-50%) translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
        node.style.zIndex = open ? 300 : z;
        node.style.opacity = open ? 1 : op;
      }
    }

    function relatedIds(node) {
      return (node.getAttribute("data-related") || "")
        .split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    }

    var settleTimer = null;
    function addSettle() {
      nodes.forEach(function (n) { n.classList.add("is--settling"); });
      clearTimeout(settleTimer);
      settleTimer = setTimeout(removeSettle, 820);
    }
    function removeSettle() {
      clearTimeout(settleTimer); settleTimer = null;
      nodes.forEach(function (n) { n.classList.remove("is--settling"); });
    }

    function clearOpen() {
      nodes.forEach(function (n) { n.classList.remove("is--open", "is--related"); });
      openId = null;
      auto = true;
      removeSettle();           /* drop the transition so the resuming spin stays smooth */
    }

    function openNode(node) {
      var id = node.getAttribute("data-id");
      if (openId === id) { clearOpen(); position(); return; }
      nodes.forEach(function (n) { n.classList.remove("is--open", "is--related"); });
      node.classList.add("is--open");
      openId = id;
      auto = false;
      var rel = relatedIds(node);
      nodes.forEach(function (n) {
        if (rel.indexOf(n.getAttribute("data-id")) >= 0) n.classList.add("is--related");
      });
      /* swing the open node to the top (270deg) so its card drops into the centre */
      var idx = nodes.indexOf(node);
      angle = 270 - (idx / total) * 360;
      addSettle();              /* animate the swing; spin is paused (auto=false) */
      position();
    }

    nodes.forEach(function (node) {
      var hit = node.querySelector(".orbit__hit") || node;
      hit.addEventListener("click", function (e) {
        e.stopPropagation();
        openNode(node);
      });
      hit.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openNode(node); }
      });
      var card = node.querySelector(".orbit__card");
      if (card) card.addEventListener("click", function (e) { e.stopPropagation(); });
      node.querySelectorAll("[data-goto]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var target = nodes.filter(function (n) {
            return n.getAttribute("data-id") === btn.getAttribute("data-goto");
          })[0];
          if (target) openNode(target);
        });
      });
    });

    stage.addEventListener("click", function (e) {
      if (e.target === stage ||
          e.target.classList.contains("orbit__ring") ||
          e.target.classList.contains("orbit__core")) {
        clearOpen();
        position();
      }
    });

    /* ---- smooth spin: rAF with delta-time, paused when off-screen ---- */
    var rafId = null;
    var last = 0;
    var SPEED = 5; /* degrees per second */

    function frame(now) {
      if (!last) last = now;
      var dt = (now - last) / 1000;
      last = now;
      if (auto && dt < 0.1) {           /* skip huge gaps (e.g. tab refocus) */
        angle = (angle + SPEED * dt) % 360;
        position();
      }
      rafId = requestAnimationFrame(frame);
    }
    function startSpin() {
      if (rafId === null && !reduceMotion) { last = 0; rafId = requestAnimationFrame(frame); }
    }
    function stopSpin() {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    }

    measure();
    position();
    /* keep the radius correct through font/layout settle and any resize */
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { measure(); position(); }).observe(stage);
    } else {
      window.addEventListener("resize", function () { measure(); position(); });
    }

    /* only run the loop while the orbit is actually on-screen */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? startSpin() : stopSpin(); });
      }, { threshold: 0.04 }).observe(stage);
    } else {
      startSpin();
    }
  }

  /* ============================================================
     ROTATOR — rotating headline word (ported from animated-hero)
     ============================================================ */
  function initRotator() {
    var rot = document.querySelector("[data-rotator]");
    if (!rot) return;
    var words = Array.prototype.slice.call(rot.querySelectorAll(".rotator__word"));
    if (!words.length) return;

    var i = 0;
    words[0].classList.add("is--active");
    if (reduceMotion || words.length < 2) return;

    setInterval(function () {
      var prev = i;
      i = (i + 1) % words.length;
      words[prev].classList.remove("is--active");
      words[prev].classList.add("is--prev");
      words[i].classList.remove("is--prev");
      words[i].classList.add("is--active");
      setTimeout(function () { words[prev].classList.remove("is--prev"); }, 650);
    }, 2200);
  }
})();
