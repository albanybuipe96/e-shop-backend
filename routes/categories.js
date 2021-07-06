const express = require('express')
const Category = require('../models/category')
const mongoose = require('mongoose')

const router = express.Router()

router.get('/', async (req, res) => {
    const categoryList = await Category.find()

    if (!categoryList) {
        return res.status(500).json({ success: false })
    }

    res.status(200).send(categoryList)
})

router.get('/:id', async (req, res) => {
    const category = await Category.findById(req.params.id)

    if (!category) {
        return res.status(500).json({
            success: false,
            message: 'Specified category not found.'
        })
    }

    res.status(200).send(category)
})

router.post('/', async (req, res) => {
    const { name, icon, color } = req.body
    let category = new Category({
        name,
        icon,
        color
    })

    category = await category.save()

    if (!category) {
        return res.status(404).json({ success: false })
    }

    res.status(200).send(category)
})

router.put('/:id', async (req, res) => {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
        return res
            .status(400)
            .json({
                success: false,
                message: 'Specified category not found/modified.'
            })
    }
    const { name, icon, color } = req.body
    const category = await Category.findByIdAndUpdate(
        id,
        { name, icon, color },
        { new: true }
    )

    if (!category) {
        return res.status(400).json({
            success: false,
            message: 'Specified category not found/modified.'
        })
    }

    res.status(200).send(category)
})

router.delete('/:id', async (req, res) => {
    const { id } = req.params
    Category.findByIdAndRemove(id)
        .then((category) => {
            if (category) {
                return res
                    .status(200)
                    .json({ success: true, message: 'Category deleted.' })
            } else {
                return res
                    .status(404)
                    .json({ success: false, message: 'Category not found.' })
            }
        })
        .catch((err) => {
            return res.status(400).json({ success: false, error: err })
        })
})

module.exports = router
