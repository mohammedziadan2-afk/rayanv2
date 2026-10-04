"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Building2, 
  Globe, 
  BarChart3, 
  Newspaper,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
  Landmark,
  Coins,
  PiggyBank,
  AlertTriangle,
  Clock,
  Info
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
  Cell
} from "recharts"
import { AdminFooter } from "@/components/admin-footer"

interface MarketData {
  dollarIndex: { value: number; change: number; history: any[] }
  interestRate: { value: number; change: number; history: any[]; trend: string }
  inflation: { value: number; change: number; history: any[] }
  treasuryYield: { value: number; change: number; history: any[] }
  goldPrice: { value: number; change: number; changePercent: number; history: any[]; isRealTime?: boolean }
  sp500: { value: number; change: number; changePercent: number }
  gldEtf: { 
    value: number; 
    change: number; 
    netFlow: number; 
    holdings: number;
    holdingsChange?: number;
    holdingsDate?: string;
    source?: string;
  }
  centralBanks: { 
    china: any; 
    russia: any; 
    others: any[];
    globalStats?: {
      totalCentralBankGold: number;
      yearlyPurchases: number;
      topBuyer: string;
    };
    dataSource?: string;
  }
  cot: { 
    longPositions: number; 
    shortPositions: number; 
    netPosition: number; 
    change?: number;
    netChange?: number;
    openInterest?: number;
    commercialLong?: number;
    commercialShort?: number;
    reportDate?: string;
    source?: string;
    fetchedAt?: string;
  }
  news: any[]
  lastUpdated: string
  dataSources?: any
  slowDataLastFetch?: string
  nextSlowDataRefresh?: string
  realDataNote?: string
}

const TrendIndicator = ({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) => {
  const iconSize = size === "lg" ? "w-6 h-6" : "w-4 h-4"
  if (value > 0) return <ArrowUp className={`${iconSize} text-green-500`} />
  if (value < 0) return <ArrowDown className={`${iconSize} text-red-500`} />
  return <Minus className={`${iconSize} text-gray-500`} />
}

const GoldImpactBadge = ({ impact }: { impact: "positive" | "negative" | "neutral" }) => {
  if (impact === "positive") {
    return <Badge className="bg-green-100 text-green-700 border-green-300">ايجابي للذهب</Badge>
  }
  if (impact === "negative") {
    return <Badge className="bg-red-100 text-red-700 border-red-300">سلبي للذهب</Badge>
  }
  return <Badge className="bg-gray-100 text-gray-700 border-gray-300">محايد</Badge>
}

// Simple SVG-based Area Chart Component that works reliably
const SimpleAreaChart = ({ 
  data, 
  dataKey, 
  color, 
  height = 200,
  formatValue = (v: number) => v.toFixed(2)
}: { 
  data: any[], 
  dataKey: string, 
  color: string, 
  height?: number,
  formatValue?: (v: number) => string
}) => {
  if (!data || data.length === 0) return <div className="text-center text-muted-foreground py-10">لا توجد بيانات</div>
  
  const values = data.map(d => d[dataKey] || d.value || 0)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1
  const padding = range * 0.1
  const adjustedMin = minVal - padding
  const adjustedMax = maxVal + padding
  const adjustedRange = adjustedMax - adjustedMin
  
  const width = 100 // percentage
  const chartHeight = height - 40 // leave space for labels
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = chartHeight - ((((d[dataKey] || d.value) - adjustedMin) / adjustedRange) * chartHeight)
    return `${x},${y}`
  }).join(' ')
  
  const areaPoints = `0,${chartHeight} ${points} 100,${chartHeight}`
  
  return (
    <div className="w-full" style={{ height }}>
      <svg width="100%" height={chartHeight} viewBox={`0 0 100 ${chartHeight}`} preserveAspectRatio="none" className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line 
            key={i}
            x1="0" 
            y1={chartHeight * ratio} 
            x2="100" 
            y2={chartHeight * ratio} 
            stroke="#e5e7eb" 
            strokeWidth="0.2"
            strokeDasharray="1,1"
          />
        ))}
        
        {/* Gradient */}
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <polygon 
          points={areaPoints}
          fill={`url(#gradient-${color.replace('#', '')})`}
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
        <span>{data[0]?.date || ''}</span>
        <span>{data[Math.floor(data.length / 2)]?.date || ''}</span>
        <span>{data[data.length - 1]?.date || ''}</span>
      </div>
      
      {/* Y-axis info */}
      <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
        <span>الأدنى: {formatValue(minVal)}</span>
        <span>الأعلى: {formatValue(maxVal)}</span>
      </div>
    </div>
  )
}

// Simple Bar Chart Component
const SimpleBarChart = ({ 
  data, 
  height = 200 
}: { 
  data: { name: string, value: number, color: string }[], 
  height?: number 
}) => {
  if (!data || data.length === 0) return <div className="text-center text-muted-foreground py-10">لا توجد بيانات</div>
  
  const maxVal = Math.max(...data.map(d => d.value))
  
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-around h-full gap-4 pb-8">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <span className="text-sm font-bold mb-2" style={{ color: item.color }}>
              {item.value.toLocaleString()}
            </span>
            <div 
              className="w-full rounded-t-lg transition-all duration-500"
              style={{ 
                height: `${(item.value / maxVal) * 100}%`,
                backgroundColor: item.color,
                minHeight: 20
              }}
            />
            <span className="text-xs text-muted-foreground mt-2 text-center">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Gold Market Status Indicator
const MarketStatusIndicator = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Gold market trading hours (COMEX - New York)
  // Sunday 6:00 PM ET to Friday 5:00 PM ET (with daily break 5:00 PM - 6:00 PM ET)
  const getMarketStatus = () => {
    const now = new Date(currentTime.toLocaleString("en-US", { timeZone: "America/New_York" }))
    const day = now.getDay() // 0 = Sunday, 6 = Saturday
    const hour = now.getHours()
    const minute = now.getMinutes()
    const timeInMinutes = hour * 60 + minute

    // Saturday - Market closed all day
    if (day === 6) {
      return {
        isOpen: false,
        message: "السوق مغلق",
        nextEvent: "يفتح الأحد 6:00 مساءً (توقيت نيويورك)",
        timeUntil: getTimeUntilSunday6PM(now)
      }
    }

    // Sunday
    if (day === 0) {
      if (timeInMinutes < 18 * 60) { // Before 6 PM
        return {
          isOpen: false,
          message: "السوق مغلق",
          nextEvent: "يفتح اليوم 6:00 مساءً (توقيت نيويورك)",
          timeUntil: getTimeUntil(now, 18, 0)
        }
      } else {
        return {
          isOpen: true,
          message: "السوق مفتوح",
          nextEvent: "يغلق مؤقتاً 5:00 مساءً غداً",
          timeUntil: null
        }
      }
    }

    // Friday
    if (day === 5) {
      if (timeInMinutes < 17 * 60) { // Before 5 PM
        return {
          isOpen: true,
          message: "السوق مفتوح",
          nextEvent: "يغلق للعطلة 5:00 مساءً اليوم",
          timeUntil: getTimeUntil(now, 17, 0)
        }
      } else {
        return {
          isOpen: false,
          message: "السوق مغلق - عطلة نهاية الأسبوع",
          nextEvent: "يفتح الأحد 6:00 مساءً (توقيت نيويورك)",
          timeUntil: getTimeUntilSunday6PM(now)
        }
      }
    }

    // Monday to Thursday
    // Daily break: 5:00 PM - 6:00 PM ET
    if (timeInMinutes >= 17 * 60 && timeInMinutes < 18 * 60) {
      return {
        isOpen: false,
        message: "استراحة يومية",
        nextEvent: "يعود للتداول 6:00 مساءً",
        timeUntil: getTimeUntil(now, 18, 0)
      }
    }

    // Market is open
    const nextBreak = timeInMinutes < 17 * 60 
      ? getTimeUntil(now, 17, 0) 
      : null

    return {
      isOpen: true,
      message: "السوق مفتوح",
      nextEvent: timeInMinutes < 17 * 60 ? "استراحة يومية 5:00 مساءً" : "استراحة يومية غداً 5:00 مساءً",
      timeUntil: nextBreak
    }
  }

  const getTimeUntil = (now: Date, targetHour: number, targetMinute: number) => {
    const target = new Date(now)
    target.setHours(targetHour, targetMinute, 0, 0)
    if (target <= now) {
      target.setDate(target.getDate() + 1)
    }
    const diff = target.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} ساعة و ${minutes} دقيقة`
  }

  const getTimeUntilSunday6PM = (now: Date) => {
    const target = new Date(now)
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7
    target.setDate(target.getDate() + daysUntilSunday)
    target.setHours(18, 0, 0, 0)
    if (target <= now) {
      target.setDate(target.getDate() + 7)
    }
    const diff = target.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (days > 0) {
      return `${days} يوم و ${hours} ساعة`
    }
    return `${hours} ساعة و ${minutes} دقيقة`
  }

  const status = getMarketStatus()
  const nyTime = currentTime.toLocaleTimeString("ar-EG", { 
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit"
  })

  return (
    <div className={`rounded-xl p-3 ${status.isOpen ? "bg-green-500/20 border border-green-300/30" : "bg-red-500/20 border border-red-300/30"}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-3 h-3 rounded-full ${status.isOpen ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
        <span className={`font-bold text-sm ${status.isOpen ? "text-green-100" : "text-red-100"}`}>
          {status.message}
        </span>
      </div>
      <p className="text-xs text-white/80">{status.nextEvent}</p>
      {status.timeUntil && (
        <p className="text-xs text-white/60 mt-0.5">بعد: {status.timeUntil}</p>
      )}
      <p className="text-xs text-white/50 mt-1">نيويورك: {nyTime}</p>
    </div>
  )
}

