const express = require("express");
const cors = require("cors");
const db = require("./config/db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/categories", require("./routes/categories"));
app.use("/api/suppliers", require("./routes/suppliers"));
app.use("/api/warehouses", require("./routes/warehouses"));
app.use("/api/products", require("./routes/products"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/purchases", require("./routes/purchases"));
app.use("/api/sales", require("./routes/sales"));
app.use("/api/dashboard", require("./routes/dashboard"));

app.get("/", (req, res) => {
  res.json({ message: "Inventory Warehouse API is running!", status: "success" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    const connection = await db.getConnection();
    console.log("MySQL Database Connected Successfully!");
    connection.release();

    app.listen(PORT, () => {
      console.log("====================================");
      console.log("Inventory Warehouse Server Running");
      console.log(`http://localhost:${PORT}`);
      console.log("====================================");
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

start();
