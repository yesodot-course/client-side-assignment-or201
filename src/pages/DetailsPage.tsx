import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import {
    Box, Button, Chip, Container, Divider, Paper,
    TextField, Typography, Alert, Snackbar,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { addToCart } from "../store/cartSlice.store";
import type { AppDispatch, RootState } from "../store/index";
import { fetchItems } from "../store/itemsSlice";

function DetailsPage() {
    const { productId } = useParams<{ productId: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const { items } = useSelector((state: RootState) => state.items);
    const cartItems = useSelector((state: RootState) => state.cart.items);

    const [qty, setQty]           = useState(1);
    const [alertMsg, setAlertMsg] = useState<string | null>(null);

    useEffect(() => {
        if (items.length === 0) {
            // fetchItems requires page & limit
            dispatch(fetchItems({ page: 1, limit: 100 }));
        }
    }, [dispatch, items.length]);

    const product = items.find(p => p._id === productId);

    if (!product) {
        return (
            <Container sx={{ mt: 10, textAlign: "center" }}>
                <Typography variant="h5">Product not found! 😢</Typography>
                <Button component={Link} to="/" sx={{ mt: 2 }}>
                    Back to Home
                </Button>
            </Container>
        );
    }

    // How many of this product are already in the cart
    const inCart = cartItems.find(i => i._id === product._id)?.quantity ?? 0;
    // Max the user can still add: min(stock remaining, 10 - already in cart)
    const maxCanAdd = Math.min(product.stock, 10 - inCart);

    const handleQtyChange = (value: string) => {
        const parsed = parseInt(value) || 1;
        setQty(Math.min(Math.max(1, parsed), Math.max(maxCanAdd, 1)));
    };

    const handleAddToCart = () => {
        if (!product) return;

        const existingItem = cartItems.find(i => i._id === product._id);

        if (!existingItem && cartItems.length >= 10) {
            setAlertMsg("לא ניתן להוסיף יותר מ-10 סוגי מוצרים שונים לעגלה.");
            return;
        }
        if (inCart + qty > 10) {
            setAlertMsg(`לא ניתן להזמין יותר מ-10 יחידות מהמוצר ${product.name}.`);
            return;
        }
        const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);
        if (totalQty + qty > 50) {
            setAlertMsg(`חריגה מהכמות הכוללת! מותר עד 50 פריטים (כרגע יש ${totalQty}).`);
            return;
        }
        if (inCart + qty > product.stock) {
            setAlertMsg(`אין מספיק מלאי! המלאי הזמין הוא ${product.stock}.`);
            return;
        }

        dispatch(addToCart({ item: product, quantity: qty }));
        setAlertMsg(null);
        // Reset qty for next add
        setQty(1);
    };

    const isDisabled = product.stock === 0 || maxCanAdd <= 0;

    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <Snackbar
                open={!!alertMsg}
                autoHideDuration={4000}
                onClose={() => setAlertMsg(null)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity="warning" onClose={() => setAlertMsg(null)} sx={{ width: "100%" }}>
                    {alertMsg}
                </Alert>
            </Snackbar>

            <Button startIcon={<ArrowBackIcon />} component={Link} to="/" sx={{ mb: 4 }}>
                Back to Store
            </Button>

            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 4 },
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 4,
                }}
            >
                {/* Product image */}
                <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                    <img
                        src={(product as any).image || "https://via.placeholder.com/350"}
                        alt={product.name}
                        style={{
                            width: "100%",
                            maxWidth: "350px",
                            borderRadius: "12px",
                            objectFit: "contain",
                        }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/350";
                        }}
                    />
                </Box>

                {/* Product info */}
                <Box sx={{ flex: 1 }}>
                    <Chip label={product.category} sx={{ mb: 2 }} />

                    <Typography variant="h3" gutterBottom sx={{ fontWeight: "bold" }}>
                        {product.name}
                    </Typography>

                    {(product as any).description && (
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            {(product as any).description}
                        </Typography>
                    )}

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h4" color="primary" sx={{ mb: 1, fontWeight: "bold" }}>
                        ₪{product.price}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: product.stock > 0 ? "success.main" : "error.main", mb: 1 }}
                    >
                        {product.stock > 0 ? `In Stock: ${product.stock} units` : "Out of Stock"}
                    </Typography>

                    {/* Show how many are already in cart */}
                    {inCart > 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            בעגלה: {inCart} · ניתן להוסיף עוד: {Math.max(maxCanAdd, 0)}
                        </Typography>
                    )}

                    {maxCanAdd <= 0 && product.stock > 0 && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            הגעת למקסימום 10 יחידות מהמוצר הזה בעגלה
                        </Alert>
                    )}

                    <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 2 }}>
                        <TextField
                            type="number"
                            label="Quantity"
                            size="small"
                            variant="outlined"
                            disabled={isDisabled}
                            slotProps={{
                                htmlInput: {
                                    min: 1,
                                    max: maxCanAdd,
                                },
                            }}
                            value={qty}
                            onChange={e => handleQtyChange(e.target.value)}
                            sx={{ width: "100px" }}
                        />
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<AddShoppingCartIcon />}
                            onClick={handleAddToCart}
                            disabled={isDisabled}
                            fullWidth
                        >
                            {product.stock === 0
                                ? "Out of Stock"
                                : maxCanAdd <= 0
                                    ? "מקסימום בעגלה"
                                    : "Add to Cart"}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default DetailsPage;
