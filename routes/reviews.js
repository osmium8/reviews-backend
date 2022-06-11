const { Review } = require('../models/review');
const { Product } = require('../models/product');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get(`/`, async(_req, res) => {
    const reviewList = await Review.find().populate('user').populate('product').sort({ 'date': -1 });

    if (!reviewList) {
        res.status(500).json({ success: false })
    }
    res.send(reviewList);
})

router.get(`/forProduct/:productId`, async(req, res) => {
    const reviewList = await Review
        .find({ product: req.params.productId, isApproved: true })
        .populate('user')
        .sort({ 'date': -1 });

    if (!reviewList) {
        res.status(500).json({ success: false })
    }
    res.send(reviewList);
})

router.get(`/:id`, async(req, res) => {
    const review = await Review.findById(req.params.id)
        .populate('user')
        .populate({
            path: 'product',
            populate: 'category'
        }).sort({ 'dateOrdered': -1 });

    if (!review) {
        res.status(500).json({ success: false })
    }
    res.send(review);
})

router.post('/', async(req, res) => {

    let review = new Review({
        user: review.user,
        product: review.product,
        rating: review.rating,
        description: review.description
    })
    review = await review.save();

    if (!review)
        return res.status(400).send('the review cannot be created!')

    res.send(review);
})

// approve review
router.put('/:id', async(req, res) => {
    const review = await Review.findByIdAndUpdate(
        req.params.id, {
            isApproved: req.body.isApproved
        }, { new: true }
    )

    if (!review)
        return res.status(400).send('the review cannot be update!')

    res.send(review);
})

router.delete('/:id', (req, res) => {
    Review.findByIdAndRemove(req.params.id).then(async review => {
        if (review) {
            return res.status(200).json({ success: true, message: 'the review is deleted!' })
        } else {
            return res.status(404).json({ success: false, message: "review not found!" })
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err })
    })
})

router.get('/get/count', async(req, res) => {
    const reviewsCount = await Review.find({ isApproved: true }).countDocuments((count) => count);

    if (!reviewsCount) {
        return res.status(400).send('There are no reviews')
    }

    res.send({ reviewsCount: reviewsCount });
})

router.get(`/get/reviews/:userid`, async(req, res) => {
    const userReviewList = await Review.find({ user: req.params.userid })
        .populate('user')
        .populate({
            path: 'product',
            populate: 'category'
        }).sort({ 'dateOrdered': -1 });

    if (!userReviewList) {
        res.status(500).json({ success: false })
    }
    res.send(userReviewList);
})


// add review
router.put('/addReview/:id', async(req, res) => {
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

    res.send(newReview);
})

module.exports = router;