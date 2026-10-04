// Supabase-backed replacement for the old Firebase Admin layer.
// Keeps the same API surface (db.collection().doc().get/set/update/delete, where, orderBy,
// limit, offset, add, count, admin.firestore.FieldValue) so the route files stay unchanged.
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

let sb = null
export function initializeFirebaseAdmin() {
  if (sb) return sb
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set')
  sb = createClient(url, key, { auth: { persistSession: false } })
  return sb
}

const T = 'documents'
const clean = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)))
const sentinel = (op, extra) => ({ __op: op, ...extra })
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function merge(existing, incoming) {
  const out = { ...existing }
  for (const [k, v] of Object.entries(incoming || {})) {
    if (v && v.__op === 'arrayUnion') {
      const arr = Array.isArray(out[k]) ? [...out[k]] : []
      for (const item of clean(v.values)) if (!arr.some((x) => same(x, item))) arr.push(item)
      out[k] = arr
    } else if (v && v.__op === 'increment') {
      out[k] = (Number(out[k]) || 0) + v.n
    } else if (v && v.__op === 'serverTimestamp') {
      out[k] = new Date().toISOString()
    } else if (v !== undefined) {
      out[k] = clean(v)
    }
  }
  return out
}

function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0 }
function test(val, op, target) {
  switch (op) {
    case '==': return same(val, target)
    case '!=': return !same(val, target)
    case '>': return val !== undefined && val !== null && val > target
    case '>=': return val !== undefined && val !== null && val >= target
    case '<': return val !== undefined && val !== null && val < target
    case '<=': return val !== undefined && val !== null && val <= target
    case 'in': return Array.isArray(target) && target.some((t) => same(val, t))
    case 'array-contains': return Array.isArray(val) && val.some((x) => same(x, target))
    default: throw new Error(`Unsupported operator ${op}`)
  }
}

function makeDoc(col, id, data) {
  const ref = docRef(col, id)
  return { id, ref, exists: data !== null, data: () => (data === null ? undefined : clean(data)) }
}

function docRef(col, id) {
  return {
    id,
    async get() {
      const { data, error } = await initializeFirebaseAdmin().from(T).select('data').eq('collection', col).eq('id', id).maybeSingle()
      if (error) throw error
      return makeDoc(col, id, data ? data.data : null)
    },
    async set(payload, opts = {}) {
      let base = {}
      if (opts.merge) base = (await this.get()).data() || {}
      const next = merge(base, payload)
      const { error } = await initializeFirebaseAdmin().from(T).upsert({ collection: col, id, data: next, updated_at: new Date().toISOString() })
      if (error) throw error
    },
    async update(payload) {
      const cur = await this.get()
      if (!cur.exists) throw new Error(`Document ${col}/${id} not found`)
      const next = merge(cur.data(), payload)
      const { error } = await initializeFirebaseAdmin().from(T).update({ data: next, updated_at: new Date().toISOString() }).eq('collection', col).eq('id', id)
      if (error) throw error
    },
    async delete() {
      const { error } = await initializeFirebaseAdmin().from(T).delete().eq('collection', col).eq('id', id)
      if (error) throw error
    },
  }
}

function makeQuery(col, st = { w: [], o: [], lim: null, off: 0 }) {
  const next = (patch) => makeQuery(col, { ...st, ...patch })
  const run = async () => {
    const { data, error } = await initializeFirebaseAdmin().from(T).select('id,data').eq('collection', col).range(0, 9999)
    if (error) throw error
    let rows = data.map((r) => ({ id: r.id, data: r.data || {} }))
    for (const [f, op, v] of st.w) rows = rows.filter((r) => test(r.data[f], op, v))
    // like Firestore, ordering by a field excludes documents that lack it
    rows = rows.filter((r) => st.o.every(([f]) => r.data[f] !== undefined && r.data[f] !== null))
    rows.sort((a, b) => {
      for (const [f, dir] of st.o) {
        const c = cmp(a.data[f], b.data[f])
        if (c) return dir === 'desc' ? -c : c
      }
      return 0
    })
    return rows
  }
  return {
    where: (f, op, v) => next({ w: [...st.w, [f, op, v]] }),
    orderBy: (f, dir = 'asc') => next({ o: [...st.o, [f, dir]] }),
    limit: (n) => next({ lim: n }),
    offset: (n) => next({ off: n }),
    async get() {
      const rows = (await run()).slice(st.off, st.lim == null ? undefined : st.off + st.lim)
      const docs = rows.map((r) => makeDoc(col, r.id, r.data))
      return { docs, empty: docs.length === 0, size: docs.length, forEach: (fn) => docs.forEach(fn) }
    },
    _run: run,
  }
}

function collection(col) {
  const base = makeQuery(col)
  const fixCount = (query) => ({
    ...query,
    where: (...a) => fixCount(query.where(...a)),
    orderBy: (...a) => fixCount(query.orderBy(...a)),
    limit: (...a) => fixCount(query.limit(...a)),
    offset: (...a) => fixCount(query.offset(...a)),
    count: () => ({ get: async () => { const rows = await query._run(); return { data: () => ({ count: rows.length }) } } }),
  })
  const root = fixCount(base)
  root.doc = (id) => docRef(col, id || randomUUID().replace(/-/g, '').slice(0, 20))
  root.add = async (payload) => { const ref = root.doc(); await ref.set(payload); return ref }
  return root
}

export function getFirebaseDb() {
  initializeFirebaseAdmin()
  return { collection }
}

export const admin = {
  firestore: Object.assign(() => getFirebaseDb(), {
    FieldValue: {
      arrayUnion: (...values) => sentinel('arrayUnion', { values }),
      increment: (n) => sentinel('increment', { n }),
      serverTimestamp: () => sentinel('serverTimestamp'),
    },
    Timestamp: { fromDate: (d) => d, now: () => new Date() },
  }),
}
