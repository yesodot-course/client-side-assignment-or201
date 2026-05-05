import { AppBar, Toolbar, Button, Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import StorefrontIcon from '@mui/icons-material/Storefront';

const Navbar = () => {
  return (
    <AppBar position="sticky" sx={{ mb: 4 }}>
      <Toolbar>
        <StorefrontIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          The Store
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={Link} to="/">Home</Button>
          <Button color="inherit" component={Link} to="/cart">Cart</Button>
          <Button color="inherit" component={Link} to="/admin">Admin</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;