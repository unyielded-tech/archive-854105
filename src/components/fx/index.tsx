import { ReactNode, useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useScroll, useSpring, animate, AnimatePresence } from 'framer-motion'
import { media } from '@/config/media'

export function Preloader() {
  const [show, setShow] = useState(() => !sessionStorage.getItem('a854105'))
  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => { sessionStorage.setItem('a854105', '1'); setShow(false) }, 2400)
    return () => clearTimeout(t)
  }, [])
  return (
    <AnimatePresence>
      {show && (
        <motion.div exit={{ opacity: 0 }} transition={{ duration: 1 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center" style={{ background: '#F7F4EF', color: '#111' }}>
          <motion.div initial={{ opacity: 0, letterSpacing: '0.2em' }} animate={{ opacity: 1, letterSpacing: '0.55em' }} transition={{ duration: 1.8, ease: 'easeOut' }}
            className="serif text-3xl md:text-5xl pl-[0.55em]">ARCHIVE</motion.div>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6, duration: 1.4 }} className="h-px w-24 bg-black my-5 origin-center" />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="text-xs tracking-[0.5em] pl-[0.5em]">854105</motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function CustomCursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 300, damping: 28 }), sy = useSpring(y, { stiffness: 300, damping: 28 })
  const [big, setBig] = useState(false)
  useEffect(() => {
    if (!window.matchMedia('(pointer:fine)').matches) return
    const m = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); setBig(!!(e.target as HTMLElement).closest('a,button,[data-hover]')) }
    window.addEventListener('mousemove', m)
    return () => window.removeEventListener('mousemove', m)
  }, [])
  return (
    <>
      <motion.div className="fixed z-[150] pointer-events-none rounded-full border border-[var(--gold)] hidden md:block"
        style={{ x: sx, y: sy, width: 40, height: 40, marginLeft: -20, marginTop: -20 }} animate={{ scale: big ? 1.8 : 1, backgroundColor: big ? 'rgba(201,169,97,.2)' : 'rgba(0,0,0,0)' }} />
      <motion.div className="fixed z-[151] pointer-events-none rounded-full bg-[var(--gold)] hidden md:block" style={{ x, y, width: 6, height: 6, marginLeft: -3, marginTop: -3 }} />
    </>
  )
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const s = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })
  return <motion.div className="fixed top-0 left-0 right-0 h-px origin-left z-[120] bg-black" style={{ scaleX: s }} />
}

export function Marquee({ items, reverse, className = '' }: { items: string[]; reverse?: boolean; className?: string }) {
  const row = (
    <div>{items.map((t, i) => (<span key={i} className="px-6 flex items-center gap-6">{t}<span className="text-[var(--gold)]">✦</span></span>))}</div>
  )
  return <div className={`marquee ${reverse ? 'rev' : ''} ${className}`}>{row}{row}</div>
}

export function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, { stiffness: 200, damping: 15 }), y = useSpring(0, { stiffness: 200, damping: 15 })
  return (
    <motion.div ref={ref} style={{ x, y, display: 'inline-block' }} data-hover
      onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); x.set((e.clientX - r.left - r.width / 2) * 0.3); y.set((e.clientY - r.top - r.height / 2) * 0.3) }}
      onMouseLeave={() => { x.set(0); y.set(0) }}>{children}</motion.div>
  )
}

export function SplitText({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((c, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span className="inline-block" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: delay + i * 0.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>{c}</motion.span>
        </span>
      ))}
    </span>
  )
}

export function RotatingBadge({ text = 'KATIHAR ✦ BIHAR ✦ NEW MARKET ✦ ', size = 150 }: { text?: string; size?: number }) {
  return (
    <div className="relative floaty" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="spin-slow absolute inset-0">
        <defs><path id="c" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
        <text fontSize="9.5" fill="#C9A961" letterSpacing="2" fontFamily="Archivo"><textPath href="#c">{text}{text}</textPath></text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-street text-lg text-[var(--bone)]">854</div>
    </div>
  )
}

// Real GIF/video sticker if provided in config, otherwise animated badge fallback.
export function Sticker({ index = 0, size = 120 }: { index?: number; size?: number }) {
  const src = media.stickers[index]
  if (!src) return <RotatingBadge size={size} />
  return /\.(mp4|webm)$/i.test(src)
    ? <video src={src} autoPlay loop muted playsInline className="floaty" width={size} />
    : <img src={src} alt="" width={size} className="floaty" />
}

export function Tilt({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div ref={ref} className={`tilt ${className}`} style={{ perspective: 800 }}
      onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5
        ref.current!.style.transform = `rotateY(${px * 12}deg) rotateX(${-py * 12}deg) scale(1.02)` }}
      onMouseLeave={() => { ref.current!.style.transform = '' }}>{children}</div>
  )
}

export function WhatsAppFab() {
  return (
    <a href={`https://wa.me/${media.whatsapp}?text=${encodeURIComponent('Hello ARCHIVE 854105, I would like to order')}`} target="_blank" rel="noreferrer"
      className="fixed bottom-5 right-5 z-[110] bg-black text-[#F7F4EF] px-5 py-3 text-[0.65rem] tracking-[0.25em] uppercase" aria-label="Order on WhatsApp">
      WhatsApp
    </a>
  )
}
