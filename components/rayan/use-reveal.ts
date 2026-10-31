"use client"

import { useEffect } from "react"

/** يُظهر العناصر ذات الصنف rv تدريجيًا عند دخولها الشاشة. */
export function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".rn .rv:not(.in)"))
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in")
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}
