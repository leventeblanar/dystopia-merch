import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import dystopiaLogo from "../assets/dystopia-logo.png";

import "./MerchPage.css";

function ProductCard({ product }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = product.images ?? [];
  const currentImage = images[currentImageIndex] ?? null;

  const showNextImage = () => {
    if (images.length <= 1) {
      return;
    }

    setCurrentImageIndex((previousIndex) => (previousIndex + 1) % images.length);
  };

  return (
    <article className="product-card product-card--featured">
      <div className="product-gallery">
        <button
          className="product-image"
          type="button"
          onClick={showNextImage}
          aria-label="Termékkép váltása"
        >
          {currentImage ? (
            <img
              key={currentImage.id}
              src={currentImage.url}
              alt={currentImage.alt_text ?? product.name}
            />
          ) : (
            <div className="product-image-placeholder">
              Nincs kép
            </div>
          )}
        </button>

        {images.length > 1 && (
          <p className="product-image-hint">
            Kattints a képre a másik oldalhoz
          </p>
        )}
      </div>

      <div className="product-info">
        <p className="product-kicker">
          Official merchandise
        </p>

        <h2>{product.name}</h2>

        <p className="product-price">
          {(Number(product.price) || 0).toLocaleString("hu-HU")} Ft
        </p>

        <div className="product-divider" />

        <p className="product-description">
          {product.description}
        </p>

        <div className="product-size-block">
          <p className="product-size-label">
            Elérhető méretek
          </p>

          <div className="product-variants">
            {product.variants?.map((variant) => (
              <span
                key={variant.id}
                className={variant.stock > 0 ? "" : "sold-out"}
              >
                {variant.size}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function MerchPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("A termékek betöltése sikertelen.");
        }

        const data = await response.json();

        setProducts(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
  <main className="merch-page">
    <header className="merch-site-header">
      <Link
        className="merch-brand"
        to="/"
        aria-label="Dystopia főoldal"
      >
        <img src={dystopiaLogo} alt="Dystopia" />
      </Link>

      <Link className="merch-back" to="/">
        Vissza az oldalra
      </Link>
    </header>

    <section className="merch-intro">
      <p className="merch-eyebrow">
        Official Dystopia merchandise
      </p>

      <h1>Merch Store</h1>

      <div className="merch-title-line" />
    </section>

    <section className="merch-products">
      {loading && (
        <p className="merch-status">
          Termékek betöltése...
        </p>
      )}

      {error && (
        <p className="merch-status merch-status--error">
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
    </section>

    <footer className="merch-footer">
      <span>Dystopia</span>
      <span>Official Merch · Hungary</span>
    </footer>
  </main>
  );
}

export default MerchPage;
