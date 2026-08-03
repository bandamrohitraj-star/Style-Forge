import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { PRODUCTS } from '@/lib/products'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ---------- MongoDB ----------
let cachedClient = null
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGO_URL)
    await cachedClient.connect()
  }
  return cachedClient.db(process.env.DB_NAME || 'styleforge')
}

// ---------- AI Provider Abstraction ----------
// Modular try-on layer — currently backed by Gemini 2.5 Flash Image via Emergent's LLM gateway.
async function generateTryOn({ personBase64, personMime, garmentBase64, garmentMime, extraPrompt }) {
  const key = process.env.EMERGENT_LLM_KEY
  if (!key) throw new Error('EMERGENT_LLM_KEY missing')

  const instruction = [
    'You are a professional virtual try-on stylist. Create a photorealistic image where the PERSON in Image 1 is wearing the GARMENT shown in Image 2.',
    'Preserve the person\'s face, identity, pose, body proportions, skin tone, hair, hands, and background exactly.',
    'Preserve the garment\'s exact color, pattern, texture, logo/print placement, neckline, sleeves, seams, buttons and silhouette.',
    'Fit the garment naturally on the body with realistic drape, folds, shadows, and consistent lighting from the person photo.',
    'Do not add accessories, do not change camera angle, do not beautify the person, do not modify the garment design.',
    extraPrompt || '',
    'Return the edited photo as an image.'
  ].filter(Boolean).join(' ')

  const body = {
    model: 'gemini/gemini-3.1-flash-image-preview',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: instruction },
        { type: 'image_url', image_url: { url: `data:${personMime};base64,${personBase64}` } },
        { type: 'image_url', image_url: { url: `data:${garmentMime};base64,${garmentBase64}` } },
      ]
    }],
    modalities: ['image', 'text']
  }

  const resp = await fetch('https://integrations.emergentagent.com/llm/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body)
  })

  const json = await resp.json()
  if (!resp.ok) {
    console.error('Emergent LLM error', resp.status, JSON.stringify(json).slice(0,500))
    throw new Error(json?.error?.message || 'AI generation failed')
  }

  // Robust extraction across possible LiteLLM/Emergent response shapes
  const msg = json?.choices?.[0]?.message || {}
  // 1) images array style
  if (Array.isArray(msg.images) && msg.images.length) {
    const first = msg.images[0]
    if (typeof first === 'string') return { dataUrl: first.startsWith('data:') ? first : `data:image/png;base64,${first}` }
    if (first?.image_url?.url) return { dataUrl: first.image_url.url }
    if (first?.b64_json) return { dataUrl: `data:image/png;base64,${first.b64_json}` }
  }
  // 2) content is array of parts (multimodal)
  if (Array.isArray(msg.content)) {
    for (const part of msg.content) {
      if (part?.type === 'image_url' && part?.image_url?.url) return { dataUrl: part.image_url.url }
      if (part?.type === 'image' && (part?.image?.b64_json || part?.image?.url)) {
        return { dataUrl: part.image.url || `data:image/png;base64,${part.image.b64_json}` }
      }
    }
  }
  // 3) content is string — look for markdown ![](data:...) or data URL
  if (typeof msg.content === 'string') {
    const md = msg.content.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/)
    if (md) return { dataUrl: md[0] }
    const mdUrl = msg.content.match(/!\[[^\]]*\]\(([^)]+)\)/)
    if (mdUrl) return { dataUrl: mdUrl[1] }
  }
  // 4) top-level image field (some LiteLLM providers)
  if (json?.data?.[0]?.b64_json) return { dataUrl: `data:image/png;base64,${json.data[0].b64_json}` }
  if (json?.data?.[0]?.url) return { dataUrl: json.data[0].url }

  console.error('No image found in AI response:', JSON.stringify(json).slice(0, 800))
  throw new Error('The AI did not return an image. Try a clearer photo or different garment.')
}

// ---------- Helpers ----------
async function fetchImageAsBase64(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error('Failed to fetch garment image')
  const ct = r.headers.get('content-type') || 'image/jpeg'
  const buf = Buffer.from(await r.arrayBuffer())
  return { mime: ct, base64: buf.toString('base64') }
}

