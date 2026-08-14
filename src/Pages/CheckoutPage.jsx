import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext.jsx";

import checkoutHeaderBackground from "../assets/dystopia_background_3.jpg";

import "./CheckoutPage.css";

import "./CheckoutPage.css";


function CheckoutPage() {
  const { cartItems, cartCount } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    postalCode: "",
    city: "",
    streetAddress: "",
    note: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, []);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [cartItems, navigate]);


  const cartTotal = cartItems.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );


  const handleChange = (field) => (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
          },
          shipping: {
            postalCode: form.postalCode,
            city: form.city,
            streetAddress: form.streetAddress,
            note: form.note || undefined,
          },
          items: cartItems.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ?? "Hiba történt a rendelés feldolgozása közben."
        );
      }

      window.location.href = data.url;
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  };


  if (cartItems.length === 0) {
    return null;
  }


  return (
    <main className="checkout-page">

      <header
        className="checkout-header"
        style={{
          "--page-hero-image": `url(${checkoutHeaderBackground})`,
        }}
      >
        <Link
          className="checkout-back"
          to="/cart"
        >
          ← Vissza a kosárhoz
        </Link>

        <div className="checkout-heading">
          <p>Official Dystopia merchandise</p>

          <h1>Rendelési információk</h1>

          <span>
            {cartCount} db termék
          </span>
        </div>
      </header>


      <div className="checkout-layout">

        <form
          className="checkout-form"
          onSubmit={handleSubmit}
        >
          <p className="checkout-form-kicker">
            Kapcsolattartási adatok
          </p>

          <div className="checkout-field">
            <label htmlFor="name">Teljes név</label>

            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange("name")}
            />
          </div>

          <div className="checkout-field-row">
            <div className="checkout-field">
              <label htmlFor="email">Email cím</label>

              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange("email")}
              />
            </div>

            <div className="checkout-field">
              <label htmlFor="phone">Telefonszám</label>

              <input
                id="phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleChange("phone")}
              />
            </div>
          </div>


          <p className="checkout-form-kicker">
            Szállítási cím
          </p>

          <div className="checkout-field-row">
            <div className="checkout-field checkout-field--narrow">
              <label htmlFor="postalCode">Irányítószám</label>

              <input
                id="postalCode"
                type="text"
                required
                value={form.postalCode}
                onChange={handleChange("postalCode")}
              />
            </div>

            <div className="checkout-field">
              <label htmlFor="city">Város</label>

              <input
                id="city"
                type="text"
                required
                value={form.city}
                onChange={handleChange("city")}
              />
            </div>
          </div>

          <div className="checkout-field">
            <label htmlFor="streetAddress">Utca, házszám</label>

            <input
              id="streetAddress"
              type="text"
              required
              value={form.streetAddress}
              onChange={handleChange("streetAddress")}
            />
          </div>

          <div className="checkout-field">
            <label htmlFor="note">Megjegyzés (opcionális)</label>

            <textarea
              id="note"
              rows={3}
              value={form.note}
              onChange={handleChange("note")}
            />
          </div>


          {error && (
            <p className="checkout-error">
              {error}
            </p>
          )}

          <button
            className="checkout-submit-button"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Feldolgozás..."
              : "Tovább a Stripe fizetéshez"}
          </button>
        </form>


        <aside className="checkout-summary">
          <p className="checkout-summary-kicker">
            Összesítés
          </p>

          <div className="checkout-summary-items">
            {cartItems.map((item) => (
              <div
                className="checkout-summary-item"
                key={item.variantId}
              >
                <span>
                  {item.name} ({item.size}) × {item.quantity}
                </span>

                <span>
                  {(
                    Number(item.price) * item.quantity
                  ).toLocaleString("hu-HU")} Ft
                </span>
              </div>
            ))}
          </div>

          <div className="checkout-summary-total">
            <span>Összesen</span>

            <strong>
              {cartTotal.toLocaleString("hu-HU")} Ft
            </strong>
          </div>

          <p className="checkout-summary-note">
            A fizetés a Stripe biztonságos oldalán történik.
          </p>
        </aside>

      </div>

    </main>
  );
}


export default CheckoutPage;
