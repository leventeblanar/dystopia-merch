import { Routes, Route } from "react-router-dom";

import HomePage from "./Pages/HomePage.jsx";
import MerchPage from "./Pages/MerchPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/merch" element={<MerchPage />} />
    </Routes>
  );
}

export default App;
