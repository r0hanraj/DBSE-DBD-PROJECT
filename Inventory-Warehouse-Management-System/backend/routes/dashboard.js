const express = require("express");
const db = require("../config/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [[products]] = await db.query("SELECT COUNT(*) AS total_products FROM products");
    const [[categories]] = await db.query("SELECT COUNT(*) AS total_categories FROM categories");
    const [[suppliers]] = await db.query("SELECT COUNT(*) AS total_suppliers FROM suppliers");
    const [[warehouses]] = await db.query("SELECT COUNT(*) AS total_warehouses FROM warehouses");
    const [[stock]] = await db.query("SELECT COALESCE(SUM(quantity),0) AS total_stock FROM inventory");
    const [[low]] = await db.query(`
      SELECT COUNT(*) AS low_stock_items FROM (
        SELECT p.product_id
        FROM products p LEFT JOIN inventory i ON p.product_id=i.product_id
        GROUP BY p.product_id, p.reorder_level
        HAVING COALESCE(SUM(i.quantity),0) <= p.reorder_level
      ) x
    `);
    const [lowStockProducts] = await db.query(`
      SELECT p.product_id,p.product_name,p.reorder_level,COALESCE(SUM(i.quantity),0) AS total_stock
      FROM products p LEFT JOIN inventory i ON p.product_id=i.product_id
      GROUP BY p.product_id,p.product_name,p.reorder_level
      HAVING COALESCE(SUM(i.quantity),0) <= p.reorder_level
      ORDER BY total_stock ASC
    `);
    res.json({
      ...products,...categories,...suppliers,...warehouses,...stock,...low,
      low_stock_products: lowStockProducts
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
