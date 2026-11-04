const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },

  publicToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Annual rent and payment breakdown
annualRent: {
  type: Number,
  default: 0,
  min: 0
},
  agentCommission: {
    type: Number,
    default: 0,
    min: 0
  },

  legalCommission: {
    type: Number,
    default: 0,
    min: 0
  },

  cautionCommission: {
    type: Number,
    default: 0,
    min: 0
  },

  cautionFeeCommission: {
    type: Number,
    default: 0,
    min: 0
  },

  // Complete amount payable
  totalPrice: {
    type: Number,
    required: true,
    min: 1
  },

  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },

  currency: {
    type: String,
    enum: ['NGN'],
    default: 'NGN'
  },

  paymentMode: {
    type: String,
    enum: ['full', 'deposit', 'monthly', 'custom'],
    required: true
  },

  depositAmount: {
    type: Number,
    default: 0
  },

  monthlyAmount: {
    type: Number,
    default: 0
  },

  monthlyMonths: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['pending', 'partially_paid', 'paid', 'review'],
    default: 'pending',
    index: true
  },

  lastPaymentAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });


// Automatically calculate all rental charges
schema.pre('validate', function () {
  if (this.annualRent > 0) {
    const rent = Number(this.annualRent);

    this.agentCommission = Math.round(rent * 0.10);
    this.legalCommission = Math.round(rent * 0.10);
    this.cautionCommission = Math.round(rent * 0.10);
    this.cautionFeeCommission = Math.round(rent * 0.10);

    this.totalPrice =
      rent +
      this.agentCommission +
      this.legalCommission +
      this.cautionCommission +
      this.cautionFeeCommission;
  }
});


// Calculate outstanding balance
schema.virtual('balance').get(function () {
  return Math.max(
    0,
    Number(this.totalPrice || 0) - Number(this.amountPaid || 0)
  );
});

module.exports =
  mongoose.models.PaymentAgreement ||
  mongoose.model('PaymentAgreement', schema);