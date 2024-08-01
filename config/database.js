const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

const connectDataBase = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } 
    catch (error) {
        console.log('error please check your ip in mongoDB');
        
    }
};


module.exports = connectDataBase;