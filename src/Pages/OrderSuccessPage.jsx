import { useEffect } from "react";
import { Link } from "react-router-dom";

import { useCart } from "../context/CartContext.jsx";

import "./CartPage.css";


function OrderSuccessPage() {
  const { clearCart } = useCart();


  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <main className="cart-page">

      <header className="cart-header">
        <div className="cart-heading">
          <p>Official Dystopia merchandise</p>

          <h1>Köszönjük!</h1>
        </div>
      </header>

      <section className="cart-empty">
        <h2>A rendelésed sikeresen feldolgoztuk.</h2>

        <p>
          A fizetés megtörtént, a rendelés részleteit hamarosan
          emailben visszaigazoljuk.
        </p>

        <Link
          className="cart-empty-link"
          to="/merch"
        >
          Vissza a merch store-ba
        </Link>
      </section>

    </main>
  );
}


export default OrderSuccessPage;
