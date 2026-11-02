
const mongoose = require('mongoose');

const paymentSettingsSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  allowFullPayment: { type: Boolean, default: true },
  allowDeposit: { type: Boolean, default: true },
  depositAmount: { type: Number, default: 0, min: 0 },
  allowMonthlyInstallments: { type: Boolean, default: false },
  monthlyAmount: { type: Number, default: 0, min: 0 },
  monthlyMonths: { type: Number, default: 0, min: 0, max: 120 },
  allowCustomInstallments: { type: Boolean, default: true }
}, { _id: false });

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  location: { type: String, required: true, trim: true, maxlength: 200 },
  price: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['For Sale', 'For Rent', 'For Lease'], default: 'For Sale' },
  category: { type: String, enum: ['Land', 'House', 'Apartment', 'Commercial'], default: 'House' },
  beds: { type: Number, default: 0, min: 0 },
  baths: { type: Number, default: 0, min: 0 },
  area: { type: String, default: '' },
  image: { type: String, default: '' },
  images: { type: [{ type: String, trim: true }], default: [] },
  description: { type: String, default: '', maxlength: 4000 },
  paymentSettings: { type: paymentSettingsSchema, default: () => ({}) },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.Property || mongoose.model('Property', schema);


// const mongoose=require('mongoose');const schema=new mongoose.Schema({title:{type:String,required:true,trim:true,maxlength:160},location:{type:String,required:true,trim:true,maxlength:200},price:{type:Number,required:true,min:0},type:{type:String,enum:['For Sale','For Lease'],default:'For Sale'},category:{type:String,enum:['Land','House','Apartment','Commercial'],default:'House'},beds:{type:Number,default:0,min:0},baths:{type:Number,default:0,min:0},area:{type:String,default:''},image:{type:String,default:''},description:{type:String,default:'',maxlength:4000},views:{type:Number,default:0},likes:{type:Number,default:0},likedBy:{type:[String],default:[]},isPublished:{type:Boolean,default:true}},{timestamps:true});module.exports=mongoose.model('Property',schema);
// const mongoose = require('mongoose');

// const schema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//     trim: true,
//     maxlength: 160
//   },

//   location: {
//     type: String,
//     required: true,
//     trim: true,
//     maxlength: 200
//   },

//   price: {
//     type: Number,
//     required: true,
//     min: 0
//   },

// type: {
// type: String,
// enum: ["For Sale", "For Rent", "For Lease"],
// default: "For Sale"
// },

//   category: {
//     type: String,
//     enum: ['Land', 'House', 'Apartment', 'Commercial'],
//     default: 'House'
//   },

//   beds: {
//     type: Number,
//     default: 0,
//     min: 0
//   },

//   baths: {
//     type: Number,
//     default: 0,
//     min: 0
//   },

//   area: {
//     type: String,
//     default: ''
//   },

//   // Main property image for existing website features
//   image: {
//     type: String,
//     default: ''
//   },

//   // Additional images for the property gallery
//   images: {
//     type: [{
//       type: String,
//       trim: true
//     }],
//     default: []
//   },

//   description: {
//     type: String,
//     default: '',
//     maxlength: 4000
//   },

//   views: {
//     type: Number,
//     default: 0
//   },

//   likes: {
//     type: Number,
//     default: 0
//   },

//   likedBy: {
//     type: [String],
//     default: []
//   },

//   isPublished: {
//     type: Boolean,
//     default: true
//   }

// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('Property', schema);



