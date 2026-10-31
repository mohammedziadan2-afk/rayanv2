"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"
import { getShipmentTrackingInfo, type ShipmentTrackingInfo } from "@/app/actions/tracking"
import { TrackingNewsBanner } from "@/components/tracking-news-banner"
import { SiteNav } from "@/components/rayan/site-nav"
import { SiteFooter } from "@/components/rayan/site-footer"
import { TrackingResults } from "@/components/rayan/tracking-results"
import "../rayan-design.css"

export default function TrackShipmentPage() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [trackingInfo, setTrackingInfo] = useState<ShipmentTrackingInfo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [runKey, setRunKey] = useState(0)
  const resultsRef = useRef<HTMLDivElement>(null)
  const autoRan = useRef(false)

  const handleTrack = async (value?: string) => {
    const number = (value ?? trackingNumber).trim()
    if (!number) return

    setLoading(true)
    setNotFound(false)
    setTrackingInfo(null)

    try {
      const result = await getShipmentTrackingInfo(number)

      if (result.success && result.data) {
        setTrackingInfo(result.data)
        setNotFound(false)
        setRunKey((k) => k + 1)

        setTimeout(() => {
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }, 100)
      } else {
        setTrackingInfo(null)
        setNotFound(true)
      }
    } catch (error) {
      console.error("Error tracking shipment:", error)
      setTrackingInfo(null)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  // فتح الصفحة من الرئيسية برقم التتبع: /track-shipment?n=XXXX
  useEffect(() => {
    if (autoRan.current) return
    autoRan.current = true
    const n = new URLSearchParams(window.location.search).get("n")
    if (n && n.trim()) {
      setTrackingNumber(n.trim())
      handleTrack(n.trim())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleTrack()
  }

  return (
    <div className="rn">
      <SiteNav active="tracking" />

      <main>
        <section className="thero">
          <div className="wrap">
            <span className="tag">
              <Search className="i" />
              تتبع الشحنات
            </span>
            <h1>
              أين وصلت <span className="gold">شحنتك؟</span>
            </h1>
            <p>أدخل رقم التتبع لمعرفة موقع شحنتك ومراحل التوصيل لحظة بلحظة.</p>

            <form className="cmd" onSubmit={handleSubmit}>
              <div className="f">
                <Search className="i" />
                <input
                  type="text"
                  placeholder="أدخل رقم التتبع..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  disabled={loading}
                  aria-label="رقم التتبع"
                />
              </div>
              <button className="btn btn-gold" type="submit" disabled={loading || !trackingNumber.trim()}>
                {loading ? (
                  <>
                    <span className="spin" />
                    جاري البحث...
                  </>
                ) : (
                  "تتبع"
                )}
              </button>
            </form>

            {notFound && (
              <div className="nf" role="alert">
                لم يتم العثور على الشحنة. تأكد من رقم التتبع وحاول مرة أخرى.
              </div>
            )}
          </div>
        </section>

        {/* الأخبار المهمة (تُدار من صفحة الأخبار في لوحة التحكم) */}
        <TrackingNewsBanner />

        {trackingInfo && (
          <div ref={resultsRef} style={{ scrollMarginTop: 90 }}>
            <TrackingResults info={trackingInfo} runKey={runKey} />
          </div>
        )}

        <div style={{ height: 60 }} />
      </main>

      <SiteFooter />
    </div>
  )
}
