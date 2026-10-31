import Link from "next/link"

export function SiteFooter() {
  return (
    <footer>
      <div className="wrap">
        <Link className="brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.jpg" alt="" />
          <div>
            <b>مؤسسة الريان واريان</b>
            <small>للشحن والتوصيل</small>
          </div>
        </Link>
        {/* الرابط المخفي إلى صفحة الدخول محفوظ كما كان في التصميم السابق */}
        <Link href="/login" className="cursor-default">
          جميع الحقوق محفوظة © {new Date().getFullYear()} مؤسسة الريان واريان
        </Link>
      </div>
    </footer>
  )
}
