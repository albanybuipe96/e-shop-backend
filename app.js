require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
const cors = require('cors')

const productsRoutes = require('./routes/products')
const ordersRoute = require('./routes/orders')
const categoriesRoute = require('./routes/categories')
const usersRoute = require('./routes/users')
const authJwt = require('./helpers/jwt')
const errorHandler = require('./helpers/error-handler')

const app = express()
app.use(cors())
app.options('*', cors())
app.use(express.json())
app.use(morgan('dev'))
app.use(authJwt())
app.use('/public/uploads', express.static(__dirname + '/public/uploads'))
app.use(errorHandler)

const apiURL = process.env.API_URL

app.use(`${apiURL}/products`, productsRoutes)
app.use(`${apiURL}/orders`, ordersRoute)
app.use(`${apiURL}/categories`, categoriesRoute)
app.use(`${apiURL}/users`, usersRoute)

mongoose
    .connect(process.env.CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: 'eshop-database'
    })
    .then(console.log('Connected to MongoDB'))

app.listen(3000, () => console.log('Served at http://localhost:3000'))
