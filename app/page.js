'use client'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search, ShoppingBag, Heart, Camera, Upload, Sparkles, ArrowRight, ArrowLeft,
  Menu, X, Star, ChevronRight, Download, Share2, RefreshCw, Trash2, Check,
  Zap, Shield, Truck, RotateCcw, ChevronDown, Plus, Minus, History, Wand2, Film
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'

const HERO = 'https://images.unsplash.com/photo-1574015974293-817f0ebebb74?w=1600&auto=format&fit=crop&q=85'
const LIFESTYLE = 'https://images.unsplash.com/photo-1541519481457-763224276691?w=1200&auto=format&fit=crop&q=85'

const cn = (...c) => c.filter(Boolean).join(' ')
function useLocalStorage(key, initial) {
  const [v, setV] = useState(initial)
  useEffect(() => { try { const s = localStorage.getItem(key); if (s) setV(JSON.parse(s)) } catch {} }, [key])
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }, [key, v])
  return [v, setV]
}
function getSessionId() {
  if (typeof window === 'undefined') return ''
  let s = localStorage.getItem('sf_session')
  if (!s) { s = crypto.randomUUID(); localStorage.setItem('sf_session', s) }
  return s
}

export default function App() {
  const [view, setView] = useState({ name: 'landing' })
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useLocalStorage('sf_cart', [])
  const [wishlist, setWishlist] = useLocalStorage('sf_wishlist', [])
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(d => { setProducts(d.products || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const nav = useCallback((v) => { setView(v); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [])

  const addToCart = (p, size, qty = 1) => {
    setCart(c => {
      const existing = c.find(x => x.id === p.id && x.size === size)
      if (existing) return c.map(x => x === existing ? { ...x, qty: x.qty + qty } : x)
      return [...c, { id: p.id, name: p.name, price: p.price, image: p.image, size, qty }]
    })
    toast.success('Added to bag', { description: `${p.name} · Size ${size}` })
  }
  const toggleWish = (p) => {
    const isIn = wishlist.find(x => x.id === p.id)
    setWishlist(w => isIn ? w.filter(x => x.id !== p.id) : [...w, p])
    toast(isIn ? 'Removed from wishlist' : 'Saved to wishlist')
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Header onNav={nav} cartCount={cart.reduce((s,x) => s+x.qty, 0)} onCart={() => setCartOpen(true)} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <AnimatePresence mode="wait">
        <motion.main key={view.name + (view.id || '')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          {view.name === 'landing' && <Landing products={products} loading={loading} onNav={nav} onWish={toggleWish} wishlist={wishlist} />}
          {view.name === 'shop' && <Shop products={products} loading={loading} onNav={nav} onWish={toggleWish} wishlist={wishlist} />}
          {view.name === 'product' && <ProductDetail product={products.find(p => p.id === view.id)} products={products} onNav={nav} onAdd={addToCart} onWish={toggleWish} wishlist={wishlist} />}
          {view.name === 'tryon' && <TryOnStudio product={products.find(p => p.id === view.id)} products={products} onNav={nav} onAdd={addToCart} />}
          {view.name === 'history' && <HistoryView onNav={nav} />}
        </motion.main>
      </AnimatePresence>
      <Footer onNav={nav} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} onNav={nav} />
    </div>
  )
}

function Header({ onNav, cartCount, onCart, menuOpen, setMenuOpen }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => { const h = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', h); return () => window.removeEventListener('scroll', h) }, [])
  return (
    <header className={cn('fixed top-0 inset-x-0 z-50 transition-all duration-500', scrolled ? 'bg-neutral-950/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent')}>
      <div className="container mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        <button onClick={() => onNav({ name: 'landing' })} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white via-amber-100 to-violet-300 flex items-center justify-center"><Sparkles className="w-4 h-4 text-neutral-900" /></div>
          <span className="font-display text-xl tracking-wider">STYLEFORGE</span>
        </button>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
          <button onClick={() => onNav({ name: 'shop' })} className="hover:text-white transition">Shop</button>
          <button onClick={() => onNav({ name: 'tryon' })} className="hover:text-white transition inline-flex items-center gap-1.5">Try-On Studio<Badge className="bg-gradient-to-r from-amber-200 to-violet-300 text-neutral-900 text-[10px] px-1.5 py-0 hover:opacity-90">AI</Badge></button>
          <button onClick={() => onNav({ name: 'history' })} className="hover:text-white transition">History</button>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-neutral-300 hover:text-white hover:bg-white/5"><Search className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="text-neutral-300 hover:text-white hover:bg-white/5"><Heart className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" onClick={onCart} className="text-neutral-300 hover:text-white hover:bg-white/5 relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-white text-neutral-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden text-neutral-300" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</Button>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="md:hidden overflow-hidden bg-neutral-950/95 backdrop-blur-xl border-t border-white/5">
            <div className="px-6 py-6 space-y-4 text-lg">
              {['shop','tryon','history'].map(v => (<button key={v} onClick={() => onNav({ name: v })} className="block w-full text-left capitalize hover:text-amber-200 transition">{v === 'tryon' ? 'Try-On Studio' : v}</button>))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function Landing({ products, loading, onNav, onWish, wishlist }) {
  return (
    <div>
      <section className="relative min-h-screen flex items-center overflow-hidden gradient-mesh">
        <div className="absolute inset-0">
          <img src={HERO} alt="STYLEFORGE" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-neutral-950/40 to-neutral-950" />
        </div>
        <div className="relative container mx-auto max-w-7xl px-6 pt-32 pb-24 grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Badge className="mb-6 bg-white/10 border border-white/20 text-white hover:bg-white/10"><Sparkles className="w-3 h-3 mr-1.5" /> AI-Powered Virtual Try-On</Badge>
            <h1 className="font-display text-6xl md:text-8xl leading-[0.95] mb-6">Wear it. <br /><span className="gradient-text italic">Before</span> you<br />buy it.</h1>
            <p className="text-neutral-300 text-lg max-w-md mb-8 leading-relaxed">Premium fashion, powered by AI. See exactly how every piece looks on you in seconds — no fitting room required.</p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => onNav({ name: 'tryon' })} className="bg-white text-neutral-900 hover:bg-neutral-200 rounded-full h-14 px-8 text-base font-medium"><Wand2 className="w-5 h-5 mr-2" /> Try On Now</Button>
              <Button size="lg" variant="outline" onClick={() => onNav({ name: 'shop' })} className="border-white/30 text-white bg-transparent hover:bg-white/10 rounded-full h-14 px-8 text-base">Shop Collection <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
            <div className="mt-12 flex items-center gap-8 text-sm text-neutral-400">
              <div><div className="text-2xl text-white font-display">120k+</div>Try-ons generated</div>
              <div className="w-px h-10 bg-white/10" />
              <div><div className="text-2xl text-white font-display">4.9</div>Avg rating</div>
              <div className="w-px h-10 bg-white/10 hidden sm:block" />
              <div className="hidden sm:block"><div className="text-2xl text-white font-display">98%</div>Fit accuracy</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.2 }} className="relative hidden md:block">
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden glass">
              <img src={LIFESTYLE} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="glass rounded-2xl p-4 flex items-center gap-3">
                  <div className="relative w-3 h-3"><div className="absolute inset-0 rounded-full bg-emerald-400" /><div className="absolute inset-0 rounded-full bg-emerald-400 pulse-ring" /></div>
                  <div className="text-sm"><div className="font-medium">Live AI Try-On</div><div className="text-neutral-400 text-xs">Generation in ~15s</div></div>
                  <Button size="sm" onClick={() => onNav({ name: 'tryon' })} className="ml-auto bg-white text-neutral-900 hover:bg-neutral-200 rounded-full h-9">Start <ArrowRight className="w-3 h-3 ml-1" /></Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-neutral-500 text-xs">
          <span>SCROLL</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}><ChevronDown className="w-4 h-4" /></motion.div>
        </div>
      </section>

      <div className="border-y border-white/5 py-6 overflow-hidden bg-neutral-950">
        <div className="marquee-track flex gap-16 whitespace-nowrap text-4xl md:text-5xl font-display text-neutral-500/40">
          {Array(8).fill(0).map((_, i) => (<span key={i} className="inline-flex items-center gap-16">STYLEFORGE <span className="text-amber-200/60">✦</span> TRY ON WITH AI <span className="text-violet-300/60">✦</span></span>))}
        </div>
      </div>

      <section className="py-24 md:py-32 relative">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-16 max-w-3xl">
            <Badge variant="outline" className="mb-4 border-white/20 text-white/80">How it works</Badge>
            <h2 className="font-display text-4xl md:text-6xl mb-4">Fitting rooms, <span className="italic gradient-text">reinvented</span>.</h2>
            <p className="text-neutral-400 text-lg">Three steps. Endless outfits. Zero commitment.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Camera, title: '01 · Capture', desc: 'Use your camera or upload a full-body photo. Front-facing works best.' },
              { icon: Sparkles, title: '02 · Select', desc: 'Pick any garment from our collection. Every piece is try-on ready.' },
              { icon: Wand2, title: '03 · Wear', desc: 'Our AI dresses you in seconds. Preserving pose, skin tone, and identity.' },
            ].map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-6"><s.icon className="w-6 h-6 text-amber-100" /></div>
                <h3 className="font-display text-2xl mb-2">{s.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{s.desc}</p>
                <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-neutral-600 group-hover:text-white transition" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 border-t border-white/5">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between mb-12">
            <div><Badge variant="outline" className="mb-4 border-white/20 text-white/80">The Edit</Badge><h2 className="font-display text-4xl md:text-6xl">Trending now.</h2></div>
            <Button variant="ghost" onClick={() => onNav({ name: 'shop' })} className="text-neutral-300 hover:text-white hover:bg-white/5">View all <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {loading ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl bg-white/5" />)
             : products.slice(0, 8).map((p, i) => (<ProductCard key={p.id} product={p} index={i} onNav={onNav} onWish={onWish} wishlist={wishlist} />))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 border-t border-white/5 bg-gradient-to-b from-neutral-950 to-neutral-900">
        <div className="container mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">
            <img src={LIFESTYLE} className="w-full h-full object-cover" alt="" />
            <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-neutral-900 to-transparent" />
          </div>
          <div>
            <Badge variant="outline" className="mb-4 border-white/20 text-white/80">Why STYLEFORGE</Badge>
            <h2 className="font-display text-4xl md:text-5xl mb-6">Confidence, tailored to you.</h2>
            <div className="space-y-6">
              {[
                { icon: Zap, t: 'Instant AI Try-On', d: 'Realistic renders in ~15 seconds using the latest image-editing models.' },
                { icon: Shield, t: 'Fit Guarantee', d: 'Free returns on every order. If it doesn\u2019t feel right, send it back.' },
                { icon: Truck, t: 'Global Express', d: 'Complimentary shipping on orders over $200. 3-day worldwide.' },
                { icon: RotateCcw, t: '365-Day Returns', d: 'A full year to change your mind. We stand behind every piece.' },
              ].map(f => (
                <div key={f.t} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full glass flex items-center justify-center flex-shrink-0"><f.icon className="w-5 h-5 text-amber-100" /></div>
                  <div><div className="font-medium mb-1">{f.t}</div><div className="text-neutral-400 text-sm leading-relaxed">{f.d}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 border-t border-white/5">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-2xl">
            <Badge variant="outline" className="mb-4 border-white/20 text-white/80">Loved by 120k+ shoppers</Badge>
            <h2 className="font-display text-4xl md:text-6xl">Words from our clients.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Emma R.', role: 'New York', text: 'The try-on is genuinely magical. I bought three pieces I would never have risked otherwise.' },
              { name: 'Kaito M.', role: 'Tokyo', text: 'Best online shopping experience. Period. The AI nails the fit every time.' },
              { name: 'Sofia L.', role: 'Milano', text: 'The quality of the clothes matches the quality of the interface. Both are impeccable.' },
            ].map((t, i) => (
              <motion.div key={t.name} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay: i*0.1}} className="glass rounded-3xl p-8">
                <div className="flex gap-1 mb-4">{Array(5).fill(0).map((_,i) => <Star key={i} className="w-4 h-4 fill-amber-200 text-amber-200" />)}</div>
                <p className="text-neutral-200 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="text-sm"><div className="font-medium">{t.name}</div><div className="text-neutral-500">{t.role}</div></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 border-t border-white/5">
        <div className="container mx-auto max-w-3xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4 border-white/20 text-white/80">FAQ</Badge>
            <h2 className="font-display text-4xl md:text-5xl">Everything you need to know.</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: 'How does the AI try-on actually work?', a: 'We use Gemini 2.5 Flash Image, a state-of-the-art image-editing model. Given your photo and a garment, it generates a photorealistic render preserving your identity and the garment design.' },
              { q: 'Is my photo private?', a: 'Your uploaded photo is used only to generate the try-on and is never shared or used for training. You can delete any generation from your history.' },
              { q: 'Which photo works best?', a: 'A front-facing, full-body photo in even lighting. Neutral backgrounds and fitted base clothing yield the best results.' },
              { q: 'Do you ship internationally?', a: 'Yes. We ship to 60+ countries. Complimentary express shipping is included on orders over $200.' },
              { q: 'What is your return policy?', a: '365 days, full refunds. If it does not feel like you, send it back on us.' },
            ].map((f, i) => (
              <AccordionItem key={i} value={`i${i}`} className="border-white/10 rounded-2xl px-6 glass">
                <AccordionTrigger className="text-left hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-neutral-400">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        <div className="relative container mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-5xl md:text-7xl mb-6">Ready to <span className="italic gradient-text">try it on</span>?</h2>
          <p className="text-neutral-400 text-lg mb-8 max-w-xl mx-auto">Upload a photo. Pick a piece. See yourself in it. Simple as that.</p>
          <Button size="lg" onClick={() => onNav({ name: 'tryon' })} className="bg-white text-neutral-900 hover:bg-neutral-200 rounded-full h-14 px-10 text-base"><Wand2 className="w-5 h-5 mr-2" /> Enter Try-On Studio</Button>
        </div>
      </section>
    </div>
  )
}

function ProductCard({ product, index, onNav, onWish, wishlist }) {
  const wished = wishlist.find(x => x.id === product.id)
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (index % 8) * 0.05 }} className="group cursor-pointer">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 mb-3">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
        {product.tags?.[0] && (<Badge className="absolute top-3 left-3 bg-white text-neutral-900 hover:bg-white capitalize text-[10px]">{product.tags[0]}</Badge>)}
        <button onClick={(e) => { e.stopPropagation(); onWish(product) }} className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-white/20">
          <Heart className={cn('w-4 h-4', wished ? 'fill-rose-400 text-rose-400' : 'text-white')} />
        </button>
        <div className="absolute bottom-3 inset-x-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
          <Button onClick={() => onNav({ name: 'tryon', id: product.id })} className="flex-1 bg-white text-neutral-900 hover:bg-neutral-200 rounded-full h-10 text-xs"><Wand2 className="w-3.5 h-3.5 mr-1.5" /> Try On</Button>
          <Button onClick={() => onNav({ name: 'product', id: product.id })} variant="outline" className="border-white/30 bg-black/40 text-white hover:bg-white/10 rounded-full h-10 text-xs px-3">View</Button>
        </div>
      </div>
      <div onClick={() => onNav({ name: 'product', id: product.id })} className="px-1">
        <div className="text-[10px] tracking-widest text-neutral-500 uppercase mb-1">{product.brand}</div>
        <div className="text-sm font-medium mb-1 truncate">{product.name}</div>
        <div className="text-sm text-neutral-300">${product.price}</div>
      </div>
    </motion.div>
  )
}

function Shop({ products, loading, onNav, onWish, wishlist }) {
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('featured')
  const [search, setSearch] = useState('')
  const [price, setPrice] = useState([0, 800])
  const categories = ['all', ...new Set(products.map(p => p.category))]
  const filtered = useMemo(() => {
    let out = [...products]
    if (category !== 'all') out = out.filter(p => p.category === category)
    if (search) out = out.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    out = out.filter(p => p.price >= price[0] && p.price <= price[1])
    if (sort === 'price-asc') out.sort((a,b) => a.price - b.price)
    if (sort === 'price-desc') out.sort((a,b) => b.price - a.price)
    if (sort === 'rating') out.sort((a,b) => b.rating - a.rating)
    return out
  }, [products, category, sort, search, price])

  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mb-12">
          <div className="text-xs tracking-widest text-neutral-500 uppercase mb-2">Collection</div>
          <h1 className="font-display text-5xl md:text-7xl mb-4">Shop All</h1>
          <p className="text-neutral-400 max-w-xl">The complete edit. Every piece is virtual try-on enabled.</p>
        </div>
        <div className="grid md:grid-cols-[240px_1fr] gap-8">
          <aside className="space-y-8">
            <div><div className="text-xs tracking-widest text-neutral-500 uppercase mb-3">Search</div><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pieces" className="bg-white/5 border-white/10 rounded-full" /></div>
            <div>
              <div className="text-xs tracking-widest text-neutral-500 uppercase mb-3">Category</div>
              <div className="space-y-1">{categories.map(c => (<button key={c} onClick={() => setCategory(c)} className={cn('block w-full text-left py-1.5 text-sm capitalize transition', category === c ? 'text-white' : 'text-neutral-500 hover:text-neutral-300')}>{c === 'all' ? 'All items' : c}</button>))}</div>
            </div>
            <div><div className="text-xs tracking-widest text-neutral-500 uppercase mb-3">Price · ${price[0]} – ${price[1]}</div><Slider value={price} onValueChange={setPrice} min={0} max={800} step={10} className="mt-4" /></div>
            <div>
              <div className="text-xs tracking-widest text-neutral-500 uppercase mb-3">Sort by</div>
              <div className="space-y-1">{[['featured','Featured'],['price-asc','Price · Low to High'],['price-desc','Price · High to Low'],['rating','Rating']].map(([k,v]) => (<button key={k} onClick={() => setSort(k)} className={cn('block w-full text-left py-1.5 text-sm', sort === k ? 'text-white' : 'text-neutral-500 hover:text-neutral-300')}>{v}</button>))}</div>
            </div>
          </aside>
          <div>
            <div className="text-sm text-neutral-500 mb-6">{filtered.length} pieces</div>
            {loading ? (<div className="grid grid-cols-2 md:grid-cols-3 gap-6">{Array(6).fill(0).map((_,i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl bg-white/5" />)}</div>) : (<div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">{filtered.map((p,i) => <ProductCard key={p.id} product={p} index={i} onNav={onNav} onWish={onWish} wishlist={wishlist} />)}</div>)}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductDetail({ product, products, onNav, onAdd, onWish, wishlist }) {
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  useEffect(() => { if (product) setColor(product.colors[0]) }, [product])
  if (!product) return <div className="pt-40 text-center text-neutral-400">Loading…</div>
  const wished = wishlist.find(x => x.id === product.id)
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)
  return (
    <div className="pt-28 pb-24">
      <div className="container mx-auto max-w-7xl px-6">
        <button onClick={() => onNav({ name: 'shop' })} className="text-sm text-neutral-500 hover:text-white mb-6 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to shop</button>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-neutral-900">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            <Button onClick={() => onNav({ name: 'tryon', id: product.id })} className="absolute bottom-6 left-6 right-6 bg-white/95 hover:bg-white text-neutral-900 rounded-full h-12 backdrop-blur"><Wand2 className="w-4 h-4 mr-2" /> Try On With AI</Button>
          </div>
          <div className="pt-4">
            <div className="text-xs tracking-widest text-neutral-500 uppercase mb-2">{product.brand}</div>
            <h1 className="font-display text-4xl md:text-5xl mb-3">{product.name}</h1>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-0.5">{Array(5).fill(0).map((_,i) => <Star key={i} className={cn('w-4 h-4', i < Math.round(product.rating) ? 'fill-amber-200 text-amber-200' : 'text-neutral-700')} />)}</div>
              <span className="text-sm text-neutral-500">{product.rating} · {product.reviews} reviews</span>
            </div>
            <div className="text-3xl font-display mb-8">${product.price}</div>
            <p className="text-neutral-400 leading-relaxed mb-8">{product.description}</p>
            <div className="mb-6">
              <div className="text-xs tracking-widest text-neutral-500 uppercase mb-3">Color · {color}</div>
              <div className="flex gap-2">{product.colors.map(c => (<button key={c} onClick={() => setColor(c)} className={cn('px-4 py-2 rounded-full text-sm border transition', color === c ? 'border-white bg-white/10' : 'border-white/15 hover:border-white/40')}>{c}</button>))}</div>
            </div>
            <div className="mb-8">
              <div className="text-xs tracking-widest text-neutral-500 uppercase mb-3">Size</div>
              <div className="flex flex-wrap gap-2">{product.sizes.map(s => (<button key={s} onClick={() => setSize(s)} className={cn('min-w-[52px] h-11 rounded-full text-sm border transition', size === s ? 'border-white bg-white text-neutral-900' : 'border-white/15 hover:border-white/40')}>{s}</button>))}</div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => { if (!size) return toast.error('Please select a size'); onAdd(product, size) }} className="flex-1 bg-white text-neutral-900 hover:bg-neutral-200 rounded-full h-14"><ShoppingBag className="w-4 h-4 mr-2" /> Add to bag</Button>
              <Button onClick={() => onWish(product)} variant="outline" className="h-14 w-14 rounded-full border-white/20 hover:bg-white/5"><Heart className={cn('w-5 h-5', wished && 'fill-rose-400 text-rose-400')} /></Button>
            </div>
            <Button onClick={() => onNav({ name: 'tryon', id: product.id })} variant="outline" className="w-full mt-3 h-14 rounded-full border-white/20 hover:bg-white/5"><Camera className="w-4 h-4 mr-2" /> See it on you first</Button>
            <div className="grid grid-cols-2 gap-3 mt-8 text-xs text-neutral-400">
              <div className="glass rounded-xl p-3"><Truck className="w-4 h-4 mb-1 text-amber-100" />Free shipping over $200</div>
              <div className="glass rounded-xl p-3"><RotateCcw className="w-4 h-4 mb-1 text-amber-100" />365-day returns</div>
            </div>
          </div>
        </div>
        {related.length > 0 && (
          <div className="mt-24">
            <h2 className="font-display text-3xl mb-8">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">{related.map((p,i) => <ProductCard key={p.id} product={p} index={i} onNav={onNav} onWish={onWish} wishlist={wishlist} />)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function TryOnStudio({ product, products, onNav, onAdd }) {
  const [selected, setSelected] = useState(product || null)
  const [personFile, setPersonFile] = useState(null)
  const [personPreview, setPersonPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [sliderX, setSliderX] = useState(50)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => { if (product) setSelected(product) }, [product])
  useEffect(() => () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()) }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1080 } })
      streamRef.current = stream
      setShowCamera(true)
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream }, 100)
    } catch { toast.error('Camera access denied', { description: 'Please allow camera or upload a photo instead.' }) }
  }
  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      setPersonFile(file); setPersonPreview(URL.createObjectURL(file))
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      setShowCamera(false)
    }, 'image/jpeg', 0.9)
  }
  const stopCamera = () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); setShowCamera(false) }
  const onFile = (e) => { const f = e.target.files?.[0]; if (!f) return; setPersonFile(f); setPersonPreview(URL.createObjectURL(f)); setResult(null) }

  const generate = async () => {
    if (!personFile) return toast.error('Add a photo of you first')
    if (!selected) return toast.error('Choose a garment first')
    setBusy(true); setResult(null); setCompareMode(false)
    try {
      const form = new FormData()
      form.append('person', personFile)
      form.append('productId', selected.id)
      form.append('sessionId', getSessionId())
      const res = await fetch('/api/try-on', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data.resultDataUrl); setCompareMode(true)
      toast.success('Your try-on is ready')
    } catch (e) { toast.error(e.message || 'Something went wrong') } finally { setBusy(false) }
  }

  const download = () => { if (!result) return; const a = document.createElement('a'); a.href = result; a.download = `styleforge-${selected?.name || 'tryon'}.png`; a.click(); toast.success('Downloaded') }
  const share = async () => {
    if (!result) return
    try {
      const blob = await (await fetch(result)).blob()
      const file = new File([blob], 'tryon.png', { type: blob.type })
      if (navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'My STYLEFORGE try-on' }) }
      else { await navigator.clipboard.writeText(result); toast.success('Copied image to clipboard') }
    } catch {}
  }

  return (
    <div className="pt-28 pb-24 min-h-screen relative">
      <div className="container mx-auto max-w-7xl px-6">
        <button onClick={() => onNav({ name: 'landing' })} className="text-sm text-neutral-500 hover:text-white mb-4 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</button>
        <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <Badge className="mb-3 bg-gradient-to-r from-amber-200 to-violet-300 text-neutral-900 hover:opacity-90"><Sparkles className="w-3 h-3 mr-1" /> AI Studio</Badge>
            <h1 className="font-display text-5xl md:text-6xl">Try-On Studio</h1>
            <p className="text-neutral-400 mt-2">Add your photo, pick a piece, see the future of shopping.</p>
          </div>
          <Button variant="outline" onClick={() => onNav({ name: 'history' })} className="border-white/20 bg-transparent hover:bg-white/5 rounded-full"><History className="w-4 h-4 mr-2" /> History</Button>
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-6">
          <div className="glass rounded-3xl p-6 min-h-[600px] flex flex-col">
            <div className="relative flex-1 rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/5 min-h-[500px] flex items-center justify-center">
              {!personPreview && !result && !showCamera && (
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-full glass flex items-center justify-center mx-auto mb-6"><Camera className="w-8 h-8 text-amber-100" /></div>
                  <h3 className="font-display text-2xl mb-2">Start with your photo</h3>
                  <p className="text-neutral-400 mb-6 max-w-sm mx-auto text-sm">Full-body, front-facing, natural lighting works best.</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button onClick={startCamera} className="bg-white text-neutral-900 hover:bg-neutral-200 rounded-full h-12 px-6"><Camera className="w-4 h-4 mr-2" /> Use Camera</Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-white/20 hover:bg-white/5 rounded-full h-12 px-6"><Upload className="w-4 h-4 mr-2" /> Upload Photo</Button>
                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onFile} />
                  </div>
                </div>
              )}
              {showCamera && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} hidden />
                  <div className="absolute bottom-6 inset-x-6 flex justify-center gap-3">
                    <Button onClick={stopCamera} variant="outline" className="border-white/20 bg-black/40 hover:bg-white/10 rounded-full">Cancel</Button>
                    <Button onClick={capturePhoto} className="bg-white text-neutral-900 hover:bg-neutral-200 rounded-full h-14 px-8"><Camera className="w-5 h-5 mr-2" /> Capture</Button>
                  </div>
                </div>
              )}
              {personPreview && !result && !busy && !showCamera && (
                <div className="absolute inset-0">
                  <img src={personPreview} alt="you" className="w-full h-full object-contain" />
                  <div className="absolute top-4 left-4"><Badge className="bg-black/60 border border-white/10">Your photo</Badge></div>
                </div>
              )}
              {busy && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-200 to-violet-300 flex items-center justify-center animate-pulse"><Wand2 className="w-8 h-8 text-neutral-900" /></div>
                    <div className="absolute inset-0 rounded-full border-2 border-amber-200/60 pulse-ring" />
                  </div>
                  <div className="font-display text-2xl mb-2">Dressing you now…</div>
                  <div className="text-neutral-400 text-sm max-w-xs text-center">Our AI is fitting the garment. This usually takes 10–20 seconds.</div>
                </div>
              )}
              {result && !busy && (
                <div className="absolute inset-0">
                  {compareMode && personPreview ? (
                    <div className="relative w-full h-full select-none" onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setSliderX(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))) }}>
                      <img src={result} className="absolute inset-0 w-full h-full object-contain" alt="after" />
                      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderX}% 0 0)` }}>
                        <img src={personPreview} className="absolute inset-0 w-full h-full object-contain" alt="before" />
                      </div>
                      <div className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none" style={{ left: `${sliderX}%` }}>
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow-2xl"><ChevronRight className="w-5 h-5" /></div>
                      </div>
                      <Badge className="absolute top-4 left-4 bg-black/60 border border-white/10">Before</Badge>
                      <Badge className="absolute top-4 right-4 bg-white text-neutral-900">After</Badge>
                    </div>
                  ) : (<img src={result} className="w-full h-full object-contain" alt="result" />)}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {personPreview && (<Button variant="outline" onClick={() => { setPersonPreview(null); setPersonFile(null); setResult(null) }} className="border-white/15 bg-transparent hover:bg-white/5 rounded-full"><RefreshCw className="w-4 h-4 mr-2" /> Change photo</Button>)}
              {result && (<>
                <Button variant="outline" onClick={() => setCompareMode(v => !v)} className="border-white/15 bg-transparent hover:bg-white/5 rounded-full"><Film className="w-4 h-4 mr-2" /> {compareMode ? 'Show result' : 'Compare'}</Button>
                <Button variant="outline" onClick={generate} className="border-white/15 bg-transparent hover:bg-white/5 rounded-full"><RefreshCw className="w-4 h-4 mr-2" /> Regenerate</Button>
                <Button variant="outline" onClick={download} className="border-white/15 bg-transparent hover:bg-white/5 rounded-full"><Download className="w-4 h-4 mr-2" /> Download</Button>
                <Button variant="outline" onClick={share} className="border-white/15 bg-transparent hover:bg-white/5 rounded-full"><Share2 className="w-4 h-4 mr-2" /> Share</Button>
              </>)}
            </div>
          </div>

          <div className="glass rounded-3xl p-6 flex flex-col">
            <div className="text-xs tracking-widest text-neutral-500 uppercase mb-3">Garment</div>
            {selected ? (
              <div className="flex gap-3 mb-4 items-center">
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-neutral-900 flex-shrink-0"><img src={selected.image} className="w-full h-full object-cover" alt="" /></div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] tracking-widest text-neutral-500 uppercase">{selected.brand}</div>
                  <div className="text-sm font-medium truncate">{selected.name}</div>
                  <div className="text-sm text-neutral-400">${selected.price}</div>
                </div>
              </div>
            ) : <div className="text-neutral-500 text-sm mb-4">Select any piece below</div>}
            <Button disabled={busy || !personFile || !selected} onClick={generate} className="w-full bg-gradient-to-r from-amber-200 to-violet-300 text-neutral-900 hover:opacity-90 rounded-full h-14 mb-2 disabled:opacity-40 font-medium"><Wand2 className="w-4 h-4 mr-2" /> {busy ? 'Generating…' : 'Generate Try-On'}</Button>
            {selected && result && (<Button variant="outline" onClick={() => onAdd(selected, selected.sizes[Math.floor(selected.sizes.length/2)])} className="w-full border-white/15 hover:bg-white/5 rounded-full h-12 mb-4"><ShoppingBag className="w-4 h-4 mr-2" /> Add to bag</Button>)}
            <div className="text-xs tracking-widest text-neutral-500 uppercase mt-4 mb-3">Try another</div>
            <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[500px] pr-1">
              {products.map(p => (
                <button key={p.id} onClick={() => { setSelected(p); setResult(null) }} className={cn('relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition', selected?.id === p.id ? 'border-amber-200' : 'border-transparent hover:border-white/20')}>
                  <img src={p.image} className="w-full h-full object-cover" alt="" />
                  {selected?.id === p.id && (<div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="w-6 h-6 rounded-full bg-amber-200 text-neutral-900 flex items-center justify-center"><Check className="w-3 h-3" /></div></div>)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function HistoryView({ onNav }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const sessionId = typeof window !== 'undefined' ? getSessionId() : ''
  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/history?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({ history: [] }))
    setItems(r.history || []); setLoading(false)
  }, [sessionId])
  useEffect(() => { load() }, [load])
  const remove = async (id) => { await fetch(`/api/history/${id}`, { method: 'DELETE' }); setItems(x => x.filter(i => i.id !== id)); toast.success('Removed') }
  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="container mx-auto max-w-7xl px-6">
        <button onClick={() => onNav({ name: 'landing' })} className="text-sm text-neutral-500 hover:text-white mb-4 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</button>
        <h1 className="font-display text-5xl md:text-6xl mb-2">Your Try-Ons</h1>
        <p className="text-neutral-400 mb-10">Every look you have generated, saved for you.</p>
        {loading ? (<div className="grid grid-cols-2 md:grid-cols-4 gap-6">{Array(4).fill(0).map((_,i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl bg-white/5" />)}</div>)
          : items.length === 0 ? (
            <div className="glass rounded-3xl p-16 text-center">
              <History className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
              <h3 className="font-display text-2xl mb-2">Nothing here yet</h3>
              <p className="text-neutral-500 mb-6">Head to the Studio and create your first look.</p>
              <Button onClick={() => onNav({ name: 'tryon' })} className="bg-white text-neutral-900 hover:bg-neutral-200 rounded-full h-12 px-6"><Wand2 className="w-4 h-4 mr-2" /> Open Studio</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {items.map(it => (
                <div key={it.id} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900">
                  <img src={it.resultDataUrl} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition" />
                  <div className="absolute bottom-0 inset-x-0 p-3 opacity-0 group-hover:opacity-100 transition">
                    <div className="text-xs text-neutral-300 mb-1">{it.product?.name || 'Custom garment'}</div>
                    <div className="flex gap-2">
                      <a href={it.resultDataUrl} download={`tryon-${it.id}.png`} className="flex-1 h-8 rounded-full bg-white text-neutral-900 text-xs flex items-center justify-center gap-1 hover:bg-neutral-200"><Download className="w-3 h-3" />Save</a>
                      <button onClick={() => remove(it.id)} className="w-8 h-8 rounded-full bg-black/60 text-neutral-300 flex items-center justify-center hover:bg-black/80"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}

function CartDrawer({ open, onClose, cart, setCart, onNav }) {
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0)
  const shipping = subtotal > 200 || subtotal === 0 ? 0 : 15
  const total = Math.max(0, subtotal + shipping - discount)
  const updateQty = (i, delta) => setCart(c => c.map((x, idx) => idx === i ? { ...x, qty: Math.max(1, x.qty + delta) } : x))
  const removeItem = (i) => setCart(c => c.filter((_, idx) => idx !== i))
  const applyCoupon = () => { if (coupon.toUpperCase() === 'STYLE10') { setDiscount(subtotal * 0.1); toast.success('10% off applied') } else toast.error('Invalid code (try STYLE10)') }
  const checkout = async () => {
    const r = await fetch('/api/orders', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ items: cart, subtotal, total, shipping, discount }) })
    const d = await r.json()
    if (d.orderId) { toast.success('Order confirmed', { description: `Reference: ${d.orderId}` }); setCart([]); onClose() }
  }
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="bg-neutral-950 border-l border-white/10 text-neutral-100 w-full sm:max-w-md flex flex-col">
        <SheetHeader><SheetTitle className="font-display text-2xl">Shopping Bag</SheetTitle></SheetHeader>
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="w-12 h-12 text-neutral-600 mb-4" />
            <div className="font-display text-xl mb-2">Your bag is empty</div>
            <p className="text-neutral-500 text-sm mb-6">Discover the collection.</p>
            <Button onClick={() => { onClose(); onNav({ name: 'shop' }) }} className="bg-white text-neutral-900 hover:bg-neutral-200 rounded-full">Continue shopping</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-4">
              {cart.map((it, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-neutral-900 flex-shrink-0"><img src={it.image} className="w-full h-full object-cover" alt="" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{it.name}</div>
                    <div className="text-xs text-neutral-500 mb-2">Size {it.size}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-white/10 rounded-full">
                        <button onClick={() => updateQty(i, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-white/5"><Minus className="w-3 h-3" /></button>
                        <span className="w-6 text-center text-xs">{it.qty}</span>
                        <button onClick={() => updateQty(i, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-white/5"><Plus className="w-3 h-3" /></button>
                      </div>
                      <button onClick={() => removeItem(i)} className="text-xs text-neutral-500 hover:text-white ml-auto">Remove</button>
                    </div>
                  </div>
                  <div className="text-sm">${it.price * it.qty}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-4 space-y-3">
              <div className="flex gap-2">
                <Input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Promo code" className="bg-white/5 border-white/10 rounded-full" />
                <Button variant="outline" onClick={applyCoupon} className="border-white/20 bg-transparent hover:bg-white/5 rounded-full">Apply</Button>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-neutral-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-neutral-400"><span>Shipping</span><span>{shipping === 0 ? 'Free' : '$'+shipping}</span></div>
                {discount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>}
                <div className="flex justify-between font-display text-xl pt-2 border-t border-white/10 mt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>
              <Button onClick={checkout} className="w-full bg-white text-neutral-900 hover:bg-neutral-200 rounded-full h-12">Checkout</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Footer({ onNav }) {
  return (
    <footer className="border-t border-white/5 mt-24 pt-16 pb-8">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white via-amber-100 to-violet-300 flex items-center justify-center"><Sparkles className="w-4 h-4 text-neutral-900" /></div>
              <span className="font-display text-xl">STYLEFORGE</span>
            </div>
            <p className="text-neutral-500 text-sm leading-relaxed">Premium fashion, reimagined for the AI age.</p>
          </div>
          {[
            { t: 'Shop', l: ['Collection','Try-On Studio','New Arrivals','Sale'] },
            { t: 'Support', l: ['Contact','Shipping','Returns','Size Guide'] },
            { t: 'Company', l: ['About','Journal','Sustainability','Careers'] },
          ].map(c => (
            <div key={c.t}>
              <div className="text-sm font-medium mb-4">{c.t}</div>
              <div className="space-y-2 text-sm text-neutral-500">{c.l.map(x => <div key={x} className="hover:text-white cursor-pointer">{x}</div>)}</div>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-wrap justify-between gap-4 text-xs text-neutral-600">
          <div>© 2025 STYLEFORGE. All rights reserved.</div>
          <div className="flex gap-6"><span>Privacy</span><span>Terms</span><span>Cookies</span></div>
        </div>
      </div>
    </footer>
  )
}
