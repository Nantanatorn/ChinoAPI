require("dotenv").config();

const express = require('express');
const cors = require('cors');

const connectDataBase = require('./config/database');
const products =require('./routes/products');
const error = require('./middlewares/error');

const app = express(); 
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/products', products);

connectDataBase();

app.use("", (req, res) =>{
    return res.json({
        message : "Welcome to ChinoAPI HEHE"
    });
});

app.use(error);

const server = app.listen(port, () =>
    console.log (`This Server run at ${port}`));

process.on("unhandledRejection", (error, promise) => {
    console.log(`Logged Error: ${error}`);
    server.close(() => process.exit(1));
  });


  
