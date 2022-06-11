const { Product } = require('../models/product');
const { Review } = require('../models/review');
const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
    destination: function (_req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads');
    },
    filename: function (_req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    }
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
    // localhost:3000/api/v1/products?categories=2342342,234234
    let filter = { forReview: false };
    if (req.query.categories) {
        filter.category = req.query.categories.split(',')
    }

    if (req.query.brand) {
        filter.brand = { '$regex': req.query.brand, '$options': 'i' }
    }

    if (req.query.code) {
        filter.code = { '$regex': `^${req.query.code}$`, '$options': 'i' }
    }

    if (req.query.name) {
        filter.name = { '$regex': req.query.name, '$options': 'i' }
    }

    console.log(filter.name);

    const productList = await Product.find(filter).populate('category').populate({
        path: 'reviews',
        populate: {
            path: 'product',
            populate: 'category'
        }
    });

    if (!productList) {
        res.status(500).json({ success: false })
    }
    res.send(productList);
})

//requiring path and fs modules
const path = require('path');
const fs = require('fs');
//joining path of directory 
const directoryPath = path.join('public/uploads');

router.get(`/photos`, async (req, res) => {
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }

        var filesList = [];
        files.forEach(function (file) {
            filesList.push(file);
        });

        res.send(filesList);
    });
})

router.get(`/all`, async (req, res) => {
    let filter = {};

    if (req.query.code) {
        filter.code = req.query.code
    }

    const productList = await Product.find(filter).populate('category').populate({
        path: 'reviews',
        populate: {
            path: 'product',
            populate: 'category'
        }
    });

    if (!productList) {
        res.status(500).json({ success: false })
    }
    res.send(productList);
})

router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category').populate({
        path: 'reviews',
        populate: {
            path: 'product',
            populate: 'category'
        }
    });

    if (!product) {
        res.status(500).json({ success: false })
    }
    res.send(product);
})

// returns Array[{}, {}, {}, ...]
router.get(`/reviews/:id`, async (req, res) => {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const reviews = await Review.find({ product: id.toHexString(), isApproved: true }).populate('user').sort({ 'date': -1 });
    // const reviews = await Product.findById(req.params.id).populate({path: 'reviews',populate: 'user'}).select('reviews')

    if (!reviews) {
        res.status(500).json({ success: false })
    }
    res.send(reviews);
})

// add review
router.put('/addReview/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id')
    }

    if (!req.body.rating) {
        return res.status(400).send('Empty request body');
    }

    let newReview = new Review({
        user: req.body.user,
        product: req.params.id,
        rating: req.body.rating,
        description: req.body.description
    })
    newReview = await newReview.save();
    const newReviewId = newReview._id;

    console.log(newReviewId);

    const product = await Product.findByIdAndUpdate(
        req.params.id, {
        $push: {
            reviews: newReviewId
        }
    }, { new: true }
    )

    if (!product)
        return res.status(500).send('the review cannot be added!')

    res.send(product);
})

router.get('/get/reviewCount/:id', async (req, res) => {

    const reviewsCount = await Review.find({ product: req.params.id, isApproved: true })
        .countDocuments((counts) => counts)

    res.send({ value: reviewsCount });
})

router.get('/get/averageRating/:id', async (req, res) => {

    const product = await Product.findById(req.params.id)
        .populate({
            path: 'reviews',
            match: { isApproved: true }
        })
        .select('reviews')

    const allReviewsArr = product.reviews;

    let ratings = [];
    allReviewsArr.forEach(review => {
        ratings.push(review.rating)
    });

    let averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    averageRating = Math.round(averageRating);
    if (!averageRating) {
        averageRating = 0;
    }

    res.send({ value: averageRating });
})

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category')

    const findProduct = await Product.find({ code: req.body.code });
    console.log('found product: ', findProduct);
    if (findProduct.length) return res.status(400).send({ invalidCode: true, message: 'Product already exists' })

    const file = req.file;
    if (!file) return res.status(400).send('No image in the request');

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    let product = new Product({
        code: req.body.code,
        name: req.body.name,
        description: req.body.description,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        forReview: req.body.forReview,
        category: req.body.category,
        isFeatured: req.body.isFeatured,
    })

    product = await product.save();

    if (!product)
        return res.status(500).send('The product cannot be created')

    res.send(product);
})

router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id')
    }

    if (req.body.category) {
        const category = await Category.findById(req.body.category);
        if (!category) return res.status(400).send('Invalid Category')
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send('Invalid Product!');

    const file = req.file;
    let imagepath;

    if (file) {
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagepath = `${basePath}${fileName}`;
    } else {
        imagepath = product.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id, {
        code: req.body.code,
        name: req.body.name,
        description: req.body.description,
        image: imagepath,
        brand: req.body.brand,
        price: req.body.price,
        forReview: req.body.forReview,
        category: req.body.category,
        isFeatured: req.body.isFeatured,
    }, { new: true }
    )

    if (!updatedProduct)
        return res.status(500).send('the product cannot be updated!')

    res.send(updatedProduct);
})

router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id).then(async product => {
        if (product) {
            await product.reviews.map(async review => {
                await Review.findByIdAndRemove(review)
            })
            return res.status(200).json({ success: true, message: 'the product is deleted!' })
        } else {
            return res.status(404).json({ success: false, message: "product not found!" })
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err })
    })
})

router.get(`/get/count`, async (req, res) => {
    let filter = { forReview: false };
    const productCount = await Product.find(filter).countDocuments((count) => count)

    if (!productCount) {
        res.status(500).json({ success: false })
    }
    res.send({
        productCount: productCount
    });
})

router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0
    const products = await Product.find({ isFeatured: true, forReview: false }).limit(+count);

    if (!products) {
        res.status(500).json({ success: false })
    }
    res.send(products);
})

router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    if (files) {
        files.map((file) => {
            imagesPaths.push(`${basePath}${file.filename}`);
        });
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id, {
        images: imagesPaths
    }, { new: true }
    );

    if (!product) return res.status(500).send('the gallery cannot be updated!');

    res.send(product);
});

module.exports = router;