import { useEffect } from "react";
import { Link } from "react-router-dom";

import "./CartPage.css";


function OrderCancelledPage() {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, []);


  return (
    <main className="cart-page">

      <header className="cart-header">
        <div className="cart-heading">
          <p>Official Dystopia merchandise</p>

          <h1>Fizetés megszakítva</h1>
        </div>
      </header>

      <section className="cart-empty">
        <h2>Nem történt terhelés.</h2>

        <p>
          A fizetési folyamatot megszakítottad. A kosarad
          tartalma megmaradt, bármikor újra megpróbálhatod.
        </p>

        <Link
          className="cart-empty-link"
          to="/cart"
        >
          Vissza a kosárhoz
        </Link>
      </section>

    </main>
  );
}


export default OrderCancelledPage;
