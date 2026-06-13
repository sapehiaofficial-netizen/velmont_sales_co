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

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var val = function (sel) {
        var el = form.querySelector(sel);
        return el ? el.value.trim() : "";
      };
      var name = val("#cf-name");
      var company = val("#cf-company");
      var subject = "Intro call — " + name + (company ? " (" + company + ")" : "");
      var bodyTxt =
        "Name: " + name +
        "\nEmail: " + val("#cf-email") +
        "\nBrand / business: " + company +
        (val("#cf-phone") ? "\nPhone: " + val("#cf-phone") : "") +
        (val("#cf-message") ? "\n\n" + val("#cf-message") : "") +
        "\n\n— sent from velmont site";

      window.location.href = "mailto:sapehiaofficial@gmail.com?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(bodyTxt);

      form.classList.add("is--hidden");
      if (done) {
        done.classList.add("is--visible");
        if (animOk) {
          gsap.fromTo(done, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" });
        }
      }
    });
  }
})();
