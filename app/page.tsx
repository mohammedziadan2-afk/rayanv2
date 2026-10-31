"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Box,
  Check,
  CircleDollarSign,
  Clock,
  Droplets,
  Headset,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Users,
} from "lucide-react"
import { NewsFloatingBubbles } from "@/components/news-floating-bubbles"
import { SiteNav } from "@/components/rayan/site-nav"
import { SiteFooter } from "@/components/rayan/site-footer"
import { FacebookIcon, WhatsAppIcon } from "@/components/rayan/icons"
import { useReveal } from "@/components/rayan/use-reveal"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import "./rayan-design.css"

const WHATSAPP_URL = "https://wa.me/message/NBC72SUIIZ5PH1"
const FACEBOOK_URL = "https://www.facebook.com/share/g/1EFavPxvik/?mibextid=wwXIfr"

// مدن أردنية وفلسطينية بالتناوب لتوضيح الشحن في الاتجاهين
const cities = [
  "عمّان", "القدس", "إربد", "رام الله", "الزرقاء", "نابلس", "العقبة", "الخليل", "السلط", "بيت لحم",
  "مادبا", "جنين", "جرش", "طولكرم", "الكرك", "قلقيلية", "عجلون", "أريحا", "المفرق", "سلفيت", "معان", "طوباس", "الطفيلة",
]

const reasons = [
  { icon: CircleDollarSign, title: "أسعار منافسة", text: "نقدم أفضل الأسعار في السوق مع الحفاظ على جودة الخدمة العالية" },
  { icon: Clock, title: "سرعة التوصيل", text: "التزام تام بمواعيد التسليم المحددة مع إمكانية التوصيل السريع" },
  { icon: ShieldCheck, title: "أمان الشحنات", text: "ضمان سلامة شحنتك من لحظة الاستلام حتى التسليم النهائي" },
  { icon: Headset, title: "دعم فني متواصل", text: "فريق خدمة عملاء متاح للرد على استفساراتكم في أي وقت" },
  { icon: Star, title: "خبرة طويلة", text: "سنوات من الخبرة في مجال الشحن الدولي والتوصيل المحلي" },
  { icon: MapPin, title: "تغطية واسعة", text: "نصل إلى جميع المدن والمناطق في الأردن بدون استثناء" },
]

