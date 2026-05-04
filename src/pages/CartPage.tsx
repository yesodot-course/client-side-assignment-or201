import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store/index';
import { removeFromCart, updateQuantity, placeOrder } from '../store/cartSlice.store';
import { Link } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Table, TableHead, TableRow,
    TableCell, TableBody, TableContainer, IconButton, TextField, Button,
    Divider, Chip, Alert, Snackbar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function CartPage() {
    const { items } = useSelector((state: RootState) => state.cart);
    const dispatch = useDispatch<AppDispatch>();

    const [address, setAddress] = useState('');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success',
    });

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleQtyChange = (id: string, newQty: number, stock: number) => {
        if (newQty < 1) return;
        if (newQty > 10) {
            setSnackbar({ open: true, message: 'Maximum 10 units per product type.', severity: 'error' });
            return;
        }
        if (newQty > stock) {
            setSnackbar({ open: true, message: `Only ${stock} units available in stock.`, severity: 'error' });
            return;
        }
        const otherItemsQty = items.filter(i => i._id !== id).reduce((sum, i) => sum + i.quantity, 0);
        if (otherItemsQty + newQty > 50) {
            setSnackbar({ open: true, message: 'Total cart quantity cannot exceed 50 items.', severity: 'error' });
            return;
        }
        dispatch(updateQuantity({ id, quantity: newQty }));
    };

    const handlePlaceOrder = async () => {
        if (items.length === 0) return;
        if (!address.trim() || address.trim().length < 5) {
            setSnackbar({ open: true, message: 'Please enter a valid delivery address (min 5 characters).', severity: 'error' });
            return;
        }

        try {
            const orderData = {
                // Server expects: { items: [{ item: id, quantity }], address }
                items: items.map(item => ({
                    item: item._id,       // ← "item" not "itemId"
                    quantity: item.quantity,
                })),
                address: address.trim(),
            };

            await dispatch(placeOrder(orderData as any)).unwrap();
            setSnackbar({ open: true, message: 'Order placed successfully! 🎉', severity: 'success' });
            setAddress('');
        } catch (err: any) {
            // Extract real server message from axios error
            const msg =
                err?.response?.data?.message ??
                err?.data?.message ??
                err?.message ??
                'Failed to place order';
            setSnackbar({ open: true, message: msg, severity: 'error' });
        }
    };

    if (items.length === 0) {
        return (
            <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>Your cart is empty</Typography>
                <Button component={Link} to="/" variant="contained" startIcon={<ArrowBackIcon />}>
                    Go back to store
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartCheckoutIcon color="primary" /> Your Cart
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, mb: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Price</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Total</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">Remove</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item._id} hover>
                                <TableCell>
                                    <Typography fontWeight="medium">{item.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Stock: {item.stock}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">₪{item.price}</TableCell>
                                <TableCell align="center">
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={item.quantity}
                                        onChange={(e) => handleQtyChange(item._id, parseInt(e.target.value) || 1, item.stock)}
                                        slotProps={{ htmlInput: { min: 1, max: Math.min(10, item.stock), style: { textAlign: 'center', width: 60 } } }}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Typography fontWeight="bold">₪{(item.price * item.quantity).toFixed(2)}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton color="error" onClick={() => dispatch(removeFromCart(item._id))}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Summary + checkout */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                        {items.length} product type{items.length !== 1 ? 's' : ''} ·{' '}
                        {items.reduce((s, i) => s + i.quantity, 0)} items
                    </Typography>
                    <Chip label={`Total: ₪${totalAmount.toFixed(2)}`}
                        color="primary" sx={{ fontSize: 16, fontWeight: 'bold', px: 1 }} />
                </Box>

                <TextField
                    label="Delivery Address"
                    placeholder="Enter your full delivery address..."
                    fullWidth
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    sx={{ mb: 2 }}
                    helperText="Minimum 5 characters"
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button component={Link} to="/" variant="outlined" startIcon={<ArrowBackIcon />}>
                        Continue Shopping
                    </Button>
                    <Button variant="contained" color="success" size="large"
                        startIcon={<ShoppingCartCheckoutIcon />}
                        onClick={handlePlaceOrder}
                        disabled={items.length === 0}
                        sx={{ flexGrow: 1 }}>
                        Place Order · ₪{totalAmount.toFixed(2)}
                    </Button>
                </Box>
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={5000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default CartPage;
