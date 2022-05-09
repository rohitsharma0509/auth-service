// import mongoose from 'mongoose';
const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  phoneNumber: String,
  authType: Number
});
postSchema.index({phoneNumber: 1}, {unique: true});

module.exports = mongoose.model('DbPosts', postSchema)