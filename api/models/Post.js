const mongoose = require('mongoose');
const {Schema, model} = mongoose;
const cloudinary = require('cloudinary').v2;

// import {v2 as cloudinary} from 'cloudinary';
          
cloudinary.config({ 
  cloud_name: 'dwevgksvg', 
  api_key: '421975619667452', 
  api_secret: 'E6cXUgokjrUKtQ6-SncVRdjEXKw' 
});

const PostSchema = new Schema({
    title:String,
    summary:String,
    content:String,
    cover:String,
    author:{type:Schema.Types.ObjectId, ref:'User'},
}, {
    timestamps : true,
});

const PostModel = model('Post', PostSchema);

module.exports = PostModel;