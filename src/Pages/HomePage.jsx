import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HomePage.css";

import dystopiaLogo from "../assets/dystopia-logo.png";
import dystopiaNameLogo from "../assets/dystopia_logo_name.png";
import background1 from "../assets/dystopia_background_1.jpg";
import background2 from "../assets/dystopia_background_2.jpg";
import background3 from "../assets/dystopia_background_3.jpg";
import groupPhoto from "../assets/DYSTOPIA_group_foto.jpg";

const backgroundImages = [
  background1,
  background2,
  background3,
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

const driftDirections = ["left", "right", "top", "bottom"];
const HOME_INTRO_SESSION_KEY = "dystopia-home-intro-seen";

const getRandomDirection = (currentDirection) => {
  const availableDirections = driftDirections.filter(
    (direction) => direction !== currentDirection
  );

  return availableDirections[
    Math.floor(Math.random() * availableDirections.length)
  ];
};

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
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [backgroundDirection, setBackgroundDirection] = useState("left");
  const [headerVisible, setHeaderVisible] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState(musicVideos[0].id);

  const [leavingForMerch, setLeavingForMerch] = useState(false);

  const navigate = useNavigate();

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

    const backgroundTimer = setInterval(() => {
      setBackgroundDirection((currentDirection) => {
        return getRandomDirection(currentDirection);
      });

      setBackgroundIndex((currentIndex) => {
        return (currentIndex + 1) % backgroundImages.length;
      });
    }, 10000);

    return () => {
      clearInterval(backgroundTimer);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "main") {
      return;
    }

    const hasCoarsePointer = () => {
      return window.matchMedia("(pointer: coarse)").matches;
    };

    const updateHeaderVisibility = () => {
      if (window.innerWidth <= 720 || hasCoarsePointer()) {
        setHeaderVisible(true);
        return;
      }

      setHeaderVisible(window.scrollY < 48);
    };

    const handleMouseMove = (event) => {
      if (window.innerWidth <= 720 || hasCoarsePointer()) {
        setHeaderVisible(true);
        return;
      }

      setHeaderVisible(event.clientY <= 110 || window.scrollY < 48);
    };

    const handleScroll = () => {
      if (window.innerWidth <= 720 || hasCoarsePointer()) {
        setHeaderVisible(true);
        return;
      }

      setHeaderVisible((currentVisible) => {
        if (window.scrollY < 48) {
          return true;
        }

        return currentVisible;
      });
    };

    updateHeaderVisibility();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateHeaderVisibility);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateHeaderVisibility);
    };
  }, [phase]);

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

  const activeVideo = musicVideos.find((video) => {
    return video.id === activeVideoId;
  }) || musicVideos[0];

  return (
    <main className="app">
      {phase !== "main" ? (
        <section
          className={`intro ${
            phase === "leaving" ? "intro--leaving" : ""
          }`}
        >
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
      ) : (
        <>
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
              className="brand"
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
            {backgroundImages.map((image, index) => (
              <div
                key={image}
                className={`background-slide ${
                  index === backgroundIndex
                    ? "background-slide--active"
                    : ""
                } background-slide--${backgroundDirection}`}
                style={{ backgroundImage: `url(${image})` }}
              />
            ))}
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

            <Link
            className="hero-button"
            to="/merch"
            onClick={openMerch}
            >
            Merch megtekintése
            </Link>
          </div>

          <div className="scroll-indicator" aria-hidden="true">
            <span />
          </div>
        </section>

        <section id="bio" className="bio-section">
          <div className="bio-container">
            <div className="bio-heading">
              <p className="section-label">A zenekarról</p>
              <h2>Bio</h2>
              <span className="bio-line" />
              <figure
                className="bio-photo"
                style={{ "--bio-photo-image": `url(${groupPhoto})` }}
              >
              <img
                src={groupPhoto}
                alt="A Dystopia zenekar tagjai"
                loading="lazy"
                decoding="async"
              />
            </figure>
            </div>

            <div className="bio-content">
              <p className="bio-lead">
                A Dystopia egy magyar metal zenekar, amelyben nagyon nehéz megkérni a fiúkat, hogy adjanak egy rendes Bio leírást, úgyhogy lefordíttattam a Spotifyosat magyarra és átalakítottam T/1-es megszólalásra. Ha nem tetszik, meg lehet nyalni az izzad golyóimat.
              </p>

              <p className="long-bio-desc">
                A történetünk 2003 forró nyarán kezdődött. A kezdeti évek után 2007 körül kezdett igazán kialakulni az a zenei világ, amelyet ma is magunkénak érzünk. Ebben az évben jelent meg első albumunk, az Incompetence Drive.

                Zenénket intenzív, mégis erősen dallamos metálként tudnánk leírni, amelyben a progresszív metal, a southern metal, a metalcore és időnként az arénarock hatásai is találkoznak. Dalszövegeinkben személyes és filozofikus témákat dolgozunk fel. Még akkor is igyekszünk reményt hagyni bennetek, amikor kritikusabb hangot ütünk meg.

                Második albumunk, a Way to Unfold 2014 áprilisában jelent meg. Egy évvel később elkészítettük Sting Englishman in New York című dalának feldolgozását, amely azóta is az egyik legkeresettebb felvételünk.

                2016-ban lehetőségünk nyílt fellépni a Wacken Open Air színpadán, a világ egyik legnagyobb metal tehetségkutatóján. Ez az élmény arra ösztönzött bennünket, hogy új szintre emeljük mindazt, amit a zenekarral képviselünk.

                A következő korszak első dala, a Purge Yourself 2018. március 22-én jelent meg videóklippel együtt a YouTube-on. Ugyanezen év nyarán kiadtuk harmadik stúdióalbumunkat, a Building Bridges-t. Az albumhoz elkészült a The Remedy Engine videóklipje is, a dal pedig helyet kapott a Legacy magazin 2018-as nyári számának különleges CD-mellékletén, a The Hungarian Legacy-n.
              </p>

              <p>
                Ide még jöhetne akár egy tag bemutatás vagy valami hasonló
              </p>
            </div>
          </div>
        </section>

        <section id="music" className="music-section">
          <div className="music-container">
            <div className="music-player-panel">
              <p className="section-label">Zene</p>
              <h2>Zene</h2>
              <span className="music-line" />
              <p className="music-intro">
                Ide felőlem listázhatunk több videót is, akár egész albumot vagy valamit. Mit tudom én...
              </p>

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

        <section id="contact" className="contact-section">
          <div className="contact-container">
            <div className="contact-heading">
              <p className="section-label">Kapcsolat</p>
              <h2>Kapcsolat</h2>
              <span className="contact-line" />
              <p className="contact-intro">
                Ide kéne valami kapcsolat sztori, ami leírja miért kereshetnek minket vagy valami.
              </p>

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
              </article>
            </div>
          </div>
        </section>
        </>
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
