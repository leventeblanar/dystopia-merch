import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HomePage.css";

import dystopiaLogo from "../assets/dystopia-logo.webp";
import dystopiaNameLogo from "../assets/dystopia_logo_name.webp";
import groupPhoto from "../assets/DYSTOPIA_group_foto.jpg";
import dystopiaSchematic from "../assets/dystopia_schematic.webp";
import backgroundVideo1 from "../assets/nemlatszik_1.mp4";
import backgroundVideo2 from "../assets/nemlatszik_2.mp4";
import backgroundVideo3 from "../assets/amivel_1.mp4";
import backgroundVideo4 from "../assets/amivel_2.mp4";
import backgroundVideo5 from "../assets/mester_1.mp4";
import backgroundVideo6 from "../assets/mester_2.mp4";

const backgroundVideos = [
  backgroundVideo5,
  backgroundVideo1,
  backgroundVideo3,
  backgroundVideo2,
  backgroundVideo4,
  backgroundVideo6,
];

const musicVideos = [
  {
    id: "8DCXT9bigSg",
    title: "Dystopia - Nem látszik már",
    meta: "Dystopia - Nem látszik már // Official klip",
  },
  {
    id: "wYSw1rSn5e4",
    title: "Dystopia - Mesterlövész",
    meta: "Dystopia - Mesterlövész // Official klip",
  },
  {
    id: "PtwgwD97YQk",
    title: "Dystopia - Utolsó repülés",
    meta: "Dystopia - Utolsó repülés // Official klip",
  },
  {
    id: "ZsMix35YvQo",
    title: "Dystopia - Amivel magadnak tartozol",
    meta: "Dystopia - Amivel magadnak tartozol // Official klip",
  },
  {
    id: "dTfhikcYPCw",
    title: "Dystopia - Purge Yourself",
    meta: "Official Music Video",
  },
];

const socialLinks = [
  {
    label: "Spotify",
    href: "https://open.spotify.com/artist/3am22hyFJavCKrKrwL8zis",
    icon: "spotify",
  },
  {
    label: "Deezer",
    href: "https://www.deezer.com/en/artist/12939023",
    icon: "deezer",
  },
  {
    label: "Apple Music",
    href: "https://music.apple.com/",
    icon: "apple",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@dystopiahungary",
    icon: "youtube",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/dystopiahungary/?locale=hu_HU",
    icon: "facebook",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/dystopia_hungary/",
    icon: "instagram",
  },
  {
    label: "Bandcamp",
    href: "https://dystopiahungary.bandcamp.com/album/mesterl-v-sz",
    icon: "bandcamp",
  },
];

function SocialIcon({ icon }) {
  switch (icon) {
    case "spotify":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M7 9.2c3.6-1 6.9-.7 10 .7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M7.9 12.4c2.8-.7 5.3-.5 7.7.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.55" />
          <path d="M8.8 15.3c2-.5 3.8-.3 5.5.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        </svg>
      );
    case "deezer":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="13.5" width="2.2" height="5.5" fill="currentColor" />
          <rect x="6.4" y="11" width="2.2" height="8" fill="currentColor" />
          <rect x="9.8" y="8.5" width="2.2" height="10.5" fill="currentColor" />
          <rect x="13.2" y="6" width="2.2" height="13" fill="currentColor" />
          <rect x="16.6" y="9.5" width="2.2" height="9.5" fill="currentColor" />
        </svg>
      );
    case "apple":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15.7 3.2c-.8.1-1.7.7-2.2 1.4-.5.6-.8 1.5-.7 2.3.9.1 1.8-.4 2.4-1.1.5-.7.8-1.5.5-2.6Z" fill="currentColor" />
          <path d="M17.8 12.8c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.4.7-3 .7-.6 0-1.5-.7-2.6-.7-1.3 0-2.6.8-3.3 2-1.4 2.5-.4 6.2 1 8.1.7 1 1.5 2.1 2.6 2 .9 0 1.3-.6 2.5-.6s1.5.6 2.5.6c1 0 1.7-1 2.4-2 .7-1.1 1-2.1 1-2.2-.1 0-1.9-.8-1.9-3.1Z" fill="currentColor" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.2" y="6.8" width="17.6" height="10.4" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="m10 9.2 5 2.8-5 2.8Z" fill="currentColor" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13.4 20.5v-6.8h2.3l.4-2.8h-2.7V9.2c0-.8.2-1.4 1.4-1.4h1.4V5.4c-.2 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.8v1.8H8.4v2.8h2.2v6.8Z" fill="currentColor" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.1" cy="6.9" r="1.1" fill="currentColor" />
        </svg>
      );
    case "bandcamp":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 17.5 12.3 6.5H19l-7.2 11Z" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

