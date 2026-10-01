import express from 'express'
import { adminAuthMiddleware } from '../middleware/admin-auth.js'
import { getFirebaseDb } from '../lib/firebase-admin.js'

const router = express.Router()
router.use(adminAuthMiddleware)

router.get('/', async (_req, res) => {
  try { const snap = await getFirebaseDb().collection('coupons').orderBy('createdAt', 'desc').get(); res.json(snap.docs.map(d => ({ id:d.id, ...d.data() }))) }
  catch { res.status(500).json({ success:false, message:'Failed to load coupons' }) }
})
router.post('/', async (req,res) => {
  try { const data={...req.body, createdAt:new Date(), updatedAt:new Date()}; const ref=await getFirebaseDb().collection('coupons').add(data); res.status(201).json({id:ref.id,...data}) }
  catch { res.status(500).json({ success:false, message:'Failed to create coupon' }) }
})
router.put('/:id', async (req,res) => {
  try { await getFirebaseDb().collection('coupons').doc(req.params.id).update({...req.body, updatedAt:new Date()}); res.json({success:true}) }
  catch { res.status(500).json({success:false,message:'Failed to update coupon'}) }
})
router.delete('/:id', async (req,res) => {
  try { await getFirebaseDb().collection('coupons').doc(req.params.id).delete(); res.json({success:true}) }
  catch { res.status(500).json({success:false,message:'Failed to delete coupon'}) }
})
export default router
