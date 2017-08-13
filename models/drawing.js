const mongoose = require('mongoose');
const DrawingSchema = mongoose.Schema({
    key: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: false,
        trim: true
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    symbol: {
        type: String,
        required: false,
        trim: true
    }
});
const Drawing = mongoose.model('Drawing', DrawingSchema);

module.exports = Drawing;