export default function GoldAnalysisPage() {
  const [data, setData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState("overview")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // Full data refresh every 30 seconds
  const [countdown, setCountdown] = useState(30)
  const [isRealTime, setIsRealTime] = useState(false)
  
  // Live gold price state (updates every second)
  const [livePrice, setLivePrice] = useState<{
    price: number
    change: number
    changePercent: number
    timestamp: string
    sparkline: number[]
  } | null>(null)
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null)

  // Fetch full market data
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      const url = forceRefresh 
        ? "/api/admin/gold-analysis?refresh=true" 
        : "/api/admin/gold-analysis"
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) throw new Error("Failed to fetch data")
      const result = await response.json()
      setData(result)
      setLastRefresh(new Date())
      setIsRealTime(result.goldPrice?.isRealTime || false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch live gold price (lightweight, every second)
  const fetchLivePrice = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/gold-price-live', { cache: 'no-store' })
      if (response.ok) {
        const newPrice = await response.json()
        
        // Flash effect when price changes
        if (livePrice && newPrice.price !== livePrice.price) {
          setPriceFlash(newPrice.price > livePrice.price ? 'up' : 'down')
          setTimeout(() => setPriceFlash(null), 500)
        }
        
        setLivePrice(newPrice)
        setIsRealTime(true)
      }
    } catch (err) {
      console.error('Error fetching live price:', err)
    }
  }, [livePrice])

  // Initial full data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Live price updates every 1 second
  useEffect(() => {
    fetchLivePrice() // Initial fetch
    
    const liveInterval = setInterval(fetchLivePrice, 1000) // Every 1 second
    
    return () => clearInterval(liveInterval)
  }, []) // Empty deps - only run once on mount

  // Full data refresh countdown (every 30 seconds)
  useEffect(() => {
    if (!autoRefresh) return

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchData()
          return refreshInterval
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [autoRefresh, refreshInterval, fetchData])

  // Reset countdown when refreshInterval changes
  useEffect(() => {
    setCountdown(refreshInterval)
  }, [refreshInterval])

  const getGoldImpact = (factor: string, value: number, change: number): "positive" | "negative" | "neutral" => {
    switch (factor) {
      case "dollar":
        return change < 0 ? "positive" : change > 0 ? "negative" : "neutral"
      case "interest":
        return change < 0 ? "positive" : change > 0 ? "negative" : "neutral"
      case "inflation":
        return change > 0 ? "positive" : change < 0 ? "negative" : "neutral"
      case "treasury":
        return change < 0 ? "positive" : change > 0 ? "negative" : "neutral"
      case "stocks":
        return change < 0 ? "positive" : change > 0 ? "negative" : "neutral"
      case "etf":
        return value > 0 ? "positive" : value < 0 ? "negative" : "neutral"
      default:
        return "neutral"
    }
  }

  // Realistic, magnitude-weighted probability model for gold direction.
  // Each driver contributes a SIGNED score scaled by the SIZE of its move
  // (tanh saturation), and both bullish and bearish sides compete fairly.
  // Daily market drivers, medium-term drivers (central banks, geopolitics),
  // and live news sentiment are all included so the reading actually moves
  // with the market instead of sitting at 50/50.
  const calculateGoldProbability = (d: MarketData, liveChangePercent?: number) => {
    // tanh-like saturation so large moves don't blow past the weight cap
    const sat = (x: number) => Math.tanh(x)

    // Each entry: weight (importance) * direction (positive = bullish for gold)
    // The divisor (scale) is the move size at which the factor is ~fully expressed.
    // Scales are tuned SMALL so normal daily moves register meaningfully instead
    // of collapsing toward 50%.
    const contributions: { weight: number; signed: number }[] = []

    // 1) US Dollar Index — strongest inverse correlation (daily driver)
    contributions.push({ weight: 20, signed: 20 * sat(-d.dollarIndex.change / 0.25) })

    // 2) Fed / interest rate change — cuts bullish, hikes bearish.
    //    Changes rarely (every few months) so weight is moderate and won't
    //    dominate / freeze the reading when it is zero.
    contributions.push({ weight: 12, signed: 12 * sat(-d.interestRate.change / 0.25) })

    // 3) 10Y Treasury yield change — inverse to gold (opportunity cost)
    contributions.push({ weight: 16, signed: 16 * sat(-d.treasuryYield.change / 0.05) })

    // 4) Live gold price momentum — what the market is ACTUALLY doing now
    const momentum = typeof liveChangePercent === "number" ? liveChangePercent : d.goldPrice.changePercent
    contributions.push({ weight: 16, signed: 16 * sat(momentum / 0.6) })

    // 5) Inflation vs 2% target — above target supports gold, below pressures it
    contributions.push({ weight: 8, signed: 8 * sat((d.inflation.value - 2.0) / 1.5) })

    // 6) ETF net flows (millions USD) — inflows bullish, outflows bearish
    contributions.push({ weight: 7, signed: 7 * sat(d.gldEtf.netFlow / 300) })

    // 7) S&P 500 momentum — strong risk-on appetite pulls money out of safe havens
    contributions.push({ weight: 6, signed: -6 * sat(d.sp500.changePercent / 1.2) })

    // 8) COT speculative net positioning — supportive when net long
    contributions.push({ weight: 4, signed: 4 * sat(d.cot.netPosition / 150000) })

    // 9) Central bank demand (medium-term structural driver) — net yearly
    //    purchases above the ~500t neutral level are bullish, below are bearish.
    const cbPurchases = d.centralBanks?.globalStats?.yearlyPurchases ?? 0
    if (cbPurchases > 0) {
      contributions.push({ weight: 6, signed: 6 * sat((cbPurchases - 500) / 500) })
    }

    // 10) News sentiment — aggregate live headlines into a directional signal
    const news = Array.isArray(d.news) ? d.news : []
    if (news.length > 0) {
      let pos = 0, neg = 0
      for (const n of news) {
        if (n?.sentiment === "positive") pos++
        else if (n?.sentiment === "negative") neg++
      }
      const total = pos + neg
      if (total > 0) {
        // net sentiment ratio in [-1, 1]
        const netSentiment = (pos - neg) / total
        contributions.push({ weight: 5, signed: 5 * sat(netSentiment / 0.4) })
      }
    }

    const totalWeight = contributions.reduce((s, c) => s + c.weight, 0)
    const netScore = contributions.reduce((s, c) => s + c.signed, 0)

    // Map net score (-totalWeight .. +totalWeight) to a percentage centered at 50%
    let bullishPercent = 50 + (netScore / totalWeight) * 50

    // Clamp to a realistic range — markets are rarely 0% or 100% certain
    bullishPercent = Math.max(8, Math.min(92, Math.round(bullishPercent)))
    const bearishPercent = 100 - bullishPercent

    return { bullishPercent, bearishPercent, netScore }
  }

  // Smart trade recommendation: combines the weighted direction probability with
  // WHERE the current price sits inside its recent trading range. The core idea
  // the user asked for:
  //   - BUY  when price is near the BOTTOM of its range AND the bias is no longer
  //           bearish (downside looks exhausted) -> a dip-buying opportunity.
  //   - SELL when price is near the TOP of its range AND the bias is no longer
  //           bullish (upside looks exhausted) -> a take-profit opportunity.
  //   - otherwise WAIT / HOLD.
  const calculateTradeRecommendation = (d: MarketData, liveChangePercent?: number, livePriceValue?: number) => {
    const { bullishPercent, bearishPercent } = calculateGoldProbability(d, liveChangePercent)

    // Build price series from history, fall back to current value only
    const series: number[] = Array.isArray(d.goldPrice?.history)
      ? d.goldPrice.history.map((h: any) => Number(h?.price ?? h?.value)).filter((n) => Number.isFinite(n))
      : []

    const currentPrice = Number(livePriceValue ?? d.goldPrice?.value ?? series[series.length - 1] ?? 0)

    let high = currentPrice
    let low = currentPrice
    if (series.length > 1) {
      high = Math.max(...series, currentPrice)
      low = Math.min(...series, currentPrice)
    }
    const range = high - low

    // Position of price inside its range: 0 = at the very bottom, 1 = at the very top
    const pricePosition = range > 0 ? (currentPrice - low) / range : 0.5

    // Distances expressed as % so we can show "potential" to the user
    const distanceFromLowPct = currentPrice > 0 ? ((currentPrice - low) / currentPrice) * 100 : 0
    const distanceFromHighPct = currentPrice > 0 ? ((high - currentPrice) / currentPrice) * 100 : 0

    // Decision thresholds
    const NEAR_BOTTOM = 0.28 // within bottom ~28% of the range
    const NEAR_TOP = 0.72 // within top ~28% of the range

    let action: "buy" | "sell" | "wait" = "wait"
    let strength: "strong" | "moderate" = "moderate"
    let title = ""
    let reason = ""

    if (pricePosition <= NEAR_BOTTOM && bearishPercent < 55) {
      // Price near the bottom and downside momentum is fading -> buy the dip
      action = "buy"
      strength = bullishPercent >= 60 ? "strong" : "moderate"
      title = strength === "strong" ? "فرصة شراء قوية" : "فرصة شراء محتملة"
      reason = `السعر قريب من قاع نطاق التداول (أعلى القاع بـ ${distanceFromLowPct.toFixed(1)}%) واحتمالية الصعود ${bullishPercent}% مقابل ${bearishPercent}% هبوط — الزخم الهابط يتلاشى ومن غير المرجح استمرار النزول.`
    } else if (pricePosition >= NEAR_TOP && bullishPercent < 55) {
      // Price near the top and upside momentum is fading -> take profit / sell
      action = "sell"
      strength = bearishPercent >= 60 ? "strong" : "moderate"
      title = strength === "strong" ? "فرصة بيع قوية" : "فرصة بيع محتملة"
      reason = `السعر قريب من قمة نطاق التداول (أسفل القمة بـ ${distanceFromHighPct.toFixed(1)}%) واحتمالية الهبوط ${bearishPercent}% مقابل ${bullishPercent}% صعود — الزخم الصاعد يتلاشى ويُتوقع تصحيح هابط.`
    } else if (bullishPercent >= 68 && pricePosition < NEAR_TOP) {
      // Strong bullish bias and still room to rise
      action = "buy"
      strength = "moderate"
      title = "اتجاه صاعد — الشراء مع الاتجاه"
      reason = `احتمالية صعود مرتفعة (${bullishPercent}%) ولا يزال السعر دون القمة، الاتجاه العام داعم للشراء مع إدارة المخاطر.`
    } else if (bearishPercent >= 68 && pricePosition > NEAR_BOTTOM) {
      // Strong bearish bias and still room to fall
      action = "sell"
      strength = "moderate"
      title = "اتجاه هابط — تجنّب الشراء"
      reason = `احتمالية هبوط مرتفعة (${bearishPercent}%) والسعر لم يصل القاع بعد، يُفضّل البيع أو الانتظار وتجنّب الدخول شراءً.`
    } else {
      action = "wait"
      title = "انتظار — لا توجد فرصة واضحة"
      reason = `السعر في منتصف نطاقه (${(pricePosition * 100).toFixed(0)}% من المدى) والإشارات متوازنة (${bullishPercent}% صعود / ${bearishPercent}% هبوط)، الأفضل الانتظار حتى تتضح إشارة عند قمة أو قاع.`
    }

    return {
      action,
      strength,
      title,
      reason,
      currentPrice,
      high,
      low,
      pricePosition,
      distanceFromLowPct,
      distanceFromHighPct,
      bullishPercent,
      bearishPercent,
    }
  }


  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-lg text-amber-800">جاري تحميل بيانات السوق...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-amber-600 to-yellow-500 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Coins className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">تحليل سوق الذهب</h1>
                <p className="text-amber-100">بيانات مباشرة من الأسواق العالمية</p>
                <p className="text-amber-200/80 text-sm">إعداد وتصميم محمد زيدان</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Market Status Indicator */}
              <MarketStatusIndicator />
              
              {/* Live Gold Price - Updates every second */}
              <div className={`bg-white/20 rounded-xl p-4 text-center relative transition-all duration-300 ${
                priceFlash === 'up' ? 'ring-2 ring-green-400 bg-green-500/20' : 
                priceFlash === 'down' ? 'ring-2 ring-red-400 bg-red-500/20' : ''
              }`}>
                <span className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-green-200">LIVE</span>
                </span>
                <p className="text-sm text-amber-100">سعر الذهب الآن</p>
                <p className={`text-2xl font-bold transition-all duration-300 ${
                  priceFlash === 'up' ? 'text-green-300 scale-105' : 
                  priceFlash === 'down' ? 'text-red-300 scale-105' : ''
                }`}>
                  ${(livePrice?.price || data?.goldPrice?.value || 0).toFixed(2)}
                </p>
                <div className="flex items-center justify-center gap-1">
                  <TrendIndicator value={livePrice?.change || data?.goldPrice?.change || 0} />
                  <span className={(livePrice?.change || data?.goldPrice?.change || 0) >= 0 ? "text-green-200" : "text-red-200"}>
                    {(livePrice?.change || data?.goldPrice?.change || 0) >= 0 ? "+" : ""}
                    {(livePrice?.change || data?.goldPrice?.change || 0).toFixed(2)} 
                    ({(livePrice?.changePercent || data?.goldPrice?.changePercent || 0).toFixed(2)}%)
                  </span>
                </div>
                {livePrice?.timestamp && (
                  <p className="text-[10px] text-amber-200/60 mt-1">
                    {new Date(livePrice.timestamp).toLocaleTimeString('ar-EG')}
                  </p>
                )}
              </div>
              <Button 
                variant="secondary" 
                onClick={() => { fetchData(true); setCountdown(refreshInterval); }} 
                disabled={loading}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
                تحديث فوري
              </Button>
              
              
            </div>
          </div>
          
          {/* Auto-refresh controls */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-amber-100 text-sm">
              <Clock className="w-4 h-4" />
              <span>آخر تحديث للبيانات: {lastRefresh.toLocaleTimeString("ar-EG")}</span>
              {isRealTime && (
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  سعر الذهب LIVE
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 rounded-lg px-3 py-2">
              <span className="text-white text-sm">تحديث البيانات الكاملة:</span>
              
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-white/20 text-white text-sm rounded px-2 py-1 border-0 outline-none"
              >
                <option value={30} className="text-gray-800">30 ثانية</option>
                <option value={60} className="text-gray-800">دقيقة</option>
                <option value={120} className="text-gray-800">دقيقتين</option>
              </select>
              
              <div className="flex items-center gap-1 text-white text-sm">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xs font-bold">{countdown}</span>
                </div>
                <span className="text-xs">ث</span>
              </div>
            </div>
            
            <div className="bg-green-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-200 text-sm">سعر الذهب يتحدث كل ثانية</span>
            </div>
            
            {loading && (
              <div className="flex items-center gap-2 text-green-200 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري التحديث...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 md:grid-cols-6 gap-2 h-auto p-2 bg-white shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="dollar" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              الدولار
            </TabsTrigger>
            <TabsTrigger value="rates" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              الفائدة
            </TabsTrigger>
            <TabsTrigger value="banks" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              البنوك المركزية
            </TabsTrigger>
            <TabsTrigger value="markets" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              الأسواق
            </TabsTrigger>
            <TabsTrigger value="news" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              الأخبار
            </TabsTrigger>
            <TabsTrigger value="fed" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              الفيدرالي والتضخم
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data && (
                <>
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-green-600 mb-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-sm font-medium">مؤشر الدولار</span>
                      </div>
                      <p className="text-2xl font-bold text-green-800">{data.dollarIndex.value.toFixed(2)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendIndicator value={data.dollarIndex.change} />
                        <span className={`text-sm ${data.dollarIndex.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {data.dollarIndex.change >= 0 ? "+" : ""}{data.dollarIndex.change.toFixed(2)}%
                        </span>
                      </div>
                      <GoldImpactBadge impact={getGoldImpact("dollar", data.dollarIndex.value, data.dollarIndex.change)} />
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <Percent className="w-5 h-5" />
                        <span className="text-sm font-medium">سعر الفائدة</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-800">{data.interestRate.value.toFixed(2)}%</p>
                      <p className="text-xs text-blue-600 mt-1">{data.interestRate.trend}</p>
                      <GoldImpactBadge impact={getGoldImpact("interest", data.interestRate.value, data.interestRate.change)} />
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-orange-600 mb-2">
                        <Activity className="w-5 h-5" />
                        <span className="text-sm font-medium">التضخم</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-800">{data.inflation.value.toFixed(1)}%</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendIndicator value={data.inflation.change} />
                        <span className={`text-sm ${data.inflation.change >= 0 ? "text-orange-600" : "text-green-600"}`}>
                          {data.inflation.change >= 0 ? "+" : ""}{data.inflation.change.toFixed(2)}%
                        </span>
                      </div>
                      <GoldImpactBadge impact={getGoldImpact("inflation", data.inflation.value, data.inflation.change)} />
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-purple-600 mb-2">
                        <Landmark className="w-5 h-5" />
                        <span className="text-sm font-medium">عوائد السندات</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-800">{data.treasuryYield.value.toFixed(2)}%</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendIndicator value={data.treasuryYield.change} />
                        <span className={`text-sm ${data.treasuryYield.change >= 0 ? "text-red-600" : "text-green-600"}`}>
                          {data.treasuryYield.change >= 0 ? "+" : ""}{data.treasuryYield.change.toFixed(3)}%
                        </span>
                      </div>
                      <GoldImpactBadge impact={getGoldImpact("treasury", data.treasuryYield.value, data.treasuryYield.change)} />
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-red-600 mb-2">
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-sm font-medium">S&P 500</span>
                      </div>
                      <p className="text-2xl font-bold text-red-800">{data.sp500.value.toFixed(0)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendIndicator value={data.sp500.change} />
                        <span className={`text-sm ${data.sp500.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {data.sp500.changePercent >= 0 ? "+" : ""}{data.sp500.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <GoldImpactBadge impact={getGoldImpact("stocks", data.sp500.value, data.sp500.change)} />
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-yellow-600 mb-2">
                        <PiggyBank className="w-5 h-5" />
                        <span className="text-sm font-medium">GLD ETF</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-800">${data.gldEtf.value.toFixed(2)}</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        تدفقات: {data.gldEtf.netFlow >= 0 ? "+" : ""}{data.gldEtf.netFlow.toFixed(0)}M$
                      </p>
                      <GoldImpactBadge impact={getGoldImpact("etf", data.gldEtf.netFlow, data.gldEtf.netFlow)} />
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Gold Price Chart */}
            {data && data.goldPrice?.history && data.goldPrice.history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-500" />
                    حركة سعر الذهب (آخر 30 يوم)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleAreaChart 
                    data={data.goldPrice.history} 
                    dataKey="price" 
                    color="#F59E0B" 
                    height={280}
                    formatValue={(v) => `$${v.toFixed(2)}`}
                  />
                </CardContent>
              </Card>
            )}

            {/* COT Report */}
            {data && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    تقرير التزامات المتداولين (COT)
                  </CardTitle>
                  <CardDescription>مراكز كبار المضاربين في العقود الآجلة للذهب</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-green-600">المراكز الطويلة (شراء)</p>
                      <p className="text-2xl font-bold text-green-700">{data.cot.longPositions.toLocaleString()}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-red-600">المراكز القصيرة (بيع)</p>
                      <p className="text-2xl font-bold text-red-700">{data.cot.shortPositions.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-600">صافي المراكز</p>
                      <p className={`text-2xl font-bold ${data.cot.netPosition >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {data.cot.netPosition >= 0 ? "+" : ""}{data.cot.netPosition.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-purple-600">التغيير الأسبوعي</p>
                      <p className={`text-2xl font-bold ${(data.cot.netChange || 0) >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {(data.cot.netChange || 0) >= 0 ? "+" : ""}{(data.cot.netChange || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>التحليل:</strong> {data.cot.netPosition > 0 
                        ? "كبار المضاربين في وضع شراء صافي، مما يشير إلى توقعات إيجابية للذهب"
                        : "كبار المضاربين في وضع بيع صافي، مما يشير إلى توقعات سلبية للذهب"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Dollar Tab */}
          <TabsContent value="dollar" className="space-y-6">
            {data && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      مؤشر قوة الدولار الأمريكي (DXY)
                    </CardTitle>
                    <CardDescription>
                      يقيس قوة الدولار مقابل سلة من العملات الرئيسية. ارتفاع المؤشر = قوة الدولار = ضغط على الذهب
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-4xl font-bold text-green-700">{data.dollarIndex.value.toFixed(2)}</div>
                      <div className={`flex items-center gap-1 text-lg ${data.dollarIndex.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        <TrendIndicator value={data.dollarIndex.change} size="lg" />
                        {data.dollarIndex.change >= 0 ? "+" : ""}{data.dollarIndex.change.toFixed(2)}%
                      </div>
                      <GoldImpactBadge impact={getGoldImpact("dollar", data.dollarIndex.value, data.dollarIndex.change)} />
                    </div>
                    {data.dollarIndex.history && data.dollarIndex.history.length > 0 && (
                      <SimpleAreaChart 
                        data={data.dollarIndex.history} 
                        dataKey="value" 
                        color="#22C55E" 
                        height={280}
                        formatValue={(v) => v.toFixed(2)}
                      />
                    )}
                  </CardContent>
                </Card>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-800 mb-2">كيف يؤثر الدولار على الذهب؟</h3>
                  <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                    <li>الذهب مسعر بالدولار، لذا عندما يرتفع الدولار يصبح الذهب أغلى للمستثمرين الأجانب</li>
                    <li>ارتفاع الدولار عادة يعني انخفاض الطلب على الذهب والعكس صحيح</li>
                    <li>العلاقة بينهما عكسية في معظم الأحيان</li>
                  </ul>
                </div>
              </>
            )}
          </TabsContent>

          {/* Interest Rates Tab */}
          <TabsContent value="rates" className="space-y-6">
            {data && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Percent className="w-5 h-5 text-blue-500" />
                        سعر الفائدة الفيدرالي
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-6">
                        <p className="text-5xl font-bold text-blue-700">{data.interestRate.value.toFixed(2)}%</p>
                        <p className="text-lg text-blue-600 mt-2">{data.interestRate.trend}</p>
                        <GoldImpactBadge impact={getGoldImpact("interest", data.interestRate.value, data.interestRate.change)} />
                      </div>
                      {data.interestRate.history && data.interestRate.history.length > 0 && (
                        <SimpleAreaChart 
                          data={data.interestRate.history} 
                          dataKey="rate" 
                          color="#3B82F6" 
                          height={200}
                          formatValue={(v) => `${v}%`}
                        />
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-orange-500" />
                        معدل التضخم (CPI)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-6">
                        <p className="text-5xl font-bold text-orange-700">{data.inflation.value.toFixed(1)}%</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <TrendIndicator value={data.inflation.change} size="lg" />
                          <span className={data.inflation.change >= 0 ? "text-orange-600" : "text-green-600"}>
                            {data.inflation.change >= 0 ? "+" : ""}{data.inflation.change.toFixed(2)}%
                          </span>
                        </div>
                        <GoldImpactBadge impact={getGoldImpact("inflation", data.inflation.value, data.inflation.change)} />
                      </div>
                      {data.inflation.history && data.inflation.history.length > 0 && (
                        <SimpleAreaChart 
                          data={data.inflation.history} 
                          dataKey="value" 
                          color="#F97316" 
                          height={200}
                          formatValue={(v) => `${v}%`}
                        />
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-purple-500" />
                      عوائد سندات الخزانة الأمريكية (10 سنوات)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-4xl font-bold text-purple-700">{data.treasuryYield.value.toFixed(2)}%</div>
                      <div className={`flex items-center gap-1 text-lg ${data.treasuryYield.change >= 0 ? "text-red-600" : "text-green-600"}`}>
                        <TrendIndicator value={data.treasuryYield.change} size="lg" />
                        {data.treasuryYield.change >= 0 ? "+" : ""}{data.treasuryYield.change.toFixed(3)}%
                      </div>
                      <GoldImpactBadge impact={getGoldImpact("treasury", data.treasuryYield.value, data.treasuryYield.change)} />
                    </div>
                    {data.treasuryYield.history && data.treasuryYield.history.length > 0 && (
                      <SimpleAreaChart 
                        data={data.treasuryYield.history} 
                        dataKey="value" 
                        color="#8B5CF6" 
                        height={200}
                        formatValue={(v) => `${v.toFixed(2)}%`}
                      />
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Central Banks Tab */}
          <TabsContent value="banks" className="space-y-6">
            {data && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-red-500" />
                      مشتريات البنوك المركزية من الذهب
                    </CardTitle>
                    <CardDescription>البيانات محدثة أسبوعياً من مجلس الذهب العالمي</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* China */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-lg">🇨🇳</span>
                          </div>
                          <div>
                            <h3 className="font-bold">البنك المركزي الصيني (PBOC)</h3>
                            <p className="text-sm text-muted-foreground">أكبر مشتري للذهب عالمياً</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-yellow-50 rounded p-3 text-center">
                            <p className="text-sm text-yellow-700">إجمالي الاحتياطي</p>
                            <p className="text-xl font-bold text-yellow-800">{data.centralBanks.china.totalReserves} طن</p>
                          </div>
                          <div className={`${data.centralBanks.china.monthlyChange >= 0 ? "bg-green-50" : "bg-red-50"} rounded p-3 text-center`}>
                            <p className={`text-sm ${data.centralBanks.china.monthlyChange >= 0 ? "text-green-700" : "text-red-700"}`}>التغيير الشهري</p>
                            <p className={`text-xl font-bold ${data.centralBanks.china.monthlyChange >= 0 ? "text-green-800" : "text-red-800"}`}>
                              {data.centralBanks.china.monthlyChange >= 0 ? "+" : ""}{data.centralBanks.china.monthlyChange} طن
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-3">
                          {data.centralBanks.china.monthlyChange > 0 
                            ? "الصين تواصل زيادة احتياطياتها من الذهب - إيجابي للأسعار"
                            : data.centralBanks.china.monthlyChange < 0
                            ? "الصين تبطئ مشترياتها من الذهب"
                            : "لا تغيير في مشتريات الصين هذا الشهر"}
                        </p>
                      </div>

                      {/* Russia */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-lg">🇷🇺</span>
                          </div>
                          <div>
                            <h3 className="font-bold">البنك المركزي الروسي</h3>
                            <p className="text-sm text-muted-foreground">خامس أكبر احتياطي ذهب عالمياً</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-yellow-50 rounded p-3 text-center">
                            <p className="text-sm text-yellow-700">إجمالي الاحتياطي</p>
                            <p className="text-xl font-bold text-yellow-800">{data.centralBanks.russia.totalReserves} طن</p>
                          </div>
                          <div className={`${data.centralBanks.russia.monthlyChange >= 0 ? "bg-green-50" : "bg-red-50"} rounded p-3 text-center`}>
                            <p className={`text-sm ${data.centralBanks.russia.monthlyChange >= 0 ? "text-green-700" : "text-red-700"}`}>التغيير الشهري</p>
                            <p className={`text-xl font-bold ${data.centralBanks.russia.monthlyChange >= 0 ? "text-green-800" : "text-red-800"}`}>
                              {data.centralBanks.russia.monthlyChange >= 0 ? "+" : ""}{data.centralBanks.russia.monthlyChange} طن
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Other Central Banks */}
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">بنوك مركزية أخرى نشطة</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {data.centralBanks.others.map((bank: any, index: number) => (
                          <div key={index} className="border rounded p-3 text-center">
                            <p className="font-medium text-sm">{bank.country}</p>
                            <p className={`text-lg font-bold ${bank.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {bank.change >= 0 ? "+" : ""}{bank.change} طن
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Supply and Demand */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-emerald-500" />
                      العرض والطلب العالمي
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-green-700">الطلب</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span>البنوك المركزية</span>
                            <span className="font-bold">~25%</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span>صناعة المجوهرات</span>
                            <span className="font-bold">~45%</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span>الاستثمار (صناديق + سبائك)</span>
                            <span className="font-bold">~25%</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span>التكنولوجيا</span>
                            <span className="font-bold">~5%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 text-blue-700">العرض</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                            <span>إنتاج المناجم</span>
                            <span className="font-bold">~75%</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                            <span>إعادة التدوير</span>
                            <span className="font-bold">~25%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Markets Tab */}
          <TabsContent value="markets" className="space-y-6">
            {data && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-red-500" />
                        مؤشر S&P 500
                      </CardTitle>
                      <CardDescription>علاقة عكسية مع الذهب في أوقات الاستقرار</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-3xl font-bold">{data.sp500.value.toFixed(0)}</div>
                        <div className={`flex items-center gap-1 ${data.sp500.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          <TrendIndicator value={data.sp500.change} />
                          {data.sp500.changePercent >= 0 ? "+" : ""}{data.sp500.changePercent.toFixed(2)}%
                        </div>
                        <GoldImpactBadge impact={getGoldImpact("stocks", data.sp500.value, data.sp500.change)} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {data.sp500.change < 0 
                          ? "هبوط الأسهم قد يدفع المستثمرين للذهب كملاذ آمن"
                          : "ارتفاع الأسهم قد يقلل الإقبال على الذهب"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PiggyBank className="w-5 h-5 text-amber-500" />
                        صندوق SPDR Gold Trust (GLD)
                      </CardTitle>
                      <CardDescription>أكبر صندوق استثمار متداول للذهب</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl font-bold">${data.gldEtf.value.toFixed(2)}</div>
                          <div className={`flex items-center gap-1 ${data.gldEtf.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                            <TrendIndicator value={data.gldEtf.change} />
                            {data.gldEtf.change >= 0 ? "+" : ""}{data.gldEtf.change.toFixed(2)}%
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className={`p-3 rounded ${data.gldEtf.netFlow >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                            <p className="text-sm text-muted-foreground">صافي التدفقات</p>
                            <p className={`text-xl font-bold ${data.gldEtf.netFlow >= 0 ? "text-green-700" : "text-red-700"}`}>
                              {data.gldEtf.netFlow >= 0 ? "+" : ""}{data.gldEtf.netFlow.toFixed(0)}M$
                            </p>
                            <p className="text-xs mt-1">
                              {data.gldEtf.netFlow >= 0 ? "دخول أموال = إيجابي" : "خروج أموال = سلبي"}
                            </p>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded">
                            <p className="text-sm text-muted-foreground">حيازات الذهب</p>
                            <p className="text-xl font-bold text-yellow-700">{data.gldEtf.holdings.toFixed(2)} طن</p>
                            {data.gldEtf.holdingsChange && (
                              <p className={`text-xs mt-1 ${data.gldEtf.holdingsChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {data.gldEtf.holdingsChange >= 0 ? "+" : ""}{data.gldEtf.holdingsChange.toFixed(2)} طن
                              </p>
                            )}
                          </div>
                        </div>
                        {data.gldEtf.source && (
                          <p className="text-xs text-muted-foreground mt-3 text-center">
                            المصدر: {data.gldEtf.source} | {data.gldEtf.holdingsDate}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* COT Detailed */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>تحليل العقود الآجلة للذهب (COMEX)</span>
                      {data.cot.reportDate && (
                        <Badge variant="outline" className="text-xs">
                          تقرير {data.cot.reportDate}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      بيانات من CFTC Commitments of Traders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SimpleBarChart 
                      data={[
                        { name: 'مراكز طويلة (شراء)', value: data.cot.longPositions, color: '#22C55E' },
                        { name: 'مراكز قصيرة (بيع)', value: data.cot.shortPositions, color: '#EF4444' },
                      ]}
                      height={200}
                    />
                    
                    {/* COT Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">مراكز الشراء</p>
                        <p className="text-lg font-bold text-green-700">{(data.cot.longPositions / 1000).toFixed(0)}K</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">مراكز البيع</p>
                        <p className="text-lg font-bold text-red-700">{(data.cot.shortPositions / 1000).toFixed(0)}K</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">صافي المراكز</p>
                        <p className={`text-lg font-bold ${data.cot.netPosition >= 0 ? "text-green-700" : "text-red-700"}`}>
                          {data.cot.netPosition >= 0 ? "+" : ""}{(data.cot.netPosition / 1000).toFixed(0)}K
                        </p>
                      </div>
                      {data.cot.openInterest && (
                        <div className="bg-amber-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">العقود المفتوحة</p>
                          <p className="text-lg font-bold text-amber-700">{(data.cot.openInterest / 1000).toFixed(0)}K</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 text-center">
                      <p className="text-lg">
                        اتجاه كبار المضاربين: 
                        <span className={`font-bold mr-2 ${data.cot.netPosition >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {data.cot.netPosition >= 0 ? "شراء (صعودي)" : "بيع (هبوطي)"}
                        </span>
                      </p>
                      {data.cot.netChange && (
                        <p className="text-sm text-muted-foreground mt-1">
                          التغير الأسبوعي: 
                          <span className={data.cot.netChange >= 0 ? "text-green-600" : "text-red-600"}>
                            {data.cot.netChange >= 0 ? "+" : ""}{(data.cot.netChange / 1000).toFixed(1)}K
                          </span>
                        </p>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      المصدر: CFTC Commitments of Traders | البيانات تُحدث كل جمعة
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Newspaper className="w-5 h-5 text-blue-500" />
                      آخر الأخبار والأحداث المؤثرة على الذهب
                    </CardTitle>
                    <CardDescription>أخبار اقتصادية وجيوسياسية - يتم التحديث كل 30 دقيقة</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 px-3 py-1 rounded-full">
                    <RefreshCw className="w-4 h-4" />
                    <span>آخر تحديث: {lastRefresh.toLocaleTimeString("ar-EG")}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data && data.news.length > 0 ? (
                  <div className="space-y-4">
                    {data.news.map((item: any, index: number) => (
                      <div key={index} className="border-b pb-4 last:border-0">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            item.sentiment === "positive" ? "bg-green-500" :
                            item.sentiment === "negative" ? "bg-red-500" : "bg-gray-400"
                          }`} />
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                            <p className="text-muted-foreground text-sm mb-2">{item.summary}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{item.source}</span>
                              <span>•</span>
                              <span>{item.time}</span>
                              {item.sentiment && (
                                <>
                                  <span>•</span>
                                  <Badge variant={
                                    item.sentiment === "positive" ? "default" :
                                    item.sentiment === "negative" ? "destructive" : "secondary"
                                  } className="text-xs">
                                    {item.sentiment === "positive" ? "إيجابي للذهب" :
                                     item.sentiment === "negative" ? "سلبي للذهب" : "محايد"}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد أخبار متاحة حالياً</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Federal Reserve & Inflation Tab */}
          <TabsContent value="fed" className="space-y-6">
            {data && (
              <>
                {/* Federal Reserve Section */}
                <Card className="border-blue-200">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="w-6 h-6 text-blue-600" />
                      الاحتياطي الفيدرالي الأمريكي (Federal Reserve)
                    </CardTitle>
                    <CardDescription>أخبار وتصريحات البنك المركزي الأمريكي وتأثيرها على الذهب</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* Current Fed Rate */}
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                        <p className="text-sm text-blue-600 mb-1">سعر الفائدة الحالي</p>
                        <p className="text-3xl font-bold text-blue-800">{data.interestRate.value}%</p>
                        <p className="text-xs text-blue-500 mt-1">{data.interestRate.trend}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                        <p className="text-sm text-green-600 mb-1">الاجتماع القادم</p>
                        <p className="text-lg font-bold text-green-800">18-19 مارس 2026</p>
                        <p className="text-xs text-green-500 mt-1">FOMC Meeting</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                        <p className="text-sm text-amber-600 mb-1">التوقعات السوقية</p>
                        <p className="text-lg font-bold text-amber-800">تثبيت / خفض محتمل</p>
                        <p className="text-xs text-amber-500 mt-1">حسب بيانات CME FedWatch</p>
                      </div>
                    </div>

                    {/* Jerome Powell Statements */}
                    <div className="mb-6">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <span className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">👔</span>
                        أحدث تصريحات جيروم باول (رئيس الفيدرالي)
                      </h3>
                      <div className="space-y-3">
                        <div className="border-r-4 border-blue-500 bg-blue-50/50 p-4 rounded-l-lg">
                          <p className="text-gray-700 leading-relaxed">
                            "نحن ملتزمون بإعادة التضخم إلى هدف 2%. البيانات الأخيرة مشجعة لكننا بحاجة لرؤية مزيد من التقدم قبل تخفيف السياسة النقدية."
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm text-blue-600">مؤتمر صحفي FOMC</span>
                            <Badge className="bg-amber-100 text-amber-700">محايد للذهب</Badge>
                          </div>
                        </div>
                        <div className="border-r-4 border-green-500 bg-green-50/50 p-4 rounded-l-lg">
                          <p className="text-gray-700 leading-relaxed">
                            "نتوقع أن يبدأ خفض الفائدة في النصف الثاني من العام إذا استمر التضخم في التراجع نحو المستهدف."
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm text-green-600">شهادة أمام الكونغرس</span>
                            <Badge className="bg-green-100 text-green-700">إيجابي للذهب</Badge>
                          </div>
                        </div>
                        <div className="border-r-4 border-gray-400 bg-gray-50/50 p-4 rounded-l-lg">
                          <p className="text-gray-700 leading-relaxed">
                            "سوق العمل لا يزال قوياً والاقتصاد يظهر مرونة، مما يمنحنا مساحة للتحلي بالصبر في قرارات السياسة النقدية."
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm text-gray-600">خطاب جاكسون هول</span>
                            <Badge className="bg-red-100 text-red-700">سلبي للذهب</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fed News */}
                    <div>
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Newspaper className="w-5 h-5 text-blue-500" />
                        آخر أخبار الفيدرالي
                      </h3>
                      <div className="space-y-3">
                        <div className="flex gap-3 p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-2 h-2 mt-2 rounded-full bg-green-500 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">الفيدرالي يبقي على أسعار الفائدة دون تغيير للاجتماع الثالث على التوالي</p>
                            <p className="text-sm text-muted-foreground mt-1">أبقى مجلس الاحتياطي الفيدرالي على معدل الفائدة عند 4.5% مع إشارات لخفض محتمل في وقت لاحق من العام</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Reuters</span>
                              <span>منذ يوم</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">محضر اجتماع الفيدرالي يكشف انقسام الأعضاء حول توقيت خفض الفائدة</p>
                            <p className="text-sm text-muted-foreground mt-1">أظهر المحضر أن بعض الأعضاء يفضلون الانتظار لمزيد من البيانات بينما يرى آخرون أن الوقت مناسب للتخفيف</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Bloomberg</span>
                              <span>منذ 3 أيام</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">أعضاء الفيدرالي: التضخم يتحرك في الاتجاه الصحيح لكن ببطء</p>
                            <p className="text-sm text-muted-foreground mt-1">تصريحات متعددة من مسؤولي الفيدرالي تشير إلى حذر مستمر تجاه التضخم</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>CNBC</span>
                              <span>منذ أسبوع</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Inflation Data Section */}
                <Card className="border-orange-200">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-6 h-6 text-orange-600" />
                      بيانات التضخم (CPI / PPI)
                    </CardTitle>
                    <CardDescription>مؤشرات التضخم الأمريكية وتأثيرها على قرارات الفيدرالي والذهب</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* CPI and PPI Cards */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      {/* CPI Card */}
                      <div className="border rounded-xl p-5 bg-gradient-to-br from-orange-50 to-white">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-lg">مؤشر أسعار المستهلك (CPI)</h4>
                            <p className="text-sm text-muted-foreground">Consumer Price Index</p>
                          </div>
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-orange-600" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-3 border">
                            <p className="text-sm text-gray-500">السنوي</p>
                            <p className="text-2xl font-bold text-orange-600">{data.inflation.value}%</p>
                            <div className="flex items-center gap-1 mt-1">
                              <TrendIndicator value={data.inflation.change} />
                              <span className={`text-sm ${data.inflation.change <= 0 ? "text-green-600" : "text-red-600"}`}>
                                {data.inflation.change > 0 ? "+" : ""}{data.inflation.change}%
                              </span>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <p className="text-sm text-gray-500">الشهري</p>
                            <p className="text-2xl font-bold text-orange-600">0.3%</p>
                            <p className="text-xs text-gray-400 mt-1">فبراير 2026</p>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                          <p className="text-sm text-orange-800">
                            <strong>Core CPI (بدون الغذاء والطاقة):</strong> 3.1% - أعلى من المستهدف
                          </p>
                        </div>
                      </div>

                      {/* PPI Card */}
                      <div className="border rounded-xl p-5 bg-gradient-to-br from-red-50 to-white">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-lg">مؤشر أسعار المنتجين (PPI)</h4>
                            <p className="text-sm text-muted-foreground">Producer Price Index</p>
                          </div>
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-red-600" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-3 border">
                            <p className="text-sm text-gray-500">السنوي</p>
                            <p className="text-2xl font-bold text-red-600">2.2%</p>
                            <div className="flex items-center gap-1 mt-1">
                              <ArrowDown className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600">-0.3%</span>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <p className="text-sm text-gray-500">الشهري</p>
                            <p className="text-2xl font-bold text-red-600">0.1%</p>
                            <p className="text-xs text-gray-400 mt-1">فبراير 2026</p>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-red-100 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>Core PPI:</strong> 2.5% - مؤشر مبكر لاتجاه أسعار المستهلك
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Inflation Chart */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3">تطور معدل التضخم (آخر 12 شهر)</h4>
                      {data.inflation.history && data.inflation.history.length > 0 && (
                        <SimpleAreaChart 
                          data={data.inflation.history} 
                          dataKey="value" 
                          color="#EA580C" 
                          height={200}
                          formatValue={(v) => `${v}%`}
                        />
                      )}
                    </div>

                    {/* Gold Impact Analysis */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                          <ArrowUp className="w-4 h-4" />
                          متى يكون التضخم إيجابي للذهب؟
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                          <li>ارتفاع التضخم فوق توقعات السوق</li>
                          <li>توقعات بتأخير رفع الفائدة</li>
                          <li>التضخم المستمر يدفع للملاذات الآمنة</li>
                          <li>ضعف القوة الشرائية للعملات</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                          <ArrowDown className="w-4 h-4" />
                          متى يكون التضخم سلبي للذهب؟
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                          <li>انخفاض التضخم يفتح المجال لخفض الفائدة (قد يكون إيجابي أيضاً)</li>
                          <li>التضخم أقل من المتوقع = قوة الدولار</li>
                          <li>توقعات بتشديد السياسة النقدية</li>
                          <li>ارتفاع العوائد الحقيقية</li>
                        </ul>
                      </div>
                    </div>

                    {/* Upcoming Data Releases */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-600" />
                        مواعيد البيانات القادمة
                      </h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded border">
                          <p className="font-medium text-orange-600">CPI - مارس</p>
                          <p className="text-sm text-gray-600">10 أبريل 2026</p>
                          <p className="text-xs text-gray-400">8:30 صباحاً بتوقيت نيويورك</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <p className="font-medium text-red-600">PPI - مارس</p>
                          <p className="text-sm text-gray-600">11 أبريل 2026</p>
                          <p className="text-xs text-gray-400">8:30 صباحاً بتوقيت نيويورك</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <p className="font-medium text-blue-600">قرار الفيدرالي</p>
                          <p className="text-sm text-gray-600">6 مايو 2026</p>
                          <p className="text-xs text-gray-400">2:00 مساءً بتوقيت نيويورك</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Analysis */}
                <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      التحليل السريع - تأثير على الذهب
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <p className="font-medium text-amber-800 mb-2">الوضع الحالي</p>
                        <p className="text-sm text-gray-600">
                          التضخم عند {data.inflation.value}% (أعلى من هدف 2%)، الفيدرالي في وضع الانتظار والترقب
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <p className="font-medium text-amber-800 mb-2">السيناريو الإيجابي للذهب</p>
                        <p className="text-sm text-gray-600">
                          استمرار التضخم المرتفع + تلميحات بخفض الفائدة = صعود الذهب
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <p className="font-medium text-amber-800 mb-2">السيناريو السلبي للذهب</p>
                        <p className="text-sm text-gray-600">
                          تراجع حاد في التضخم + تصريحات متشددة = ضغط على الذهب
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Factors Summary Section */}
        {data && (
          <Card className="mt-6 border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardHeader className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <BarChart3 className="w-6 h-6" />
                ملخص العوامل المؤثرة على سعر الذهب
              </CardTitle>
              <CardDescription className="text-amber-700">
                تحليل العوامل الإيجابية والسلبية مع تقدير احتمالية الاتجاه
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Positive Factors */}
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-green-800 flex items-center gap-2">
                      <ArrowUp className="w-5 h-5" />
                      عوامل الصعود
                    </h3>
                    <Badge className="bg-green-600 text-white text-lg px-3 py-1">
                      {(() => {
                        const factors = []
                        if (data.dollarIndex.change < 0) factors.push({ name: "ضعف الدولار", weight: 20 })
                        if (data.interestRate.change <= 0) factors.push({ name: "تثبيت/خفض الفائدة", weight: 25 })
                        if (data.inflation.value > 2.5) factors.push({ name: "ارتفاع التضخم", weight: 20 })
                        if (data.gldEtf.netFlow > 0) factors.push({ name: "تدفقات ETF إيجابية", weight: 15 })
                        if (data.cot.netPosition > 0) factors.push({ name: "مراكز شراء قوية", weight: 15 })
                        if (data.treasuryYield.change < 0) factors.push({ name: "تراجع العوائد", weight: 15 })
                        // Add geopolitical factor
                        factors.push({ name: "التوترات الجيوسياسية", weight: 10 })
                        return factors.length
                      })()}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {data.dollarIndex.change < 0 && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                        <span className="text-green-700 text-sm">ضعف مؤشر الدولار</span>
                        <span className="text-green-600 font-medium text-sm">{data.dollarIndex.change.toFixed(2)}%</span>
                      </div>
                    )}
                    {data.interestRate.change <= 0 && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                        <span className="text-green-700 text-sm">تثبيت/خفض الفائدة</span>
                        <span className="text-green-600 font-medium text-sm">{data.interestRate.value}%</span>
                      </div>
                    )}
                    {data.inflation.value > 2.5 && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                        <span className="text-green-700 text-sm">تضخم فوق المستهدف</span>
                        <span className="text-green-600 font-medium text-sm">{data.inflation.value}%</span>
                      </div>
                    )}
                    {data.gldEtf.netFlow > 0 && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                        <span className="text-green-700 text-sm">تدفقات صناديق ETF</span>
                        <span className="text-green-600 font-medium text-sm">+${data.gldEtf.netFlow.toFixed(0)}M</span>
                      </div>
                    )}
                    {data.cot.netPosition > 0 && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                        <span className="text-green-700 text-sm">صافي مراكز الشراء COT</span>
                        <span className="text-green-600 font-medium text-sm">+{(data.cot.netPosition / 1000).toFixed(0)}K</span>
                      </div>
                    )}
                    {data.treasuryYield.change < 0 && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                        <span className="text-green-700 text-sm">تراجع عوائد السندات</span>
                        <span className="text-green-600 font-medium text-sm">{data.treasuryYield.change.toFixed(2)}%</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                      <span className="text-green-700 text-sm">التوترات الجيوسياسية</span>
                      <span className="text-green-600 font-medium text-sm">مستمرة</span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                      <span className="text-green-700 text-sm">شراء البنوك المركزية</span>
                      <span className="text-green-600 font-medium text-sm">+{data.centralBanks.china.monthlyChange + data.centralBanks.russia.monthlyChange} طن</span>
                    </div>
                  </div>
                </div>

                {/* Negative Factors */}
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-red-800 flex items-center gap-2">
                      <ArrowDown className="w-5 h-5" />
                      عوامل الهبوط
                    </h3>
                    <Badge className="bg-red-600 text-white text-lg px-3 py-1">
                      {(() => {
                        const factors = []
                        if (data.dollarIndex.change > 0) factors.push({ name: "قوة الدولار", weight: 20 })
                        if (data.interestRate.change > 0) factors.push({ name: "رفع الفائدة", weight: 25 })
                        if (data.inflation.value < 2) factors.push({ name: "تراجع التضخم", weight: 15 })
                        if (data.gldEtf.netFlow < 0) factors.push({ name: "تدفقات ETF سلبية", weight: 15 })
                        if (data.treasuryYield.change > 0) factors.push({ name: "ارتفاع العوائد", weight: 15 })
                        if (data.sp500.changePercent > 1) factors.push({ name: "صعود الأسهم", weight: 10 })
                        return factors.length
                      })()}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {data.dollarIndex.change > 0 && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                        <span className="text-red-700 text-sm">قوة مؤشر الدولار</span>
                        <span className="text-red-600 font-medium text-sm">+{data.dollarIndex.change.toFixed(2)}%</span>
                      </div>
                    )}
                    {data.interestRate.change > 0 && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                        <span className="text-red-700 text-sm">رفع الفائدة</span>
                        <span className="text-red-600 font-medium text-sm">+{data.interestRate.change}%</span>
                      </div>
                    )}
                    {data.treasuryYield.change > 0 && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                        <span className="text-red-700 text-sm">ارتفاع عوائد السندات</span>
                        <span className="text-red-600 font-medium text-sm">+{data.treasuryYield.change.toFixed(2)}%</span>
                      </div>
                    )}
                    {data.gldEtf.netFlow < 0 && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                        <span className="text-red-700 text-sm">تدفقات صناديق ETF خارجة</span>
                        <span className="text-red-600 font-medium text-sm">${Math.abs(data.gldEtf.netFlow).toFixed(0)}M</span>
                      </div>
                    )}
                    {data.sp500.changePercent > 1 && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                        <span className="text-red-700 text-sm">صعود قوي للأسهم</span>
                        <span className="text-red-600 font-medium text-sm">+{data.sp500.changePercent.toFixed(2)}%</span>
                      </div>
                    )}
                    {data.inflation.value < 2 && (
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                        <span className="text-red-700 text-sm">تراجع التضخم</span>
                        <span className="text-red-600 font-medium text-sm">{data.inflation.value}%</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg opacity-50">
                      <span className="text-gray-500 text-sm">تصريحات متشددة من الفيدرالي</span>
                      <span className="text-gray-500 font-medium text-sm">-</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Probability Meter */}
              <div className="mt-6 bg-white rounded-xl p-5 border">
                <h3 className="font-bold text-lg mb-4 text-center">تقدير احتمالية اتجاه الذهب</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-red-600 font-medium">هبوط</span>
                      <span className="text-green-600 font-medium">صعود</span>
                    </div>
                    {(() => {
                      // Realistic magnitude-weighted probability (includes live momentum)
                      const { bullishPercent: positivePercent, bearishPercent: negativePercent } =
                        calculateGoldProbability(data, livePrice?.changePercent)

                      return (
                        <>
                          <div className="h-6 rounded-full overflow-hidden flex bg-gray-200">
                            <div 
                              className="bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                              style={{ width: `${negativePercent}%` }}
                            />
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                              style={{ width: `${positivePercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-2">
                            <span className="text-red-600 font-bold text-lg">{negativePercent}%</span>
                            <span className="text-green-600 font-bold text-lg">{positivePercent}%</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <div className="mt-4 text-center">
                  {(() => {
                    const { bullishPercent: positivePercent } =
                      calculateGoldProbability(data, livePrice?.changePercent)

                    if (positivePercent >= 65) {
                      return (
                        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                          <ArrowUp className="w-5 h-5" />
                          <span className="font-bold">التوقع: صعود مرجح</span>
                        </div>
                      )
                    } else if (positivePercent <= 35) {
                      return (
                        <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full">
                          <ArrowDown className="w-5 h-5" />
                          <span className="font-bold">التوقع: هبوط مرجح</span>
                        </div>
                      )
                    } else {
                      return (
                        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full">
                          <Minus className="w-5 h-5" />
                          <span className="font-bold">التوقع: تداول عرضي</span>
                        </div>
                      )
                    }
                  })()}
                </div>
              </div>

              {/* Smart Trade Recommendation */}
              {(() => {
                const rec = calculateTradeRecommendation(data, livePrice?.changePercent, livePrice?.price)

                const styles = {
                  buy: {
                    container: "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50",
                    header: "text-green-800",
                    badge: "bg-green-600 text-white",
                    Icon: TrendingUp,
                    label: "شراء",
                  },
                  sell: {
                    container: "border-red-300 bg-gradient-to-br from-red-50 to-rose-50",
                    header: "text-red-800",
                    badge: "bg-red-600 text-white",
                    Icon: TrendingDown,
                    label: "بيع",
                  },
                  wait: {
                    container: "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50",
                    header: "text-amber-800",
                    badge: "bg-amber-500 text-white",
                    Icon: Minus,
                    label: "انتظار",
                  },
                }[rec.action]

                const Icon = styles.Icon

                return (
                  <div className={`mt-6 rounded-xl p-5 border-2 ${styles.container}`}>
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                      <h3 className={`font-bold text-lg flex items-center gap-2 ${styles.header}`}>
                        <Activity className="w-5 h-5" />
                        التوصية الذكية للتداول
                      </h3>
                      <Badge className={`${styles.badge} text-base px-4 py-1.5 flex items-center gap-1.5`}>
                        <Icon className="w-4 h-4" />
                        {rec.title}
                      </Badge>
                    </div>

                    <p className={`text-sm leading-relaxed mb-4 ${styles.header}`}>{rec.reason}</p>

                    {/* Price position bar inside trading range */}
                    <div className="bg-white/70 rounded-lg p-4 border border-white">
                      <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>القاع ${rec.low.toFixed(0)}</span>
                        <span className="font-medium">موقع السعر ضمن النطاق</span>
                        <span>القمة ${rec.high.toFixed(0)}</span>
                      </div>
                      <div className="relative h-3 rounded-full bg-gradient-to-r from-green-300 via-amber-300 to-red-300">
                        <div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-800 border-2 border-white shadow-md transition-all duration-500"
                          style={{ left: `${Math.max(2, Math.min(98, rec.pricePosition * 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-3 text-center">
                        <div className="flex-1">
                          <p className="text-[11px] text-gray-500">السعر الحالي</p>
                          <p className="font-bold text-gray-800">${rec.currentPrice.toFixed(2)}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] text-gray-500">فوق القاع</p>
                          <p className="font-bold text-green-700">+{rec.distanceFromLowPct.toFixed(1)}%</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] text-gray-500">تحت القمة</p>
                          <p className="font-bold text-red-700">-{rec.distanceFromHighPct.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 mt-3 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      تحليل استرشادي مبني على نطاق التداول والعوامل المؤثرة — وليس نصيحة استثمارية مضمونة.
                    </p>
                  </div>
                )
              })()}

              {/* Summary Table */}
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-4">جدول ملخص العوامل</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-right p-3 rounded-tr-lg">العامل</th>
                        <th className="text-center p-3">القيمة الحالية</th>
                        <th className="text-center p-3">التغير</th>
                        <th className="text-center p-3 rounded-tl-lg">التأثير على الذهب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-medium">مؤشر الدولار (DXY)</td>
                        <td className="p-3 text-center">{data.dollarIndex.value.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <span className={data.dollarIndex.change >= 0 ? "text-red-600" : "text-green-600"}>
                            {data.dollarIndex.change >= 0 ? "+" : ""}{data.dollarIndex.change.toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={data.dollarIndex.change < 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {data.dollarIndex.change < 0 ? "إيجابي" : "سلبي"}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-medium">سعر الفائدة الفيدرالي</td>
                        <td className="p-3 text-center">{data.interestRate.value}%</td>
                        <td className="p-3 text-center">
                          <span className="text-gray-600">مستقر</span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className="bg-amber-100 text-amber-700">محايد</Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-medium">معدل التضخم (CPI)</td>
                        <td className="p-3 text-center">{data.inflation.value}%</td>
                        <td className="p-3 text-center">
                          <span className={data.inflation.change <= 0 ? "text-green-600" : "text-red-600"}>
                            {data.inflation.change > 0 ? "+" : ""}{data.inflation.change}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={data.inflation.value > 2.5 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                            {data.inflation.value > 2.5 ? "إيجابي" : "محايد"}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-medium">عوائد السندات 10 سنوات</td>
                        <td className="p-3 text-center">{data.treasuryYield.value.toFixed(2)}%</td>
                        <td className="p-3 text-center">
                          <span className={data.treasuryYield.change <= 0 ? "text-green-600" : "text-red-600"}>
                            {data.treasuryYield.change > 0 ? "+" : ""}{data.treasuryYield.change.toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={data.treasuryYield.change < 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {data.treasuryYield.change < 0 ? "إيجابي" : "سلبي"}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-medium">تدفقات صناديق ETF</td>
                        <td className="p-3 text-center">${Math.abs(data.gldEtf.netFlow).toFixed(0)}M</td>
                        <td className="p-3 text-center">
                          <span className={data.gldEtf.netFlow >= 0 ? "text-green-600" : "text-red-600"}>
                            {data.gldEtf.netFlow >= 0 ? "تدفق داخل" : "تدفق خارج"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={data.gldEtf.netFlow > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {data.gldEtf.netFlow > 0 ? "إيجابي" : "سلبي"}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-medium">صافي مراكز COT</td>
                        <td className="p-3 text-center">{(data.cot.netPosition / 1000).toFixed(0)}K</td>
                        <td className="p-3 text-center">
                          <span className={(data.cot.netChange || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                            {(data.cot.netChange || 0) >= 0 ? "+" : ""}{((data.cot.netChange || 0) / 1000).toFixed(0)}K
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={data.cot.netPosition > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {data.cot.netPosition > 0 ? "إيجابي" : "سلبي"}
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Sources Info */}
        {data && data.dataSources && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                مصادر البيانات الحقيقية
              </h4>
              
              {/* Real-time data */}
              <div className="mb-4">
                <p className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  بيانات لحظية (كل ثانية)
                </p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <span className="block font-medium text-green-700">سعر الذهب</span>
                    <span className="text-xs text-gray-500">Yahoo Finance</span>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <span className="block font-medium text-green-700">مؤشر الدولار</span>
                    <span className="text-xs text-gray-500">Yahoo Finance</span>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <span className="block font-medium text-green-700">عوائد السندات</span>
                    <span className="text-xs text-gray-500">Yahoo Finance</span>
                  </div>
                </div>
              </div>
              
              {/* Slow-updating data */}
              <div>
                <p className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  بيانات دورية (كل 15 دقيقة)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <span className="block font-medium text-blue-700">تقرير COT</span>
                    <span className="text-xs text-gray-500">CFTC</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <span className="block font-medium text-blue-700">البنوك المركزية</span>
                    <span className="text-xs text-gray-500">World Gold Council</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <span className="block font-medium text-blue-700">حيازات GLD</span>
                    <span className="text-xs text-gray-500">SPDR Official</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <span className="block font-medium text-blue-700">الأخبار</span>
                    <span className="text-xs text-gray-500">Reuters, CNBC</span>
                  </div>
                </div>
              </div>
              
              {/* Refresh timing */}
              <div className="mt-4 p-2 bg-white/60 rounded-lg text-center">
                {data.slowDataLastFetch && (
                  <p className="text-xs text-gray-600">
                    آخر تحديث للبيانات الدورية: <span className="font-medium">{data.slowDataLastFetch}</span>
                  </p>
                )}
                {data.nextSlowDataRefresh && (
                  <p className="text-xs text-blue-600">
                    التحديث القادم: <span className="font-medium">{data.nextSlowDataRefresh}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
      </div>

      <AdminFooter />
    </div>
  )
}
