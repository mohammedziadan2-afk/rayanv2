"use client"

import * as React from "react"


const images = [
  {
    url: "/images/0cf3b520-d7b0-4586-996c.jpeg",
    alt: "شاحنة توصيل مع صناديق شحن",
    caption: "أسطول حديث من مركبات التوصيل السريع",
  },
  {
    url: "/images/2862002f-5408-4efa-bea9.jpeg",
    alt: "موظف توصيل محترف",
    caption: "فريق محترف مدرب على أعلى المعايير",
  },
  {
    url: "/images/10b22537-e703-492a-bbbf.jpeg",
    alt: "تسليم الشحنات للعملاء",
    caption: "خدمة توصيل من الباب إلى الباب",
  },
  {
    url: "/images/d2c79896-42a5-4885-bfe8.jpeg",
    alt: "الشحن الدولي والجوي",
    caption: "شحن دولي إلى جميع أنحاء العالم",
  },
  {
    url: "/images/0fa671c8-b9b1-4172-9e72.jpeg",
    alt: "شعار الريان للخدمات اللوجستية",
    caption: "الريان للخدمات اللوجستية وحلول الشحن",
  },
  {
    url: "/images/d3c9c516-88cc-4340-a2dd.jpeg",
    alt: "حقائب سفر وشحنات",
    caption: "شحن آمن للأمتعة والبضائع الشخصية",
  },
  {
    url: "/images/ae156fe8-c59a-417c-8225.jpeg",
    alt: "مستودع الشحنات",
    caption: "مستودعات حديثة ومجهزة بأحدث التقنيات",
  },
  {
    url: "/images/2dfbe5d1-b19b-4c9b-8285.jpeg",
    alt: "مكتب الريان للشحن",
    caption: "مكاتب خدمة العملاء في موقع مركزي",
  },
  {
    url: "/images/38821bd9-9833-4a6b-94ee.jpeg",
    alt: "صناديق شحن متعددة",
    caption: "تخزين آمن ومنظم لجميع الشحنات",
  },
  {
    url: "/images/a3210aab-8b7a-43f2-ba7f.jpeg",
    alt: "حقائب سفر جاهزة للشحن",
    caption: "خدمات شحن متنوعة تناسب جميع احتياجاتك",
  },
]

export function ServicesSlider() {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isVisible, setIsVisible] = React.useState(false)
  const sliderRef = React.useRef<HTMLDivElement>(null)

  // Only run slider when visible (Intersection Observer)
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    if (sliderRef.current) {
      observer.observe(sliderRef.current)
    }

    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    // Only run interval when slider is visible
    if (!isVisible) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 4000) // Increased to 4 seconds for better performance

    return () => clearInterval(interval)
  }, [isVisible])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div ref={sliderRef} className="relative w-full px-4 py-8">
      <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-muted">
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-6">
          <h3 className="text-white text-xl md:text-2xl font-bold text-center drop-shadow-lg">
            {images[currentIndex].caption}
          </h3>
        </div>

        <div className="relative aspect-[16/9] w-full">
          {images.map((image, index) => (
            <img
              key={index}
              src={image.url || "/placeholder.svg"}
              alt={image.alt}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 gpu-accelerated ${
                index === currentIndex ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={index === 0 ? "high" : "low"}
            />
          ))}
        </div>
      </div>



      <div className="flex justify-center gap-3 mt-6">
        {images.map((_, index) => (
          <button
            key={index}
            className={`h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? "w-10 bg-sky-600" : "w-3 bg-sky-300 hover:bg-sky-400"
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`الذهاب إلى الصورة ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
