import { Link } from 'react-router-dom'
import { api } from '../../utils/apiClient'
import { useAuth } from '../../state/auth/AuthContext.jsx'
import { useCart } from '../../state/cart/CartContext.jsx'
import { useState } from 'react'

function formatPrice(value) {
  const n = Number(value)
  if (Number.isFinite(n)) return n
  return 0
}

export default function CartPage() {
  const auth = useAuth()
  const cart = useCart()

  const [status, setStatus] = useState('')
  const [syncing, setSyncing] = useState(false)

  const total = cart.total

  async function syncToBackend() {
    if (!auth.isAuthed) {
      setStatus('Please login to sync cart to backend.')
      return
    }
    setSyncing(true)
    setStatus('')
    try {
      for (const item of cart.items) {
        await api.post(
          '/users/cart/add',
          { productId: Number(item.product.id), quantity: Number(item.quantity) },
          { headers: { Authorization: `Bearer ${auth.token}` } }
        )
      }
      setStatus('Synced to backend.')
    } catch (e) {
      setStatus(e?.response?.data?.message || e.message || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div>
      <h1 className="pageTitle">Cart</h1>

      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Summary</div>
            <div className="muted">Items: {cart.count}</div>
          </div>
          <div className="price">{total.toFixed(2)} MDL</div>
        </div>

        <div className="btnRow">
          {cart.items.length > 0 ? (
            <Link className="btn btnPrimary" to="/checkout">
              Finalizează comanda
            </Link>
          ) : (
            <button className="btn btnPrimary" disabled>
              Finalizează comanda
            </button>
          )}

          <button className="btn" disabled={cart.items.length === 0} onClick={cart.clear}>
            Clear cart
          </button>
          {!auth.isAuthed && (
            <Link className="btn" to="/account">
              Login
            </Link>
          )}
        </div>

        {status && <div className={status.toLowerCase().includes('fail') ? 'alert' : 'muted'}>{status}</div>}
      </div>

      {cart.items.length === 0 && (
        <div className="card">
          <div className="cardTitle">Your cart is empty</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Go to <Link to="/menu">menu</Link> and add something tasty.
          </div>
        </div>
      )}

      {cart.items.length > 0 && (
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Items</div>
              <div className="muted">Stored locally (sync optional)</div>
            </div>
            <div className="price">{total.toFixed(2)} MDL</div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
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
                <div className="btnRow" style={{ marginTop: 0 }}>
                  <Link className="btn" to={`/products/${it.product.id}`}>View</Link>
                  <button className="btn" onClick={() => cart.remove(it.product.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
