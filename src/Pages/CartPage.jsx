import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext.jsx";
import {
  SIZELESS_VARIANT_LABEL,
  FREE_SHIPPING_THRESHOLD_HUF,
  formatSizeCutLabel,
  getShippingFee,
  getFreeShippingRemaining,
} from "../../shared/constants";

import cartHeaderBackground from "../assets/dystopia_background_2.jpg";

import "./CartPage.css";


function CartPage() {
  const {
    cartItems,
    removeFromCart,
    increaseCartQuantity,
    decreaseCartQuantity,
    cartCount,
  } = useCart();

  const navigate = useNavigate();


  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, []);


  const cartTotal = cartItems.reduce(
    (total, item) => {
      return (
        total +
        Number(item.price) * item.quantity
      );
    },
    0
  );

  const shippingFee = getShippingFee(cartTotal);
  const freeShippingRemaining = getFreeShippingRemaining(cartTotal);
  const grandTotal = cartTotal + shippingFee;


  return (
    <main className="cart-page">

      <header
        className="cart-header"
        style={{
          "--page-hero-image": `url(${cartHeaderBackground})`,
        }}
      >
        <Link
          className="cart-back"
          to="/merch"
        >
          ← Vissza a merch store-ba
        </Link>

        <div className="cart-heading">
          <p>Official Dystopia merchandise</p>

          <h1>Kosár</h1>

          <span>
            {cartCount} db termék
          </span>
        </div>
      </header>


      {cartItems.length === 0 ? (
        <section className="cart-empty">
          <h2>A kosarad üres.</h2>

          <p>
            Még nem tettél semmit a kosárba.
          </p>

          <Link
            className="cart-empty-link"
            to="/merch"
          >
            Merch megtekintése
          </Link>
        </section>
      ) : (
        <div className="cart-layout">

          <section className="cart-items">
            {cartItems.map((item) => {
              const stock = Number(item.stock);

              const canDecrease =
                item.quantity > 1;

              const canIncrease =
                item.quantity < stock;

              const itemTotal =
                Number(item.price) *
                item.quantity;


              return (
                <article
                  className="cart-item"
                  key={item.variantId}
                >

                  <div className="cart-item-image">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="cart-item-image-placeholder">
                        Nincs kép
                      </div>
                    )}
                  </div>


                  <div className="cart-item-info">
                    <p className="cart-item-kicker">
                      Official merchandise
                    </p>

                    <h2>
                      {item.name}
                    </h2>

                    {item.size !== SIZELESS_VARIANT_LABEL && (
                      <p className="cart-item-size">
                        Méret: {formatSizeCutLabel(item.size, item.cut)}
                      </p>
                    )}

                    <p className="cart-item-unit-price">
                      {Number(
                        item.price
                      ).toLocaleString(
                        "hu-HU"
                      )} Ft / db
                    </p>


                    <div className="cart-item-actions">

                      <div className="cart-item-quantity">
                        <button
                          type="button"
                          onClick={() => {
                            decreaseCartQuantity(
                              item.variantId
                            );
                          }}
                          disabled={!canDecrease}
                          aria-label="Darabszám csökkentése"
                        >
                          −
                        </button>

                        <span>
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            increaseCartQuantity(
                              item.variantId
                            );
                          }}
                          disabled={!canIncrease}
                          aria-label="Darabszám növelése"
                        >
                          +
                        </button>
                      </div>


                      <button
                        className="cart-item-remove"
                        type="button"
                        onClick={() => {
                          removeFromCart(
                            item.variantId
                          );
                        }}
                      >
                        Eltávolítás
                      </button>

                    </div>


                    <p className="cart-item-stock">
                      Készleten: {stock} db
                    </p>
                  </div>


                  <strong className="cart-item-total">
                    {itemTotal.toLocaleString(
                      "hu-HU"
                    )} Ft
                  </strong>

                </article>
              );
            })}
          </section>


          <aside className="cart-summary">
            <p className="cart-summary-kicker">
              Összesítés
            </p>

            <div className="cart-summary-row">
              <span>Termékek</span>

              <span>
                {cartCount} db
              </span>
            </div>

            <div className="cart-summary-row">
              <span>Részösszeg</span>

              <span>
                {cartTotal.toLocaleString(
                  "hu-HU"
                )} Ft
              </span>
            </div>

            <div className="cart-summary-row">
              <span>Szállítás</span>

              <span>
                {shippingFee > 0
                  ? `${shippingFee.toLocaleString("hu-HU")} Ft`
                  : "Ingyenes"}
              </span>
            </div>

            <div className="cart-summary-total">
              <span>Összesen</span>

              <strong>
                {grandTotal.toLocaleString(
                  "hu-HU"
                )} Ft
              </strong>
            </div>

            {freeShippingRemaining > 0 && (
              <p className="cart-summary-free-shipping">
                * Már csak{" "}
                {freeShippingRemaining.toLocaleString("hu-HU")}{" "}
                Ft hiányzik az ingyenes szállításhoz.
              </p>
            )}

            <button
              className="cart-checkout-button"
              type="button"
              onClick={() => {
                navigate("/checkout");
              }}
            >
              Tovább a fizetéshez
            </button>

            <p className="cart-checkout-note">
              A kiszállítási adatokat a következő
              lépésben adhatod meg.
              <br />
              {shippingFee > 0
                ? `A szállítási költség (${shippingFee.toLocaleString("hu-HU")} Ft) a végösszeghez adódik hozzá.`
                : "A rendelésedhez ingyenes szállítás jár."}{" "}
              {FREE_SHIPPING_THRESHOLD_HUF.toLocaleString("hu-HU")} Ft
              feletti rendelés esetén mindig ingyenes a szállítás.
            </p>
          </aside>

        </div>
      )}

    </main>
  );
}


export default CartPage;