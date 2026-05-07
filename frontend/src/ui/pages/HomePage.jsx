import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="hero">
      <h1 className="heroTitle">Binevenit la Hardware Store — echipamente de calitate pentru securitate IT</h1>
      <p className="heroText">
        Descoperă catalogul nostru de echipamente hardware profesionale: firewall-uri, routere, camere de supraveghere și soluții NAS. 
        Alege produsele care îți plac, adaugă-le în coș și finalizează comanda rapid. Stocul se actualizează automat, iar tu rămâi mereu la curent cu disponibilitatea.
      </p>

      <div className="heroBadges">
        <span className="badge">Plată cash/card</span>
        <span className="badge">Checkout simplu</span>
        <span className="badge">Stoc actualizat</span>
      </div>

      <div className="actions">
        <Link to="/catalog" className="btn btnPrimary">
          Vezi catalogul
        </Link>
        <Link to="/account" className="btn btnGhost">
          Contul meu
        </Link>
      </div>

      <div className="cards">
        <div className="card">
          <h3 className="cardTitle">Echipamente profesionale</h3>
          <div className="muted">Produse de calitate de la branduri cunoscute, testate și garantate.</div>
        </div>
        <div className="card">
          <h3 className="cardTitle">Checkout rapid</h3>
          <div className="muted">Adaugi în coș, completezi adresa și trimiți comanda în câteva secunde.</div>
        </div>
        <div className="card">
          <h3 className="cardTitle">Securitate & confidențialitate</h3>
          <div className="muted">Contul tău rămâne protejat, iar datele sunt gestionate în siguranță.</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardTitle">Cum funcționează</div>
        <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
          1) Intră în <Link to="/catalog">Catalog</Link> și selectează categoria și produsele care îți plac.
          <br />
          2) Verifică <Link to="/cart">Coșul</Link> și apasă „Finalizează comanda”.
          <br />
          3) Completează adresa și alege plata, apoi apasă „Dă comanda”.
        </div>
      </div>
    </div>
  )
}
