const express = require("express");
const db = require("../config/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.category_name, s.supplier_name,
      COALESCE(SUM(i.quantity),0) AS total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id=c.category_id
      LEFT JOIN suppliers s ON p.supplier_id=s.supplier_id
      LEFT JOIN inventory i ON p.product_id=i.product_id
      GROUP BY p.product_id
      ORDER BY p.product_id DESC
    `);
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { product_name, category_id=null, supplier_id=null, price=0, reorder_level=0, description="" } = req.body;
    if (!product_name) return res.status(400).json({ message: "Product name is required" });
    const [result] = await db.query(
      "INSERT INTO products (product_name,category_id,supplier_id,price,reorder_level,description) VALUES (?,?,?,?,?,?)",
      [product_name,category_id || null,supplier_id || null,Number(price)||0,Number(reorder_level)||0,description]
    );
    res.status(201).json({ message: "Product created", product_id: result.insertId });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const { product_name, category_id=null, supplier_id=null, price=0, reorder_level=0, description="" } = req.body;
    await db.query(
      "UPDATE products SET product_name=?,category_id=?,supplier_id=?,price=?,reorder_level=?,description=? WHERE product_id=?",
      [product_name,category_id || null,supplier_id || null,Number(price)||0,Number(reorder_level)||0,description,req.params.id]
    );
    res.json({ message: "Product updated" });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM products WHERE product_id=?", [req.params.id]);
    res.json({ message: "Product deleted" });
  } catch (error) { res.status(400).json({ message: "Cannot delete a product used by inventory, purchases or sales" }); }
});

module.exports = router;
