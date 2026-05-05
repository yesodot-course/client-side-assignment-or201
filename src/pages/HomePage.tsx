import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { addToCart } from "../store/cartSlice.store";
import type { AppDispatch, RootState } from "../store/index";
import { fetchItems } from "../store/itemsSlice";
import type { Item } from "../types/item.types";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import {
    Alert, Box, Button, Card, CardActions, CardContent, CardMedia,
    CircularProgress, Container, Pagination, Snackbar, TextField,
    Typography, MenuItem, Select, InputLabel, FormControl, Paper,
    Collapse, IconButton, Divider,
} from "@mui/material";

const ITEMS_PER_PAGE = 16;

const SORT_OPTIONS = [
    { value: "",           label: "ללא מיון" },
    { value: "price_asc",  label: "מחיר: מהנמוך לגבוה" },
    { value: "price_desc", label: "מחיר: מהגבוה לנמוך" },
    { value: "name_asc",   label: "שם: א-ת" },
    { value: "name_desc",  label: "שם: ת-א" },
];

function HomePage() {
    const dispatch = useDispatch<AppDispatch>();
    const [searchParams, setSearchParams] = useSearchParams();

    const { items, totalItems, loading, error } = useSelector((state: RootState) => state.items);
    const cartItems = useSelector((state: RootState) => state.cart.items);

    // ── URL-driven state (what was last submitted) ──────────────────────────
    const pageParam     = parseInt(searchParams.get("page")     ?? "1");
    const searchParam   = searchParams.get("search")   ?? "";
    const categoryParam = searchParams.get("category") ?? "";

    const [currentPage, setCurrentPage] = useState(isNaN(pageParam) ? 1 : pageParam);

    // ── Local input state (what the user is typing — NOT sent until submit) ──
    const [inputText, setInputText]   = useState(searchParam);
    const [category, setCategory]     = useState(categoryParam);
    const [sortBy, setSortBy]         = useState(searchParams.get("sort") ?? "");
    const [minPrice, setMinPrice]     = useState(searchParams.get("minPrice") ?? "");
    const [maxPrice, setMaxPrice]     = useState(searchParams.get("maxPrice") ?? "");
    const [showFilters, setShowFilters] = useState(false);

    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
    const [alertMsg, setAlertMsg]     = useState<string | null>(null);

    // ── Fetch only when URL params change (not on every keystroke) ───────────
    useEffect(() => {
        dispatch(fetchItems({
            page:  currentPage,
            limit: ITEMS_PER_PAGE,
            ...(searchParam   ? { name: searchParam }     : {}),
            ...(categoryParam ? { category: categoryParam } : {}),
        } as any));
    }, [dispatch, currentPage, searchParam, categoryParam]);

    // ── Sorted + price-filtered (client-side on current page) ────────────────
    const processedItems = (() => {
        let result = [...(items ?? [])];
        if (minPrice !== "") result = result.filter(p => p.price >= Number(minPrice));
        if (maxPrice !== "") result = result.filter(p => p.price <= Number(maxPrice));
        if (sortBy === "price_asc")  result.sort((a, b) => a.price - b.price);
        if (sortBy === "price_desc") result.sort((a, b) => b.price - a.price);
        if (sortBy === "name_asc")   result.sort((a, b) => a.name.localeCompare(b.name));
        if (sortBy === "name_desc")  result.sort((a, b) => b.name.localeCompare(a.name));
        return result;
    })();

    const totalPages = totalItems > 0 ? Math.ceil(totalItems / ITEMS_PER_PAGE) : 1;

    // ── Submit search → update URL → useEffect fires fetch ──────────────────
    const handleSearch = () => {
        const params: Record<string, string> = { page: "1" };
        if (inputText) params.search   = inputText;
        if (category)  params.category = category;
        if (sortBy)    params.sort     = sortBy;
        setCurrentPage(1);
        setSearchParams(params);
    };

    const handleReset = () => {
        setInputText(""); setCategory(""); setSortBy("");
        setMinPrice(""); setMaxPrice("");
        setCurrentPage(1);
        setSearchParams({ page: "1" });
    };

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
        const params: Record<string, string> = { page: String(value) };
        if (searchParam)   params.search   = searchParam;
        if (categoryParam) params.category = categoryParam;
        if (sortBy)        params.sort     = sortBy;
        setSearchParams(params);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ── Cart helpers ──────────────────────────────────────────────────────────
    const getMaxQty = (product: Item): number => {
        const inCart = cartItems.find(i => i._id === product._id)?.quantity ?? 0;
        return Math.min(product.stock, 10 - inCart);
    };

    const handleQuantityChange = (productId: string, value: string, product: Item) => {
        const max    = getMaxQty(product);
        const parsed = parseInt(value) || 1;
        setQuantities(prev => ({ ...prev, [productId]: Math.min(Math.max(1, parsed), Math.max(max, 1)) }));
    };

    const handleAddToCart = (product: Item) => {
        const requestedQty = quantities[product._id] || 1;
        const existingItem = cartItems.find(i => i._id === product._id);
        const inCart       = existingItem?.quantity ?? 0;

        if (!existingItem && cartItems.length >= 10) {
            setAlertMsg("לא ניתן להוסיף יותר מ-10 סוגי מוצרים שונים לעגלה."); return;
        }
        if (inCart + requestedQty > 10) {
            setAlertMsg(`לא ניתן להזמין יותר מ-10 יחידות מהמוצר ${product.name}.`); return;
        }
        const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);
        if (totalQty + requestedQty > 50) {
            setAlertMsg(`חריגה מהכמות הכוללת! מותר עד 50 פריטים (כרגע יש ${totalQty}).`); return;
        }
        if (inCart + requestedQty > product.stock) {
            setAlertMsg(`אין מספיק מלאי! המלאי הזמין הוא ${product.stock}.`); return;
        }
        dispatch(addToCart({ item: product, quantity: requestedQty }));
    };

    if (loading)
        return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Snackbar open={!!alertMsg} autoHideDuration={4000} onClose={() => setAlertMsg(null)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                <Alert severity="warning" onClose={() => setAlertMsg(null)} sx={{ width: "100%" }}>
                    {alertMsg}
                </Alert>
            </Snackbar>

            <Typography variant="h3" align="center" sx={{ mb: 4, fontWeight: "bold" }}>
                The Store
            </Typography>

            {/* ── Search & Filter Panel ── */}
            <Paper elevation={2} sx={{ p: 2, mb: 4, borderRadius: 2 }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <TextField
                        placeholder="חיפוש מוצרים..."
                        size="small"
                        fullWidth
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                        slotProps={{ input: { endAdornment: <SearchIcon color="action" /> } }}
                    />
                    <IconButton onClick={() => setShowFilters(v => !v)} color={showFilters ? "primary" : "default"}>
                        <TuneIcon />
                    </IconButton>
                    <Button variant="contained" onClick={handleSearch}>חיפוש</Button>
                    <Button variant="outlined"  onClick={handleReset}>נקה</Button>
                </Box>

                <Collapse in={showFilters}>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: "grid", gap: 2,
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(4,1fr)" } }}>
                        <TextField label="קטגוריה" size="small" fullWidth
                            value={category} onChange={e => setCategory(e.target.value)} />
                        <TextField label="מחיר מינימלי" type="number" size="small" fullWidth
                            value={minPrice} slotProps={{ htmlInput: { min: 0 } }}
                            onChange={e => setMinPrice(e.target.value)} />
                        <TextField label="מחיר מקסימלי" type="number" size="small" fullWidth
                            value={maxPrice} slotProps={{ htmlInput: { min: 0 } }}
                            onChange={e => setMaxPrice(e.target.value)} />
                        <FormControl size="small" fullWidth>
                            <InputLabel>מיון לפי</InputLabel>
                            <Select value={sortBy} label="מיון לפי" onChange={e => setSortBy(e.target.value)}>
                                {SORT_OPTIONS.map(o => (
                                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Collapse>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

            {/* ── Product Grid ── */}
            <Box sx={{
                display: "grid", gap: 4,
                gridTemplateColumns: {
                    xs: "1fr", sm: "repeat(2,minmax(0,1fr))",
                    md: "repeat(3,minmax(0,1fr))", lg: "repeat(4,minmax(0,1fr))",
                },
            }}>
                {processedItems.map(product => {
                    const maxQty = getMaxQty(product);
                    return (
                        <Box key={product._id}>
                            <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 3 }}>
                                <CardMedia component="img" height="160"
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
                                    {(product as any).description && (
                                        <Typography variant="body2" color="text.secondary"
                                            sx={{ mt: 0.5, display: "-webkit-box", WebkitLineClamp: 2,
                                                  WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {(product as any).description}
                                        </Typography>
                                    )}
                                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                                        ₪{product.price}
                                    </Typography>
                                    <TextField label="Quantity" type="number" size="small" fullWidth sx={{ mt: 2 }}
                                        disabled={maxQty <= 0 || product.stock === 0}
                                        slotProps={{ htmlInput: { min: 1, max: maxQty } }}
                                        value={quantities[product._id] || 1}
                                        onChange={e => handleQuantityChange(product._id, e.target.value, product)}
                                    />
                                    {maxQty <= 0 && product.stock > 0 && (
                                        <Typography variant="caption" color="error">
                                            הגעת למקסימום 10 יחידות
                                        </Typography>
                                    )}
                                </CardContent>
                                <CardActions sx={{ flexDirection: "column", p: 2, gap: 1 }}>
                                    <Button variant="contained" fullWidth startIcon={<AddShoppingCartIcon />}
                                        onClick={() => handleAddToCart(product)}
                                        disabled={product.stock === 0 || maxQty <= 0}>
                                        {product.stock === 0 ? "Out of Stock"
                                            : maxQty <= 0 ? "מקסימום בעגלה" : "Add to Cart"}
                                    </Button>
                                    <Button variant="outlined" fullWidth component={Link}
                                        to={`/product/${product._id}`} startIcon={<VisibilityIcon />}
                                        sx={{ ml: "0 !important" }}>
                                        Details
                                    </Button>
                                </CardActions>
                            </Card>
                        </Box>
                    );
                })}
            </Box>

            {/* ── Pagination ── */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                <Pagination count={totalPages} page={currentPage} onChange={handlePageChange}
                    color="primary" size="large" showFirstButton showLastButton />
            </Box>
        </Container>
    );
}

export default HomePage;
