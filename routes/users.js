require('dotenv').config()
const express = require('express')
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const router = express.Router()

/**
 * Get all users
 */
router.get('/', async (req, res) => {
    const userList = await User.find().select(' -passwordHash -__v ')

    if (!userList) {
        return res.status(500).json({ success: false })
    }

    res.status(200).send(userList)
})

/**
 * Get user based on [id]
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params
    const user = await User.findById(id).select('-passwordHash')

    if (!user) {
        return res.status(404).json({ success: false })
    }

    res.status(200).send(user)
})

/**
 * Add new user
 */
router.post('/register', async (req, res) => {
    const {
        name,
        email,
        password,
        phone,
        isAdmin,
        street,
        apartment,
        zip,
        city,
        country
    } = req.body
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country
    })
    user = await user.save()

    if (!user) return res.status(400).send('the user cannot be created!')

    res.send(user)
})

/**
 * Update user based on [id]
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: 'Specified user not found/modified.'
        })
    }
    const {
        name,
        email,
        password,
        phone,
        isAdmin,
        street,
        apartment,
        zip,
        city,
        country
    } = req.body
    let newPassword
    const userExist = await User.findById(id)
    if (password) {
        newPassword = bcrypt.hashSync(password, 10)
    } else {
        newPassword = userExist.passwordHash
    }
    const user = await User.findByIdAndUpdate(
        id,
        {
            name,
            email,
            passwordHash: newPassword,
            phone,
            isAdmin,
            street,
            apartment,
            zip,
            city,
            country
        },
        { new: true }
    )

    if (!user) {
        return res
            .status(400)
            .json({ success: false, message: 'Error creating user.' })
    }

    res.status(200).send(user)
})

/**
 * Sign in user [email, password]
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    const secret = process.env.SECRET
    if (!user) {
        return res.status(400).send('The user not found')
    }

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin
            },
            secret,
            { expiresIn: '1d' }
        )
        res.status(200).send({ user: user.email, token })
    } else {
        res.status(400).send('password is wrong!')
    }
})

router.delete('/:id', async (req, res) => {
    const { id } = req.params
    User.findByIdAndRemove(id)
        .then((user) => {
            if (user) {
                return res
                    .status(200)
                    .json({ success: true, message: 'User deleted.' })
            } else {
                return res
                    .status(404)
                    .json({ success: false, message: 'User not found.' })
            }
        })
        .catch((err) => {
            return res.status(400).json({ success: false, error: err })
        })
})

router.get('/get/count', async (req, res) => {
    const count = await User.countDocuments((count) => count)

    if (!count) {
        return res.status(500).json({ success: false })
    }

    res.status(200).send({
        count
    })
})

module.exports = router
