"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Box, Check, Clock, MapPin, Navigation, Package, PackageCheck, Truck } from "lucide-react"
import type { ShipmentTrackingInfo } from "@/app/actions/tracking"
import { WhatsAppIcon } from "@/components/rayan/icons"

const WHATSAPP_URL = "https://wa.me/message/NBC72SUIIZ5PH1"

const stageIcons = [
  Box, // المرحلة 1: استلام الشحنة
  Navigation, // المرحلة 2: تحضير الشحنة
  Truck, // المرحلة 3: قيد التصدير
  Package, // المرحلة 4: مركز التوزيع
  PackageCheck, // المرحلة 5: تم التسليم
]

const ANIM_MS = 2600

export function TrackingResults({ info, runKey }: { info: ShipmentTrackingInfo; runKey: number }) {
  const [shownPct, setShownPct] = useState(0)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

  const completedCount = info.stages.filter((s) => s.isCompleted).length
  const totalStages = info.stages.length || 5
  const pct = Math.round((completedCount / totalStages) * 100)
  const delivered = completedCount === totalStages

  // عدّاد النسبة المئوية داخل الدائرة
  useEffect(() => {
    let raf = 0
    let t0: number | null = null
    const step = (t: number) => {
      if (t0 === null) t0 = t
      const k = Math.min((t - t0) / ANIM_MS, 1)
      const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
      setShownPct(Math.round(pct * eased))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    setShownPct(0)
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [runKey, pct])

  const fromLabel = info.senderCity || info.senderCountry || "نقطة الاستلام"
  const toLabel = info.receiverCountry || "الوجهة"
  const senderPlace = [info.senderCity, info.senderCountry].filter(Boolean).join("، ")
  const doneStages = info.stages.filter((s) => s.isCompleted && s.enteredAt)

  return (
    <div className="wrap tres" style={{ paddingTop: 28 }}>
            <div className="tgrid">
              <div className="glass tcard">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div className="big-no">
                    <small>رقم التتبع</small>
                    <b className="ltr">{info.trackingNumber}</b>
                  </div>
                  <span className="pill">
                    <i className="live" style={{ background: "#06210f", boxShadow: "none", animation: "none" }} />
                    {delivered ? "تم التسليم" : "قيد التوصيل"}
                  </span>
                </div>

                <div className="map bigmap">
                  <svg key={runKey} viewBox="0 0 600 300" aria-label="مسار الشحنة">
                    <defs>
                      <linearGradient id="rn-gr" x1="0" x2="1">
                        <stop offset="0" stopColor="#3BD3EA" />
                        <stop offset="1" stopColor="#3EE08F" />
                      </linearGradient>
                    </defs>
                    <path id="rn-rp2" className="rt-bg" d="M70 220 C170 70 300 300 530 80" />
                    <path
                      className="rt-fg"
                      pathLength={100}
                      d="M70 220 C170 70 300 300 530 80"
                      style={
                        {
                          stroke: "url(#rn-gr)",
                          strokeDashoffset: 100,
                          "--off": 100 - pct,
                          animation: `rn-draw-to ${ANIM_MS}ms cubic-bezier(.45,0,.2,1) forwards`,
                        } as React.CSSProperties
                      }
                    />
                    <g>
                      <circle className="node on" cx="70" cy="220" r="9" />
                      <text className="maplbl" x="70" y="262">{fromLabel}</text>
                      <text className="maplbl s" x="70" y="282">الاستلام</text>
                    </g>
                    <g>
                      <circle className={`node${pct >= 50 ? " on" : ""}`} cx="251" cy="192" r="8" />
                      <text className="maplbl s" x="251" y="224">المعبر</text>
                    </g>
                    <g>
                      <circle className="ring" cx="530" cy="80" r="10" />
                      <circle className={`node${delivered ? " on" : ""}`} cx="530" cy="80" r="9" />
                      <text className="maplbl" x="530" y="122">{toLabel}</text>
                      <text className="maplbl s" x="530" y="142">الوجهة</text>
                    </g>
                    <g className="truckg">
                      <circle r="20" fill="#0a1626" stroke="#E3B95A" strokeWidth="2.5" />
                      <Truck x={-10} y={-10} width={20} height={20} color="#F7DFA2" strokeWidth={2} />
                      <animateMotion
                        dur={`${ANIM_MS}ms`}
                        begin="0s"
                        fill="freeze"
                        keyPoints={`0;${pct / 100}`}
                        keyTimes="0;1"
                        calcMode="spline"
                        keySplines=".45 0 .2 1"
                      >
                        <mpath href="#rn-rp2" />
                      </animateMotion>
                    </g>
                  </svg>
                </div>
              </div>

              <div className="glass tcard eta">
                <div className="dial" style={{ "--p": shownPct } as React.CSSProperties}>
                  <div>
                    <b>{shownPct}%</b>
                    <small>من الطريق</small>
                  </div>
                </div>
                <div>
                  <small className="m">الحالة</small>
                  <div className="big">{delivered ? "تم تسليم الشحنة" : "قيد التوصيل"}</div>
                  <small className="m">
                    {completedCount} من {totalStages} مراحل
                  </small>
                </div>
                <div className="kv" style={{ width: "100%", textAlign: "start" }}>
                  <div>
                    <span>من</span>
                    <b>{senderPlace || "—"}</b>
                  </div>
                  <div>
                    <span>إلى</span>
                    <b>{info.receiverCountry || "—"}</b>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass tcard" style={{ marginTop: 18 }}>
              <div className="prog">
                {info.stages.map((stage, index) => {
                  const Icon = stageIcons[index] || Package
                  const isCompleted = stage.isCompleted
                  const isCurrent = isCompleted && !info.stages[index + 1]?.isCompleted
                  const cls = isCurrent && !delivered ? "now" : isCompleted ? "done" : ""
                  return (
                    <div key={stage.stage} className={`pg ${cls}`}>
                      <div className="c">{isCompleted && !(isCurrent && !delivered) ? <Check className="i" /> : <Icon className="i" />}</div>
                      {stage.stageName}
                      {stage.enteredAt && isCompleted && (
                        <small>
                          {formatDate(stage.enteredAt)} - {formatTime(stage.enteredAt)}
                        </small>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="two">
              <div className="glass tcard">
                <h3>
                  <Clock className="i" />
                  سجل الشحنة
                </h3>
                {doneStages.length === 0 ? (
                  <p className="dm">لم تُسجَّل أي مرحلة لهذه الشحنة بعد.</p>
                ) : (
                  <div className="tl">
                    {[...doneStages].reverse().map((stage, i) => (
                      <div key={stage.stage} className={`ev${i === 0 ? " cur" : ""}`}>
                        <b>{stage.stageName}</b>
                        <time>
                          {formatDate(stage.enteredAt as string)} · {formatTime(stage.enteredAt as string)}
                        </time>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="glass tcard">
                  <h3>
                    <Package className="i" />
                    تفاصيل الشحنة
                  </h3>
                  <div className="kv">
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
                    <div className="desc">
                      <small className="dm">وصف الشحنة</small>
                      <p>{info.description}</p>
                    </div>
                  )}
                </div>

                <div className="help">
                  <b>تحتاج مساعدة؟</b>
                  <p>فريقنا جاهز للإجابة عن أي سؤال حول شحنتك.</p>
                  <a className="btn" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="i" />
                    راسلنا على واتساب
                  </a>
                </div>
              </div>
            </div>
          </div>
  )
}
