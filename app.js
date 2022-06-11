const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv/config');

//Routes
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const usersRoutes = require('./routes/users');
const reviewsRoutes = require('./routes/reviews');

const jwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

const api = process.env.API_URL;

app.use(cors());
app.options('*', cors())

//middlewares
app.use(express.json());
app.use(morgan('tiny'));
app.use(jwt);
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
app.use(errorHandler);

app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/reviews`, reviewsRoutes);

//Database
mongoose.connect(
        process.env.CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: process.env.DB_NAME
        }
    )
    .then(() => {
        console.log('Database Connection is ready...')
    })
    .catch((err) => {
        console.log(err);
    })

const PORT = process.env.PORT || 3000;
//Server
app.listen(PORT, () => {

    console.log(`server is running on PORT: ${PORT}`);
})