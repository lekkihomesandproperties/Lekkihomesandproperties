const router = require('express').Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const Property = require('../models/Property');
const Order = require('../models/Order');
const PaymentAgreement = require('../models/PaymentAgreement');

const isEmail = value => /^\S+@\S+\.\S+$/.test(String(value || '').trim());
const toKobo = naira => Math.round(Number(naira) * 100);

router.post('/initialize', async (req, res) => {
  let order;
  try {
    const propertyId = String(req.body.propertyId || '');
    const email = String(req.body.email || '').trim().toLowerCase();
    const paymentType = String(req.body.paymentType || '');
    const agreementToken = String(req.body.agreementToken || '').trim();

    if (!mongoose.isValidObjectId(propertyId) || !isEmail(email)) {
      return res.status(400).json({ message: 'A valid property and email address are required.' });
    }
    if (!process.env.PAYSTACK_SECRET_KEY || !process.env.PAYSTACK_SECRET_KEY.startsWith('sk_')) {
      return res.status(503).json({ message: 'Online payments are not configured. Please contact our team.' });
    }

    const property = await Property.findOne({ _id: propertyId, isPublished: true }).lean();
    if (!property) return res.status(404).json({ message: 'Property not found.' });

    let agreement;
    let chargeAmount;
    let isNewAgreement = false;

    if (agreementToken) {
      agreement = await PaymentAgreement.findOne({ publicToken: agreementToken, property: property._id, email });
      if (!agreement) return res.status(404).json({ message: 'Payment plan not found. Check your payment plan reference.' });
      const balance = Math.max(0, agreement.totalPrice - agreement.amountPaid);
      if (balance <= 0 || agreement.status === 'paid') return res.status(400).json({ message: 'This property has been fully paid for.' });

      if (agreement.paymentMode === 'monthly') {
        chargeAmount = Math.min(agreement.monthlyAmount, balance);
      } else {
        chargeAmount = Number(req.body.amount);
        if (!Number.isSafeInteger(chargeAmount) || chargeAmount <= 0) {
          return res.status(400).json({ message: 'Enter the amount you want to pay.' });
        }
        if (chargeAmount > balance) return res.status(400).json({ message: 'Your payment cannot exceed the outstanding balance.' });
      }
    } else {
      const settings = property.paymentSettings || {};
      if (!settings.enabled) return res.status(400).json({ message: 'Online payment is not enabled for this property. Please contact our team.' });

      const totalPrice = Number(property.price);
      if (!Number.isSafeInteger(totalPrice) || !Number.isSafeInteger(toKobo(totalPrice)) || toKobo(totalPrice) <= 0) {
        return res.status(400).json({ message: 'This property does not have a valid online payment price.' });
      }

      if (paymentType === 'full' && settings.allowFullPayment) {
        chargeAmount = totalPrice;
      } else if (paymentType === 'deposit' && settings.allowDeposit) {
        chargeAmount = Number(settings.depositAmount);
      } else if (paymentType === 'monthly' && settings.allowMonthlyInstallments) {
        chargeAmount = Number(settings.allowDeposit && settings.depositAmount > 0
          ? settings.depositAmount
          : settings.monthlyAmount);
      } else if (paymentType === 'custom' && settings.allowCustomInstallments) {
        chargeAmount = Number(req.body.amount);
      } else {
        return res.status(400).json({ message: 'The selected payment option is not available for this property.' });
      }

      if (!Number.isSafeInteger(chargeAmount) || chargeAmount <= 0 || chargeAmount > totalPrice) {
        return res.status(400).json({ message: 'The payment amount is invalid.' });
      }
      if (paymentType === 'monthly' && (!Number(settings.monthlyAmount) || !Number(settings.monthlyMonths))) {
        return res.status(400).json({ message: 'The monthly installment plan is not fully configured.' });
      }
      if (paymentType === 'monthly' && Number(settings.monthlyAmount) > totalPrice) {
        return res.status(400).json({ message: 'The monthly installment amount cannot exceed the property price.' });
      }

      agreement = await PaymentAgreement.create({
        property: property._id,
        email,
        publicToken: crypto.randomBytes(24).toString('hex'),
        totalPrice,
        amountPaid: 0,
        paymentMode: paymentType,
        depositAmount: Number(settings.depositAmount || 0),
        monthlyAmount: Number(settings.monthlyAmount || 0),
        monthlyMonths: Number(settings.monthlyMonths || 0),
        status: 'pending'
      });
      isNewAgreement = true;
    }

    const amountKobo = toKobo(chargeAmount);
    if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
      if (isNewAgreement) await PaymentAgreement.deleteOne({ _id: agreement._id });
      return res.status(400).json({ message: 'Invalid payment amount.' });
    }

    const reference = `LHP-${Date.now()}-${crypto.randomBytes(5).toString('hex')}`;
    order = await Order.create({
      property: property._id,
      agreement: agreement._id,
      email,
      amount: chargeAmount,
      currency: 'NGN',
      reference,
      status: 'pending'
    });

    const clientUrl = String(process.env.CLIENT_URL || 'https://lekkihomesandproperties.com').replace(/\/$/, '');
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        currency: 'NGN',
        reference,
        callback_url: `${clientUrl}/payment-result.html?agreement=${encodeURIComponent(agreement.publicToken)}`,
        metadata: {
          orderReference: reference,
          agreementToken: agreement.publicToken,
          propertyId: String(property._id),
          propertyTitle: property.title,
          paymentMode: agreement.paymentMode
        }
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.status || !result.data?.authorization_url) {
      order.status = 'failed';
      await order.save();
      if (isNewAgreement) await PaymentAgreement.deleteOne({ _id: agreement._id, amountPaid: 0 });
      return res.status(502).json({ message: result.message || 'Paystack could not initialize this payment.' });
    }

    order.paymentUrl = result.data.authorization_url;
    await order.save();
    return res.json({
      authorization_url: result.data.authorization_url,
      reference,
      agreementToken: agreement.publicToken,
      amount: chargeAmount,
      balanceBeforePayment: Math.max(0, agreement.totalPrice - agreement.amountPaid)
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    if (order && order.status === 'pending') {
      order.status = 'failed';
      await order.save().catch(() => {});
    }
    return res.status(500).json({ message: 'Unable to initialize payment.' });
  }
});

