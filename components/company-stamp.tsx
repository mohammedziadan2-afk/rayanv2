"use client"

interface CompanyStampProps {
  date?: string
  className?: string
}

export function CompanyStamp({ date, className = "" }: CompanyStampProps) {
  const currentDate = date || new Date().toLocaleDateString("ar-IQ")

  return (
    <div className={`relative ${className}`}>
      <svg width="220" height="220" viewBox="0 0 220 220" className="w-full h-full">
        <defs>
          <linearGradient id="stampGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
        </defs>

        <circle cx="110" cy="110" r="105" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeDasharray="3,2" />

        <circle cx="110" cy="110" r="100" fill="none" stroke="#1e3a8a" strokeWidth="3" />

        {/* Decorative stars */}
        {[30, 90, 150, 210, 270, 330].map((angle) => {
          const radian = (angle * Math.PI) / 180
          const x = 110 + 94 * Math.cos(radian)
          const y = 110 + 94 * Math.sin(radian)
          return (
            <g key={angle} transform={`translate(${x},${y})`}>
              <path d="M0,-4 L1,-1 L4,0 L1,1 L0,4 L-1,1 L-4,0 L-1,-1 Z" fill="#1e3a8a" />
            </g>
          )
        })}

        <circle cx="110" cy="110" r="80" fill="none" stroke="#1e3a8a" strokeWidth="1.5" />

        <path id="topArabicCurve" d="M 40,110 A 70,70 0 0,1 180,110" fill="none" />
        <text className="text-[15px] font-bold" fill="#1e3a8a">
          <textPath href="#topArabicCurve" startOffset="50%" textAnchor="middle">
            مؤسسة الريان واريان للخدمات اللوجستية
          </textPath>
        </text>

        <path id="bottomEnglishCurve" d="M 180,110 A 70,70 0 0,1 40,110" fill="none" />
        <text className="text-[12px] font-semibold" fill="#1e3a8a">
          <textPath href="#bottomEnglishCurve" startOffset="50%" textAnchor="middle">
            ALRAYAN & ARYAN LOGSTIC SERVICE
          </textPath>
        </text>

        {/* Truck icon as logo */}
        <g transform="translate(110, 110)">
          <rect x="-20" y="-8" width="28" height="16" rx="2" fill="none" stroke="#1e3a8a" strokeWidth="2" />
          <rect x="-25" y="-5" width="5" height="10" rx="1" fill="none" stroke="#1e3a8a" strokeWidth="1.5" />
          <circle cx="-15" cy="10" r="3" fill="none" stroke="#1e3a8a" strokeWidth="1.5" />
          <circle cx="3" cy="10" r="3" fill="none" stroke="#1e3a8a" strokeWidth="1.5" />
          <path d="M 8,-8 L 15,-8 L 20,0 L 20,8 L 8,8 Z" fill="none" stroke="#1e3a8a" strokeWidth="2" />
          <line x1="15" y1="-8" x2="15" y2="0" stroke="#1e3a8a" strokeWidth="1.5" />
        </g>

        {/* Date */}
        <text x="110" y="145" textAnchor="middle" className="text-[14px] font-bold" fill="#1e3a8a">
          {currentDate}
        </text>

        {/* Phone number */}
        <text
          x="110"
          y="162"
          textAnchor="middle"
          className="text-[13px] font-bold"
          fill="#1e3a8a"
          style={{ direction: "ltr" }}
        >
          0791083443
        </text>

        {/* Decorative dots */}
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const radian = (angle * Math.PI) / 180
          const x = 110 + 73 * Math.cos(radian)
          const y = 110 + 73 * Math.sin(radian)
          return <circle key={`dot-${angle}`} cx={x} cy={y} r="1.5" fill="#1e3a8a" />
        })}
      </svg>
    </div>
  )
}
