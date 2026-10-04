import app from '../server/app.js'

// Vercel serverless entry. vercel.json rewrites every /api/* request here;
// Express then routes on the original URL path.
export default app
