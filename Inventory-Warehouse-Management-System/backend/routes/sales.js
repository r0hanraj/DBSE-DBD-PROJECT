const express = require("express");
const db = require("../config/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT si.*, p.product_name, w.warehouse_name
      FROM sale_items si
      JOIN products p ON si.product_id=p.product_id
      JOIN warehouses w ON si.warehouse_id=w.warehouse_id
      ORDER BY si.sale_id DESC
    `);
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post("/", async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { product_id, warehouse_id, quantity, unit_price=0, customer_name="", notes="" } = req.body;
    if (!product_id || !warehouse_id || Number(quantity) <= 0) {
      conn.release(); return res.status(400).json({ message: "Product, warehouse and positive quantity are required" });
    }
    await conn.beginTransaction();
    const [stock] = await conn.query(
      "SELECT inventory_id, quantity FROM inventory WHERE product_id=? AND warehouse_id=? FOR UPDATE",
      [product_id,warehouse_id]
    );
    if (!stock.length || Number(stock[0].quantity) < Number(quantity)) {
      throw new Error("Insufficient stock for this sale");
    }
    const [result] = await conn.query(
      "INSERT INTO sale_items (product_id,warehouse_id,quantity,unit_price,customer_name,notes) VALUES (?,?,?,?,?,?)",
      [product_id,warehouse_id,Number(quantity),Number(unit_price)||0,customer_name,notes]
    );
    await conn.query("UPDATE inventory SET quantity=quantity-? WHERE inventory_id=?",
      [Number(quantity),stock[0].inventory_id]);
    await conn.commit();
    res.status(201).json({ message: "Sale recorded and stock reduced", sale_id: result.insertId });
  } catch (error) {
    await conn.rollback(); res.status(400).json({ message: error.message });
  } finally { conn.release(); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM sale_items WHERE sale_id=?", [req.params.id]);
    res.json({ message: "Sale record deleted (stock is not reversed)" });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
