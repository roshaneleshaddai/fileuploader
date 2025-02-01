const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Amount: { type: Number, required: true },
  Date: { type: String, required: true }, // Store in "DD-MM-YYYY" format
  Verified: { type: String, enum: ['Yes', 'No'], required: true },
});

const DataModel = mongoose.model('Data', DataSchema);
module.exports = DataModel;