router.get('/verify/:reference', async (req, res) => {
  try {
    const reference = String(req.params.reference || '');
    const order = await Order.findOne({ reference }).populate('agreement');
    if (!order) return res.status(404).json({ message: 'Payment reference not found.' });
    if (order.status === 'paid') return res.json(agreementResult(order));
    if (!process.env.PAYSTACK_SECRET_KEY) return res.status(503).json({ message: 'Payment verification is not configured.' });

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.status || !result.data) {
      return res.status(502).json({ message: 'Could not verify this transaction with Paystack.' });
    }

    const data = result.data;
    const valid = data.status === 'success' &&
      data.reference === order.reference &&
      data.currency === 'NGN' &&
      Number(data.amount) === toKobo(order.amount) &&
      String(data.customer?.email || '').toLowerCase() === order.email.toLowerCase();

    if (!valid) {
      if (['failed', 'abandoned', 'reversed'].includes(data.status) && order.status === 'pending') {
        order.status = 'failed';
        await order.save();
      }
      return res.status(400).json({ status: data.status || 'unverified', message: 'Payment has not been verified as successful.' });
    }

    await recordSuccessfulPayment(order, data);
    const refreshed = await Order.findOne({ reference }).populate('agreement');
    return res.json(agreementResult(refreshed));
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ message: 'Unable to verify payment.' });
  }
});

router.post('/webhook', async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers['x-paystack-signature'];
  const rawBody = req.rawBody;
  if (!secret || !signature || !Buffer.isBuffer(rawBody)) return res.sendStatus(401);

  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest();
  let provided;
  try { provided = Buffer.from(String(signature), 'hex'); } catch { return res.sendStatus(401); }
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) return res.sendStatus(401);

  try {
    const event = req.body;
    if (event?.event === 'charge.success' && event.data?.reference) {
      const order = await Order.findOne({ reference: event.data.reference });
      if (order && event.data.status === 'success' && event.data.currency === 'NGN' &&
          Number(event.data.amount) === toKobo(order.amount) &&
          String(event.data.customer?.email || '').toLowerCase() === order.email.toLowerCase()) {
        await recordSuccessfulPayment(order, event.data);
      }
    }
    return res.sendStatus(200);
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return res.sendStatus(500);
  }
});

