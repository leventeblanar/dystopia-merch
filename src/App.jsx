import { useEffect, useState } from "react";
import "./App.css";

import dystopiaLogo from "./assets/dystopia-logo.png";
import bandPhoto from "./assets/dystopia-band.jpg";

function App() {
  const [phase, setPhase] = useState("intro");

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
        <section
          className="home"
          style={{ backgroundImage: `url(${bandPhoto})` }}
        >
          <div className="home-overlay" />

          <header className="site-header">
            <a className="brand" href="#top" aria-label="Dystopia kezdőlap">
              <img src={dystopiaLogo} alt="Dystopia" />
            </a>

            <nav className="main-navigation" aria-label="Fő navigáció">
              <a href="#merch">Merch</a>
              <a href="#music">Zene</a>
              <a href="#bio">Bio</a>
              <a href="#contact">Kapcsolat</a>
            </nav>
          </header>

          <div className="hero-content" id="top">
            <p className="hero-kicker">Official website</p>
            <h1>Dystopia</h1>
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