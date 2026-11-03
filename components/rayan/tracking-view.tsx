"use client"

import type React from "react"
import { useEffect, useMemo, useRef } from "react"
import { ArrowLeft, Box, Check, Clock, MapPin, Navigation, Package, PackageCheck, Truck } from "lucide-react"
import type { ShipmentTrackingInfo } from "@/app/actions/tracking"
import { SHIPPING_MAP, type MapCity } from "@/lib/shipping-map-data"
import { WhatsAppIcon } from "@/components/rayan/icons"

const WHATSAPP_URL = "https://wa.me/message/NBC72SUIIZ5PH1"

// Zoom window on the West Bank / Amman area so the route is large and readable.
const Z = 2.81
const X0 = 62
const Y0 = 88
const cities = SHIPPING_MAP.cities as unknown as Record<string, MapCity>
const S = (p: { x: number; y: number }) => ({ x: (p.x - X0) * Z, y: (p.y - Y0) * Z })
const HUB = S(SHIPPING_MAP.hub)

const STAGE_ICONS = [Box, Package, Truck, Navigation, PackageCheck]
// where the truck rests on the route for each stage (0 = pickup, 1 = delivered)
const STAGE_T = [0, 0.25, 0.5, 0.8, 1]

const isJordan = (s?: string) => !!s && /(الأردن|اردن|jordan)/i.test(s)
const isPalestine = (s?: string) => !!s && /(فلسطين|palestine)/i.test(s)

function matchCity(text: string | undefined, side: "p" | "j") {
  const t = (text || "").trim()
  if (!t) return null
  return Object.keys(cities).find((n) => cities[n].side === side && (t.includes(n) || n.includes(t))) || null
}

function routeD(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + HUB.x) / 2
  const my = (a.y + HUB.y) / 2
  const dx = HUB.x - a.x
  const dy = HUB.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const bulge = Math.min(60, len * 0.3)
  return `M${a.x},${a.y} Q${mx + (-dy / len) * bulge},${my + (dx / len) * bulge} ${HUB.x},${HUB.y} T${b.x},${b.y}`
}

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
const fmtTime = (d: string) => new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
const when = (d?: string) => (d ? `${fmtDate(d)} ${fmtTime(d)}` : "")

