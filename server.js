require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const config = require('./config'); // Your MSSQL config file
const products = require('./routes/products'); // Routes for product APIs
const errorMiddleware = require('./middlewares/error'); // Error-handling middleware

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/products', products);

// Default route
app.use('/', (req, res) => {
    return res.json({
        message: 'Welcome to ChinoAPI HEHE',
    });
});

// Error-handling middleware
app.use(errorMiddleware);

// Database Connection Function
async function connectToDatabase() {
    try {
        await sql.connect(config);

        // Verify connection and fetch current database name
        const result = await sql.query`SELECT DB_NAME() AS CurrentDatabase`;
        console.log('Connected to MSSQL');
        console.log('Using database:', result.recordset[0].CurrentDatabase);
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1); // Exit the process if the database connection fails
    }
}

// Initialize Database Connection
connectToDatabase();

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
