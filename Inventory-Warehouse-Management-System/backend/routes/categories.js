const express = require("express");
const db = require("../config/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categories ORDER BY category_id DESC");
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { category_name, description = "" } = req.body;
    if (!category_name) return res.status(400).json({ message: "Category name is required" });
    const [result] = await db.query(
      "INSERT INTO categories (category_name, description) VALUES (?, ?)",
      [category_name, description]
    );
    res.status(201).json({ message: "Category created", category_id: result.insertId });
  } catch (error) {
    res.status(400).json({ message: error.code === "ER_DUP_ENTRY" ? "Category already exists" : error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { category_name, description = "" } = req.body;
    await db.query("UPDATE categories SET category_name=?, description=? WHERE category_id=?",
      [category_name, description, req.params.id]);
    res.json({ message: "Category updated" });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM categories WHERE category_id=?", [req.params.id]);
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(400).json({ message: "Cannot delete a category used by products" });
  }
});

module.exports = router;
