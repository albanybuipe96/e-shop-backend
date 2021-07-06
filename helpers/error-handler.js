const errorHandler = (err, req, res, next) => {
    if (err) {
        res.status(err.status).json({ success: false, message: err.name })
    }
    next()
}

module.exports = errorHandler
