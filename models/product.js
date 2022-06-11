const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ''
    },
    images: [{
        type: String
    }],
    brand: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    forReview: {
        type: Boolean,
        default: true
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
    }],
    rating: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    dateCreated: {
        type: Date,
        default: Date.now
    }
})

productSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

productSchema.virtual('totalReviews').get(function() {
    return this.reviews.length;
});

productSchema.set('toJSON', {
    virtuals: true,
});

exports.Product = mongoose.model('Product', productSchema);

/*
 {
    "reviews": [
        {
            "user"   : "a09sfd8a09fsd80afdsa09s80afds",
            "product": "a09sfd8a09fsd80afds",
            "date"   : 2022-01-01,
            "rating" : 5,
            "description": "very nice product"
        }
    ]
 * }
 */