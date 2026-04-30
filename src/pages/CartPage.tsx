import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store/index';
import { removeFromCart, updateQuantity, placeOrder } from '../store/cartSlice.store';
import { Link } from 'react-router-dom';

function CartPage() {
  const { items } = useSelector((state: RootState) => state.cart);
  const dispatch = useDispatch<AppDispatch>();

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // פונקציה לבדיקת מגבלות ועדכון כמות
  const handleQtyChange = (id: string, newQty: number, stock: number) => {
    // 1. הגבלת מינימום פריט אחד
    if (newQty < 1) return;

    // 2. הגבלה: מקסימום 10 פריטים מאותו סוג (כפי שמופיע בדרישות)
    if (newQty > 10) {
      alert("Maximum 10 units allowed per product type.");
      return;
    }

    // 3. הגבלה: מלאי זמין
    if (newQty > stock) {
      alert(`Only ${stock} units available in stock.`);
      return;
    }

    // 4. הגבלה: מקסימום 50 פריטים סך הכל בעגלה
    const otherItemsQty = items
      .filter(i => i._id !== id)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (otherItemsQty + newQty > 50) {
      alert("Total cart quantity cannot exceed 50 items.");
      return;
    }

    // אם עבר את כל הבדיקות - מעדכנים
    dispatch(updateQuantity({ id, quantity: newQty }));
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    
    try {
      const orderData = {
        items: items.map(item => ({
          itemId: item._id,
          quantity: item.quantity
        }))
      };
      
      await dispatch(placeOrder(orderData)).unwrap();
      alert('Order placed successfully!');
    } catch (err) {
      alert('Failed to place order: ' + (err as Error).message);
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Your Cart</h1>
        <p>Your cart is empty.</p>
        <Link to="/">Go back to store</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Your Cart</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ textAlign: 'left', padding: '10px' }}>Product</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Price</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Quantity</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Total</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{item.name}</td>
              <td style={{ padding: '10px' }}>₪{item.price}</td>
              <td style={{ padding: '10px' }}>
                <input
                  type="number"
                  min="1"
                  max="10" // הגבלה ויזואלית בדפדפן
                  value={item.quantity}
                  onChange={(e) => handleQtyChange(item._id, parseInt(e.target.value) || 1, item.stock)}
                  style={{ width: '50px' }}
                />
              </td>
              <td style={{ padding: '10px' }}>₪{item.price * item.quantity}</td>
              <td style={{ padding: '10px' }}>
                <button onClick={() => dispatch(removeFromCart(item._id))}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <h2>Total Amount: ₪{totalAmount}</h2>
        <button 
          onClick={handlePlaceOrder}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Place Order
        </button>
      </div>
    </div>
  );
}

export default CartPage;