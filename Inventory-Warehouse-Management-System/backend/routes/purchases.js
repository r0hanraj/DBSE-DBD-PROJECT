const express = require("express");
const db = require("../config/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pi.*, p.product_name, w.warehouse_name, s.supplier_name
      FROM purchase_items pi
      JOIN products p ON pi.product_id=p.product_id
      JOIN warehouses w ON pi.warehouse_id=w.warehouse_id
      LEFT JOIN suppliers s ON pi.supplier_id=s.supplier_id
      ORDER BY pi.purchase_id DESC
    `);
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post("/", async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { product_id, warehouse_id, supplier_id=null, quantity, unit_cost=0, notes="" } = req.body;
    if (!product_id || !warehouse_id || Number(quantity) <= 0) {
      conn.release(); return res.status(400).json({ message: "Product, warehouse and positive quantity are required" });
    }
    await conn.beginTransaction();
    const [result] = await conn.query(
      "INSERT INTO purchase_items (product_id,warehouse_id,supplier_id,quantity,unit_cost,notes) VALUES (?,?,?,?,?,?)",
      [product_id,warehouse_id,supplier_id || null,Number(quantity),Number(unit_cost)||0,notes]
    );
    await conn.query(`
      INSERT INTO inventory (product_id,warehouse_id,quantity) VALUES (?,?,?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
    `, [product_id,warehouse_id,Number(quantity)]);
    await conn.commit();
    res.status(201).json({ message: "Purchase recorded and stock increased", purchase_id: result.insertId });
  } catch (error) {
    await conn.rollback(); res.status(500).json({ message: error.message });
  } finally { conn.release(); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM purchase_items WHERE purchase_id=?", [req.params.id]);
    res.json({ message: "Purchase record deleted (stock is not reversed)" });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