async function recordSuccessfulPayment(order, paystackData) {
  // Claim the pending order once, so webhook retries and browser verification cannot double-count it.
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, status: 'pending' },
    { $set: { status: 'processing', paystackTransactionId: String(paystackData.id || '') } },
    { new: true }
  );
  if (!claimed) return;

  // Keep compatibility with legacy full-payment orders created before installment plans existed.
  if (!claimed.agreement) {
    claimed.status = 'paid';
    claimed.verifiedAt = new Date();
    await claimed.save();
    return;
  }

  const agreement = await PaymentAgreement.findOneAndUpdate(
    {
      _id: claimed.agreement,
      $expr: { $lte: [{ $add: ['$amountPaid', claimed.amount] }, '$totalPrice'] }
    },
    { $inc: { amountPaid: claimed.amount }, $set: { lastPaymentAt: new Date() } },
    { new: true }
  );

  if (!agreement) {
    claimed.status = 'review';
    await claimed.save();
    return;
  }

  agreement.status = agreement.amountPaid >= agreement.totalPrice ? 'paid' : 'partially_paid';
  await agreement.save();
  claimed.status = 'paid';
  claimed.verifiedAt = new Date();
  await claimed.save();
}

function agreementResult(order) {
  const agreement = order?.agreement;
  return {
    status: order.status,
    reference: order.reference,
    amount: order.amount,
    currency: 'NGN',
    agreementToken: agreement?.publicToken || '',
    totalPrice: agreement?.totalPrice || 0,
    amountPaid: agreement?.amountPaid || 0,
    balance: agreement ? Math.max(0, agreement.totalPrice - agreement.amountPaid) : 0,
    agreementStatus: agreement?.status || 'pending'
  };
}

module.exports = router;


// const router=require('express').Router();const crypto=require('crypto');const Property=require('../models/Property');const Order=require('../models/Order');
// router.post('/initialize',async(req,res)=>{try{const {propertyId,email}=req.body;if(!propertyId||!/^\S+@\S+\.\S+$/.test(String(email||'')))return res.status(400).json({message:'A valid property and email address are required.'});if(!process.env.PAYSTACK_SECRET_KEY||!process.env.PAYSTACK_SECRET_KEY.startsWith('sk_'))return res.status(503).json({message:'Online payments are not configured. Please contact our team.'});const property=await Property.findById(propertyId);if(!property)return res.status(404).json({message:'Property not found.'});const amountKobo=Math.round(property.price*100);if(!Number.isSafeInteger(amountKobo)||amountKobo<=0)return res.status(400).json({message:'Invalid payment amount.'});const reference='LHP-'+Date.now()+'-'+crypto.randomBytes(4).toString('hex');const order=await Order.create({property:property._id,email,amount:property.price,reference,status:'pending'});const resp=await fetch('https://api.paystack.co/transaction/initialize',{method:'POST',headers:{Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({email,amount:amountKobo,currency:'NGN',reference,callback_url:`${process.env.CLIENT_URL||'http://localhost:5000'}/payment-result.html`,metadata:{orderReference:reference,propertyId:String(property._id),propertyTitle:property.title}})});const data=await resp.json();if(!resp.ok||!data.status){order.status='failed';await order.save();return res.status(502).json({message:data.message||'Payment provider could not initialize payment.'})}order.paymentUrl=data.data.authorization_url;await order.save();res.json({authorization_url:data.data.authorization_url,reference})}catch(e){res.status(500).json({message:'Unable to initialize payment.'})}});
// router.get('/verify/:reference',async(req,res)=>{try{const order=await Order.findOne({reference:req.params.reference});if(!order)return res.status(404).json({message:'Payment reference not found.'});if(!process.env.PAYSTACK_SECRET_KEY)return res.status(503).json({message:'Payment verification is not configured.'});const r=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(order.reference)}`,{headers:{Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`}});const d=await r.json();if(r.ok&&d.status&&d.data.status==='success'&&d.data.currency==='NGN'&&Number(d.data.amount)===Math.round(order.amount*100)&&d.data.customer.email.toLowerCase()===order.email.toLowerCase()){order.status='paid';order.verifiedAt=new Date();await order.save();return res.json({status:'paid',reference:order.reference,amount:order.amount,currency:'NGN'})}order.status='failed';await order.save();res.status(400).json({status:'unverified',message:'Payment could not be verified.'})}catch{res.status(500).json({message:'Unable to verify payment.'})}});
// router.post('/webhook',async(req,res)=>{const signature=req.headers['x-paystack-signature'];const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret||!signature)return res.sendStatus(401);const hash=crypto.createHmac('sha512',secret).update(JSON.stringify(req.body)).digest('hex');if(hash!==signature)return res.sendStatus(401);try{const event=req.body;if(event.event==='charge.success'){const d=event.data;const order=await Order.findOne({reference:d.reference});if(order&&d.status==='success'&&d.currency==='NGN'&&Number(d.amount)===Math.round(order.amount*100)&&d.customer.email.toLowerCase()===order.email.toLowerCase()){order.status='paid';order.verifiedAt=new Date();await order.save()}}res.sendStatus(200)}catch{res.sendStatus(500)}});module.exports=router;
