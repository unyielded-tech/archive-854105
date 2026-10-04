import app from './app.js'
import { initializeFirebaseAdmin } from './lib/firebase-admin.js'

const PORT = Number(process.env.PORT || 8541)

try {
  initializeFirebaseAdmin()
  console.log('✓ Supabase ready')
} catch (error) {
  console.warn(`⚠ Supabase not ready: ${error.message}`)
}

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\nARCHIVE 854105 admin API: http://127.0.0.1:${PORT}\n`)
})
