import { useParams, Link } from 'react-router-dom';
import { DUMMY_PRODUCTS } from '../mockData'; 

function DetailsPage() {
  const { productId } = useParams<{ productId: string }>();

  const product = DUMMY_PRODUCTS.find(p => p._id === productId);

  if (!product) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>אוי! המוצר לא נמצא 😢</h2>
        <Link to="/">חזור לדף הבית</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '30px', alignItems: 'center' }}>
      
      <div>
        <img src={product.image} alt={product.name} style={{ width: '300px', borderRadius: '10px' }} />
      </div>

      <div style={{ display: '    flex', flexDirection: 'column', gap: '15px' }}>
        <Link to="/">← חזור לדף הבית</Link>
        <span style={{ background: '#eee', padding: '5px', borderRadius: '5px', alignSelf: 'start' }}>
          {product.category}
        </span>
        <h1 style={{ margin: 0 }}>{product.name}</h1>
        <p style={{ color: 'gray' }}>ספק: {product.supplier}</p>
        <p style={{ fontSize: '1.2em' }}>{product.description}</p>
        
        <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#2e7d32' }}>
          ₪{product.price}
        </div>
        
        <p>במלאי: {product.stock} יחידות</p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
           <input type="number" defaultValue={1} min={1} max={product.stock} style={{ width: '50px', fontSize: '1.2em' }} />
           <button style={{ padding: '10px 20px', fontSize: '1.1em' }}>
              הוסף לעגלה 🛒
           </button>
        </div>
      </div>
    </div>
  );
}

export default DetailsPage;