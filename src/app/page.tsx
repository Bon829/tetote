import "./page.css";

const services = [
  { title: "ライトドレナージュ", duration: "60分", price: "¥8,800", desc: "初めての方にも最適。全身の軽いむくみをすっきり流します。" },
  { title: "スタンダードコース", duration: "90分", price: "¥13,200", desc: "頭部から足先まで丁寧にアプローチ。もっとも人気のコースです。" },
  { title: "プレミアムリラクゼーション", duration: "120分", price: "¥19,800", desc: "至高のアロマオイルと共に、完全なる解放と再生を体験してください。" },
];

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <h1 className="hero-title animate-slide-up">LUMINA</h1>
          <p className="hero-subtitle animate-slide-up delay-300">
            A Sanctuary for Your Body and Soul.<br />
            心身を解放する、至福のリンパドレナージュ。
          </p>
          <div className="hero-actions animate-slide-up delay-500">
            <a href="/booking" className="btn-primary">RESERVE</a>
          </div>
        </div>
      </section>

      {/* Concept Section */}
      <section className="concept-section container text-center">
        <h2 className="section-title mb-4">CONCEPT</h2>
        <h3 className="section-subtitle mb-8 text-serif">日常の喧騒から離れた、あなただけのサンクチュアリ</h3>
        <p className="concept-text text-muted mb-8">
          LUMINAでは、熟練のセラピストがお客様一人ひとりの身体の声に耳を傾け、<br />
          最適なリンパドレナージュを提供します。<br />
          滞った巡りを整え、本来の美しさと健やかさを目覚めさせる。<br />
          心地よい香りと静寂に包まれながら、極上のリラクゼーションをお約束します。
        </p>
      </section>

      {/* Services Section */}
      <section className="services-section container">
        <h2 className="section-title text-center mb-4">MENU</h2>
        <h3 className="section-subtitle text-center mb-8 text-serif">施術メニュー</h3>
        <div className="services-grid">
          {services.map((s) => (
            <div key={s.title} className="service-card glass-panel">
              <p className="service-duration">{s.duration}</p>
              <h3 className="service-name">{s.title}</h3>
              <p className="service-desc text-muted">{s.desc}</p>
              <p className="service-price">{s.price}</p>
              <a href="/booking" className="btn-outline service-btn">RESERVE</a>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section text-center">
        <h2 className="footer-brand text-serif mb-4">LUMINA</h2>
        <p className="footer-text mb-4 text-muted">
          12:00 - 21:00（火曜定休）<br />
          東京都渋谷区 1-2-3 ルミナビル 5F
        </p>
        <div className="footer-links">
          <a href="#">Instagram</a>
          <a href="#">お問い合わせ</a>
          <a href="#">プライバシーポリシー</a>
        </div>
        <p className="footer-copy">© 2025 LUMINA. All rights reserved.</p>
      </footer>
    </>
  );
}
