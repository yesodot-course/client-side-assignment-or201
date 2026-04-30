import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{ display: 'flex', gap: '20px', padding: '10px', background: '#eee' }}>
      <Link to="/">Home</Link>
      <Link to="/cart">Cart</Link>
      <Link to="/admin">Admin</Link>
    </nav>
  );
};

export default Navbar;