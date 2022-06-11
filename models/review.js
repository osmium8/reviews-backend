const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    date: {
        type: Date,
        default: Date.now
    },
    rating: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    isApproved: {
        type: Boolean,
        default: false
    }
})

reviewSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

reviewSchema.set('toJSON', {
    virtuals: true,
});

exports.Review = mongoose.model('Review', reviewSchema);