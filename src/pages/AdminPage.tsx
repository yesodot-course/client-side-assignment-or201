import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { addItem, deleteItem, updateItem, fetchItems } from "../store/itemsSlice";
import { fetchSuppliers, addSupplier, deleteSupplier, updateSupplier } from "../store/suppliersSlice";
import type { RootState, AppDispatch } from "../store/index";
import type { Item } from "../types/item.types";
import type { Supplier } from "../types/supplier.types";
import { analyticsService, orderService } from "../services/api.service";
import {
    Container, Typography, TextField, Button, Box, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Divider,
    Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
    Select, InputLabel, FormControl, Chip, Alert, Snackbar, CircularProgress,
    Card, CardContent, Grid, Pagination,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleIcon from "@mui/icons-material/People";
import BarChartIcon from "@mui/icons-material/BarChart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 16;

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

/** Orders with these statuses are shown in the Archive section */
const ARCHIVED_STATUSES: OrderStatus[] = ["delivered", "cancelled"];

const STATUS_COLORS: Record<OrderStatus, "warning" | "info" | "primary" | "success" | "error"> = {
    pending:    "warning",
    processing: "info",
    shipped:    "primary",
    delivered:  "success",
    cancelled:  "error",
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemFormData {
    name: string;
    price: number;
    category: string;
    image: string;
    stock: number;
    description: string;
    supplier: string;
    supplierPrice: number;
}

interface SupplierFormData {
    name: string;
    contactInfo: string;
}

interface AnalyticsData {
    revenue: any;
    topCategory: any;
    topItemDaily: any;
    profitMargins: any;
    topSupplier: any;
    supplierSpending: any;
}

const emptyItemForm: ItemFormData = {
    name: "", price: 0, category: "", image: "",
    stock: 0, description: "", supplier: "", supplierPrice: 0,
};

const emptySupplierForm: SupplierFormData = { name: "", contactInfo: "" };

// ─── Error helper ─────────────────────────────────────────────────────────────
// RTK unwrap() throws the rejectWithValue payload directly — just read .message
function extractErrorMessage(err: unknown): string {
    if (err && typeof err === "object") {
        const e = err as any;
        if (typeof e.message === "string") return e.message;
        if (Array.isArray(e.errors)) return e.errors.map((x: any) => x.message ?? x).join(", ");
    }
    if (typeof err === "string") return err;
    return "An unknown error occurred";
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ title, value, sub, icon, color }: {
    title: string; value: string | number; sub?: string;
    icon: React.ReactNode; color: string;
}) {
    return (
        <Card elevation={2} sx={{ borderRadius: 2, borderLeft: `4px solid ${color}`, height: "100%" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ color, fontSize: 36, display: "flex" }}>{icon}</Box>
                <Box>
                    <Typography variant="body2" color="text.secondary">{title}</Typography>
                    <Typography variant="h6" fontWeight="bold">{value}</Typography>
                    {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
                </Box>
            </CardContent>
        </Card>
    );
}

// ─── AdminPage ────────────────────────────────────────────────────────────────

function AdminPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { items, totalItems, loading } = useSelector((state: RootState) => state.items);
    const { suppliers } = useSelector((state: RootState) => state.suppliers);

    // URL search params for pagination (persists across browser nav)
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam  = parseInt(searchParams.get("tab")  ?? "0");
    const pageParam = parseInt(searchParams.get("page") ?? "1");
    const [tab, setTab]           = useState(isNaN(tabParam)  ? 0 : tabParam);
    const [currentPage, setPage]  = useState(isNaN(pageParam) ? 1 : pageParam);

    const setTabAndUrl = (newTab: number) => {
        setTab(newTab);
        setSearchParams({ tab: String(newTab), page: "1" });
        setPage(1);
    };

    const setPageAndUrl = (newPage: number) => {
        setPage(newPage);
        setSearchParams({ tab: String(tab), page: String(newPage) });
    };

    // Item state
    const [itemForm, setItemForm]         = useState<ItemFormData>(emptyItemForm);
    const [editingItem, setEditingItem]   = useState<Item | null>(null);
    const [itemDialogOpen, setItemDialog] = useState(false);

    // Supplier state
    const [supplierForm, setSupplierForm]           = useState<SupplierFormData>(emptySupplierForm);
    const [editingSupplier, setEditingSupplier]     = useState<Supplier | null>(null);
    const [supplierDialogOpen, setSupplierDialog]   = useState(false);

    // Analytics
    const [analytics, setAnalytics]               = useState<AnalyticsData | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // Orders
    const [orders, setOrders]               = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [showArchive, setShowArchive]     = useState(false);

    // Snackbar
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
        open: false, message: "", severity: "success",
    });

    // ── Fetch on mount / page change
    useEffect(() => {
        dispatch(fetchItems({ page: currentPage, limit: ITEMS_PER_PAGE }));
    }, [dispatch, currentPage]);

    useEffect(() => {
        dispatch(fetchSuppliers());
    }, [dispatch]);

    useEffect(() => {
        if (tab === 2 && !analytics) loadAnalytics();
    }, [tab]);

    useEffect(() => {
        if (tab === 3) loadOrders();
    }, [tab]);

    const showSnack = (message: string, severity: "success" | "error" = "success") =>
        setSnackbar({ open: true, message, severity });

    const showError = (err: unknown) => showSnack(extractErrorMessage(err), "error");

    // ─── Analytics ────────────────────────────────────────────────────────────

    const loadAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const [revenue, topCategory, topItemDaily, profitMargins, topSupplier, supplierSpending] =
                await Promise.allSettled([
                    analyticsService.getRevenue(),
                    analyticsService.getTopCategory(),
                    analyticsService.getTopItemDaily(),
                    analyticsService.getProfitMargins(),
                    analyticsService.getTopSuppliers(),
                    analyticsService.getSupplierSpending(),
                ]);
            setAnalytics({
                revenue:          revenue.status          === "fulfilled" ? revenue.value          : null,
                topCategory:      topCategory.status      === "fulfilled" ? topCategory.value      : null,
                topItemDaily:     topItemDaily.status     === "fulfilled" ? topItemDaily.value     : null,
                profitMargins:    profitMargins.status    === "fulfilled" ? profitMargins.value    : null,
                topSupplier:      topSupplier.status      === "fulfilled" ? topSupplier.value      : null,
                supplierSpending: supplierSpending.status === "fulfilled" ? supplierSpending.value : null,
            });
        } catch (err) {
            showError(err);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // ─── Orders ───────────────────────────────────────────────────────────────

    const loadOrders = async () => {
        setOrdersLoading(true);
        try {
            const data = await orderService.getAll();
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            showError(err);
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        // Optimistic update — change UI immediately, revert on error
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        try {
            await orderService.updateStatus(orderId, newStatus);
            showSnack(`Order status updated to "${newStatus}"`);
        } catch (err) {
            // Revert on failure
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: o.status } : o));
            showError(err);
        }
    };

    // Split orders into active / archived
    const activeOrders   = orders.filter(o => !ARCHIVED_STATUSES.includes(o.status));
    const archivedOrders = orders.filter(o =>  ARCHIVED_STATUSES.includes(o.status));

    // ─── Item helpers ──────────────────────────────────────────────────────────

    const getSupplierName = (supplier: Item["supplier"]): string => {
        if (!supplier) return "—";
        if (typeof supplier === "object") return (supplier as any).name ?? "—";
        const found = suppliers.find(s => s._id === supplier);
        return found ? found.name : "—";
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemForm.name || !itemForm.supplier || itemForm.supplierPrice <= 0) {
            showSnack("Please fill all required fields", "error");
            return;
        }
        try {
            await dispatch(addItem(itemForm)).unwrap();
            setItemForm(emptyItemForm);
            showSnack("Product added successfully");
            dispatch(fetchItems({ page: currentPage, limit: ITEMS_PER_PAGE }));
        } catch (err) {
            showError(err);
        }
    };

    const openEditItem = (item: Item) => {
        setEditingItem(item);
        const supplierId =
            typeof item.supplier === "object" && item.supplier !== null
                ? (item.supplier as any)._id
                : item.supplier;
        setItemForm({
            name:          item.name,
            price:         item.price ?? 0,
            category:      item.category ?? "",
            image:         (item as any).image ?? "",
            stock:         item.stock,
            description:   (item as any).description ?? "",
            supplier:      supplierId ?? "",
            supplierPrice: item.supplierPrice,
        });
        setItemDialog(true);
    };

    const handleUpdateItem = async () => {
        if (!editingItem) return;
        try {
            await dispatch(updateItem({ id: editingItem._id, data: itemForm })).unwrap();
            setItemDialog(false);
            setEditingItem(null);
            setItemForm(emptyItemForm);
            showSnack("Product updated successfully");
        } catch (err) {
            showError(err);
        }
    };

    const handleDeleteItem = (id: string) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        dispatch(deleteItem(id)).unwrap()
            .then(() => {
                showSnack("Product deleted");
                dispatch(fetchItems({ page: currentPage, limit: ITEMS_PER_PAGE }));
            })
            .catch(showError);
    };

    // ─── Supplier helpers ──────────────────────────────────────────────────────

    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierForm.name) { showSnack("Supplier name is required", "error"); return; }
        try {
            await dispatch(addSupplier(supplierForm)).unwrap();
            setSupplierForm(emptySupplierForm);
            showSnack("Supplier added successfully");
        } catch (err) {
            showError(err);
        }
    };

    const openEditSupplier = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setSupplierForm({ name: supplier.name, contactInfo: (supplier as any).contactInfo ?? "" });
        setSupplierDialog(true);
    };

    const handleUpdateSupplier = async () => {
        if (!editingSupplier) return;
        try {
            await dispatch(updateSupplier({ id: editingSupplier._id, data: supplierForm })).unwrap();
            setSupplierDialog(false);
            setEditingSupplier(null);
            setSupplierForm(emptySupplierForm);
            showSnack("Supplier updated successfully");
        } catch (err) {
            showError(err);
        }
    };

    const handleDeleteSupplier = (id: string) => {
        if (!window.confirm("Deleting a supplier will also delete all their products. Are you sure?")) return;
        dispatch(deleteSupplier(id)).unwrap()
            .then(() => showSnack("Supplier deleted"))
            .catch(showError);
    };

    // ─── Shared item form fields ───────────────────────────────────────────────

    const renderItemFields = () => (
        <>
            <TextField label="Product Name" size="small" fullWidth required
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
            <FormControl size="small" fullWidth required>
                <InputLabel>Supplier</InputLabel>
                <Select value={itemForm.supplier} label="Supplier"
                    onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })}>
                    {suppliers.map(s => (
                        <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "1fr 1fr" }}>
                <TextField label="Supplier Price" type="number" size="small" fullWidth required
                    slotProps={{ htmlInput: { min: 0 } }}
                    value={itemForm.supplierPrice}
                    onChange={(e) => setItemForm({ ...itemForm, supplierPrice: Number(e.target.value) })} />
                <TextField label="Retail Price (0 = auto +30%)" type="number" size="small" fullWidth
                    slotProps={{ htmlInput: { min: 0 } }}
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })} />
            </Box>
            <TextField label="Stock" type="number" size="small" fullWidth required
                slotProps={{ htmlInput: { min: 0 } }}
                value={itemForm.stock}
                onChange={(e) => setItemForm({ ...itemForm, stock: Number(e.target.value) })} />
            <TextField label="Category" size="small" fullWidth
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} />
            <TextField label="Image URL" size="small" fullWidth
                value={itemForm.image}
                onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })} />
            <TextField label="Description" size="small" fullWidth multiline rows={3}
                placeholder="Enter product description..."
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
        </>
    );

    // ─── Orders table renderer ─────────────────────────────────────────────────

    const renderOrdersTable = (orderList: any[]) => (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
            <Table>
                <TableHead sx={{ bgcolor: "grey.100" }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Order ID</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Address</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Items</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }} align="right">Total</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }} align="right">Profit</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }} align="center">Status</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {orderList.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                No orders found
                            </TableCell>
                        </TableRow>
                    ) : orderList.map((order) => (
                        <TableRow key={order._id} hover>
                            <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                                {String(order._id).slice(-8)}
                            </TableCell>
                            <TableCell>
                                {new Date(order.orderDate ?? order.createdAt).toLocaleDateString("he-IL")}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {order.address}
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                    {order.items?.map((oi: any, i: number) => (
                                        <Chip key={i} size="small"
                                            label={`${oi.item?.name ?? "Item"} ×${oi.quantity}`} />
                                    ))}
                                </Box>
                            </TableCell>
                            <TableCell align="right">₪{Number(order.totalAmount).toFixed(2)}</TableCell>
                            <TableCell align="right">
                                <Typography fontWeight="bold"
                                    color={order.shopProfit >= 0 ? "success.main" : "error.main"}>
                                    ₪{Number(order.shopProfit).toFixed(2)}
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <FormControl size="small" sx={{ minWidth: 130 }}>
                                    <Select
                                        value={order.status ?? "pending"}
                                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                        renderValue={(val) => (
                                            <Chip
                                                label={val}
                                                size="small"
                                                color={STATUS_COLORS[val as OrderStatus] ?? "default"}
                                            />
                                        )}
                                    >
                                        {ORDER_STATUSES.map(s => (
                                            <MenuItem key={s} value={s}>
                                                <Chip label={s} size="small" color={STATUS_COLORS[s]} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom
                sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 2 }}>
                <InventoryIcon color="primary" /> Admin Dashboard
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Tabs value={tab} onChange={(_, v) => setTabAndUrl(v)} sx={{ mb: 3 }}>
                <Tab icon={<InventoryIcon />}   label="Products"  iconPosition="start" />
                <Tab icon={<PeopleIcon />}      label="Suppliers" iconPosition="start" />
                <Tab icon={<BarChartIcon />}    label="Analytics" iconPosition="start" />
                <Tab icon={<ReceiptLongIcon />} label="Orders"    iconPosition="start" />
            </Tabs>

            {/* ══════════════ PRODUCTS ══════════════ */}
            {tab === 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: "360px 1fr" } }}>
                        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">Add New Product</Typography>
                            <Box component="form" onSubmit={handleAddItem}
                                sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {renderItemFields()}
                                <Button type="submit" variant="contained" startIcon={<AddIcon />} fullWidth>
                                    Create Product
                                </Button>
                            </Box>
                        </Paper>

                        <Box>
                            {loading ? (
                                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
                                    <Table>
                                        <TableHead sx={{ bgcolor: "grey.100" }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: "bold" }}>Product</TableCell>
                                                <TableCell sx={{ fontWeight: "bold" }}>Supplier</TableCell>
                                                <TableCell sx={{ fontWeight: "bold" }} align="right">S. Price</TableCell>
                                                <TableCell sx={{ fontWeight: "bold" }} align="right">Retail</TableCell>
                                                <TableCell sx={{ fontWeight: "bold" }} align="right">Stock</TableCell>
                                                <TableCell sx={{ fontWeight: "bold" }} align="center">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {items.map(item => (
                                                <TableRow key={item._id} hover>
                                                    <TableCell>
                                                        <Typography fontWeight="medium">{item.name}</Typography>
                                                        {(item as any).description && (
                                                            <Typography variant="caption" color="text.secondary"
                                                                sx={{ display: "block", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {(item as any).description}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{getSupplierName(item.supplier)}</TableCell>
                                                    <TableCell align="right">₪{item.supplierPrice}</TableCell>
                                                    <TableCell align="right">₪{item.price}</TableCell>
                                                    <TableCell align="right">
                                                        <Chip label={item.stock} size="small"
                                                            color={item.stock < 5 ? "error" : item.stock < 20 ? "warning" : "success"} />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton color="primary" onClick={() => openEditItem(item)}>
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton color="error" onClick={() => handleDeleteItem(item._id)}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {totalItems > ITEMS_PER_PAGE && (
                                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                                    <Pagination
                                        count={Math.ceil(totalItems / ITEMS_PER_PAGE)}
                                        page={currentPage}
                                        onChange={(_, v) => setPageAndUrl(v)}
                                        color="primary"
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ══════════════ SUPPLIERS ══════════════ */}
            {tab === 1 && (
                <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: "360px 1fr" } }}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">Add New Supplier</Typography>
                        <Box component="form" onSubmit={handleAddSupplier}
                            sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <TextField label="Supplier Name" size="small" fullWidth required
                                value={supplierForm.name}
                                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
                            <TextField label="Contact Info" size="small" fullWidth
                                value={supplierForm.contactInfo}
                                onChange={(e) => setSupplierForm({ ...supplierForm, contactInfo: e.target.value })} />
                            <Button type="submit" variant="contained" startIcon={<AddIcon />} fullWidth>
                                Add Supplier
                            </Button>
                        </Box>
                    </Paper>

                    <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
                        <Table>
                            <TableHead sx={{ bgcolor: "grey.100" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }}>Contact Info</TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }} align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {suppliers.map(supplier => (
                                    <TableRow key={supplier._id} hover>
                                        <TableCell>{supplier.name}</TableCell>
                                        <TableCell>{(supplier as any).contactInfo ?? "—"}</TableCell>
                                        <TableCell align="center">
                                            <IconButton color="primary" onClick={() => openEditSupplier(supplier)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton color="error" onClick={() => handleDeleteSupplier(supplier._id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* ══════════════ ANALYTICS ══════════════ */}
            {tab === 2 && (
                <Box>
                    {analyticsLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : analytics ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <StatCard title="Top Supplier (Profit)"
                                        value={analytics.topSupplier?.name ?? "N/A"}
                                        sub={analytics.topSupplier ? `₪${analytics.topSupplier.totalProfit}` : undefined}
                                        icon={<TrendingUpIcon fontSize="inherit" />} color="#1976d2" />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <StatCard title="Top Category (7 days)"
                                        value={analytics.topCategory?._id ?? "N/A"}
                                        sub={analytics.topCategory ? `₪${Number(analytics.topCategory.categoryProfit).toFixed(2)}` : undefined}
                                        icon={<ShoppingBagIcon fontSize="inherit" />} color="#9c27b0" />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <StatCard title="Top Item Today"
                                        value={analytics.topItemDaily?.name ?? "N/A"}
                                        sub={analytics.topItemDaily ? `₪${Number(analytics.topItemDaily.totalProfit).toFixed(2)} profit` : undefined}
                                        icon={<BarChartIcon fontSize="inherit" />} color="#ed6c02" />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <StatCard title="Best Margin"
                                        value={analytics.profitMargins?.highestMargin?.name ?? "N/A"}
                                        sub={analytics.profitMargins?.highestMargin ? `${(analytics.profitMargins.highestMargin.margin * 100).toFixed(1)}%` : undefined}
                                        icon={<TrendingUpIcon fontSize="inherit" />} color="#2e7d32" />
                                </Grid>
                            </Grid>

                            {Array.isArray(analytics.revenue) && analytics.revenue.length > 0 && (
                                <Paper elevation={2} sx={{ borderRadius: 2, p: 3 }}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>Monthly Revenue</Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: "grey.100" }}>
                                                <TableRow>
                                                    <TableCell>Month</TableCell>
                                                    <TableCell>Year</TableCell>
                                                    <TableCell align="right">Total Revenue</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {analytics.revenue.map((row: any, i: number) => (
                                                    <TableRow key={i} hover>
                                                        <TableCell>{MONTH_NAMES[(row._id?.month ?? 1) - 1]}</TableCell>
                                                        <TableCell>{row._id?.year}</TableCell>
                                                        <TableCell align="right">₪{Number(row.totalRevenue).toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            )}

                            {Array.isArray(analytics.supplierSpending) && analytics.supplierSpending.length > 0 && (
                                <Paper elevation={2} sx={{ borderRadius: 2, p: 3 }}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>Supplier Spending</Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: "grey.100" }}>
                                                <TableRow>
                                                    <TableCell>Supplier</TableCell>
                                                    <TableCell align="right">Total Spent</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {analytics.supplierSpending.map((row: any, i: number) => (
                                                    <TableRow key={i} hover>
                                                        <TableCell>{row.supplierName ?? row.supplierId}</TableCell>
                                                        <TableCell align="right">₪{Number(row.totalSpent).toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            )}

                            {analytics.profitMargins && (
                                <Paper elevation={2} sx={{ borderRadius: 2, p: 3 }}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>Profit Margins</Typography>
                                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Highest Margin</Typography>
                                            <Typography fontWeight="bold">{analytics.profitMargins.highestMargin?.name ?? "N/A"}</Typography>
                                            <Typography color="success.main">
                                                {analytics.profitMargins.highestMargin ? `${(analytics.profitMargins.highestMargin.margin * 100).toFixed(1)}%` : ""}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Lowest Margin</Typography>
                                            <Typography fontWeight="bold">{analytics.profitMargins.lowestMargin?.name ?? "N/A"}</Typography>
                                            <Typography color="error.main">
                                                {analytics.profitMargins.lowestMargin ? `${(analytics.profitMargins.lowestMargin.margin * 100).toFixed(1)}%` : ""}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            )}

                            <Button variant="outlined" onClick={() => { setAnalytics(null); loadAnalytics(); }}>
                                Refresh Analytics
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: "center", py: 8 }}>
                            <Typography color="text.secondary" gutterBottom>No analytics data loaded.</Typography>
                            <Button variant="contained" onClick={loadAnalytics}>Load Analytics</Button>
                        </Box>
                    )}
                </Box>
            )}

            {/* ══════════════ ORDERS ══════════════ */}
            {tab === 3 && (
                <Box>
                    {ordersLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {/* Toolbar */}
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="h6" fontWeight="bold">
                                    {showArchive ? (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <ArchiveIcon /> Archive
                                            <Chip label={archivedOrders.length} size="small" color="default" />
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            Active Orders
                                            <Chip label={activeOrders.length} size="small" color="primary" />
                                        </Box>
                                    )}
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <Button
                                        variant={showArchive ? "contained" : "outlined"}
                                        startIcon={showArchive ? <UnarchiveIcon /> : <ArchiveIcon />}
                                        onClick={() => setShowArchive(v => !v)}
                                        color={showArchive ? "inherit" : "primary"}
                                    >
                                        {showArchive ? "Show Active" : `Archive (${archivedOrders.length})`}
                                    </Button>
                                    <Button variant="outlined" onClick={loadOrders}>Refresh</Button>
                                </Box>
                            </Box>

                            {/* Active orders */}
                            {!showArchive && renderOrdersTable(activeOrders)}

                            {/* Archive */}
                            {showArchive && (
                                <Box>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        Archive shows orders with status <strong>delivered</strong> or <strong>cancelled</strong>.
                                    </Alert>
                                    {renderOrdersTable(archivedOrders)}
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            )}

            {/* ══════════════ EDIT ITEM DIALOG ══════════════ */}
            <Dialog open={itemDialogOpen} onClose={() => setItemDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                        {renderItemFields()}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setItemDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateItem}>Save Changes</Button>
                </DialogActions>
            </Dialog>

            {/* ══════════════ EDIT SUPPLIER DIALOG ══════════════ */}
            <Dialog open={supplierDialogOpen} onClose={() => setSupplierDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Supplier</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                        <TextField label="Supplier Name" size="small" fullWidth required
                            value={supplierForm.name}
                            onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
                        <TextField label="Contact Info" size="small" fullWidth
                            value={supplierForm.contactInfo}
                            onChange={(e) => setSupplierForm({ ...supplierForm, contactInfo: e.target.value })} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSupplierDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateSupplier}>Save Changes</Button>
                </DialogActions>
            </Dialog>

            {/* ══════════════ SNACKBAR ══════════════ */}
            <Snackbar open={snackbar.open} autoHideDuration={5000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default AdminPage;
