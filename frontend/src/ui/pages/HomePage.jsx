import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="hero">
      <h1 className="heroTitle">Bun venit — comanda ta preferată, în câteva clickuri</h1>
      <p className="heroText">
        Descoperă meniul nostru, adaugă rapid produsele în coș și finalizează comanda cu adresa de livrare și metoda
        de plată (cash sau card). Stocul se actualizează automat după plasarea comenzii, iar tu rămâi mereu la curent
        cu disponibilitatea produselor.
      </p>

      <div className="heroBadges">
        <span className="badge">Plată cash/card</span>
        <span className="badge">Checkout simplu</span>
        <span className="badge">Stoc actualizat</span>
      </div>

      <div className="actions">
        <Link to="/menu" className="btn btnPrimary">
          Vezi meniul
        </Link>
        <Link to="/account" className="btn btnGhost">
          Contul meu
        </Link>
      </div>

      <div className="cards">
        <div className="card">
          <h3 className="cardTitle">Ingrediente proaspete</h3>
          <div className="muted">Gătite cu grijă, pentru gust și calitate în fiecare porție.</div>
        </div>
        <div className="card">
          <h3 className="cardTitle">Checkout rapid</h3>
          <div className="muted">Adaugi în coș, completezi adresa și trimiți comanda în câteva secunde.</div>
        </div>
        <div className="card">
          <h3 className="cardTitle">Securitate & verificare</h3>
          <div className="muted">Contul tău rămâne protejat, iar datele sunt gestionate în siguranță.</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardTitle">Cum funcționează</div>
        <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
          1) Intră în <Link to="/menu">Meniu</Link> și alege ce îți place.
          <br />
          2) Verifică <Link to="/cart">Coșul</Link> și apasă „Finalizează comanda”.
          <br />
          3) Completează adresa și alege plata, apoi apasă „Dă comanda”.
        </div>
      </div>
    </div>
  )
}
