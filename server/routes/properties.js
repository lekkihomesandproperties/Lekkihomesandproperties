const router=require('express').Router();const mongoose=require('mongoose');const Property=require('../models/Property');const Comment=require('../models/Comment');const auth=require('../middleware/auth');
router.get('/',async(req,res)=>{try{const filter={isPublished:true};if(req.query.type)filter.type=req.query.type;if(req.query.category)filter.category=req.query.category;if(req.query.q)filter.$or=[{title:new RegExp(escapeRegex(req.query.q),'i')},{location:new RegExp(escapeRegex(req.query.q),'i')}];const properties=await Property.find(filter).sort({createdAt:-1}).lean();res.json({properties})}catch{res.status(500).json({message:'Could not load properties.'})}});
router.get('/:id',async(req,res)=>{try{if(!mongoose.isValidObjectId(req.params.id))return res.status(404).json({message:'Property not found.'});const property=await Property.findById(req.params.id);if(!property)return res.status(404).json({message:'Property not found.'});res.json({property})}catch{res.status(500).json({message:'Could not load property.'})}});
router.post('/:id/view',async(req,res)=>{try{if(!mongoose.isValidObjectId(req.params.id))return res.status(404).json({message:'Property not found.'});const property=await Property.findByIdAndUpdate(req.params.id,{$inc:{views:1}},{new:true});if(!property)return res.status(404).json({message:'Property not found.'});res.json({property})}catch{res.status(500).json({message:'Could not record view.'})}});
router.post('/:id/like',async(req,res)=>{try{const p=await Property.findById(req.params.id);if(!p)return res.status(404).json({message:'Property not found.'});p.likes+=1;await p.save();res.json({likes:p.likes})}catch{res.status(500).json({message:'Could not record like.'})}});

router.get('/:id/comments',async(req,res)=>{try{const comments=await Comment.find({property:req.params.id}).sort({createdAt:-1}).limit(100).lean();res.json({comments})}catch{res.status(500).json({message:'Could not load comments.'})}});
router.post('/:id/comments',async(req,res)=>{try{const name=String(req.body.name||'').trim(),text=String(req.body.text||'').trim();if(!name||!text)return res.status(400).json({message:'Name and comment are required.'});if(!mongoose.isValidObjectId(req.params.id)||!await Property.exists({_id:req.params.id}))return res.status(404).json({message:'Property not found.'});const comment=await Comment.create({property:req.params.id,name,text});res.status(201).json({comment})}catch{res.status(500).json({message:'Could not save comment.'})}});
router.post('/',auth,async(req,res)=>{try{const p=await Property.create(clean(req.body));res.status(201).json({property:p})}catch(e){res.status(400).json({message:e.message||'Invalid property details.'})}});
router.put('/:id',auth,async(req,res)=>{try{const p=await Property.findByIdAndUpdate(req.params.id,clean(req.body),{new:true,runValidators:true});if(!p)return res.status(404).json({message:'Property not found.'});res.json({property:p})}catch(e){res.status(400).json({message:e.message||'Could not update property.'})}});
router.delete('/:id',auth,async(req,res)=>{try{const p=await Property.findByIdAndDelete(req.params.id);if(!p)return res.status(404).json({message:'Property not found.'});await Comment.deleteMany({property:p._id});res.json({message:'Property deleted.'})}catch{res.status(500).json({message:'Could not delete property.'})}});



// function clean(b){const o={};for(const k of ['title','location','price','type','category','beds','baths','area','image','description','isPublished'])if(b[k]!==undefined)o[k]=b[k];return o}function escapeRegex(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\$&')}module.exports=router;


function clean(b) {
  const o = {};

  const allowedFields = [
    'title',
    'location',
    'price',
    'type',
    'category',
    'beds',
    'baths',
    'area',
    'image',
    'description',
    'isPublished'
  ];

  // Copy the existing supported property fields.
  for (const key of allowedFields) {
    if (b[key] !== undefined) {
      o[key] = b[key];
    }
  }

  // Accept multiple image URLs.
  if (b.images !== undefined) {
    if (!Array.isArray(b.images)) {
      throw new Error('Property images must be provided as an array.');
    }

    o.images = b.images
      .filter(url => typeof url === 'string')
      .map(url => url.trim())
      .filter(Boolean);
  }

  // Keep the first image in the old image field
  // for compatibility with existing website components.
  if (o.images && o.images.length > 0) {
    o.image = o.images[0];
  } else if (o.image && b.images === undefined) {
    // Support older forms that submit only one image.
    o.images = [o.image];
  }

  return o;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = router;