const pressKitItems = [
  {
    key: "epk",
    label: "EPK",
    sub: "Electronic Press Kit",
    icon: "epk",
  },
  {
    key: "logos",
    label: "Logók és plakátanyagok",
    sub: "Zenekari logó, plakátanyagok",
    icon: "logos",
  },
  {
    key: "rider",
    label: "Rider",
    sub: "Technikai rider",
    icon: "rider",
  },
];

function PressKitIcon({ icon }) {
  switch (icon) {
    case "epk":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="3" width="13" height="17" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7.3 7.8h6.4M7.3 11.2h6.4M7.3 14.6h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
          <circle cx="17.3" cy="17.3" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="m19.4 19.4 1.8 1.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        </svg>
      );
    case "logos":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="14" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="8.3" cy="9.8" r="1.5" fill="currentColor" />
          <path d="m5 16.5 4.3-4.7 3.3 3.7 2.4-2.8 4 4.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
        </svg>
      );
    case "rider":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5" y="4" width="14" height="17" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="9" y="2.3" width="6" height="3" rx="1" fill="currentColor" />
          <path d="M8.3 11h7.4M8.3 14.4h7.4M8.3 17.8h4.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
        </svg>
      );
    default:
      return null;
  }
}

const HOME_INTRO_SESSION_KEY = "dystopia-home-intro-seen";

function rafThrottle(callback) {
  let frameId = null;
  let lastArgs = [];

  const throttled = (...args) => {
    lastArgs = args;

    if (frameId !== null) {
      return;
    }

    frameId = requestAnimationFrame(() => {
      frameId = null;
      callback(...lastArgs);
    });
  };

  throttled.cancel = () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  };

  return throttled;
}

