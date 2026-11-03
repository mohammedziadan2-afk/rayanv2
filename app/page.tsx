"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Box,
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
  Sparkles,
  Star,
  Truck,
  Users,
} from "lucide-react"
import { NewsFloatingBubbles } from "@/components/news-floating-bubbles"
import { SiteNav } from "@/components/rayan/site-nav"
import { SiteFooter } from "@/components/rayan/site-footer"
import { ShippingMap } from "@/components/rayan/shipping-map"
import { FacebookIcon, WhatsAppIcon } from "@/components/rayan/icons"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import "./rayan-design.css"
import "./home.css"

const WHATSAPP_URL = "https://wa.me/message/NBC72SUIIZ5PH1"
const FACEBOOK_URL = "https://www.facebook.com/share/g/1EFavPxvik/?mibextid=wwXIfr"

const services = [
  { icon: Package, title: "شحن الطرود", text: "نقل جميع أنواع الطرود والبضائع من فلسطين إلى الأردن بأمان تام." },
  { icon: Truck, title: "توصيل سريع", text: "خدمة التوصيل السريع لجميع المدن الأردنية خلال أيام معدودة." },
  { icon: Search, title: "تتبع الشحنات", text: "نظام تتبع متطور لمتابعة شحنتك لحظة بلحظة حتى وصولها." },
  { icon: Droplets, title: "نقل الزيت", text: "خدمة متخصصة لنقل زيت الزيتون بعناية فائقة مع ضمان الجودة." },
  { icon: ShoppingBag, title: "خدمة التجار", text: "باقات خاصة للتجار وأصحاب المتاجر مع أسعار تنافسية." },
  { icon: ShieldCheck, title: "تغليف آمن", text: "تغليف احترافي للبضائع الحساسة لضمان وصولها بحالة ممتازة." },
]

const steps = [
  { title: "سلّمنا الشحنة", text: "سلّم طردك لفرعنا أو اطلب استلامه." },
  { title: "نغلّف ونسجّل", text: "تغليف احترافي ورقم تتبع لشحنتك." },
  { title: "في الطريق", text: "تتحرك الشحنة وتتابعها لحظة بلحظة." },
  { title: "تصل بأمان", text: "تُسلَّم للمستلم في وجهتها بأمان." },
]

const reasons = [
  { icon: CircleDollarSign, title: "أسعار منافسة", text: "نقدم أفضل الأسعار في السوق مع الحفاظ على جودة الخدمة العالية." },
  { icon: Clock, title: "سرعة التوصيل", text: "التزام بمواعيد التسليم المحددة مع إمكانية التوصيل السريع." },
  { icon: ShieldCheck, title: "أمان الشحنات", text: "ضمان سلامة شحنتك من لحظة الاستلام حتى التسليم النهائي." },
  { icon: Headset, title: "دعم فني متواصل", text: "فريق خدمة عملاء متاح للرد على استفساراتكم في أي وقت." },
  { icon: MapPin, title: "تغطية واسعة", text: "نصل إلى جميع المدن والمناطق في الأردن بدون استثناء." },
  { icon: Star, title: "خبرة طويلة", text: "سنوات من الخبرة في مجال الشحن الدولي والتوصيل المحلي." },
]

const photos = [
  { src: "store", cap: "فرعنا في عمّان" },
  { src: "van", cap: "أسطول التوصيل" },
  { src: "trucks", cap: "الشحن البري" },
  { src: "bags", cap: "حقائب المسافرين" },
]

