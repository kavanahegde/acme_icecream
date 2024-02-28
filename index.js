const pg = require("pg");
const express = require("express");
const path = require("path");

// Initialize Express app
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(require("morgan")("dev")); // Middleware for logging requests

// Create a PostgreSQL client
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme-ice-cream-api"
);

// Serve index.html on root route
app.get("/", (req, res, next) =>
  res.sendFile(path.join(__dirname, "index.html"))
);

// Route to fetch all flavors
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = "SELECT * FROM flavors";
    const response = await client.query(SQL);
    res.json(response.rows); // Send flavors as JSON response
  } catch (error) {
    console.error("Error fetching flavors:", error.message);
    res.status(500).json({ error: "Internal Server Error" }); // Send 500 error response
  }
});

// Route to add a new flavor
app.post("/api/flavors", async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" }); // Send 400 error if name is missing
    }

    const SQL = "INSERT INTO flavors(name) VALUES($1) RETURNING *";
    const response = await client.query(SQL, [name]);
    res.status(201).json(response.rows[0]); // Send 201 status and new flavor as JSON response
  } catch (error) {
    console.error("Error creating flavor:", error.message);
    res.status(500).json({ error: "Internal Server Error" }); // Send 500 error response
  }
});

// Route to update a flavor
app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" }); // Send 400 error if name is missing
    }

    const SQL = "UPDATE flavors SET name=$1 WHERE id=$2 RETURNING *";
    const response = await client.query(SQL, [name, id]);
    if (response.rows.length === 0) {
      return res.status(404).json({ error: "Flavor not found" }); // Send 404 error if flavor not found
    }
    res.json(response.rows[0]); // Send updated flavor as JSON response
  } catch (error) {
    console.error("Error updating flavor:", error.message);
    res.status(500).json({ error: "Internal Server Error" }); // Send 500 error response
  }
});

// Route to delete a flavor
app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const SQL = "DELETE FROM flavors WHERE id=$1 RETURNING *";
    const response = await client.query(SQL, [id]);
    if (response.rows.length === 0) {
      return res.status(404).json({ error: "Flavor not found" }); // Send 404 error if flavor not found
    }
    res.status(204).send(); // Send 204 status (No Content) upon successful deletion
  } catch (error) {
    console.error("Error deleting flavor:", error.message);
    res.status(500).json({ error: "Internal Server Error" }); // Send 500 error response
  }
});

// Function to initialize the application
const init = async () => {
  try {
    // Connect to the PostgreSQL database
    await client.connect();

    // SQL statements to initialize the database schema and seed data
    const SQL = `
        DROP TABLE IF EXISTS flavors;
        CREATE TABLE flavors(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO flavors(name) VALUES('Coconut');
        INSERT INTO flavors(name) VALUES('Mint');
        INSERT INTO flavors(name) VALUES('Honeyberry');
        INSERT INTO flavors(name) VALUES('Choco');
        `;

    // Execute the SQL statements
    await client.query(SQL);
    console.log("DB has been seeded");

    // Start the Express server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`App listening in port ${PORT}`));
  } catch (error) {
    console.error("Error initializing app:", error.message);
  }
};

// Call the init function to start the application
init();
