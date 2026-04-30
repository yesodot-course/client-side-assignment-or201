import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Chip, Container, Divider, Paper, TextField, Typography } from "@mui/material";
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
    const [qty, setQty] = useState(1);

    useEffect(() => {
        if (items.length === 0) {
            dispatch(fetchItems());
        }
    }, [dispatch, items.length]);

    const product = items.find((p) => p._id === productId);

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

    const handleAddToCart = () => {
        dispatch(addToCart({ item: product, quantity: qty }));
        alert(`${product.name} added to cart!`);
    };

    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <Button startIcon={<ArrowBackIcon />} component={Link} to="/" sx={{ mb: 4 }}>
                Back to Store
            </Button>

            <Paper
                elevation={0}
                sx={{ p: { xs: 2, md: 4 }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}
            >
                <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                    <img
                        src={product.image}
                        alt={product.name}
                        style={{ width: "100%", maxWidth: "350px", borderRadius: "12px", objectFit: "contain" }}
                    />
                </Box>

                <Box sx={{ flex: 1 }}>
                    <Chip label={product.category} sx={{ mb: 2 }} />

                    {/* תיקון השגיאה: fontWeight הועבר ל-sx, והסרת component="h1" אם הוא עושה בעיות */}
                    <Typography variant="h3" gutterBottom sx={{ fontWeight: "bold" }}>
                        {product.name}
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {product.description}
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    {/* תיקון נוסף: העברת fontWeight ל-sx */}
                    <Typography variant="h4" color="primary" sx={{ mb: 1, fontWeight: "bold" }}>
                        ₪{product.price}
                    </Typography>

                    <Typography
                        variant="body2"
                        sx={{ color: product.stock > 0 ? "success.main" : "error.main", mb: 4 }}
                    >
                        {product.stock > 0 ? `In Stock: ${product.stock} units` : "Out of Stock"}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                        <TextField
                            type="number"
                            label="Quantity"
                            size="small"
                            variant="outlined"
                            slotProps={{
                                htmlInput: {
                                    min: 1,
                                    max: product.stock,
                                },
                            }}
                            value={qty}
                            onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                setQty(Math.min(product.stock, Math.max(1, value)));
                            }}
                            sx={{ width: "100px" }}
                        />
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                            fullWidth
                        >
                            Add to Cart
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default DetailsPage;
