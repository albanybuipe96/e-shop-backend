const express = require('express')
const Order = require('../models/order')
const OrderItem = require('../models/order-item')
const { route } = require('./products')

const router = express.Router()

router.get('/', async (req, res) => {
    const orderList = await Order.find()
        .populate('user', 'name')
        .populate({
            path: 'orderItems',
            populate: { path: 'product', populate: 'category' }
        })
        .sort({ dateOrdered: -1 })

    if (!orderList) {
        res.status(500).json({ success: false })
    }

    res.status(200).send(orderList)
})

router.get('/:id', async (req, res) => {
    const { id } = req.params
    const order = await Order.findById(id)
        .populate('user', 'name')
        .populate({
            path: 'orderItems',
            populate: { path: 'product', populate: 'category' }
        })

    if (!order) {
        return res
            .status(400)
            .json({ success: false, message: 'Order item missing.' })
    }

    res.status(200).send(order)
})

router.post('/', async (req, res) => {
    const {
        orderItems,
        shippingAddress1,
        shippingAddress2,
        city,
        zip,
        country,
        phone,
        status,
        user
    } = req.body
    const odrderItemsIds = Promise.all(
        orderItems.map(async (orderItem) => {
            let newOrderItem = new OrderItem({
                quantity: orderItem.quantity,
                product: orderItem.product
            })

            newOrderItem = await newOrderItem.save()
            return newOrderItem._id
        })
    )
    const orderItemsItsResolved = await odrderItemsIds

    const totalPrices = await Promise.all(
        orderItemsItsResolved.map(async (orderItemId) => {
            const orderItem = await OrderItem.findById(orderItemId).populate(
                'product',
                'price'
            )
            const totalPrice = orderItem.product.price * orderItem.quantity
            return totalPrice
        })
    )
    const totalPrice = totalPrices.reduce((a, b) => a + b, 0)
    let order = new Order({
        orderItems: orderItemsItsResolved,
        shippingAddress1,
        shippingAddress2,
        city,
        zip,
        country,
        phone,
        status,
        totalPrice,
        user
    })

    order = await order.save()

    if (!order) {
        res.status(400).json({
            success: false,
            message: 'Error creating order.'
        })
    }

    res.send(order)
})

router.put('/:id', async (req, res) => {
    const { id } = req.params
    const { status } = req.body
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true })

    if (!order) {
        return res.status(400).send('Error modifying order.')
    }

    res.status(200).send(order)
})

router.delete('/:id', async (req, res) => {
    const { id } = req.params
    Order.findByIdAndRemove(id)
        .then(async (order) => {
            if (order) {
                await order.orderItems.map(async (orderItem) => {
                    await OrderItem.findByIdAndRemove(orderItem)
                })
                return res.status(200).json({
                    success: true,
                    message: 'Order deleted successfully.'
                })
            } else {
                return res
                    .status(404)
                    .json({ success: false, message: 'Error deleting order.' })
            }
        })
        .catch((err) => res.status(500).json({ success: false, error: err }))
})

router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
    ])

    console.log(totalSales)

    if (!totalSales) {
        return res.status(400).json({
            success: false,
            message: 'Total sales cannot be generated.'
        })
    }

    res.send({ totalsales: totalSales.pop().totalsales })
})

router.get(`/get/count`, async (req, res) => {
    const orderCount = await Order.countDocuments((count) => count)

    if (!orderCount) {
        res.status(500).json({ success: false })
    }
    res.send({ orderCount })
})

router.get(`/get/userorders/:userid`, async (req, res) => {
    const { userid } = req.params
    const userOrderList = await Order.find({ user: userid })
        .populate({
            path: 'orderItems',
            populate: {
                path: 'product',
                populate: 'category'
            }
        })
        .sort({ dateOrdered: -1 })

    if (!userOrderList) {
        res.status(500).json({ success: false })
    }
    res.send(userOrderList)
})

module.exports = router
