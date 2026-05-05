import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store/index';
import { removeFromCart, updateQuantity, placeOrder } from '../store/cartSlice.store';
import { Link } from 'react-router-dom';

function CartPage() {
  const { items } = useSelector((state: RootState) => state.cart);
  const dispatch = useDispatch<AppDispatch>();

  // ✅ FIX: Added address state (required by server)
  const [address, setAddress] = useState('');

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleQtyChange = (id: string, newQty: number, stock: number) => {
    if (newQty < 1) return;

    if (newQty > 10) {
      alert("Maximum 10 units allowed per product type.");
      return;
    }

    if (newQty > stock) {
      alert(`Only ${stock} units available in stock.`);
      return;
    }

    const otherItemsQty = items
      .filter(i => i._id !== id)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (otherItemsQty + newQty > 50) {
      alert("Total cart quantity cannot exceed 50 items.");
      return;
    }

    dispatch(updateQuantity({ id, quantity: newQty }));
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    // ✅ FIX: Validate address before submitting
    if (!address || address.trim().length < 5) {
      alert('Please enter a valid delivery address (at least 5 characters).');
      return;
    }

    try {
      const orderData = {
        // ✅ FIX: Use "item" (not "itemId") — matches server schema
        items: items.map(item => ({
          item: item._id,
          quantity: item.quantity
        })),
        // ✅ FIX: Include address — required field on server
        address: address.trim(),
      };

      await dispatch(placeOrder(orderData)).unwrap();
      alert('Order placed successfully!');
      setAddress('');
    } catch (err) {
      // ✅ no 'any' — rejectWithValue returns a string directly
      const msg = typeof err === 'string' ? err : 'Failed to place order';
      alert('Failed to place order: ' + msg);
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
                  max="10"
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

      {/* ✅ FIX: Address input field */}
      <div style={{ marginTop: '20px' }}>
        <label htmlFor="address" style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
          Delivery Address *
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your full delivery address"
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxSizing: 'border-box',
          }}
        />
      </div>

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
