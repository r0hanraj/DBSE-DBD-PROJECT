const express = require("express");
const db = require("../config/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT i.*, p.product_name, p.reorder_level, w.warehouse_name,
      CASE WHEN i.quantity <= p.reorder_level THEN 1 ELSE 0 END AS is_low_stock
      FROM inventory i
      JOIN products p ON i.product_id=p.product_id
      JOIN warehouses w ON i.warehouse_id=w.warehouse_id
      ORDER BY i.inventory_id DESC
    `);
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { product_id, warehouse_id, quantity=0 } = req.body;
    if (!product_id || !warehouse_id) return res.status(400).json({ message: "Product and warehouse are required" });
    const [result] = await db.query(
      "INSERT INTO inventory (product_id,warehouse_id,quantity) VALUES (?,?,?)",
      [product_id,warehouse_id,Math.max(0,Number(quantity)||0)]
    );
    res.status(201).json({ message: "Inventory created", inventory_id: result.insertId });
  } catch (error) {
    res.status(400).json({ message: error.code === "ER_DUP_ENTRY" ? "This product already exists in this warehouse. Use Update." : error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { quantity } = req.body;
    await db.query("UPDATE inventory SET quantity=? WHERE inventory_id=?",
      [Math.max(0,Number(quantity)||0),req.params.id]);
    res.json({ message: "Stock updated" });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM inventory WHERE inventory_id=?", [req.params.id]);
    res.json({ message: "Inventory record deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
