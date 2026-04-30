import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addItem, deleteItem } from "../store/itemsSlice";
import type { RootState, AppDispatch } from "../store/index";
import {
    Container,
    Typography,
    TextField,
    Button,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import InventoryIcon from "@mui/icons-material/Inventory";

function AdminPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { items } = useSelector((state: RootState) => state.items);

    // הוספת השדות החסרים: supplier ו-supplierPrice
    const [newItem, setNewItem] = useState({
        name: "",
        price: 0,
        category: "",
        image: "",
        stock: 0,
        description: "",
        supplier: "", // שדה חובה לפי ה-Schema
        supplierPrice: 0, // שדה חובה לפי ה-Schema
    });

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        // וודא שכל שדות החובה קיימים לפני השליחה
        if (newItem.name && newItem.price > 0 && newItem.supplier) {
            dispatch(addItem(newItem));
            // איפוס הטופס
            setNewItem({
                name: "",
                price: 0,
                category: "",
                image: "",
                stock: 0,
                description: "",
                supplier: "",
                supplierPrice: 0,
            });
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            dispatch(deleteItem(id));
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography
                variant="h4"
                gutterBottom
                sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 2 }}
            >
                <InventoryIcon color="primary" /> Admin Dashboard
            </Typography>

            <Divider sx={{ mb: 4 }} />

            <Box
                sx={{
                    display: "grid",
                    gap: 4,
                    gridTemplateColumns: { xs: "1fr", md: "360px 1fr" },
                }}
            >
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                            Add New Product
                        </Typography>
                        <Box
                            component="form"
                            onSubmit={handleAddItem}
                            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                        >
                            <TextField
                                label="Product Name"
                                variant="outlined"
                                size="small"
                                fullWidth
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                required
                            />
                            <TextField
                                label="Supplier Name"
                                variant="outlined"
                                size="small"
                                fullWidth
                                value={newItem.supplier}
                                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                                required
                            />
                            <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                                <Box>
                                    <TextField
                                        label="Supplier Price"
                                        type="number"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        slotProps={{ htmlInput: { min: 0 } }}
                                        value={newItem.supplierPrice}
                                        onChange={(e) =>
                                            setNewItem({ ...newItem, supplierPrice: Number(e.target.value) })
                                        }
                                        required
                                    />
                                </Box>
                                <Box>
                                    <TextField
                                        label="Retail Price"
                                        type="number"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        slotProps={{ htmlInput: { min: 0 } }}
                                        value={newItem.price}
                                        onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                                        required
                                    />
                                </Box>
                            </Box>
                            <TextField
                                label="Stock Quantity"
                                type="number"
                                variant="outlined"
                                size="small"
                                fullWidth
                                slotProps={{ htmlInput: { min: 0 } }}
                                value={newItem.stock}
                                onChange={(e) => setNewItem({ ...newItem, stock: Number(e.target.value) })}
                                required
                            />
                            <TextField
                                label="Category"
                                variant="outlined"
                                size="small"
                                fullWidth
                                value={newItem.category}
                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            />
                            <TextField
                                label="Image URL"
                                variant="outlined"
                                size="small"
                                fullWidth
                                value={newItem.image}
                                onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                fullWidth
                                sx={{ mt: 1 }}
                            >
                                Create Product
                            </Button>
                        </Box>
                    </Paper>

                <Box>
                    <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
                        <Table>
                            <TableHead sx={{ bgcolor: "grey.100" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: "bold" }}>Product</TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }}>Supplier</TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }} align="right">
                                        S. Price
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }} align="right">
                                        Retail
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }} align="right">
                                        Stock
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }} align="center">
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item._id} hover>
                                        <TableCell sx={{ fontWeight: "medium" }}>{item.name}</TableCell>

                                        <TableCell>
                                            {/* תיקון: בדיקה אם ספק הוא אובייקט או מחרוזת לפני הרנדור */}
                                            {typeof item.supplier === "object" && item.supplier !== null
                                                ? (item.supplier as any).name
                                                : item.supplier}
                                        </TableCell>

                                        <TableCell align="right">₪{item.supplierPrice}</TableCell>
                                        <TableCell align="right">₪{item.price}</TableCell>
                                        <TableCell align="right">{item.stock}</TableCell>
                                        <TableCell align="center">
                                            <IconButton color="error" onClick={() => handleDelete(item._id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>
        </Container>
    );
}

export default AdminPage;
