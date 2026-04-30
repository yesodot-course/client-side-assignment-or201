import { DUMMY_PRODUCTS } from "../mockData";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/cartSlice.store";

function HomePage() {
  const dispatch = useDispatch();

  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  const handleAddToCart = (product: any) => {
    const qty = quantities[product._id] || 1;
    dispatch(addToCart({ item: product, quantity: qty }));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>The Store</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {DUMMY_PRODUCTS.map((product) => (
          <div
            key={product._id}
            style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px", width: "200px" }}
          >
            <img src={product.image} alt={product.name} style={{ width: "100%", height: "100px", objectFit: "cover" }} />

            <h3>{product.name}</h3>
            <p>category: {product.category}</p>
            <p>price: ₪{product.price}</p>

            <input
              type="number"
              min={1}
              max={product.stock}
              defaultValue={1} // שיתחיל ב-1
              style={{ width: "50px", marginBottom: "10px" }}
              onChange={(e) =>
                setQuantities({
                  ...quantities,
                  [product._id]: parseInt(e.target.value) || 1,
                })
              }
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => handleAddToCart(product)}>add to cart</button>

              <Link to={`/product/${product._id}`}>
                <button style={{ width: "100%" }}>view in details</button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;