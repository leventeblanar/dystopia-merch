import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext.jsx";

import {
  getShippingFee,
  SIZELESS_VARIANT_LABEL,
  formatSizeCutLabel,
} from "../../shared/constants";

import checkoutHeaderBackground from "../assets/dystopia_background_3.jpg";
import huPostalCodes from "../data/huPostalCodes.json";

import "./CheckoutPage.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HUNGARIAN_PHONE_PATTERN = /^(?:(?:\+|00)36|06)(?:1\d{7}|[2-9]\d{8})$/;

function normalizePhoneNumber(value) {
  return value.replace(/[\s().-]/g, "");
}

function getFieldError(field, value, form) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return "A mező kitöltése kötelező.";

  if (field === "email" && !EMAIL_PATTERN.test(trimmedValue)) {
    return "Adj meg egy érvényes email címet.";
  }

  if (field === "phone" && !HUNGARIAN_PHONE_PATTERN.test(normalizePhoneNumber(trimmedValue))) {
    return "Adj meg magyar telefonszámot, pl. +36 20 123 4567.";
  }

  if (field === "postalCode") {
    if (!/^\d{4}$/.test(trimmedValue)) return "Az irányítószám 4 számjegyből áll.";
    if (!huPostalCodes[trimmedValue]) return "Ez nem ismert magyar irányítószám.";
  }

  if (field === "city") {
    const cities = huPostalCodes[form.postalCode];
    if (cities && !cities.includes(trimmedValue)) {
      return "Válassz az irányítószámhoz tartozó települések közül.";
    }
  }

  return null;
}


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
  const [fieldErrors, setFieldErrors] = useState({});

  const postalCities = huPostalCodes[form.postalCode] ?? [];


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

  const shippingFee = getShippingFee(cartTotal);
  const grandTotal = cartTotal + shippingFee;


  const handleChange = (field) => (event) => {
    const value = field === "postalCode"
      ? event.target.value.replace(/\D/g, "").slice(0, 4)
      : event.target.value;

    setForm((currentForm) => {
      const nextForm = { ...currentForm, [field]: value };

      if (field === "postalCode") {
        const cities = huPostalCodes[value] ?? [];
        nextForm.city = cities.length === 1 ? cities[0] : "";
      }

      return nextForm;
    });

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      ...(field === "postalCode" ? { city: undefined } : {}),
    }));
  };

  const handleBlur = (field) => (event) => {
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: getFieldError(field, event.target.value, form),
    }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextFieldErrors = Object.fromEntries(
      ["name", "email", "phone", "postalCode", "city", "streetAddress"].map(
        (field) => [field, getFieldError(field, form[field], form)]
      )
    );

    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean)) return;

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
              onBlur={handleBlur("name")}
            />

            {fieldErrors.name && <span className="checkout-field-error">{fieldErrors.name}</span>}
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
                onBlur={handleBlur("email")}
                autoComplete="email"
              />

              {fieldErrors.email && <span className="checkout-field-error">{fieldErrors.email}</span>}
            </div>

            <div className="checkout-field">
              <label htmlFor="phone">Telefonszám</label>

              <input
                id="phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleChange("phone")}
                onBlur={handleBlur("phone")}
                inputMode="tel"
                autoComplete="tel"
              />

              {fieldErrors.phone && <span className="checkout-field-error">{fieldErrors.phone}</span>}
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
                onBlur={handleBlur("postalCode")}
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={4}
              />

              {fieldErrors.postalCode && <span className="checkout-field-error">{fieldErrors.postalCode}</span>}
            </div>

            <div className="checkout-field">
              <label htmlFor="city">Város</label>

              {postalCities.length > 1 ? (
                <select
                  id="city"
                  required
                  value={form.city}
                  onChange={handleChange("city")}
                  onBlur={handleBlur("city")}
                  disabled={!form.postalCode}
                >
                  <option value="">Válassz települést</option>
                  {postalCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              ) : (
                <input
                  id="city"
                  type="text"
                  required
                  value={form.city}
                  onChange={handleChange("city")}
                  onBlur={handleBlur("city")}
                  readOnly={postalCities.length === 1}
                  autoComplete="address-level2"
                />
              )}

              {fieldErrors.city && <span className="checkout-field-error">{fieldErrors.city}</span>}
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
              onBlur={handleBlur("streetAddress")}
              autoComplete="street-address"
            />

            {fieldErrors.streetAddress && <span className="checkout-field-error">{fieldErrors.streetAddress}</span>}
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
                  {item.name}
                  {item.size !== SIZELESS_VARIANT_LABEL &&
                    ` (${formatSizeCutLabel(item.size, item.cut)})`} ×{" "}
                  {item.quantity}
                </span>

                <span>
                  {(
                    Number(item.price) * item.quantity
                  ).toLocaleString("hu-HU")} Ft
                </span>
              </div>
            ))}
          </div>

          <div className="checkout-summary-shipping">
            <span>Szállítás</span>

            <span>
              {shippingFee > 0
                ? `${shippingFee.toLocaleString("hu-HU")} Ft`
                : "Ingyenes"}
            </span>
          </div>

          <div className="checkout-summary-total">
            <span>Összesen</span>

            <strong>
              {grandTotal.toLocaleString("hu-HU")} Ft
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
