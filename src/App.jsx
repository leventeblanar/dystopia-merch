import { useEffect, useState } from "react";
import "./App.css";

import dystopiaLogo from "./assets/dystopia-logo.png";
import dystopiaNameLogo from "./assets/dystopia_logo_name.png";
import background1 from "./assets/dystopia_background_1.jpg";
import background2 from "./assets/dystopia_background_2.jpg";
import background3 from "./assets/dystopia_background_3.jpg";
import groupPhoto from "./assets/DYSTOPIA_group_foto.jpg";

const backgroundImages = [
  background1,
  background2,
  background3,
];

const driftDirections = ["left", "right", "top", "bottom"];

const getRandomDirection = (currentDirection) => {
  const availableDirections = driftDirections.filter(
    (direction) => direction !== currentDirection
  );

  return availableDirections[
    Math.floor(Math.random() * availableDirections.length)
  ];
};

function App() {
  const [phase, setPhase] = useState("intro");
  const [menuOpen, setMenuOpen] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [backgroundDirection, setBackgroundDirection] = useState("left");
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    const fadeOutTimer = setTimeout(() => {
      setPhase("leaving");
    }, 3200);

    const showMainPageTimer = setTimeout(() => {
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
              <a href="#merch" onClick={closeMenu}>
                Merch
              </a>

              <a href="#music" onClick={closeMenu}>
                Zene
              </a>

              <a href="#bio" onClick={closeMenu}>
                Bio
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

            <a className="hero-button" href="#merch">
              Merch megtekintése
            </a>
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

              <p>
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

        <section id="contact" className="contact-section">
          <div className="contact-container">
            <div className="contact-heading">
              <p className="section-label">Kapcsolat</p>
              <h2>Kapcsolat</h2>
              <span className="contact-line" />
              <p className="contact-intro">
                Ha booking, kollab, interjú vagy bármi más miatt keresnél,
                innen indulj. A mostani adatok helykitöltők, cseréld ki őket a
                végleges elérhetőségekre.
              </p>
            </div>

            <div className="contact-grid">
              <article className="contact-card">
                <p className="contact-card-label">Booking</p>
                <h3>Koncertszervezés</h3>
                <p>booking@dystopia.hu</p>
                <p>+36 30 123 4567</p>
              </article>

              <article className="contact-card contact-card--wide">
                <p className="contact-card-label">Info</p>
                <h3>Rövid üzenet</h3>
                <p>
                  Ide jöhet majd egy 1-2 soros szöveg arról, milyen ügyekben
                  és milyen válaszidővel érdemes keresni a zenekart.
                </p>
              </article>
            </div>
          </div>
        </section>
        </>
      )}
    </main>
  );
}

export default App;
