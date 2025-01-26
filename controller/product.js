const config = require("../config");
const sql = require("mssql");

module.exports.getAllProducts = async (req, res) => {
    try {
        const limit = Number(req.query.limit) || null;
        const sort = req.query.sort === 'desc' ? 'DESC' : 'ASC';
    
        const pool = await sql.connect(config);
   
        let query = `SELECT * FROM Pc ORDER BY id ${sort}`;
        if (limit) {
            query += ` OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY`; 
        }

        const result = await pool.request().query(query);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching products' });
    }
};

module.exports.getProduct = async (req, res) => {
    const id = req.params.id;

    try {
        const pool = await sql.connect(config);

        // Query to fetch a single product by id
        const result = await pool
            .request()
            .input('id', sql.Int, id) // Use input to prevent SQL injection
            .query('SELECT * FROM Pc WHERE id = @id');

        // Send the product details
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching the product' });
    }
};

module.exports.getProductCategories = async (req, res) => {
    try {
        const pool = await sql.connect(config);

        // Query to fetch distinct categories
        const result = await pool.request().query('SELECT DISTINCT category FROM Pc');

        // Send the distinct categories
        res.json(result.recordset.map((row) => row.category.trim())); // Trim because `NCHAR` can pad with spaces
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching product categories' });
    }
};

module.exports.getProductsInCategory = async (req, res) => {
    const category = req.params.category.trim(); // Ensure category is trimmed
    const limit = Number(req.query.limit) || null; // Default to no limit
    const sort = req.query.sort === 'desc' ? 'DESC' : 'ASC'; // Determine sort order

    try {
        const pool = await sql.connect(config);

        // Base query to fetch products in a category
        let query = `SELECT id, title, price, description, category, image FROM Pc WHERE category = @category ORDER BY id ${sort}`;

        // Add LIMIT clause if limit is provided
        if (limit) {
            query += ` OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY`; // MSSQL pagination syntax
        }

        // Execute the query
        const result = await pool
            .request()
            .input('category', sql.NChar(10), category) // Use NCHAR for the category column
            .query(query);

        // Send the response
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching products in the category' });
    }
};

module.exports.addProduct = async (req, res) => {
    // Check if request body is undefined
    if (!req.body) {
        return res.status(400).json({
            status: 'error',
            message: 'Data is undefined',
        });
    }

    const { title, price, description, image, category } = req.body;

    try {
        const pool = await sql.connect(config);

        // Insert the new product into the Pc table
        const result = await pool
            .request()
            .input('title', sql.NVarChar(50), title)
            .input('price', sql.Money, price)
            .input('description', sql.NVarChar(50), description)
            .input('image', sql.NVarChar(50), image)
            .input('category', sql.NChar(10), category)
            .query(
                `INSERT INTO Pc (title, price, description, image, category)
                 OUTPUT INSERTED.id, INSERTED.title, INSERTED.price, INSERTED.description, INSERTED.image, INSERTED.category
                 VALUES (@title, @price, @description, @image, @category)`
            );

        // Send the newly created product as the response
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while adding the product',
        });
    }
};

module.exports.editProduct = async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, price, description, image, category } = req.body;

    // Validate input
    if (!req.body || !id) {
        return res.status(400).json({
            status: 'error',
            message: 'Something went wrong! Check your sent data.',
        });
    }

    try {
        const pool = await sql.connect(config);

        // Update the product in the Pc table
        const result = await pool
            .request()
            .input('id', sql.Int, id)
            .input('title', sql.NVarChar(50), title)
            .input('price', sql.Money, price)
            .input('description', sql.NVarChar(50), description)
            .input('image', sql.NVarChar(50), image)
            .input('category', sql.NChar(10), category)
            .query(
                `UPDATE Pc
                 SET title = @title,
                     price = @price,
                     description = @description,
                     image = @image,
                     category = @category
                 WHERE id = @id
                 OUTPUT INSERTED.id, INSERTED.title, INSERTED.price, INSERTED.description, INSERTED.image, INSERTED.category`
            );

        // If no rows were affected, return 404
        if (result.recordset.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found',
            });
        }

        // Send the updated product as the response
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while updating the product',
        });
    }
};

module.exports.deleteProduct = async (req, res) => {
    const id = parseInt(req.params.id);

    // Validate input
    if (!id) {
        return res.status(400).json({
            status: 'error',
            message: 'Product id should be provided',
        });
    }

    try {
        const pool = await sql.connect(config);

        // Delete the product from the Pc table and return the deleted record
        const result = await pool
            .request()
            .input('id', sql.Int, id)
            .query(
                `DELETE FROM Pc
                 OUTPUT DELETED.id, DELETED.title, DELETED.price, DELETED.description, DELETED.image, DELETED.category
                 WHERE id = @id`
            );

        // If no rows were affected, return 404
        if (result.recordset.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found',
            });
        }

        // Send the deleted product details as the response
        res.json({
            status: 'success',
            message: 'Product deleted successfully',
            product: result.recordset[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while deleting the product',
        });
    }
};