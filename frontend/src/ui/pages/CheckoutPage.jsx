import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { api, formatAxiosError, unwrapApiData } from '../../utils/apiClient'
import { useAuth } from '../../state/auth/AuthContext.jsx'
import { useCart } from '../../state/cart/CartContext.jsx'

export default function CheckoutPage() {
  const auth = useAuth()
  const cart = useCart()

  const [shippingAddress, setShippingAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  const total = cart.total

  const itemsPayload = useMemo(() => {
    return cart.items.map((it) => ({
      productId: Number(it.product.id),
      quantity: Number(it.quantity)
    }))
  }, [cart.items])

  async function placeOrder() {
    setError('')
    setOrder(null)

    if (cart.items.length === 0) {
      setError('Coșul este gol.')
      return
    }
    if (!auth.isAuthed) {
      setError('Te rugăm să te loghezi înainte de a plasa comanda.')
      return
    }
    if (shippingAddress.trim().length < 5) {
      setError('Te rugăm să completezi adresa de livrare.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post(
        '/users/checkout',
        {
          items: itemsPayload,
          shippingAddress: shippingAddress.trim(),
          paymentMethod
        },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      const data = unwrapApiData(res)
      setOrder(data?.order || null)
      cart.clear()
    } catch (e) {
      setError(e?.response?.data?.message || formatAxiosError(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="pageTitle">Checkout</h1>

      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Rezumat</div>
            <div className="muted">Produse: {cart.count}</div>
          </div>
          <div className="price">{total.toFixed(2)} MDL</div>
        </div>

        {cart.items.length === 0 ? (
          <div className="muted" style={{ marginTop: 10 }}>
            Nu ai nimic în coș. Mergi la <Link to="/menu">menu</Link>.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            {cart.items.map((it) => (
              <div
                key={it.product.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderTop: '1px solid rgba(15, 23, 42, 0.10)',
                  paddingTop: 10
                }}
              >
                <div>
                  <div className="cardTitle">{it.product.name}</div>
                  <div className="muted">
                    Qty: {it.quantity} · Price: {Number(it.product.price).toFixed(2)} MDL
                  </div>
                </div>
                <div className="muted">{(Number(it.quantity) * Number(it.product.price)).toFixed(2)} MDL</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="cardTitle">Detalii livrare</div>

        {!auth.isAuthed ? (
          <div className="muted" style={{ marginTop: 10 }}>
            Pentru a plasa comanda, te rugăm să te <Link to="/account">loghezi</Link>.
          </div>
        ) : null}

        <div className="form" style={{ marginTop: 10 }}>
          <div className="field">
            <label>Adresa</label>
            <textarea
              className="input"
              rows={3}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Strada, număr, apartament, etc."
            />
          </div>

          <div className="field">
            <label>Metoda de plată</label>
            <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div className="btnRow">
            <Link className="btn" to="/cart">
              Înapoi la coș
            </Link>
            <button
              className="btn btnPrimary"
              disabled={loading || cart.items.length === 0}
              onClick={placeOrder}
            >
              {loading ? 'Se plasează…' : 'Dă comanda'}
            </button>
          </div>

          {error ? <div className="alert">{error}</div> : null}

          {order ? (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="cardTitle">Comandă plasată</div>
              <div className="muted" style={{ marginTop: 6 }}>
                Număr comandă: <strong>{order.orderNumber}</strong>
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                Total: {Number(order.totalAmount).toFixed(2)} MDL
              </div>
              <div className="btnRow" style={{ marginTop: 10 }}>
                <Link className="btn" to="/menu">
                  Înapoi la meniu
                </Link>
              </div>
            </div>
          ) : null}

          <div className="hint" style={{ marginTop: 10 }}>
            Notă: backend-ul cere email verificat pentru plasarea comenzii.
          </div>
        </div>
      </div>
    </div>
  )
}
