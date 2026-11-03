"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeftRight } from "lucide-react"
import { SHIPPING_MAP, type MapCity } from "@/lib/shipping-map-data"

const cities = SHIPPING_MAP.cities as unknown as Record<string, MapCity>
const palCities = Object.keys(cities).filter((n) => cities[n].side === "p")
const jorCities = Object.keys(cities).filter((n) => cities[n].side === "j")
const stages = ["استلام الشحنة", "تحضير للتصدير", "العبور", "التسليم"]
const HUB = SHIPPING_MAP.hub

function routePath(a: MapCity, b: MapCity) {
  // Palestinian city -> crossing -> Jordanian city, smooth through the crossing
  const mx = (a.x + HUB.x) / 2
  const my = (a.y + HUB.y) / 2
  const dx = HUB.x - a.x
  const dy = HUB.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const bulge = Math.min(26, len * 0.28)
  const cx = mx + (-dy / len) * bulge
  const cy = my + (dx / len) * bulge
  return `M${a.x},${a.y} Q${cx},${cy} ${HUB.x},${HUB.y} T${b.x},${b.y}`
}

function CityLabel({ name }: { name: string }) {
  const c = cities[name]
  const w = name.length * 9 + 22
  const cx = c.x + 16 + w / 2
  return (
    <g className="h-lbl">
      <rect x={cx - w / 2} y={c.y - 14} width={w} height={28} rx={14} />
      <text x={cx} y={c.y + 5.5} textAnchor="middle">
        {name}
      </text>
    </g>
  )
}

export function ShippingMap() {
  const [pal, setPal] = useState("نابلس")
  const [jor, setJor] = useState("عمّان")
  const [dir, setDir] = useState<1 | -1>(1) // 1: فلسطين -> الأردن
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = setInterval(() => setStage((s) => (s + 1) % stages.length), 1500)
    return () => clearInterval(t)
  }, [])

  const d = useMemo(() => routePath(cities[pal], cities[jor]), [pal, jor])
  const from = dir > 0 ? pal : jor
  const to = dir > 0 ? jor : pal

  const pick = (name: string) => (cities[name].side === "p" ? setPal(name) : setJor(name))

  return (
    <div className="h-mapcard">
      <div className="h-mappanel">
        <div className="h-mp-top">
          <div>
            <small>خريطة الشحن بين الأردن وفلسطين</small>
            <b>
              من {from} إلى {to}
            </b>
          </div>
          <span className="h-ex">مثال توضيحي</span>
        </div>

        <div className="h-grp">
          <h4>
            <i style={{ background: "#E3B95A" }} />
            مدن فلسطين
          </h4>
          <div className="h-chips">
            {palCities.map((n) => (
              <button key={n} type="button" className="h-chip" aria-pressed={n === pal} onClick={() => pick(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="h-grp">
          <h4>
            <i style={{ background: "#7FE3F2" }} />
            مدن الأردن
          </h4>
          <div className="h-chips">
            {jorCities.map((n) => (
              <button key={n} type="button" className="h-chip" aria-pressed={n === jor} onClick={() => pick(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <ol className="h-stages" aria-label="مراحل الشحنة">
          {stages.map((s, i) => (
            <li key={s} className={i === stage ? "on" : undefined}>
              {s}
            </li>
          ))}
        </ol>

        <div className="h-mp-foot">
          <button
            type="button"
            className={`h-swap${dir < 0 ? " flip" : ""}`}
            aria-label="عكس اتجاه الشحن"
            onClick={() => setDir((v) => (v === 1 ? -1 : 1))}
          >
            <ArrowLeftRight className="i" />
            عكس الاتجاه
          </button>
          <p className="h-hint">اضغط على أي مدينة لتغيير المسار</p>
        </div>
      </div>

      <div className="h-mapview">
        <svg viewBox={`0 0 ${SHIPPING_MAP.width} ${SHIPPING_MAP.height}`} role="group" aria-label="خريطة تفاعلية للأردن وفلسطين">
          <defs>
            <linearGradient id="h-rg" x1="0" x2="1">
              <stop offset="0" stopColor="#E3B95A" />
              <stop offset="1" stopColor="#7FE3F2" />
            </linearGradient>
            <linearGradient id="h-fj" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(20,105,140,.38)" />
              <stop offset="1" stopColor="rgba(11,74,102,.18)" />
            </linearGradient>
            <linearGradient id="h-fp" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(227,185,90,.34)" />
              <stop offset="1" stopColor="rgba(227,185,90,.14)" />
            </linearGradient>
            <pattern id="h-dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="rgba(255,255,255,.10)" />
            </pattern>
            <radialGradient id="h-fade" cx=".4" cy=".42" r=".65">
              <stop offset="0" stopColor="#fff" />
              <stop offset="1" stopColor="#000" />
            </radialGradient>
            <mask id="h-mm">
              <rect width={SHIPPING_MAP.width} height={SHIPPING_MAP.height} fill="url(#h-fade)" />
            </mask>
            <filter id="h-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width={SHIPPING_MAP.width} height={SHIPPING_MAP.height} fill="url(#h-dots)" mask="url(#h-mm)" />
          <path className="h-jor" d={SHIPPING_MAP.jordan} />
          <path className="h-pal" d={SHIPPING_MAP.palestine} />
          <text className="h-cname j" x={410} y={330} textAnchor="middle">
            الأردن
          </text>
          <text className="h-cname p" x={82} y={362} textAnchor="middle">
            فلسطين
          </text>

          <path className="h-rbg" d={d} />
          <path className="h-rfg" d={d} filter="url(#h-glow)" />

          <g>
            <title>المعبر</title>
            <circle className="h-hring" cx={HUB.x} cy={HUB.y} r={9} />
            <circle cx={HUB.x} cy={HUB.y} r={5} fill="#0C1A2A" stroke="#E3B95A" strokeWidth={2.2} />
          </g>

          <g>
            {Object.keys(cities).map((name) => {
              const c = cities[name]
              const selected = name === pal || name === jor
              return (
                <g
                  key={name}
                  className={`h-n${selected ? " sel" : ""}`}
                  tabIndex={0}
                  role="button"
                  aria-label={name}
                  onClick={() => pick(name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      pick(name)
                    }
                  }}
                >
                  <title>{name}</title>
                  <circle className="hit" cx={c.x} cy={c.y} r={13} />
                  <circle className="ring" cx={c.x} cy={c.y} r={8} />
                  <circle className="dot" cx={c.x} cy={c.y} r={5.5} />
                </g>
              )
            })}
          </g>
          <g>
            <CityLabel name={pal} />
            <CityLabel name={jor} />
          </g>

          <g key={`${pal}-${jor}-${dir}`} filter="url(#h-glow)">
            <circle r={16} fill="#0C1A2A" stroke="#E3B95A" strokeWidth={2.3} />
            <g
              transform="translate(-9 -9) scale(.75)"
              fill="none"
              stroke="#F7DFA2"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
              <circle cx="7" cy="18" r="1.8" />
              <circle cx="17" cy="18" r="1.8" />
            </g>
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              calcMode="linear"
              keyPoints={dir > 0 ? "0;1" : "1;0"}
              keyTimes="0;1"
              path={d}
            />
          </g>
        </svg>
      </div>
    </div>
  )
}
