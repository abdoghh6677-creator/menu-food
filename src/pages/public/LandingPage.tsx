import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  QrCode, Smartphone, BarChart3, Zap, Globe,
  ChevronLeft, Star, CheckCircle, Menu, X,
  Utensils, Bell
} from "lucide-react";

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    { icon: QrCode, title: "منيو QR ذكي", desc: "عملاؤك يمسحون QR ويطلبون مباشرة بدون تطبيق" },
    { icon: Bell, title: "إشعارات فورية", desc: "استقبل إشعار صوتي فور وصول أي طلب جديد" },
    { icon: BarChart3, title: "تقارير تفصيلية", desc: "تابع مبيعاتك وأداء مطعمك لحظة بلحظة" },
    { icon: Zap, title: "تحديث فوري", desc: "عدّل المنيو وسعر أي صنف ويظهر للعملاء فوراً" },
    { icon: Smartphone, title: "يعمل كتطبيق", desc: "العميل يثبّت المنيو على هاتفه كتطبيق كامل" },
    { icon: Globe, title: "عربي وإنجليزي", desc: "المنيو متاح باللغتين — العميل يختار" },
  ];

  const plans = [
    {
      name: "تجريبي مجاني",
      price: "0",
      period: "14 يوم",
      color: "border-gray-200",
      btnClass: "bg-gray-800 text-white hover:bg-gray-700",
      features: ["حتى 50 طلب/شهر", "إدارة المنيو الأساسية", "QR ordering", "دعم بالبريد"],
    },
    {
      name: "ستارتر",
      price: "350",
      period: "شهرياً",
      color: "border-accent ring-2 ring-accent",
      badge: "الأكثر شيوعاً",
      btnClass: "bg-accent text-white hover:bg-accent/90",
      features: ["طلبات غير محدودة", "إدارة منيو كاملة", "تقارير مبيعات", "إشعارات فورية", "دعم واتساب"],
    },
    {
      name: "برو",
      price: "2500",
      period: "سنويا",
      color: "border-gray-200",
      btnClass: "bg-gray-800 text-white hover:bg-gray-700",
      features: ["كل مميزات ستارتر", "فروع متعددة", "تحليلات متقدمة", "تخصيص الألوان", "دعم أولوية"],
    },
  ];

  const steps = [
    { n: "01", title: "سجّل مطعمك", desc: "أرسل طلب التسجيل وسيراجعه فريقنا خلال 24 ساعة" },
    { n: "02", title: "أضف المنيو", desc: "أضف أصنافك بالصور والأسعار بسهولة تامة" },
    { n: "03", title: "اطبع QR Code", desc: "نزّل QR Code الخاص بك وضعه على طاولاتك" },
    { n: "04", title: "استقبل الطلبات", desc: "العملاء يطلبون وأنت تستقبل كل شيء فورياً" },
  ];

  const testimonials = [
    { name: "أحمد محمود", role: "صاحب مطعم الأصيل", text: "من أول يوم وأنا مبسوط. العملاء بيطلبوا بسهولة والطلبات بتوصلني فوراً على الموبايل.", stars: 5 },
    { name: "سارة علي", role: "مديرة كافيه مودرن", text: "وفّرنا وقت كتير على الطلبات اليدوية. التطبيق بسيط وكل حاجة واضحة.", stars: 5 },
    { name: "محمد كريم", role: "صاحب مطعم فاست فود", text: "التقارير بتساعدني أعرف أكثر الأصناف طلباً وأتحكم في المخزون بشكل أحسن.", stars: 5 },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* ===== Navbar ===== */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FoodOrder</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-accent transition-colors text-sm font-medium">المميزات</a>
              <a href="#how" className="text-gray-600 hover:text-accent transition-colors text-sm font-medium">كيف يعمل؟</a>
              <a href="#pricing" className="text-gray-600 hover:text-accent transition-colors text-sm font-medium">الأسعار</a>
              <Link to="/login" className="text-gray-600 hover:text-accent transition-colors text-sm font-medium">تسجيل الدخول</Link>
              <Link to="/register" className="bg-accent text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors">ابدأ مجاناً</Link>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-4 space-y-3">
              {["المميزات:#features", "كيف يعمل؟:#how", "الأسعار:#pricing"].map((item) => {
                const [label, href] = item.split(":");
                return <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="block text-gray-600 py-1 font-medium">{label}</a>;
              })}
              <div className="flex gap-3 pt-2">
                <Link to="/login" className="flex-1 text-center border border-gray-200 py-2 rounded-xl text-sm font-medium">دخول</Link>
                <Link to="/register" className="flex-1 text-center bg-accent text-white py-2 rounded-xl text-sm font-bold">ابدأ مجاناً</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-orange-50 via-white to-amber-50 pt-16 pb-24">
        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-100/50 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-semibold mb-8">
            <Zap className="w-4 h-4" />
            الحل الرقمي الأمثل لمطعمك في مصر
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            منيو رقمي ذكي
            <br />
            <span className="text-accent">لمطعمك في دقائق</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            دع عملاءك يطلبون بمسح QR Code بسيط — بدون تطبيق، بدون تعقيد.
            استقبل الطلبات فوراً وإدارة مطعمك من مكان واحد.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/register"
              className="flex items-center gap-2 bg-accent text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-0.5">
              ابدأ تجربتك المجانية
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <Link to="/login"
              className="flex items-center gap-2 border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl text-lg font-semibold hover:border-accent hover:text-accent transition-all">
              تسجيل الدخول
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 text-center">
            {[
              { n: "500+", label: "مطعم يثق بنا" },
              { n: "50K+", label: "طلب يومياً" },
              { n: "99.9%", label: "وقت التشغيل" },
              { n: "4.9/5", label: "تقييم العملاء" },
            ].map((s) => (
              <div key={s.n}>
                <div className="text-3xl font-extrabold text-accent">{s.n}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">المميزات</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-4">كل ما يحتاجه مطعمك</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">منصة متكاملة تغطي كل احتياجات مطعمك الرقمية</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-gray-100 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all bg-white">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all">
                  <f.icon className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">الخطوات</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-4">كيف تبدأ؟</h2>
            <p className="text-gray-500 text-lg">في 4 خطوات بسيطة مطعمك يكون أونلاين</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-8 right-[12.5%] left-[12.5%] h-0.5 bg-gradient-to-l from-accent/10 via-accent/40 to-accent/10" />
            {steps.map((s, i) => (
              <div key={i} className="text-center relative">
                <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/30 text-white text-xl font-extrabold">{s.n}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">الأسعار</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-4">اختر الباقة المناسبة</h2>
            <p className="text-gray-500 text-lg">جرّب مجاناً 14 يوم — بدون بطاقة ائتمان</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((p, i) => (
              <div key={i} className={`relative rounded-2xl border-2 p-8 ${p.color} bg-white`}>
                {p.badge && (
                  <div className="absolute -top-3 right-6 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">{p.badge}</div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{p.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">{p.price}</span>
                    <span className="text-gray-500">ج.م / {p.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`block text-center py-3 rounded-xl font-bold transition-all ${p.btnClass}`}>
                  ابدأ الآن
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">آراء العملاء</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">ماذا يقول أصحاب المطاعم؟</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {Array(t.stars).fill(0).map((_, si) => (
                    <Star key={si} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 bg-accent">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">جاهز تحوّل مطعمك للرقمي؟</h2>
          <p className="text-white/80 text-lg mb-10">انضم لمئات المطاعم اللي بتستخدم FoodOrder يومياً</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"
              className="flex items-center justify-center gap-2 bg-white text-accent px-8 py-4 rounded-2xl text-lg font-bold hover:bg-gray-50 transition-all shadow-xl">
              سجّل مطعمك مجاناً
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <Link to="/login"
              className="flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-white/10 transition-all">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Utensils className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">FoodOrder</span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#features" className="hover:text-white transition-colors">المميزات</a>
              <a href="#pricing" className="hover:text-white transition-colors">الأسعار</a>
              <Link to="/login" className="hover:text-white transition-colors">تسجيل الدخول</Link>
              <Link to="/register" className="hover:text-white transition-colors">سجّل مطعمك</Link>
            </div>
            <p className="text-sm">© 2026 FoodOrder — جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
