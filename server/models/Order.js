const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  agreement: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentAgreement', default: null, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, default: 'NGN' },
  reference: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'processing', 'paid', 'failed', 'review'], default: 'pending', index: true },
  paymentUrl: { type: String, default: '' },
  paystackTransactionId: { type: String, default: '' },
  verifiedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', schema);

// const mongoose=require('mongoose');module.exports=mongoose.model('Order',new mongoose.Schema({property:{type:mongoose.Schema.Types.ObjectId,ref:'Property',required:true},email:{type:String,required:true,lowercase:true,trim:true},amount:{type:Number,required:true},currency:{type:String,default:'NGN'},reference:{type:String,required:true,unique:true},status:{type:String,enum:['pending','paid','failed'],default:'pending'},paymentUrl:{type:String,default:''},verifiedAt:{type:Date}},{timestamps:true}));
