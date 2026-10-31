"use client"

import { useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"

const links = [
  { href: "/", label: "الرئيسية", key: "home" },
  { href: "/track-shipment", label: "تتبع الشحنات", key: "tracking" },
  { href: "/#services", label: "خدماتنا", key: "services" },
  { href: "/#why", label: "لماذا نحن", key: "why" },
  { href: "/#contact", label: "تواصل معنا", key: "contact" },
]

export function SiteNav({ active }: { active: "home" | "tracking" }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="nav">
      <div className="in">
        <Link className="brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.jpg" alt="شعار الريان" />
          <div>
            <b>الريان واريان</b>
            <small>للشحن والتوصيل</small>
          </div>
        </Link>
        <nav className={`links${open ? " open" : ""}`}>
          {links.map((l) => (
            <Link key={l.key} href={l.href} className={l.key === active ? "on" : undefined} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <Link className="btn btn-ghost" href="/customers">
          بوابة العملاء
        </Link>
        <Link className="btn btn-gold" href="/track-shipment">
          <Search className="i" />
          تتبع شحنتك
        </Link>
        <button className="burger" aria-label="القائمة" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          ☰
        </button>
      </div>
    </header>
  )
}
