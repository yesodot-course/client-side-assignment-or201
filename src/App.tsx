import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import CartPage from "./pages/CartPage";
import AdminPage from "./pages/AdminPage";
import DetailsPage from "./pages/DetailsPage";

function App() {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/product/:productId" element={<DetailsPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
