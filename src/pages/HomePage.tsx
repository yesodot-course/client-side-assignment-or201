import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { addToCart } from "../store/cartSlice.store";
import type { AppDispatch, RootState } from "../store/index";
import { fetchItems } from "../store/itemsSlice";
import type { Item } from "../types/item.types";

// Material UI
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    CircularProgress,
    Container,
    Pagination,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";

function HomePage() {
    const dispatch = useDispatch<AppDispatch>();

    // שליפת הנתונים כולל totalItems מה-Redux
    const { items, totalItems, loading, error } = useSelector((state: RootState) => state.items);
    const cartItems = useSelector((state: RootState) => state.cart.items);

    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
    const [alertMsg, setAlertMsg] = useState<string | null>(null);

    // ניהול עמוד נוכחי
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const currentItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        // שליפה פעם אחת של כל המוצרים, ואז פירוק לעמודים בצד הלקוח
        dispatch(fetchItems());
    }, [dispatch]);

    const handleAddToCart = (product: Item) => {
        const requestedQty = quantities[product._id] || 1;

        // לוגיקה עסקית: מקסימום 50 פריטים כולל בעגלה
        const currentTotalQty = cartItems.reduce((sum, i) => sum + i.quantity, 0);
        if (currentTotalQty + requestedQty > 50) {
            setAlertMsg(`חריגה מהכמות הכוללת! מותר עד 50 פריטים (כרגע יש ${currentTotalQty}).`);
            return;
        }

        // לוגיקה עסקית: מקסימום 10 סוגי מוצרים שונים
        const existingItem = cartItems.find((i) => i._id === product._id);
        if (!existingItem && cartItems.length >= 10) {
            setAlertMsg("לא ניתן להוסיף יותר מ-10 סוגי מוצרים שונים לעגלה.");
            return;
        }

        // הגבלת כמות לאותו מוצר ספציפי (מקס' 10)
        const currentQtyInCart = existingItem ? existingItem.quantity : 0;
        if (currentQtyInCart + requestedQty > 10) {
            setAlertMsg(`לא ניתן להזמין יותר מ-10 יחידות מהמוצר ${product.name}.`);
            return;
        }

        // בדיקת מלאי
        if (currentQtyInCart + requestedQty > product.stock) {
            setAlertMsg(`אין מספיק מלאי! המלאי הזמין הוא ${product.stock}.`);
            return;
        }

        dispatch(addToCart({ item: product, quantity: requestedQty }));
    };

    const handleQuantityChange = (productId: string, value: string, maxStock: number) => {
        const parsedValue = parseInt(value) || 1;
        const safeValue = Math.min(Math.max(1, parsedValue), maxStock);
        setQuantities((prev) => ({ ...prev, [productId]: safeValue }));
    };

    if (loading)
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
                <CircularProgress />
            </Box>
        );

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
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

            <Typography variant="h3" align="center" sx={{ mb: 6, fontWeight: "bold" }}>
                The Store
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 4 }}>
                    {error}
                </Alert>
            )}

            <Box
                sx={{
                    display: "grid",
                    gap: 4,
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(3, minmax(0, 1fr))",
                        lg: "repeat(4, minmax(0, 1fr))",
                    },
                }}
            >
                {currentItems?.map((product) => (
                    <Box key={product._id}>
                        <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 3 }}>
                            <CardMedia
                                component="img"
                                height="160"
                                image={product.image || "https://via.placeholder.com/200"}
                                alt={product.name}
                                sx={{ objectFit: "contain", p: 1, bgcolor: "#f5f5f5" }}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold", lineHeight: 1.2, mb: 1 }}>
                                    {product.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {product.category}
                                </Typography>
                                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                                    ₪{product.price}
                                </Typography>

                                <TextField
                                    label="Quantity"
                                    type="number"
                                    size="small"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                    slotProps={{
                                        htmlInput: { min: 1, max: product.stock },
                                    }}
                                    value={quantities[product._id] || 1}
                                    onChange={(e) => handleQuantityChange(product._id, e.target.value, product.stock)}
                                />
                            </CardContent>
                            <CardActions sx={{ flexDirection: "column", p: 2, gap: 1 }}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<AddShoppingCartIcon />}
                                    onClick={() => handleAddToCart(product)}
                                    disabled={product.stock === 0}
                                >
                                    {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    component={Link}
                                    to={`/product/${product._id}`}
                                    startIcon={<VisibilityIcon />}
                                    sx={{ ml: "0 !important" }}
                                >
                                    Details
                                </Button>
                            </CardActions>
                        </Card>
                    </Box>
                ))}
            </Box>

            {/* רכיב ה-Pagination של Material UI */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                <Pagination
                    count={Math.ceil(items.length / itemsPerPage) || 1}
                    page={currentPage}
                    onChange={(_, value) => setCurrentPage(value)}
                    color="primary"
                    size="large"
                />
            </Box>
        </Container>
    );
}

export default HomePage;
