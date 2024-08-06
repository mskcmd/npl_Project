const mongoose = require('mongoose');

const textSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  processedContent: {
    type: String,
    default: '',
  },
  sentiment: {
    type: Number, // or String depending on your needs
    default: 0, // default sentiment value
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 24 * 60 * 60, // TTL index expires documents after 24 hours (1 day)
  },
});

const Text = mongoose.model('Text', textSchema);

module.exports = Text;
