// const mongoose=require('mongoose');const schema=new mongoose.Schema({title:{type:String,required:true,trim:true,maxlength:160},location:{type:String,required:true,trim:true,maxlength:200},price:{type:Number,required:true,min:0},type:{type:String,enum:['For Sale','For Lease'],default:'For Sale'},category:{type:String,enum:['Land','House','Apartment','Commercial'],default:'House'},beds:{type:Number,default:0,min:0},baths:{type:Number,default:0,min:0},area:{type:String,default:''},image:{type:String,default:''},description:{type:String,default:'',maxlength:4000},views:{type:Number,default:0},likes:{type:Number,default:0},likedBy:{type:[String],default:[]},isPublished:{type:Boolean,default:true}},{timestamps:true});module.exports=mongoose.model('Property',schema);





const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },

  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },

  type: {
    type: String,
    enum: ['For Sale', 'For Lease'],
    default: 'For Sale'
  },

  category: {
    type: String,
    enum: ['Land', 'House', 'Apartment', 'Commercial'],
    default: 'House'
  },

  beds: {
    type: Number,
    default: 0,
    min: 0
  },

  baths: {
    type: Number,
    default: 0,
    min: 0
  },

  area: {
    type: String,
    default: ''
  },

  // Main property image for existing website features
  image: {
    type: String,
    default: ''
  },

  // Additional images for the property gallery
  images: {
    type: [{
      type: String,
      trim: true
    }],
    default: []
  },

  description: {
    type: String,
    default: '',
    maxlength: 4000
  },

  views: {
    type: Number,
    default: 0
  },

  likes: {
    type: Number,
    default: 0
  },

  likedBy: {
    type: [String],
    default: []
  },

  isPublished: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Property', schema);