function ok(data, status = 200) { return NextResponse.json(data, { status }) }
function bad(error, status = 400) { return NextResponse.json({ error }, { status }) }

// ---------- Routing ----------
async function handleRoute(req, path, method) {
  const [root, id] = path

  // GET /api/  — health
  if (!root) return ok({ name: 'STYLEFORGE API', status: 'ok', time: new Date().toISOString() })

  // Products
  if (root === 'products') {
    if (method === 'GET' && !id) return ok({ products: PRODUCTS })
    if (method === 'GET' && id) {
      const p = PRODUCTS.find(x => x.id === id)
      return p ? ok({ product: p }) : bad('Product not found', 404)
    }
  }

  // Try-on
  if (root === 'try-on' && method === 'POST') {
    const form = await req.formData()
    const person = form.get('person')
    const productId = form.get('productId')
    const garmentFile = form.get('garment')
    const extraPrompt = form.get('prompt') || ''
    const sessionId = form.get('sessionId') || uuidv4()

    if (!person || typeof person === 'string') return bad('Person image required')

    const personBuf = Buffer.from(await person.arrayBuffer())
    const personBase64 = personBuf.toString('base64')
    const personMime = person.type || 'image/jpeg'

    let garmentBase64, garmentMime, productMeta = null
    if (garmentFile && typeof garmentFile !== 'string') {
      const gb = Buffer.from(await garmentFile.arrayBuffer())
      garmentBase64 = gb.toString('base64')
      garmentMime = garmentFile.type || 'image/jpeg'
    } else if (productId) {
      const product = PRODUCTS.find(p => p.id === productId)
      if (!product) return bad('Invalid productId', 404)
      const g = await fetchImageAsBase64(product.image)
      garmentBase64 = g.base64; garmentMime = g.mime
      productMeta = { id: product.id, name: product.name, image: product.image }
    } else {
      return bad('Provide a productId or a garment file')
    }

    try {
      const { dataUrl } = await generateTryOn({ personBase64, personMime, garmentBase64, garmentMime, extraPrompt })

      const jobId = uuidv4()
      const db = await getDb()
      await db.collection('tryOnHistory').insertOne({
        id: jobId, sessionId, product: productMeta, resultDataUrl: dataUrl,
        createdAt: new Date().toISOString()
      })
      return ok({ id: jobId, sessionId, resultDataUrl: dataUrl, product: productMeta })
    } catch (e) {
      console.error('try-on failure', e)
      return bad(e.message || 'AI generation failed', 500)
    }
  }

  // History
  if (root === 'history' && method === 'GET') {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('sessionId')
    if (!sessionId) return ok({ history: [] })
    const db = await getDb()
    const items = await db.collection('tryOnHistory')
      .find({ sessionId }).sort({ createdAt: -1 }).limit(30).toArray()
    return ok({ history: items.map(({_id, ...rest}) => rest) })
  }

  if (root === 'history' && method === 'DELETE' && id) {
    const db = await getDb()
    await db.collection('tryOnHistory').deleteOne({ id })
    return ok({ deleted: true })
  }

  // Orders (checkout stub)
  if (root === 'orders' && method === 'POST') {
    const body = await req.json()
    const orderId = 'SF-' + Date.now().toString(36).toUpperCase()
    const db = await getDb()
    await db.collection('orders').insertOne({ id: orderId, ...body, createdAt: new Date().toISOString(), status: 'confirmed' })
    return ok({ orderId, status: 'confirmed' })
  }

  return bad('Route not found', 404)
}

export async function GET(req, { params }) {
  try { const p = (await params).path || []; return await handleRoute(req, p, 'GET') }
  catch (e) { return bad(e.message, 500) }
}
export async function POST(req, { params }) {
  try { const p = (await params).path || []; return await handleRoute(req, p, 'POST') }
  catch (e) { return bad(e.message, 500) }
}
export async function DELETE(req, { params }) {
  try { const p = (await params).path || []; return await handleRoute(req, p, 'DELETE') }
  catch (e) { return bad(e.message, 500) }
}
