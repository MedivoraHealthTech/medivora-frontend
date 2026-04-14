import { useEffect, useRef } from 'react'

/**
 * MedivoraOrb — animated 3-D particle sphere with eclipse-style corona.
 * Props:
 *   size      {number}  diameter in px          (default 340)
 *   speed     {number}  rotation speed factor   (default 1)
 *   paused    {bool}    freeze animation         (default false)
 */
export default function MedivoraOrb({ size = 340, speed = 1, paused = false }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({ rot: 0, frame: null, paused })

  useEffect(() => { stateRef.current.paused = paused }, [paused])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const W = canvas.width  = size
    const H = canvas.height = size
    const cx = W / 2
    const cy = H / 2
    const R  = size * 0.355          // sphere radius

    // ── Build sphere point cloud ────────────────────────────────────────────
    const LATITUDE_RINGS  = 38
    const pts = []

    for (let lat = 0; lat <= LATITUDE_RINGS; lat++) {
      const phi       = (lat / LATITUDE_RINGS) * Math.PI      // 0 → π
      const sinPhi    = Math.sin(phi)
      const cosPhi    = Math.cos(phi)
      const perRing   = Math.max(1, Math.round(sinPhi * 72))
      for (let lon = 0; lon < perRing; lon++) {
        const theta = (lon / perRing) * Math.PI * 2
        pts.push({ phi, theta, sinPhi, cosPhi })
      }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────
    function project(p, rot) {
      // Y-axis rotation
      const cosT = Math.cos(p.theta + rot)
      const sinT = Math.sin(p.theta + rot)
      const sx   =  p.sinPhi * cosT         // right
      const sy   = -p.cosPhi                // up   (−1 = top of sphere)
      const sz   =  p.sinPhi * sinT         // depth (+ = front)
      const px   = cx + sx * R
      const py   = cy + sy * R * 0.92       // slight perspective squeeze
      return { px, py, sz, sx, sy }
    }

    function particleColor(sz, sy, px, py) {
      // Edge factor: particles near the silhouette (sz ≈ 0) are most visible
      const edgeness  = 1 - Math.abs(sz)                          // 0…1, 1 = edge
      const topness   = -sy                                        // 1 = top, −1 = bottom
      const frontness = Math.max(0, sz)

      // Cull deep back-face — keep near-edge back particles for the dark side rim
      if (sz < -0.18 && edgeness < 0.55) return null

      // Base brightness
      const base = 0.15 + frontness * 0.25 + edgeness * 0.55

      // Corona zone: top + near-edge
      if (topness > 0.55 && edgeness > 0.55) {
        const t = (topness - 0.55) / 0.45                         // 0…1
        const r = Math.round(200 + t * 55)
        const g = Math.round(160 + t * 80)
        const b = 255
        const a = (0.55 + t * 0.45) * base * 2.2
        return `rgba(${r},${g},${b},${Math.min(1, a)})`
      }

      // Edge ring: blue / cyan
      if (edgeness > 0.72) {
        const a = base * 1.6
        return `rgba(110,140,255,${Math.min(1, a)})`
      }

      // Front hemisphere: dim blue-purple particles
      if (sz > 0) {
        const a = frontness * 0.32
        return `rgba(90,80,220,${Math.min(0.5, a)})`
      }

      // Back-edge: dark blue
      const a = edgeness * 0.18
      return `rgba(60,60,200,${Math.min(0.35, a)})`
    }

    // ── Draw loop ────────────────────────────────────────────────────────────
    function draw() {
      if (!stateRef.current.paused) stateRef.current.rot += 0.0038 * speed
      const rot = stateRef.current.rot

      ctx.clearRect(0, 0, W, H)

      // ── 1. Outer bloom halo ──────────────────────────────────────────────
      const halo = ctx.createRadialGradient(cx, cy - R * 0.08, R * 0.6, cx, cy, R * 1.62)
      halo.addColorStop(0,   'rgba(70,20,200,0.18)')
      halo.addColorStop(0.3, 'rgba(40,10,180,0.12)')
      halo.addColorStop(0.7, 'rgba(20,5,140,0.06)')
      halo.addColorStop(1,   'rgba(0,0,80,0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(cx, cy, R * 1.62, 0, Math.PI * 2)
      ctx.fill()

      // ── 2. Dark sphere core ──────────────────────────────────────────────
      const core = ctx.createRadialGradient(cx - R * 0.18, cy - R * 0.22, 0, cx, cy, R)
      core.addColorStop(0, '#0b0b22')
      core.addColorStop(1, '#030310')
      ctx.fillStyle = core
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()

      // ── 3. Project + sort particles ──────────────────────────────────────
      const visible = pts
        .map(p => ({ p, ...project(p, rot) }))
        .filter(v => v.sz >= -0.22)
        .sort((a, b) => a.sz - b.sz)      // painter's algorithm (back → front)

      // ── 4. Render particles ──────────────────────────────────────────────
      for (const v of visible) {
        const color = particleColor(v.sz, v.sy, v.px, v.py)
        if (!color) continue

        const edgeness = 1 - Math.abs(v.sz)
        const topness  = -v.sy
        const isCorona = topness > 0.55 && edgeness > 0.55

        // Glow for corona particles
        if (isCorona) {
          ctx.shadowColor = 'rgba(200,160,255,0.8)'
          ctx.shadowBlur  = 6
        } else {
          ctx.shadowBlur = 0
        }

        const dotR = isCorona
          ? 1.6 + (topness - 0.55) * 2.5
          : edgeness > 0.72 ? 1.4 : 0.85

        ctx.beginPath()
        ctx.arc(v.px, v.py, dotR, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      }
      ctx.shadowBlur = 0

      // ── 5. Glowing arc (top corona ring) ─────────────────────────────────
      ctx.save()
      // Wide soft glow pass
      ctx.shadowColor = 'rgba(180,120,255,0.9)'
      ctx.shadowBlur  = 22
      ctx.lineWidth   = 3
      const arcG1 = ctx.createLinearGradient(cx - R, cy, cx + R, cy)
      arcG1.addColorStop(0,    'rgba(60,60,255,0)')
      arcG1.addColorStop(0.2,  'rgba(100,60,255,0.7)')
      arcG1.addColorStop(0.5,  'rgba(255,230,255,1)')
      arcG1.addColorStop(0.8,  'rgba(100,60,255,0.7)')
      arcG1.addColorStop(1,    'rgba(60,60,255,0)')
      ctx.strokeStyle = arcG1
      ctx.beginPath()
      ctx.arc(cx, cy, R, Math.PI * 1.08, Math.PI * 1.92)
      ctx.stroke()

      // Tight bright line on top of the glow
      ctx.shadowBlur  = 10
      ctx.lineWidth   = 1.2
      const arcG2 = ctx.createLinearGradient(cx - R, cy, cx + R, cy)
      arcG2.addColorStop(0,    'rgba(80,80,255,0)')
      arcG2.addColorStop(0.35, 'rgba(200,140,255,0.9)')
      arcG2.addColorStop(0.5,  'rgba(255,255,255,1)')
      arcG2.addColorStop(0.65, 'rgba(200,140,255,0.9)')
      arcG2.addColorStop(1,    'rgba(80,80,255,0)')
      ctx.strokeStyle = arcG2
      ctx.beginPath()
      ctx.arc(cx, cy, R, Math.PI * 1.12, Math.PI * 1.88)
      ctx.stroke()
      ctx.restore()

      // ── 6. Bright hotspot at top ─────────────────────────────────────────
      const hot = ctx.createRadialGradient(cx, cy - R, 0, cx, cy - R, R * 0.36)
      hot.addColorStop(0,   'rgba(255,240,255,0.72)')
      hot.addColorStop(0.4, 'rgba(200,120,255,0.28)')
      hot.addColorStop(1,   'rgba(80,40,200,0)')
      ctx.fillStyle = hot
      ctx.beginPath()
      ctx.arc(cx, cy - R, R * 0.36, 0, Math.PI * 2)
      ctx.fill()

      // ── 7. Inner sphere rim edge ─────────────────────────────────────────
      const rim = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R)
      rim.addColorStop(0,   'rgba(0,0,0,0)')
      rim.addColorStop(0.7, 'rgba(30,10,120,0.08)')
      rim.addColorStop(1,   'rgba(60,20,180,0.22)')
      ctx.fillStyle = rim
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()

      stateRef.current.frame = requestAnimationFrame(draw)
    }

    stateRef.current.frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(stateRef.current.frame)
  }, [size, speed])

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* CSS outer glow layers */}
      <div style={{
        position:     'absolute',
        inset:        -size * 0.08,
        borderRadius: '50%',
        background:   'transparent',
        boxShadow:    `
          0 0 ${size * 0.18}px ${size * 0.06}px rgba(70,20,220,0.35),
          0 0 ${size * 0.38}px ${size * 0.10}px rgba(40,10,180,0.18),
          0 0 ${size * 0.65}px ${size * 0.18}px rgba(20,5,140,0.09)
        `,
        pointerEvents: 'none',
      }} />
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
