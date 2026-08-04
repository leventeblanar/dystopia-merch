import { useEffect, useState } from "react";
import "./App.css";

import dystopiaLogo from "./assets/dystopia-logo.png";
import dystopiaNameLogo from "./assets/dystopia_logo_name.png";
import background1 from "./assets/dystopia_background_1.jpg";
import background2 from "./assets/dystopia_background_2.jpg";
import background3 from "./assets/dystopia_background_3.jpg";

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

          <header className="site-header">
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

          <div className="hero-content" id="top">
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
      )}
    </main>
  );
}

export default App;