function Label({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 9 + 24
  const cx = x + 20 + w / 2
  return (
    <g className="t-lbl">
      <rect x={cx - w / 2} y={y - 15} width={w} height={30} rx={15} />
      <text x={cx} y={y + 5.5} textAnchor="middle">
        {text}
      </text>
    </g>
  )
}

export function TrackingView({ info, scanning }: { info: ShipmentTrackingInfo | null; scanning?: boolean }) {
  const stages = info?.stages ?? []
  const completed = stages.filter((s) => s.isCompleted).length
  const cur = info ? Math.min(5, Math.max(1, completed)) : 0
  const delivered = !!info && completed >= 5
  const pct = info ? Math.round((Math.min(completed, 5) / 5) * 100) : 0

  // direction + anchors on the map
  const dir: 1 | -1 = info
    ? isJordan(info.senderCountry) || (!info.senderCountry && isPalestine(info.receiverCountry))
      ? -1
      : 1
    : 1
  const palCity = (info && dir > 0 ? matchCity(info.senderCity || info.senderCountry, "p") : null) || "رام الله"
  const jorCity = (info && dir < 0 ? matchCity(info.senderCity || info.senderCountry, "j") : null) || "عمّان"
  const palKnown = !!info && dir > 0 && !!matchCity(info.senderCity || info.senderCountry, "p")
  const jorKnown = !!info && dir < 0 && !!matchCity(info.senderCity || info.senderCountry, "j")
  const A = S(cities[palCity])
  const B = S(cities[jorCity])
  const d = useMemo(() => routeD(A, B), [A.x, A.y, B.x, B.y]) // eslint-disable-line react-hooks/exhaustive-deps

  const fromText = info
    ? [info.senderCity, info.senderCountry].filter(Boolean).join("، ") || (dir > 0 ? "فلسطين" : "الأردن")
    : ""
  const toText = info ? info.receiverCountry || (dir > 0 ? "الأردن" : "فلسطين") : ""

  const doneRef = useRef<SVGPathElement>(null)
  const truckRef = useRef<SVGGElement>(null)
  const dialRef = useRef<HTMLDivElement>(null)
  const pctRef = useRef<HTMLElement>(null)
  const markRefs = useRef<(SVGCircleElement | null)[]>([])

  useEffect(() => {
    const done = doneRef.current
    const truck = truckRef.current
    const dial = dialRef.current
    const pctEl = pctRef.current
    if (!info || !done || !truck || !dial || !pctEl) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const len = done.getTotalLength()
    const tAt = (i: number) => (dir > 0 ? STAGE_T[i] : 1 - STAGE_T[i])
    const fromT = dir > 0 ? 0 : 1
    const toT = tAt(cur - 1)
    markRefs.current.forEach((c, i) => {
      if (!c) return
      const p = done.getPointAtLength(len * tAt(i))
      c.setAttribute("cx", String(p.x))
      c.setAttribute("cy", String(p.y))
      c.classList.remove("on")
    })
    dial.classList.remove("burst")
    let raf = 0
    let t0: number | null = null
    const dur = reduce ? 1 : 1900
    const step = (ts: number) => {
      if (t0 === null) t0 = ts
      const k = Math.min((ts - t0) / dur, 1)
      const e = ease(k)
      const t = fromT + (toT - fromT) * e
      const p = done.getPointAtLength(len * t)
      truck.setAttribute("transform", `translate(${p.x} ${p.y})`)
      const trav = Math.abs(t - fromT) * len
      done.style.strokeDasharray = `${trav} ${len} `
      done.style.strokeDashoffset = String(dir > 0 ? 0 : -(len - trav))
      const frac = Math.abs(t - fromT)
      markRefs.current.forEach((c, i) => {
        if (c && i < cur && frac >= Math.abs(tAt(i) - fromT) - 0.002) c.classList.add("on")
      })
      const sp = Math.round(pct * e)
      pctEl.textContent = `${sp}%`
      dial.style.setProperty("--p", String(sp))
      if (k < 1) raf = requestAnimationFrame(step)
      else if (delivered) dial.classList.add("burst")
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [info, d, dir, cur, pct, delivered])

  const idle = !info && !scanning
  const doneStages = stages.filter((s) => s.isCompleted && s.enteredAt)
  const lastWhen = cur ? when(stages[cur - 1]?.enteredAt) : ""

  return (
    <div className={`t-res${scanning && !info ? " scan" : ""}`}>
      <div className="t-in">
        <div className="t-mapcard t-rv" style={{ "--i": 4 } as React.CSSProperties}>
          <div className="t-panel">
            {info ? (
              <>
                <div className="t-p-top">
                  <div>
                    <small>رقم التتبع</small>
                    <b className="t-no ltr">{info.trackingNumber}</b>
                  </div>
                  <span className={`t-pill ${delivered ? "done" : "prog"}`}>
                    <i />
                    <span>{delivered ? "تم التسليم" : "قيد التوصيل"}</span>
                  </span>
                </div>
                <div className="t-status">
                  <div className="t-dial" ref={dialRef} style={{ "--p": 0 } as React.CSSProperties}>
                    <div>
                      <b ref={pctRef}>0%</b>
                      <small>من الرحلة</small>
                    </div>
                  </div>
                  <div>
                    <h3>{stages[cur - 1]?.stageName}</h3>
                    {lastWhen && <p>آخر تحديث: {lastWhen}</p>}
                  </div>
                </div>
                <div className="t-route">
                  <div>
                    <small>من</small>
                    <b>{fromText}</b>
                  </div>
                  <ArrowLeft className="i t-arr" />
                  <div className="t-to">
                    <small>إلى</small>
                    <b>{toText}</b>
                  </div>
                </div>
              </>
            ) : scanning ? (
              <>
                <div className="t-skel" style={{ width: "50%", height: 28 }} />
                <div className="t-skel" style={{ width: "80%", height: 90 }} />
                <div className="t-skel" style={{ width: "100%", height: 56 }} />
              </>
            ) : (
              <p className="t-idle">
                أدخل رقم التتبع في الأعلى ثم اضغط «تتبع»، وستظهر هنا حالة شحنتك ومسارها بين فلسطين والأردن لحظة بلحظة.
              </p>
            )}
          </div>

          <div className="t-mapview">
            <svg
              viewBox={`0 0 ${SHIPPING_MAP.width} ${SHIPPING_MAP.height}`}
              role="img"
              aria-label="مسار الشحنة على الخريطة"
            >
              <defs>
                <linearGradient id="t-rg" x1="0" x2="1">
                  <stop offset="0" stopColor="#E3B95A" />
                  <stop offset="1" stopColor="#7FE3F2" />
                </linearGradient>
                <linearGradient id="t-fj" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="rgba(20,105,140,.38)" />
                  <stop offset="1" stopColor="rgba(11,74,102,.18)" />
                </linearGradient>
                <linearGradient id="t-fp" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="rgba(227,185,90,.34)" />
                  <stop offset="1" stopColor="rgba(227,185,90,.14)" />
                </linearGradient>
                <pattern id="t-dots" width="22" height="22" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.2" fill="rgba(255,255,255,.10)" />
                </pattern>
                <radialGradient id="t-fade" cx=".4" cy=".42" r=".65">
                  <stop offset="0" stopColor="#fff" />
                  <stop offset="1" stopColor="#000" />
                </radialGradient>
                <mask id="t-mm">
                  <rect width={SHIPPING_MAP.width} height={SHIPPING_MAP.height} fill="url(#t-fade)" />
                </mask>
                <filter id="t-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width={SHIPPING_MAP.width} height={SHIPPING_MAP.height} fill="url(#t-dots)" mask="url(#t-mm)" />
              <g transform={`scale(${Z}) translate(${-X0} ${-Y0})`}>
                <path className="t-jor" vectorEffect="non-scaling-stroke" d={SHIPPING_MAP.jordan} />
                <path className="t-pal" vectorEffect="non-scaling-stroke" d={SHIPPING_MAP.palestine} />
              </g>
              <text className="t-cname j" x={470} y={470} textAnchor="middle">
                الأردن
              </text>
              <text className="t-cname p" x={92} y={330} textAnchor="middle">
                فلسطين
              </text>
              <path className="t-rbg" d={d} />
              {info && <path ref={doneRef} className="t-rdone" d={d} filter="url(#t-glow)" />}
              <circle className="t-hring" cx={HUB.x} cy={HUB.y} r={9} />
              {scanning && !info && (
                <g className="t-radar" transform={`translate(${A.x} ${A.y})`}>
                  <circle r={10} />
                  <circle r={10} />
                  <circle r={10} />
                </g>
              )}
              {info &&
                STAGE_T.map((_, i) => (
                  <circle
                    key={i}
                    ref={(el) => {
                      markRefs.current[i] = el
                    }}
                    className="t-mk"
                    r={7}
                  />
                ))}
              <Label x={A.x} y={A.y} text={palKnown ? palCity : "فلسطين"} />
              <Label x={B.x} y={B.y} text={jorKnown ? jorCity : "الأردن"} />
              {info && (
                <g ref={truckRef} filter="url(#t-glow)">
                  <g className="t-bob">
                    <circle className="t-halo" r={17} />
                    <circle r={17} fill="#0C1A2A" stroke="#E3B95A" strokeWidth={2.4} />
                    <g
                      transform="translate(-9.5 -9.5) scale(.8)"
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
                  </g>
                </g>
              )}
            </svg>
          </div>
        </div>

        {info && (
          <>
            <div className="t-steps t-rv" style={{ "--i": 6 } as React.CSSProperties}>
              <div className="t-stepper">
                {stages.map((s, i) => {
                  const Icon = STAGE_ICONS[i] || Package
                  const isDone = i < cur - 1 || (i === cur - 1 && delivered)
                  const isNow = i === cur - 1 && !delivered
                  return (
                    <div
                      key={s.stage}
                      className={`t-stp ${isDone ? "done" : isNow ? "now" : ""}`}
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <div className="t-c">{isDone ? <Check className="i" /> : <Icon className="i" />}</div>
                      <div className="t-t">
                        <h4>{s.stageName}</h4>
                        {s.isCompleted && s.enteredAt && <small>{when(s.enteredAt)}</small>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="t-two">
              <div className="t-card t-rv" style={{ "--i": 7 } as React.CSSProperties}>
                <h3>
                  <Clock className="i" />
                  سجل الشحنة
                </h3>
                {doneStages.length === 0 ? (
                  <p className="t-empty">لم تُسجَّل أي مرحلة لهذه الشحنة بعد.</p>
                ) : (
                  <div className="t-tl">
                    {[...doneStages].reverse().map((s, n) => (
                      <div
                        key={s.stage}
                        className={`t-ev t-rv${n === 0 ? " cur" : ""}`}
                        style={{ "--i": n + 8 } as React.CSSProperties}
                      >
                        <b>{s.stageName}</b>
                        <time>{when(s.enteredAt)}</time>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="t-card t-rv" style={{ "--i": 8 } as React.CSSProperties}>
                <h3>
                  <Package className="i" />
                  تفاصيل الشحنة
                </h3>
                <div className="t-kv">
                  <div>
                    <span>المرسل</span>
                    <b>{info.senderName}</b>
                  </div>
                  <div>
                    <span>المستلم</span>
                    <b>{info.receiverName}</b>
                  </div>
                  <div>
                    <span>هاتف المستلم</span>
                    <b className="ltr">{info.receiverPhone}</b>
                  </div>
                  <div>
                    <span>
                      <MapPin className="i" style={{ display: "inline", verticalAlign: "-2px", marginInlineEnd: 4 }} />
                      العنوان
                    </span>
                    <b>{info.receiverAddress}</b>
                  </div>
                </div>
                {info.description && (
                  <div className="t-desc">
                    <small>وصف الشحنة</small>
                    <p>{info.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="t-help t-rv" style={{ "--i": 9 } as React.CSSProperties}>
              <div>
                <b>تحتاج مساعدة؟</b>
                <p>فريقنا جاهز للإجابة عن أي سؤال حول شحنتك.</p>
              </div>
              <a className="btn" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="i" />
                راسلنا على واتساب
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
