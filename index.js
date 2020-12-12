const express = require('express');
const app = express();
const authRoute = require('./routes/auth');
const dotenv = require('dotenv');
const mongoose = require('mongoose')
dotenv.config();
mongoose.connect(process.env.DB_ACCESS,{ useNewUrlParser: true },()=>{
    console.log('DB connected SUCCESSFULLY !');
})
app.use(express.json());
app.use('/api/user',authRoute);

app.listen('3030',()=>console.log('Running on 3030...'));