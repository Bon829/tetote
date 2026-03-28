import "./page.css";
import Image from "next/image";
import Link from "next/link";

const services = [
  {
    title: "しっかりケアコース",
    duration: "90分",
    price: "¥5,000",
    desc: "当店1番人気のコースです☺ 全身をしっかりケアして、むくみ・疲れをすっきり流します。",
    popular: true,
  },
  {
    title: "ベーシックコース",
    duration: "60分",
    price: "¥4,000",
    desc: "はじめての方にも安心。リンパの流れを整えて、軽やかな体に。",
    popular: false,
  },
  {
    title: "肩頭すっきりコース",
    duration: "60分",
    price: "¥3,500",
    desc: "服の着脱なしで施術できます。肩こり・頭の重さが気になる方におすすめ。",
    popular: false,
  },
];

const addons = [
  { title: "ドライヘッドマッサージ", duration: "各15分", price: "¥1,000" },
  { title: "腸トリートメント", duration: "各15分", price: "¥1,000" },
  { title: "フェイスマッサージ", duration: "各15分", price: "¥1,000", note: "ノーメイクでのご来店をお願いしています。" },
];

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-wrap">
          <Image
            src="/hero.jpg"
            alt="lymph drainage tetote"
            fill
            priority
            quality={90}
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-cta-wrap animate-slide-up delay-500">
          <Link href="/booking?menuTitle=しっかりケアコース" className="btn-primary">ご予約はこちら</Link>
        </div>
      </section>


      {/* Concept Section */}
      <section className="concept-section container text-center">
        <h2 className="section-title mb-4">CONCEPT</h2>
        <h3 className="section-subtitle mb-8 text-serif">ほっとできる場所を。</h3>
        <p className="concept-text text-muted mb-8">
          tetoteは、「手（テ）と手（テ）をつなぐ」想いを大切に、<br className="pc-br" />
          お客様一人ひとりに丁寧に向き合うリンパドレナージュサロンです。<br className="pc-br" />
          施術者の手のぬくもりで、滞った流れをやさしくほぐして。<br className="pc-br" />
          スッキリした軽さと、心地よいゆるみをお届けします。
        </p>
      </section>

      {/* Services Section */}
      <section className="services-section container">
        <h2 className="section-title text-center mb-4">MENU</h2>
        <h3 className="section-subtitle text-center mb-8 text-serif">施術メニュー</h3>
        <div className="services-grid">
          {services.map((s) => (
            <div key={s.title} className={`service-card glass-panel ${s.popular ? "popular" : ""}`}>
              {s.popular && <span className="popular-badge">人気No.1</span>}
              <p className="service-duration">{s.duration}</p>
              <h3 className="service-name">{s.title}</h3>
              <p className="service-desc text-muted">{s.desc}</p>
              <p className="service-price">{s.price}</p>
              <Link href={`/booking?menuTitle=${encodeURIComponent(s.title)}`} className="btn-outline service-btn">予約する</Link>
            </div>
          ))}
        </div>

        {/* Addons */}
        <div className="addons-section">
          <h4 className="addons-title">追加メニュー</h4>
          <div className="addons-grid">
            {addons.map((a) => (
              <div key={a.title} className="addon-card">
                <span className="addon-name">{a.title}</span>
                <span className="addon-price">{a.duration} / {a.price}</span>
                {a.note && <p className="addon-note">{a.note}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section text-center">
        <p className="footer-tagline">lymph drainage</p>
        <h2 className="footer-brand text-serif mb-4">tetote</h2>
        <p className="footer-text mb-4 text-muted">
          ご予約・お問い合わせはInstagramのDMよりお気軽にどうぞ。
        </p>
        <div className="footer-links">
          <a href="#">Instagram</a>
          <a href="#">ご予約</a>
          <a href="#">プライバシーポリシー</a>
        </div>
        <p className="footer-copy">© 2025 lymph drainage tetote. All rights reserved.</p>
      </footer>
    </>
  );
}