export default function LandingPage() {
  const router = useRouter()
  const [trackingNumber, setTrackingNumber] = useState("")
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)
  const [selectedPhone, setSelectedPhone] = useState<{ number: string; whatsapp: string } | null>(null)

  useReveal()

  const handlePhoneClick = (number: string, whatsapp: string) => {
    setSelectedPhone({ number, whatsapp })
    setIsPhoneDialogOpen(true)
  }

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    const value = trackingNumber.trim()
    router.push(value ? `/track-shipment?n=${encodeURIComponent(value)}` : "/track-shipment")
  }

  return (
    <div className="rn">
      <SiteNav active="home" />

      <main>
        {/* ===== الواجهة ===== */}
        <section className="hero" style={{ paddingTop: 130 }}>
          <div className="bgimg" />
          <i className="blob a" />
          <i className="blob b" />
          <div className="wrap">
            <div>
              <span className="tag">
                <i className="live" />
                خدمة شحن بين الأردن وفلسطين
              </span>
              <h1 className="big">
                شحن بين الأردن
                <br />
                وفلسطين
                <br />
                <span className="gold">أسرع وأأمن</span>
              </h1>
              <p className="lead">
                ذهابًا وإيابًا: نشحن طرودك وبضائعك من فلسطين إلى الأردن، ومن الأردن إلى فلسطين، بأسعار منافسة وتغليف
                احترافي وتتبع مباشر لحظة بلحظة.
              </p>

              <form className="cmd" onSubmit={handleTrack}>
                <div className="f">
                  <Box className="i" />
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="أدخل رقم الشحنة لتتبعها…"
                    aria-label="رقم الشحنة"
                  />
                </div>
                <button className="btn btn-gold" type="submit">
                  تتبع الآن <ArrowLeft className="i" />
                </button>
              </form>

              <div className="acts">
                <Link href="/subscriber-login">
                  <Users className="i" />
                  أصحاب الطلبات
                </Link>
                <Link href="/request-shipping">
                  <Package className="i" />
                  لنقل شحنة
                </Link>
                <span className="news-slot">
                  <NewsFloatingBubbles triggerClassName="news-btn" />
                </span>
              </div>

              <div className="proof">
                <div>
                  <ShieldCheck className="i" />
                  شحن آمن
                </div>
                <div>
                  <Clock className="i" />
                  توصيل سريع
                </div>
                <div>
                  <MapPin className="i" />
                  تغطية كل المدن
                </div>
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <div className="glass live-card">
                <div className="lc-head">
                  <div>
                    <small>مسار شحنتك</small>
                    <b>من الاستلام إلى التسليم</b>
                  </div>
                  <span className="lc-ex">مثال توضيحي</span>
                </div>
                <div className="map">
                  <svg viewBox="0 0 600 330" aria-label="مسار الشحنة">
                    <defs>
                      <linearGradient id="rn-gr" x1="0" x2="1">
                        <stop offset="0" stopColor="#3BD3EA" />
                        <stop offset="1" stopColor="#3EE08F" />
                      </linearGradient>
                    </defs>
                    <path id="rn-rp" className="rt-bg" d="M70 240 C170 90 300 320 530 100" />
                    <path
                      className="rt-fg"
                      pathLength={100}
                      d="M70 240 C170 90 300 320 530 100"
                      style={{ stroke: "url(#rn-gr)", strokeDashoffset: 100, animation: "rn-draw 6s cubic-bezier(.45,0,.2,1) infinite alternate" }}
                    />
                    <g>
                      <circle className="ring" cx="70" cy="240" r="10" />
                      <circle className="node on" cx="70" cy="240" r="9" />
                      <text className="maplbl" x="70" y="282">الاستلام</text>
                    </g>
                    <g>
                      <circle className="node on" cx="251" cy="212" r="8" />
                      <text className="maplbl s" x="251" y="244">المعبر</text>
                    </g>
                    <g>
                      <circle className="ring" cx="530" cy="100" r="10" style={{ animationDelay: "-1.2s" }} />
                      <circle className="node" cx="530" cy="100" r="9" />
                      <text className="maplbl" x="530" y="142">الوجهة</text>
                    </g>
                    <g className="truckg">
                      <circle r="19" fill="#0a1626" stroke="#E3B95A" strokeWidth="2.5" />
                      <Truck x={-10} y={-10} width={20} height={20} color="#F7DFA2" strokeWidth={2} />
                      <animateMotion
                        dur="6s"
                        repeatCount="indefinite"
                        keyPoints="0;.66;0"
                        keyTimes="0;.5;1"
                        calcMode="spline"
                        keySplines=".45 0 .2 1;.45 0 .2 1"
                      >
                        <mpath href="#rn-rp" />
                      </animateMotion>
                    </g>
                  </svg>
                </div>
                <div className="lc-foot">
                  <div>
                    <small>المرحلة 1</small>
                    <b>استلام الشحنة</b>
                  </div>
                  <div>
                    <small>المرحلة 3</small>
                    <b>قيد التصدير</b>
                  </div>
                  <div>
                    <small>المرحلة 5</small>
                    <b>تم التسليم</b>
                  </div>
                </div>
              </div>
              <div className="fl x">
                <ShieldCheck className="i" />
                <div>
                  <b>شحن آمن</b>
                  <small>من الاستلام حتى التسليم</small>
                </div>
              </div>
              <div className="fl y">
                <Check className="i" />
                <div>
                  <b>تتبع مباشر</b>
                  <small>لحظة بلحظة</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mq" aria-hidden="true">
          <div className="tr">
            {[0, 1].map((n) => (
              <div key={n} style={{ display: "flex" }}>
                {cities.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ===== الخدمات ===== */}
        <section id="services">
          <div className="wrap">
            <div className="sh rv">
              <span className="tag">خدماتنا</span>
              <h2>
                كل ما تحتاجه <span className="gold">لشحن بلا قلق</span>
              </h2>
              <p>نقدم مجموعة متكاملة من خدمات الشحن والتوصيل للأفراد والتجّار.</p>
            </div>
            <div className="bento">
              <div className="bx big rv">
                <div className="ph" />
                <div className="in">
                  <div className="ic"><Package className="i" /></div>
                  <h3>شحن الطرود</h3>
                  <p>نقل جميع أنواع الطرود والبضائع بين فلسطين والأردن، ذهابًا وإيابًا، بأمان تام.</p>
                  <Link className="arrow" href="/request-shipping">
                    اطلب نقل شحنة <ArrowLeft className="i" />
                  </Link>
                </div>
              </div>
              <div className="bx m rv d1">
                <div className="ic"><Truck className="i" /></div>
                <h3>توصيل سريع</h3>
                <p>خدمة التوصيل السريع لجميع المدن الأردنية خلال أيام معدودة.</p>
              </div>
              <div className="bx m rv d2">
                <div className="ic"><Search className="i" /></div>
                <h3>تتبع الشحنات</h3>
                <p>نظام تتبع متطور لمتابعة شحنتك لحظة بلحظة حتى وصولها.</p>
                <Link className="arrow" href="/track-shipment">
                  جرّب التتبع <ArrowLeft className="i" />
                </Link>
              </div>
              <div className="bx s rv">
                <div className="ic"><Droplets className="i" /></div>
                <h3>نقل الزيت</h3>
                <p>خدمة متخصصة لنقل زيت الزيتون بعناية فائقة مع ضمان الجودة.</p>
              </div>
              <div className="bx s rv d1">
                <div className="ic"><ShoppingBag className="i" /></div>
                <h3>خدمة التجار</h3>
                <p>باقات خاصة للتجار وأصحاب المتاجر مع أسعار تنافسية.</p>
              </div>
              <div className="bx s rv d2">
                <div className="ic"><ShieldCheck className="i" /></div>
                <h3>تغليف آمن</h3>
                <p>تغليف احترافي للبضائع الحساسة لضمان وصولها بحالة ممتازة.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== كيف نعمل ===== */}
        <section>
          <div className="wrap">
            <div className="sh rv">
              <span className="tag">كيف نعمل</span>
              <h2>
                من يدك إلى يد المستلم <span className="gold">في 4 خطوات</span>
              </h2>
            </div>
            <div className="steps">
              {[
                { icon: Box, title: "سلّمنا الشحنة", text: "سلّم طردك لفرعنا أو اطلب استلامه." },
                { icon: ShieldCheck, title: "نغلّف ونسجّل", text: "تغليف احترافي ورقم تتبع لشحنتك." },
                { icon: Truck, title: "في الطريق", text: "تتحرك الشحنة وتتابعها لحظة بلحظة." },
                { icon: Check, title: "تصل بأمان", text: "تُسلَّم للمستلم في وجهتها بأمان." },
              ].map((s, i) => (
                <div key={s.title} className={`st rv${i ? ` d${i}` : ""}`}>
                  <div className="ic"><s.icon className="i" /></div>
                  <h4>{s.title}</h4>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== لماذا نحن ===== */}
        <section id="why">
          <div className="wrap why">
            <div className="collage rv">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="c1" src="/images/home/store.jpg" alt="فرع المؤسسة" loading="lazy" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="c2" src="/images/home/bags.jpg" alt="حقائب جاهزة للشحن" loading="lazy" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="c3" src="/images/home/handoff.jpg" alt="تسليم طرد" loading="lazy" />
              <div className="badge">
                خبرة طويلة
                <small>في الشحن الدولي والتوصيل المحلي</small>
              </div>
            </div>
            <div>
              <div className="rv">
                <span className="tag">لماذا الريان واريان؟</span>
                <h2 style={{ fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.2, fontWeight: 900, margin: "16px 0 0" }}>
                  مميزات تجعلنا <span className="gold">الخيار الأول</span> لعملائنا
                </h2>
              </div>
              <div className="checks">
                {reasons.map((r, i) => (
                  <div key={r.title} className={`ck rv${i % 4 ? ` d${i % 4}` : ""}`}>
                    <r.icon className="i" />
                    <div>
                      <b>{r.title}</b>
                      <span>{r.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== معرض الصور ===== */}
        <section>
          <div className="wrap">
            <div className="sh rv" style={{ marginBottom: 30 }}>
              <span className="tag">من أعمالنا</span>
              <h2>
                من داخل <span className="gold">مؤسستنا</span>
              </h2>
            </div>
          </div>
          <div className="gal rv">
            {[
              { src: "store", cap: "فرعنا في عمّان" },
              { src: "van", cap: "أسطول التوصيل" },
              { src: "trucks", cap: "الشحن البري" },
              { src: "bags", cap: "حقائب المسافرين" },
              { src: "courier", cap: "توصيل حتى باب المستلم" },
              { src: "map", cap: "الأردن وفلسطين" },
            ].map((g) => (
              <figure key={g.src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/home/${g.src}.jpg`} alt={g.cap} loading="lazy" />
                <figcaption>{g.cap}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ===== بوابة العملاء ===== */}
        <section>
          <div className="wrap">
            <div className="cta rv">
              <div>
                <h3>
                  <span className="gold">بوابة العملاء:</span> تتبع شحناتك واطلب خدماتك بسهولة
                </h3>
                <p>سجّل الدخول إلى بوابة العملاء وتابع كل شيء في مكان واحد.</p>
              </div>
              <Link className="btn btn-gold" href="/customers">
                الدخول إلى البوابة <ArrowLeft className="i" />
              </Link>
            </div>
          </div>
        </section>

        {/* ===== تواصل معنا ===== */}
        <section id="contact">
          <div className="wrap">
            <div className="sh rv">
              <span className="tag">تواصل معنا</span>
              <h2>
                نحن هنا لخدمتك <span className="gold">في أي وقت</span>
              </h2>
            </div>
            <div className="ct">
              <div className="ctc rv">
                <div className="ic"><Phone className="i" /></div>
                <small>الهاتف / واتساب</small>
                <button className="ltr" onClick={() => handlePhoneClick("+962791083443", WHATSAPP_URL)}>
                  +962 79 108 3443
                </button>
                <button className="ltr" onClick={() => handlePhoneClick("+972599344783", WHATSAPP_URL)}>
                  +972 59 934 4783
                </button>
              </div>
              <div className="ctc rv d1">
                <div className="ic"><Mail className="i" /></div>
                <small>البريد الإلكتروني</small>
                <b>
                  <a className="ltr" href="mailto:mz.zm@hotmail.com">mz.zm@hotmail.com</a>
                </b>
              </div>
              <div className="ctc rv d2">
                <div className="ic"><MapPin className="i" /></div>
                <small>العنوان</small>
                <b>
                  عمان، الأردن
                  <br />
                  الياسمين - بالقرب من حديقة الشورى
                </b>
              </div>
              <div className="ctc rv d3">
                <div className="ic"><FacebookIcon className="i" /></div>
                <small>تابعنا وتواصل معنا على فيسبوك</small>
                <b>
                  <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">صفحتنا</a>
                </b>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <a className="wa" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="تواصل عبر واتساب">
        <WhatsAppIcon className="i" />
      </a>

      <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">اختر طريقة الاتصال</DialogTitle>
            <DialogDescription className="text-center" dir="ltr">
              {selectedPhone?.number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Button
              onClick={() => {
                window.open(selectedPhone?.whatsapp, "_blank")
                setIsPhoneDialogOpen(false)
              }}
              className="w-full h-16 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
            >
              <WhatsAppIcon className="w-6 h-6 ml-2" />
              فتح واتساب
            </Button>

            <Button
              onClick={() => {
                window.location.href = `tel:${selectedPhone?.number}`
                setIsPhoneDialogOpen(false)
              }}
              className="w-full h-16 text-lg bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-lg"
            >
              <Phone className="w-6 h-6 ml-2" />
              إجراء مكالمة هاتفية
            </Button>

            <Button onClick={() => setIsPhoneDialogOpen(false)} variant="outline" className="w-full">
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
