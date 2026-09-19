const express = require("express");
const db = require("../config/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM suppliers ORDER BY supplier_id DESC");
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { supplier_name, email="", phone="", address="" } = req.body;
    if (!supplier_name) return res.status(400).json({ message: "Supplier name is required" });
    const [result] = await db.query(
      "INSERT INTO suppliers (supplier_name,email,phone,address) VALUES (?,?,?,?)",
      [supplier_name,email,phone,address]
    );
    res.status(201).json({ message: "Supplier created", supplier_id: result.insertId });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const { supplier_name, email="", phone="", address="" } = req.body;
    await db.query(
      "UPDATE suppliers SET supplier_name=?,email=?,phone=?,address=? WHERE supplier_id=?",
      [supplier_name,email,phone,address,req.params.id]
    );
    res.json({ message: "Supplier updated" });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM suppliers WHERE supplier_id=?", [req.params.id]);
    res.json({ message: "Supplier deleted" });
  } catch (error) { res.status(400).json({ message: "Cannot delete a supplier used by products" }); }
});

module.exports = router;
