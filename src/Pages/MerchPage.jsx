import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

import dystopiaLogo from "../assets/dystopia-logo.webp";
import merchHeaderBackground from "../assets/dystopia_background_1.jpg";

import "./MerchPage.css";

function ProductCard({ product }) {
  const { addToCart } = useCart();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false);


  const images = product.images ?? [];
  const currentImage = images[currentImageIndex] ?? null;

  const selectedVariant =
  product.variants?.find(
    (variant) => variant.id === selectedVariantId
  ) ?? null;

  useEffect(() => {
    if (!justAdded) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setJustAdded(false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [justAdded]);

  const showNextImage = () => {
    if (images.length <= 1) {
      return;
    }

    setCurrentImageIndex((previousIndex) => (previousIndex + 1) % images.length);
  };

  const decreaseQuantity = () => {
    setQuantity((currentQuantity) =>
      Math.max(1, currentQuantity - 1)
    );
  };

  const increaseQuantity = () => {
    if (!selectedVariant) {
      return;
    }

    setQuantity((currentQuantity) =>
      Math.min(
        selectedVariant.stock,
        currentQuantity + 1
      )
    );
  };

  const handleAddToCart = () => {
  if (!selectedVariant) {
    return;
  }

  const cartItem = {
    productId: product.id,
    variantId: selectedVariant.id,
    name: product.name,
    size: selectedVariant.size,
    quantity,
    price: product.price,
    image: product.images?.[0]?.url ?? null,
    stock: selectedVariant.stock,
  };

  addToCart(cartItem);
  setJustAdded(true);
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
              loading="lazy"
              decoding="async"
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
            {product.variants?.map((variant) => {
              const isSelected =
                selectedVariantId === variant.id;

              const isSoldOut =
                variant.stock <= 0;

              return (
                <button
                  key={variant.id}
                  type="button"
                  className={`product-variant-button ${
                    isSelected
                      ? "product-variant-button--selected"
                      : ""
                  } ${
                    isSoldOut
                      ? "product-variant-button--sold-out"
                      : ""
                  }`}
                  disabled={isSoldOut}
                  onClick={() => {
                    setSelectedVariantId(variant.id);
                    setQuantity(1);
                    setJustAdded(false);
                  }}
                >
                  {variant.size}
                </button>
              );
            })}
          </div>
        </div>
        <div className="product-quantity-block">
          <p className="product-quantity-label">
            Darabszám
          </p>

          <div className="product-quantity">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={
                !selectedVariant ||
                quantity <= 1
              }
              aria-label="Darabszám csökkentése"
            >
              −
            </button>

            <span>{quantity}</span>

            <button
              type="button"
              onClick={increaseQuantity}
              disabled={
                !selectedVariant ||
                quantity >= selectedVariant.stock
              }
              aria-label="Darabszám növelése"
            >
              +
            </button>
          </div>
        </div>

        <button
          className={`add-to-cart-button ${
            justAdded ? "add-to-cart-button--added" : ""
          }`}
          type="button"
          disabled={!selectedVariant}
          onClick={handleAddToCart}
          >
          {justAdded ? "Hozzáadtad a kosárhoz" : "Kosárba"}
        </button>
      </div>
    </article>
  );
}

function MerchPage() {
  const { cartItems, cartCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const cartTotal = cartItems.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );
  
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
        const contentType = response.headers.get("content-type") ?? "";

        if (!response.ok) {
          throw new Error("A termékek betöltése sikertelen.");
        }

        if (!contentType.includes("application/json")) {
          const responsePreview = (await response.text()).slice(0, 120).trim();

          throw new Error(
            `Az API nem JSON valaszt adott a /api/products vegponton. Valoszinuleg statikus build vagy hibas Worker route fut. Valasz eleje: ${responsePreview || "ures valasz"}`,
          );
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
    <header className="merch-site-header merch-site-header--visible">
      <Link
        className="merch-brand"
        to="/"
        aria-label="Dystopia főoldal"
      >
        <img src={dystopiaLogo} alt="Dystopia" />
      </Link>

      <div className="merch-header-actions">
      <Link className="merch-back" to="/">
        Vissza az oldalra
      </Link>

      <button
        className="merch-cart-button"
        type="button"
        aria-label={`Kosár, ${cartCount} termék`}
        aria-expanded={cartOpen}
        onClick={() => {
          setCartOpen((currentOpen) => !currentOpen);
        }}
      >
        <span className="merch-cart-icon">🛒</span>

        {cartCount > 0 && (
          <span className="merch-cart-count">
            {cartCount}
          </span>
        )}
      </button>

      {cartOpen && (
        <div className="mini-cart">
          <div className="mini-cart-header">
            <span>Kosár</span>
            <span>{cartCount} db</span>
          </div>

          {cartItems.length === 0 ? (
            <p className="mini-cart-empty">
              A kosarad még üres.
            </p>
          ) : (
            <>
              <div className="mini-cart-items">
                {cartItems.map((item) => (
                  <div
                    className="mini-cart-item"
                    key={item.variantId}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    )}

                    <div className="mini-cart-item-info">
                      <strong>{item.name}</strong>

                      <span>
                        {item.size} · {item.quantity} db
                      </span>

                      <span>
                        {(
                          Number(item.price) *
                          item.quantity
                        ).toLocaleString("hu-HU")} Ft
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mini-cart-total">
                <span>Összesen</span>

                <strong>
                  {cartTotal.toLocaleString("hu-HU")} Ft
                </strong>
              </div>

              <Link
                className="mini-cart-link"
                to="/cart"
              >
                Kosárhoz
              </Link>
            </>
          )}
        </div>
      )}

    </div>
    </header>

    <section
      className="merch-intro"
      style={{
        "--page-hero-image": `url(${merchHeaderBackground})`,
      }}
    >
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