export default function LandingPage() {
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)
  const [selectedPhone, setSelectedPhone] = useState<{ number: string; whatsapp: string } | null>(null)

  const handlePhoneClick = (number: string, whatsapp: string) => {
    setSelectedPhone({ number, whatsapp })
    setIsPhoneDialogOpen(true)
  }

  return (
    <div className="rn h-page">
      <SiteNav active="home" />

      <main>
        {/* الشعار ثم نص المؤسسة ثم الأزرار الأربعة الرئيسية */}
        <section className="h-hero">
          <div className="h-in">
            <div className="h-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.jpg" alt="شعار الريان" />
            </div>
            <h1>
              <span>مؤسسة الريان واريان</span>
              <span className="gold">للشحن والتوصيل</span>
            </h1>
            <p className="h-lead">خدمة توصيل الطرود والشحنات من فلسطين إلى الأردن بأسعار منافسة وسرعة عالية</p>
            <p className="h-lead2">نوفر خدمات شحن موثوقة وآمنة لجميع المدن الأردنية مع تتبع مباشر للشحنات</p>

            <div className="h-acts">
              <Link href="/track-shipment" className="h-act h-pri">
                <div className="h-ic"><Search className="i" /></div>
                <div>
                  <b>تتبع شحنتك</b>
                  <small>أدخل رقم الشحنة واعرف أين وصلت</small>
                </div>
                <ArrowLeft className="i h-go" />
              </Link>
              <Link href="/subscriber-login" className="h-act">
                <div className="h-ic"><Users className="i" /></div>
                <div>
                  <b>مشتركين</b>
                  <small>سجّل الدخول وتابع طلباتك وشحناتك</small>
                </div>
                <ArrowLeft className="i h-go" />
              </Link>
              <Link href="/request-shipping" className="h-act">
                <div className="h-ic"><Box className="i" /></div>
                <div>
                  <b>طلب شحن</b>
                  <small>اطلب نقل شحنتك بخطوات بسيطة</small>
                </div>
                <ArrowLeft className="i h-go" />
              </Link>
              <div className="h-news">
                <NewsFloatingBubbles
                  triggerClassName="h-act"
                  triggerContent={
                    <>
                      <div className="h-ic"><Sparkles className="i" /></div>
                      <div>
                        <b>أخبار الجسر</b>
                        <small>آخر الأخبار والتحديثات المهمة</small>
                      </div>
                      <ArrowLeft className="i h-go" />
                    </>
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* الخريطة التفاعلية */}
        <section className="h-mapsec">
          <div className="h-in">
            <ShippingMap />
          </div>
        </section>

        {/* الخدمات */}
        <section className="h-sec" id="services">
          <div className="h-in">
            <div className="h-sec-h">
              <div>
                <span className="h-eyebrow">خدماتنا</span>
                <h2>خدمات شحن متكاملة للأفراد والتجّار</h2>
              </div>
              <p>من الطرد الصغير إلى البضائع التجارية، نتولى الأمر من الاستلام حتى التسليم.</p>
            </div>
            <div className="h-grid3">
              {services.map((s) => (
                <div key={s.title} className="h-svc">
                  <div className="h-ic"><s.icon className="i" /></div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* كيف نعمل */}
        <section className="h-sec h-band">
          <div className="h-in">
            <div className="h-sec-h">
              <div>
                <span className="h-eyebrow">كيف نعمل</span>
                <h2>من يدك إلى يد المستلم في أربع خطوات</h2>
              </div>
            </div>
            <div className="h-steps">
              {steps.map((s, i) => (
                <div key={s.title} className="h-step">
                  <div className="h-num">{i + 1}</div>
                  <h4>{s.title}</h4>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* لماذا نحن */}
        <section className="h-sec" id="why">
          <div className="h-in h-why">
            <div className="h-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/home/store.jpg" alt="فرع المؤسسة في عمّان" loading="lazy" />
              <div className="h-badge">
                خبرة طويلة
                <small>في الشحن الدولي والتوصيل المحلي</small>
              </div>
            </div>
            <div className="txt">
              <span className="h-eyebrow">لماذا الريان واريان</span>
              <h2>مميزات تجعلنا الخيار الأول لعملائنا</h2>
              <div className="h-pts">
                {reasons.map((r) => (
                  <div key={r.title} className="h-pt">
                    <div className="h-ic"><r.icon className="i" /></div>
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

        {/* من أعمالنا */}
        <section className="h-sec h-band">
          <div className="h-in">
            <div className="h-sec-h">
              <div>
                <span className="h-eyebrow">من أعمالنا</span>
                <h2>من داخل مؤسستنا</h2>
              </div>
            </div>
            <div className="h-photos">
              {photos.map((p) => (
                <figure key={p.src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/home/${p.src}.jpg`} alt={p.cap} loading="lazy" />
                  <figcaption>{p.cap}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* بوابة العملاء */}
        <section className="h-sec" id="portal">
          <div className="h-in">
            <div className="h-cta">
              <div>
                <h2>بوابة العملاء: تتبع شحناتك واطلب خدماتك بسهولة</h2>
                <p>سجّل الدخول وتابع كل شيء في مكان واحد.</p>
              </div>
              <Link className="btn btn-gold" href="/customers">
                الدخول إلى البوابة <ArrowLeft className="i" />
              </Link>
            </div>
          </div>
        </section>

        {/* تواصل معنا */}
        <section className="h-sec h-pt0" id="contact">
          <div className="h-in">
            <div className="h-sec-h">
              <div>
                <span className="h-eyebrow">تواصل معنا</span>
                <h2>نحن هنا لخدمتك في أي وقت</h2>
              </div>
            </div>
            <div className="h-contact">
              <div className="h-cc">
                <div className="h-ic"><Phone className="i" /></div>
                <small>الهاتف / واتساب</small>
                <button type="button" className="ltr" onClick={() => handlePhoneClick("+962791083443", WHATSAPP_URL)}>
                  +962 79 108 3443
                </button>
                <button type="button" className="ltr" onClick={() => handlePhoneClick("+972599344783", WHATSAPP_URL)}>
                  +972 59 934 4783
                </button>
              </div>
              <div className="h-cc">
                <div className="h-ic"><Mail className="i" /></div>
                <small>البريد الإلكتروني</small>
                <b>
                  <a className="ltr" href="mailto:mz.zm@hotmail.com">mz.zm@hotmail.com</a>
                </b>
              </div>
              <div className="h-cc">
                <div className="h-ic"><MapPin className="i" /></div>
                <small>العنوان</small>
                <b>
                  عمان، الأردن
                  <br />
                  الياسمين، بالقرب من حديقة الشورى
                </b>
              </div>
              <div className="h-cc">
                <div className="h-ic"><FacebookIcon className="i" /></div>
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
