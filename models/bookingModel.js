const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Booking must belong to a tour!'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Booking must belong to a User'],
    },
    price: {
        type: Number,
        required: [true, 'Booking must have a price'],
    },
    createAt: {
        type: Date,
        default: Date.now(),
    },
    paid: {
        type: Boolean,
        default: true,
    },
});
bookingSchema.pre(/^find/, function (next) {
    this.populate('user').populate({
        path: 'tour',
        select: 'name',
    });
    next();
});
bookingSchema.index({ tour: 1, user: 1 }, { unique: true });
// chỗ này định làm để mỗi user chỉ được book một tour thôi ! nHưng mà có vấn đề
// pre middleware have to access next() function
const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
