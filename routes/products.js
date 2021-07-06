const express = require('express')
const Category = require('../models/category')
const Product = require('../models/product')
const mongoose = require('mongoose')
const multer = require('multer')

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = FILE_TYPE_MAP[file.mimetype]
        let uploadError = new Error('Invalid image type')
        if (isValid) {
            uploadError = null
        }
        cb(null, '/public/uploads')
    },
    filename: (req, file, cb) => {
        const fileName = file.originalname.split(' ').join('-')
        const extension = FILE_TYPE_MAP[file.mimetype]
        cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
})

const uploadOptions = multer({ storage: storage })

const router = express.Router()

router.get('/', async (req, res) => {
    const { categories } = req.query
    let filter = {}
    if (categories) {
        filter = { category: categories.split(',') }
    }

    const products = await Product.find(filter)
        .select('name image price')
        .populate('category')

    if (!products) {
        return res.status(500).json({ success: false })
    }

    res.status(200).send(products)
})

router.get('/:id', async (req, res) => {
    const { id } = req.params
    const product = await Product.findById(id)
        .select('name brand description -_id')
        .populate('category')

    if (!product) {
        return res.status(500).json({ success: false })
    }

    res.status(200).send(product)
})

router.post('/', uploadOptions.single('image'), async (req, res) => {
    const {
        name,
        description,
        richDescription,
        brand,
        price,
        countInStock,
        rating,
        numReviews,
        isFeatured
    } = req.body
    const category = await Category.findById(req.body.category)
    if (!category) {
        return res
            .status(400)
            .json({ success: false, message: 'Category supplied is incorrect' })
    }
    const file = req.file
    if (!file) {
        return res
            .status(400)
            .json({ success: false, message: 'No image in the request.' })
    }
    const fileName = file.filename
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`
    let product = new Product({
        name,
        description,
        richDescription,
        image: `${basePath}${fileName}`,
        brand,
        price,
        category: req.body.category,
        countInStock,
        rating,
        numReviews,
        isFeatured
    })
    product = await product.save()

    if (!product) {
        return res.status(500).send('Error creating product')
    }

    res.status(200).send(product)
})

router.put(':/id', uploadOptions.single('image'), async (req, res) => {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: 'Specified product not found/modified.'
        })
    }
    const {
        name,
        description,
        richDescription,
        brand,
        price,
        countInStock,
        rating,
        numReviews,
        isFeatured
    } = req.body
    const category = await Category.findById(req.body.category)
    if (!category) {
        return res
            .status(400)
            .json({ success: false, message: 'Category supplied incorrect' })
    }

    const product = await Product.findById(id)

    if (!product) {
        return res
            .status(400)
            .json({ success: false, message: 'Error modifying proudct.' })
    }

    const file = req.file
    let imagePath
    if (file) {
        const fileName = file.filename
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`
        imagePth = `${basePath}${fileName}`
    } else {
        imagePath = product.image
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
            name,
            description,
            richDescription,
            image: imagePath,
            brand,
            price,
            category: req.body.category,
            countInStock,
            rating,
            numReviews,
            isFeatured
        },
        { new: true }
    )

    if (!updatedProduct) {
        return res.status(400).json({
            success: false,
            message: 'Specified product not found/modified.'
        })
    }

    return res.status(200).send(updatedProduct)
})

router.delete('/:id', async (req, res) => {
    const { id } = req.params
    Product.findByIdAndRemove(id)
        .then((product) => {
            if (product) {
                return res.status(200).json({
                    success: true,
                    message: 'Specified product deleted successfully.'
                })
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Specified product not found/deleted.'
                })
            }
        })
        .catch((err) => {
            return res.status(500).json({ success: false, error: err })
        })
})

router.get('/get/count', async (req, res) => {
    const count = await Product.countDocuments((count) => count)

    if (!count) {
        return res.status(500).json({ success: false })
    }

    res.status(200).send({
        count
    })
})

router.get('/get/featured/:count', async (req, res) => {
    const count = req.params.count ? req.params.count : 0
    const products = await Product.find({ isFeatured: true }).limit(+count)
    // .select('name isFeatured')

    if (!products) {
        return res
            .status(500)
            .json({ success: false, message: 'Error while fetching data.' })
    }

    res.status(200).send(products)
})

router.put(
    '/gallery-images/:id',
    uploadOptions.array('images', 10),
    async (req, res) => {
        const { id } = req.body
        if (!mongoose.isValidObjectId(id)) {
            return res
                .status(400)
                .json({ success: false, message: 'Invalid product id.' })
        }

        let imagePaths = []
        const files = req.files
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`
        if (files) {
            files.map((file) => imagePaths.push(`${basePath}${file.fileName}`))
        }
        const product = await Product.findByIdAndUpdate(
            id,
            { images: imagePaths },
            { new: true }
        )

        if (!product) {
            return res
                .status(500)
                .json({ success: false, message: 'Error uploading images.' })
        }

        res.send(product)
    }
)

module.exports = router
