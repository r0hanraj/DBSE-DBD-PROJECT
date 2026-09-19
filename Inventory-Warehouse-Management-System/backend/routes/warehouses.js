const express = require("express");
const db = require("../config/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM warehouses ORDER BY warehouse_id DESC");
    res.json(rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { warehouse_name, location="", capacity=null } = req.body;
    if (!warehouse_name) return res.status(400).json({ message: "Warehouse name is required" });
    const [result] = await db.query(
      "INSERT INTO warehouses (warehouse_name,location,capacity) VALUES (?,?,?)",
      [warehouse_name,location,capacity || null]
    );
    res.status(201).json({ message: "Warehouse created", warehouse_id: result.insertId });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const { warehouse_name, location="", capacity=null } = req.body;
    await db.query(
      "UPDATE warehouses SET warehouse_name=?,location=?,capacity=? WHERE warehouse_id=?",
      [warehouse_name,location,capacity || null,req.params.id]
    );
    res.json({ message: "Warehouse updated" });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM warehouses WHERE warehouse_id=?", [req.params.id]);
    res.json({ message: "Warehouse deleted" });
  } catch (error) { res.status(400).json({ message: "Cannot delete a warehouse used by inventory" }); }
});

module.exports = router;
