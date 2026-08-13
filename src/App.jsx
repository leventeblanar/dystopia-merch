import { Routes, Route } from "react-router-dom";

import HomePage from "./Pages/HomePage.jsx";
import MerchPage from "./Pages/MerchPage.jsx";
import CartPage from "./Pages/CartPage.jsx";
import CheckoutPage from "./Pages/CheckoutPage.jsx";
import OrderSuccessPage from "./Pages/OrderSuccessPage.jsx";
import OrderCancelledPage from "./Pages/OrderCancelledPage.jsx";
import AdminPage from "./Pages/AdminPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/merch" element={<MerchPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order/success" element={<OrderSuccessPage />} />
      <Route path="/order/cancelled" element={<OrderCancelledPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

export default App;
