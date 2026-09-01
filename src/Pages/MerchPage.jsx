import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import {
  SIZELESS_VARIANT_LABEL,
  VARIANT_CUTS,
  CUT_LABELS,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  formatSizeCutLabel,
  getShippingFee,
  getFreeShippingRemaining,
} from "../../shared/constants";

import dystopiaLogo from "../assets/dystopia-logo.webp";
import merchHeaderBackground from "../assets/dystopia_background_1.jpg";

import "./MerchPage.css";

// Mirrors the size ordering used by the /api/products query, so filter
// pills line up the same way the size buttons on a product card do.
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

function sortSizes(sizes) {
  return [...sizes].sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a.toUpperCase());
    const indexB = SIZE_ORDER.indexOf(b.toUpperCase());

    if (indexA === -1 && indexB === -1) {
      return a.localeCompare(b);
    }

    if (indexA === -1) {
      return 1;
    }

    if (indexB === -1) {
      return -1;
    }

    return indexA - indexB;
  });
}

function ProductCard({ product }) {
  const { addToCart } = useCart();

  const isSizeless =
    product.variants?.length === 1 &&
    product.variants[0].size === SIZELESS_VARIANT_LABEL;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(
    isSizeless ? product.variants[0].id : null
  );
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
    cut: selectedVariant.cut,
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

        {!isSizeless && (
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
                  {formatSizeCutLabel(variant.size, variant.cut)}
                </button>
              );
            })}
          </div>
        </div>
        )}
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
  const {
    cartItems,
    cartCount,
    removeFromCart,
    increaseCartQuantity,
    decreaseCartQuantity,
  } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const cartTotal = cartItems.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );
  const shippingFee = getShippingFee(cartTotal);
  const freeShippingRemaining = getFreeShippingRemaining(cartTotal);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedCut, setSelectedCut] = useState("all");

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedSize("all");
    setSelectedCut("all");
  };

  const availableSizes = useMemo(() => {
    const sizes = new Set();

    products.forEach((product) => {
      if (product.category !== "polo") {
        return;
      }

      product.variants?.forEach((variant) => {
        if (variant.size !== SIZELESS_VARIANT_LABEL) {
          sizes.add(variant.size);
        }
      });
    });

    return sortSizes([...sizes]);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false;
      }

      if (selectedCategory === "polo") {
        if (
          selectedSize !== "all" &&
          !product.variants?.some((variant) => variant.size === selectedSize)
        ) {
          return false;
        }

        if (
          selectedCut !== "all" &&
          !product.variants?.some((variant) => variant.cut === selectedCut)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, selectedSize, selectedCut]);

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
                {cartItems.map((item) => {
                  const stock = Number(item.stock) || 0;
                  const canDecrease = item.quantity > 1;
                  const canIncrease = item.quantity < stock;

                  return (
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

                      {item.size !== SIZELESS_VARIANT_LABEL && (
                        <span>{formatSizeCutLabel(item.size, item.cut)}</span>
                      )}

                      <span>
                        {(
                          Number(item.price) *
                          item.quantity
                        ).toLocaleString("hu-HU")} Ft
                      </span>

                      <div className="mini-cart-item-actions">
                        <div className="mini-cart-item-quantity">
                          <button
                            type="button"
                            onClick={() => {
                              decreaseCartQuantity(item.variantId);
                            }}
                            disabled={!canDecrease}
                            aria-label="Darabszám csökkentése"
                          >
                            −
                          </button>

                          <span>{item.quantity} db</span>

                          <button
                            type="button"
                            onClick={() => {
                              increaseCartQuantity(item.variantId);
                            }}
                            disabled={!canIncrease}
                            aria-label="Darabszám növelése"
                          >
                            +
                          </button>
                        </div>

                        <button
                          className="mini-cart-item-remove"
                          type="button"
                          onClick={() => {
                            removeFromCart(item.variantId);
                          }}
                        >
                          Törlés
                        </button>
                      </div>
                    </div>
                    </div>
                  );
                })}
              </div>

              <div className="mini-cart-total">
                <span>Részösszeg</span>

                <strong>
                  {cartTotal.toLocaleString("hu-HU")} Ft
                </strong>
              </div>

              <p className="mini-cart-shipping-note">
                {freeShippingRemaining > 0
                  ? `+ ${shippingFee.toLocaleString("hu-HU")} Ft szállítási költség adódik a végösszeghez. * Már csak ${freeShippingRemaining.toLocaleString("hu-HU")} Ft hiányzik az ingyenes szállításhoz.`
                  : "A szállítás ingyenes, mivel a kosár értéke eléri a 20 000 Ft-ot."}
              </p>

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

    {!loading && !error && products.length > 0 && (
      <section className="merch-filter-bar">
        <div className="merch-filter-group">
          <span className="merch-filter-label">Kategória</span>

          <div className="merch-filter-options">
            <button
              type="button"
              className={`merch-filter-button ${
                selectedCategory === "all" ? "merch-filter-button--selected" : ""
              }`}
              onClick={() => handleCategoryChange("all")}
            >
              Mind
            </button>

            {PRODUCT_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={`merch-filter-button ${
                  selectedCategory === category ? "merch-filter-button--selected" : ""
                }`}
                onClick={() => handleCategoryChange(category)}
              >
                {PRODUCT_CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
        </div>

        {selectedCategory === "polo" && availableSizes.length > 0 && (
          <div className="merch-filter-group">
            <span className="merch-filter-label">Méret</span>

            <div className="merch-filter-options">
              <button
                type="button"
                className={`merch-filter-button ${
                  selectedSize === "all" ? "merch-filter-button--selected" : ""
                }`}
                onClick={() => setSelectedSize("all")}
              >
                Mind
              </button>

              {availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`merch-filter-button ${
                    selectedSize === size ? "merch-filter-button--selected" : ""
                  }`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedCategory === "polo" && (
          <div className="merch-filter-group">
            <span className="merch-filter-label">Szabás</span>

            <div className="merch-filter-options">
              <button
                type="button"
                className={`merch-filter-button ${
                  selectedCut === "all" ? "merch-filter-button--selected" : ""
                }`}
                onClick={() => setSelectedCut("all")}
              >
                Mind
              </button>

              {VARIANT_CUTS.map((cut) => (
                <button
                  key={cut}
                  type="button"
                  className={`merch-filter-button ${
                    selectedCut === cut ? "merch-filter-button--selected" : ""
                  }`}
                  onClick={() => setSelectedCut(cut)}
                >
                  {CUT_LABELS[cut]}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    )}

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

      {!loading && !error && filteredProducts.length === 0 && (
        <p className="merch-status">
          Nincs a szűrésnek megfelelő termék.
        </p>
      )}

      {!loading &&
        !error &&
        filteredProducts.map((product) => (
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
