import express from 'express'
import { adminAuthMiddleware } from '../middleware/admin-auth.js'
import { getFirebaseDb } from '../lib/firebase-admin.js'

const router=express.Router()
router.use(adminAuthMiddleware)
router.get('/', async (_req,res)=>{ try { const snap=await getFirebaseDb().collection('auditLogs').orderBy('createdAt','desc').limit(100).get(); res.json({logs:snap.docs.map(d=>({id:d.id,...d.data()})),total:snap.size}) } catch { res.status(500).json({success:false,message:'Failed to load audit log'}) } })
export default router