function HomePage() {
  const [phase, setPhase] = useState(() => {
    if (
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(HOME_INTRO_SESSION_KEY) === "true"
    ) {
      return "main";
    }

    return "intro";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState(musicVideos[0].id);
  const [musicPlayerHeight, setMusicPlayerHeight] = useState(null);
  const [brandVisible, setBrandVisible] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  const [leavingForMerch, setLeavingForMerch] = useState(false);

  const [merchSlides, setMerchSlides] = useState([]);
  const [merchSlideIndex, setMerchSlideIndex] = useState(0);
  const [merchWidgetVisible, setMerchWidgetVisible] = useState(false);
  const [merchDismissed, setMerchDismissed] = useState(false);

  const navigate = useNavigate();
  const musicPlayerPanelRef = useRef(null);
  const bioSectionRef = useRef(null);
  const musicSectionRef = useRef(null);
  const contactSectionRef = useRef(null);

  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [backgroundVideoLoaded, setBackgroundVideoLoaded] = useState(false);
  const [backgroundVideoSettled, setBackgroundVideoSettled] = useState(false);
  const [backgroundVideoEnabled, setBackgroundVideoEnabled] = useState(false);

  useEffect(() => {
    // A háttérvideó (több MB-os mp4) csak akkor kerül a DOM-ba, amikor a
    // böngésző már ráért a kritikus induló kéréseket (font, CSS, JS, merch
    // API + kép) elindítani — így nem versenyeznek egymással sávszélességért
    // az első pillanatokban. A .background-slider feketén marad addig is,
    // amíg a videó nem jelenik meg, ez a szándékolt alapállapot.
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(
        () => setBackgroundVideoEnabled(true),
        { timeout: 1500 },
      );

      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(() => setBackgroundVideoEnabled(true), 400);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (phase !== "intro") {
      return;
    }

    const fadeOutTimer = setTimeout(() => {
      setPhase("leaving");
    }, 3200);

    const showMainPageTimer = setTimeout(() => {
      window.sessionStorage.setItem(HOME_INTRO_SESSION_KEY, "true");
      setPhase("main");
    }, 4000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(showMainPageTimer);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 720) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (phase !== "main") {
      return;
    }

    const updateBrandVisibility = () => {
      const bioSection = document.getElementById("bio");

      if (!bioSection) {
        return;
      }

      const bioTop = bioSection.getBoundingClientRect().top;

      setBrandVisible(bioTop <= 120);
    };

    const throttledUpdateBrandVisibility = rafThrottle(updateBrandVisibility);

    updateBrandVisibility();

    window.addEventListener("scroll", throttledUpdateBrandVisibility, {
      passive: true,
    });

    window.addEventListener("resize", throttledUpdateBrandVisibility);

    return () => {
      window.removeEventListener(
        "scroll",
        throttledUpdateBrandVisibility,
      );

      window.removeEventListener(
        "resize",
        throttledUpdateBrandVisibility,
      );

      throttledUpdateBrandVisibility.cancel();
    };
  }, [phase]);

  useEffect(() => {
    const loadMerchSlides = async () => {
      try {
        const response = await fetch("/api/products");
        const contentType = response.headers.get("content-type") ?? "";

        if (!response.ok || !contentType.includes("application/json")) {
          return;
        }

        const data = await response.json();

        const slides = data
          .map((product) => ({
            id: product.id,
            name: product.name,
            image: product.images?.[0]?.url,
          }))
          .filter((slide) => slide.image);

        setMerchSlides(slides);
      } catch {
        // Nem kritikus a főoldalon, csendben elhagyjuk hiba esetén.
      }
    };

    loadMerchSlides();
  }, []);

  useEffect(() => {
    if (phase !== "main" || merchSlides.length <= 1) {
      return;
    }

    const merchSlideTimer = setInterval(() => {
      setMerchSlideIndex((currentIndex) => (currentIndex + 1) % merchSlides.length);
    }, 5000);

    return () => {
      clearInterval(merchSlideTimer);
    };
  }, [phase, merchSlides.length]);

  useEffect(() => {
    if (phase !== "main") {
      return;
    }

    const merchVisibilityTimer = setTimeout(() => {
      setMerchWidgetVisible(true);
    }, 3000);

    return () => {
      clearTimeout(merchVisibilityTimer);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "main") {
      return;
    }

    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    let isCoarsePointer = coarsePointerQuery.matches;

    const handleCoarsePointerChange = (event) => {
      isCoarsePointer = event.matches;
    };

    if (coarsePointerQuery.addEventListener) {
      coarsePointerQuery.addEventListener("change", handleCoarsePointerChange);
    } else {
      coarsePointerQuery.addListener(handleCoarsePointerChange);
    }

    const updateHeaderVisibility = () => {
      if (window.innerWidth <= 720 || isCoarsePointer) {
        setHeaderVisible(true);
        return;
      }

      setHeaderVisible(window.scrollY < 48);
    };

    const handleMouseMove = rafThrottle((event) => {
      if (window.innerWidth <= 720 || isCoarsePointer) {
        setHeaderVisible(true);
        return;
      }

      setHeaderVisible(event.clientY <= 110 || window.scrollY < 48);
    });

    const handleScroll = rafThrottle(() => {
      if (window.innerWidth <= 720 || isCoarsePointer) {
        setHeaderVisible(true);
        return;
      }

      setHeaderVisible((currentVisible) => {
        if (window.scrollY < 48) {
          return true;
        }

        return currentVisible;
      });
    });

    updateHeaderVisibility();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateHeaderVisibility);

    return () => {
      if (coarsePointerQuery.removeEventListener) {
        coarsePointerQuery.removeEventListener("change", handleCoarsePointerChange);
      } else {
        coarsePointerQuery.removeListener(handleCoarsePointerChange);
      }

      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateHeaderVisibility);
      handleMouseMove.cancel();
      handleScroll.cancel();
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "main") {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const sectionRefs = [bioSectionRef, musicSectionRef, contactSectionRef];
    const spots = sectionRefs.map(() => ({ x: 50, y: 50 }));
    // A rect-eket csak scroll/resize-kor mérjük újra (lásd lejjebb), sosem az
    // animációs loopban — a folyamatos getBoundingClientRect() hívás minden
    // frame-ben "forced reflow"-t okozott, mert a böngészőnek a megelőző
    // stílusírás miatt mindig újra kellett futtatnia a layoutot a lekérdezés
    // előtt (ez volt Firefoxon az akadás fő forrása).
    const rects = sectionRefs.map(() => null);
    const visibleSections = new Set();

    const pointer = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    const handleMouseMove = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const measureRects = () => {
      sectionRefs.forEach((sectionRef, index) => {
        if (sectionRef.current) {
          rects[index] = sectionRef.current.getBoundingClientRect();
        }
      });
    };

    const throttledMeasureRects = rafThrottle(measureRects);

    window.addEventListener("scroll", throttledMeasureRects, { passive: true });
    window.addEventListener("resize", throttledMeasureRects);

    let frameId = null;

    const animateSpots = () => {
      sectionRefs.forEach((sectionRef, index) => {
        if (!visibleSections.has(index)) {
          return;
        }

        const element = sectionRef.current;
        const rect = rects[index];

        if (!element || !rect) {
          return;
        }

        const spot = spots[index];

        const targetX = ((pointer.x - rect.left) / rect.width) * 100;
        const targetY = ((pointer.y - rect.top) / rect.height) * 100;

        spot.x += (targetX - spot.x) * 0.045;
        spot.y += (targetY - spot.y) * 0.045;

        element.style.setProperty("--spot-x", `${spot.x}%`);
        element.style.setProperty("--spot-y", `${spot.y}%`);
      });

      frameId = requestAnimationFrame(animateSpots);
    };

    const startLoop = () => {
      if (frameId === null) {
        frameId = requestAnimationFrame(animateSpots);
      }
    };

    const stopLoop = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    // A spotlight-effekt csak akkor fut, ha a bio/zene/kapcsolat szekciók
    // közül legalább egy látszik — így nem terheli a CPU-t a háttérben,
    // amíg a felhasználó máshol van az oldalon.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = sectionRefs.findIndex(
            (sectionRef) => sectionRef.current === entry.target,
          );

          if (index === -1) {
            return;
          }

          if (entry.isIntersecting) {
            visibleSections.add(index);
            rects[index] = entry.boundingClientRect;
          } else {
            visibleSections.delete(index);
          }
        });

        if (visibleSections.size > 0) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.01 },
    );

    sectionRefs.forEach((sectionRef) => {
      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", throttledMeasureRects);
      window.removeEventListener("resize", throttledMeasureRects);
      throttledMeasureRects.cancel();
      observer.disconnect();
      stopLoop();
    };
  }, [phase]);

  useLayoutEffect(() => {
    const panel = musicPlayerPanelRef.current;

    if (!panel) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry) {
        setMusicPlayerHeight(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height);
      }
    });

    observer.observe(panel);

    return () => {
      observer.disconnect();
    };
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const openMerch = (event) => {
  event.preventDefault();

  if (leavingForMerch) {
    return;
  }

  closeMenu();
  setLeavingForMerch(true);
  window.sessionStorage.setItem(HOME_INTRO_SESSION_KEY, "true");

  window.setTimeout(() => {
    navigate("/merch");
  }, 500);
};

  const dismissMerchShowcase = (event) => {
    event.preventDefault();
    setMerchDismissed(true);
  };

  const advanceBackgroundVideo = () => {
    setBackgroundVideoLoaded(false);
    setBackgroundVideoSettled(false);
    setBackgroundIndex((currentIndex) => (currentIndex + 1) % backgroundVideos.length);
  };

  const activeVideo = musicVideos.find((video) => {
    return video.id === activeVideoId;
  }) || musicVideos[0];

  return (
    <main className="app">
      {/*
        A tartalom mindig a DOM-ban van, a bevezető animáció csak egy opak
        overlay felette (lásd .intro, z-index 100). Így a valós LCP-elemek
        (hero, merch kártya) attól függetlenül tölthetnek/renderelhetnek,
        hogy az intro animáció még játszik — nem kell rá várniuk.
      */}
      <div
        className="site-content"
        inert={phase !== "main" ? true : undefined}
        aria-hidden={phase !== "main"}
      >
          <div id="top" className="top-anchor" aria-hidden="true" />

          <header
            className={`site-header ${
              headerVisible || menuOpen ? "site-header--visible" : "site-header--hidden"
            }`}
            onMouseEnter={() => setHeaderVisible(true)}
          >
            {menuOpen && (
              <button
                type="button"
                className="menu-backdrop"
                aria-label="Menü bezárása"
                onClick={closeMenu}
              />
            )}

            <a
              className={`brand ${
                brandVisible ? "brand--visible" : ""
              }`}
              href="#top"
              aria-label="Dystopia kezdőlap"
              onClick={closeMenu}
            >
              <img src={dystopiaLogo} alt="Dystopia" />
            </a>

            <button
              className={`menu-toggle ${
                menuOpen ? "menu-toggle--open" : ""
              }`}
              type="button"
              aria-label={menuOpen ? "Menü bezárása" : "Menü megnyitása"}
              aria-expanded={menuOpen}
              aria-controls="main-navigation"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span />
              <span />
              <span />
            </button>

            <nav
              id="main-navigation"
              className={`main-navigation ${
                menuOpen ? "main-navigation--open" : ""
              }`}
              aria-label="Fő navigáció"
            >
              <Link to="/merch" onClick={openMerch}>
                Merch
              </Link>

              <a href="#bio" onClick={closeMenu}>
                Bio
              </a>

              <a href="#music" onClick={closeMenu}>
                Zene
              </a>

              <a href="#contact" onClick={closeMenu}>
                Kapcsolat
              </a>
            </nav>
          </header>

        <section className="home">
          <div className="background-slider" aria-hidden="true">
            {backgroundVideoEnabled && (
              <video
                key={backgroundVideos[backgroundIndex]}
                className={`background-video ${
                  backgroundVideoLoaded ? "background-video--loaded" : ""
                } ${
                  backgroundVideoSettled ? "background-video--settled" : ""
                }`}
                src={backgroundVideos[backgroundIndex]}
                autoPlay
                muted
                playsInline
                preload="auto"
                fetchPriority="low"
                onLoadedData={() => setBackgroundVideoLoaded(true)}
                onAnimationEnd={(event) => {
                  if (event.animationName === "backgroundReveal") {
                    setBackgroundVideoSettled(true);
                  }
                }}
                onEnded={advanceBackgroundVideo}
                onError={advanceBackgroundVideo}
              />
            )}
          </div>

          <div className="home-overlay" />

          <div className="hero-content">
            <p className="hero-kicker">Official website</p>

            <h1 className="hero-title">
              <img
                className="hero-wordmark"
                src={dystopiaNameLogo}
                alt="Dystopia"
                />
            </h1>

            <p className="hero-description">
              Metal from Hungary
            </p>
          </div>

          <div className="scroll-indicator" aria-hidden="true">
            <span />
          </div>
        </section>

        {merchSlides.length > 0 && !merchDismissed && (
          <aside
            className={`merch-showcase ${
              merchWidgetVisible
                ? "merch-showcase--visible"
                : ""
            }`}
            aria-label="Elérhető merch"
          >
            <button
              type="button"
              className="merch-showcase-close"
              aria-label="Bezárás"
              onClick={dismissMerchShowcase}
            >
              ×
            </button>

            <div className="merch-showcase-copy">
              <p className="merch-showcase-kicker">
                Official merch
              </p>

              <h2>
                Támogasd a zenekart.
                <span>Viseld a Dystopiát!</span>
              </h2>
            </div>

            <Link
              className="merch-showcase-card"
              to="/merch"
              onClick={openMerch}
            >
              <div className="merch-showcase-frame">
                {merchSlides.map((slide, index) => {
                  const nextIndex = (merchSlideIndex + 1) % merchSlides.length;
                  const shouldLoad =
                    index === merchSlideIndex || index === nextIndex;

                  return (
                    <div
                      key={slide.id}
                      className={`merch-showcase-slide ${
                        index === merchSlideIndex
                          ? "merch-showcase-slide--active"
                          : ""
                      }`}
                      style={
                        shouldLoad
                          ? { backgroundImage: `url(${slide.image})` }
                          : undefined
                      }
                    />
                  );
                })}

                <div className="merch-showcase-edge-blur" />

                <div className="merch-showcase-title">
                  <span>
                    {merchSlides[merchSlideIndex]?.name}
                  </span>
                </div>
              </div>

              {merchSlides.length > 1 && (
                <div
                  className="merch-showcase-dots"
                  aria-hidden="true"
                >
                  {merchSlides.map((slide, index) => (
                    <span
                      key={slide.id}
                      className={
                        index === merchSlideIndex
                          ? "merch-showcase-dot--active"
                          : ""
                      }
                    />
                  ))}
                </div>
              )}

              <span className="merch-showcase-cta">
                Merch megtekintése
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          </aside>
        )}

        <section
          id="bio"
          className="bio-section"
          ref={bioSectionRef}
        >
          <div className="bio-container">

            <div className="bio-heading">
              <p className="section-label">
                A zenekarról
              </p>

              <h2>Bio</h2>

              <span className="bio-line" />
            </div>


            <div className="bio-main">

              <figure
                className="bio-photo"
                style={{
                  "--bio-photo-image": `url(${groupPhoto})`,
                }}
              >
                <img
                  src={groupPhoto}
                  alt="A Dystopia zenekar tagjai"
                  loading="lazy"
                  decoding="async"
                />
              </figure>


              <div className="bio-content">

                <p className="bio-lead">
                  A Dystopia egy magyar metal zenekar, amelyben nagyon nehéz megkérni a fiúkat, hogy adjanak egy rendes Bio leírást, úgyhogy lefordíttattam a Spotifyosat magyarra és átalakítottam T/1-es megszólalásra. Ha nem tetszik, meg lehet nyalni az izzad golyóimat.
                </p>


                <div
                  id="bio-details"
                  className={`bio-details ${
                    bioExpanded
                      ? "bio-details--open"
                      : ""
                  }`}
                >
                  <div className="bio-details-inner">

                    <p className="long-bio-desc">
                      A történetünk 2003 forró nyarán kezdődött. A kezdeti évek után 2007 körül kezdett igazán kialakulni az a zenei világ, amelyet ma is magunkénak érzünk. Ebben az évben jelent meg első albumunk, az Incompetence Drive.

                      Zenénket intenzív, mégis erősen dallamos metálként tudnánk leírni, amelyben a progresszív metal, a southern metal, a metalcore és időnként az arénarock hatásai is találkoznak. Dalszövegeinkben személyes és filozofikus témákat dolgozunk fel. Még akkor is igyekszünk reményt hagyni bennetek, amikor kritikusabb hangot ütünk meg.

                      Második albumunk, a Way to Unfold 2014 áprilisában jelent meg. Egy évvel később elkészítettük Sting Englishman in New York című dalának feldolgozását, amely azóta is az egyik legkeresettebb felvételünk.

                      2016-ban lehetőségünk nyílt fellépni a Wacken Open Air színpadán, a világ egyik legnagyobb metal tehetségkutatóján. Ez az élmény arra ösztönzött bennünket, hogy új szintre emeljük mindazt, amit a zenekarral képviselünk.

                      A következő korszak első dala, a Purge Yourself 2018. március 22-én jelent meg videóklippel együtt a YouTube-on. Ugyanezen év nyarán kiadtuk harmadik stúdióalbumunkat, a Building Bridges-t. Az albumhoz elkészült a The Remedy Engine videóklipje is, a dal pedig helyet kapott a Legacy magazin 2018-as nyári számának különleges CD-mellékletén, a The Hungarian Legacy-n.
                    </p>

                  </div>
                </div>


                <button
                  className="bio-read-more"
                  type="button"
                  aria-expanded={bioExpanded}
                  aria-controls="bio-details"
                  onClick={() => {
                    setBioExpanded(
                      (current) => !current
                    );
                  }}
                >
                  {bioExpanded
                    ? "Kevesebb"
                    : "Olvass tovább"}
                </button>

              </div>

            </div>

          </div>
        </section>

        <section id="music" className="music-section" ref={musicSectionRef}>
          <div
            className="music-container"
            style={{
              "--music-player-height": musicPlayerHeight
                ? `${musicPlayerHeight}px`
                : undefined,
            }}
          >
            <div className="music-header">
              <p className="section-label">Zene</p>
              <h2>Zene</h2>
              <span className="music-line"/>
            </div>

            <div className="music-player-panel" ref={musicPlayerPanelRef}>
              <div className="music-player-shell">
                <div className="music-player-frame">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?rel=0`}
                    title={activeVideo.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>

                <div className="music-player-meta">
                  <p className="music-player-kicker">Most kiválasztva</p>
                  <h3>{activeVideo.title}</h3>
                  <p>{activeVideo.meta}</p>
                </div>
              </div>
            </div>

            <div className="music-list-panel">
              <div className="music-list-header">
                <p className="music-list-label">Videók</p>
                <p className="music-list-caption">Válassz egy klipet</p>
              </div>

              <div className="music-list" role="list">
                {musicVideos.map((video) => {
                  const isActive = video.id === activeVideo.id;

                  return (
                    <button
                      key={video.id}
                      type="button"
                      className={`music-item ${
                        isActive ? "music-item--active" : ""
                      }`}
                      onClick={() => setActiveVideoId(video.id)}
                    >
                      <span className="music-item-thumb" aria-hidden="true">
                        <img
                          src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                          alt=""
                          loading="lazy"
                        />
                      </span>

                      <span className="music-item-copy">
                        <span className="music-item-title">{video.title}</span>
                        <span className="music-item-meta">{video.meta}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="contact-section" ref={contactSectionRef}>
          <div className="contact-container">
            <div className="contact-heading">
              <p className="section-label">Kapcsolat</p>
              <h2>Kapcsolat</h2>
              <span className="contact-line" />

              <div className="contact-social-block">
                <p className="contact-social-heading">Megtalálsz minket itt is:</p>

              <div className="contact-socials" aria-label="Közösségi linkek">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    className={`contact-social-link contact-social-link--${link.icon}`}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    title={link.label}
                  >
                    <SocialIcon icon={link.icon} />
                  </a>
                ))}
              </div>
              </div>
            </div>

            <div className="contact-grid">
              <article className="contact-card">
                <p className="contact-card-label">Booking</p>
                
                <h3>Koncertszervezés</h3>
                <p>booking@dystopia.hu</p>
                <p>+36 30 123 4567</p>

                <div className="press-kit-list" aria-label="Sajtó- és technikai anyagok">
                  {pressKitItems.map((item) => (
                    <a
                      key={item.key}
                      className="press-kit-item"
                      href="#"
                      onClick={(event) => event.preventDefault()}
                      title={`${item.label} – hamarosan elérhető`}
                    >
                      <span className="press-kit-item-icon" aria-hidden="true">
                        <PressKitIcon icon={item.icon} />
                      </span>
                      <span className="press-kit-item-copy">
                        <span className="press-kit-item-label">{item.label}</span>
                        <span className="press-kit-item-sub">{item.sub}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </article>
            </div>
          </div>

          <div className="contact-outro" aria-hidden="true">
            <img
              className="contact-outro-image"
              src={dystopiaSchematic}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
        </section>
      </div>

      {phase !== "main" && (
        <section
          className={`intro ${
            phase === "leaving" ? "intro--leaving" : ""
          }`}
        >
          <div className="intro-smoke" aria-hidden="true">
            <span className="intro-smoke-layer intro-smoke-layer--one" />
            <span className="intro-smoke-layer intro-smoke-layer--two" />
            <span className="intro-smoke-layer intro-smoke-layer--three" />
          </div>

          <div className="logo-container">
            <img
              className="dystopia-logo logo-glitch"
              src={dystopiaLogo}
              alt=""
              aria-hidden="true"
            />

            <img
              className="dystopia-logo logo-main"
              src={dystopiaLogo}
              alt="Dystopia"
            />
          </div>
        </section>
      )}

    <div
    className={`page-transition-overlay ${
        leavingForMerch
        ? "page-transition-overlay--active"
        : ""
    }`}
    aria-hidden="true"
    />
    </main>
  );
}

export default HomePage;
