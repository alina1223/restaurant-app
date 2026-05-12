import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, unwrapApiData, getImageUrl } from '../../utils/apiClient'
import { useAuth } from '../../state/auth/AuthContext.jsx'
import { useCart } from '../../state/cart/CartContext.jsx'

const CATEGORY_FILTERS = {
  Firewall: ['brand', 'ram', 'ports', 'throughput', 'vpn', 'rackmount'],
  Router: ['brand', 'wifiStandard', 'ram', 'ports', 'vpnSupport'],
  Camera: ['brand', 'resolution', 'connectivity', 'weatherproof'],
  NAS: ['brand', 'bays', 'ram', 'raid']
}

const FILTER_LABELS = {
  brand: 'Brand',
  ram: 'RAM',
  ports: 'Ports',
  throughput: 'Throughput',
  vpn: 'VPN',
  rackmount: 'Rackmount',
  wifiStandard: 'Wi-Fi Standard',
  vpnSupport: 'VPN Support',
  resolution: 'Resolution',
  connectivity: 'Connectivity',
  weatherproof: 'Weatherproof',
  bays: 'Bays',
  raid: 'RAID'
}

function formatPrice(value) {
  const n = Number(value)
  if (Number.isFinite(n)) return `${n.toFixed(2)} MDL`
  return String(value)
}

export default function ProductPage() {
  const { id } = useParams()
  const auth = useAuth()
  const cart = useCart()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [product, setProduct] = useState(null)

  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)

  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [reviewStatus, setReviewStatus] = useState('')

  const authHeaders = useMemo(() => {
    return auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
  }, [auth.token])

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/products/details/${id}`)
        const data = unwrapApiData(res)
        if (!alive) return
        setProduct(data)
      } catch (e) {
        if (!alive) return
        setError(e?.response?.data?.message || e.message || 'Failed to load product')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [id])

  async function onAddToCart() {
    setAdding(true)
    setError('')
    try {
      if (product) cart.add(product, qty)
      if (auth.isAuthed) {
        await auth.addToCart(id, qty)
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to add to cart')
    } finally {
      setAdding(false)
    }
  }

  async function onSubmitReview() {
    if (!auth.isAuthed) {
      setReviewStatus('Login required.')
      return
    }
    setReviewStatus('')
    try {
      const res = await api.post(
        `/products/${id}/reviews`,
        { rating: Number(review.rating), comment: review.comment || undefined },
        { headers: authHeaders }
      )
      const data = unwrapApiData(res)
      setReviewStatus(data?.message || 'Review submitted.')
      setReview({ rating: 5, comment: '' })
    } catch (e) {
      setReviewStatus(e?.response?.data?.message || e.message || 'Failed to submit review')
    }
  }

  return (
    <div>
      <div className="muted" style={{ marginBottom: 10 }}>
        <Link to="/menu">← Back to menu</Link>
      </div>

      {error && <div className="alert">{error}</div>}

      {loading ? (
        <div className="card">Loading...</div>
      ) : !product ? (
        <div className="card">Product not found.</div>
      ) : (
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle" style={{ fontSize: 18 }}>
                {product.name}
              </div>
              <div className="muted">{product.category}</div>
            </div>
            <div className="price">{formatPrice(product.price)}</div>
          </div>

          {product.imagePath && (
            <div style={{ marginBottom: 15, textAlign: 'center' }}>
              {console.log('[ProductPage render] Product image:', { id: product.id, name: product.name, imagePath: product.imagePath, imageUrl: getImageUrl(product.imagePath) })}
              <img 
                src={getImageUrl(product.imagePath)} 
                alt={product.name} 
                style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 4, objectFit: 'cover' }}
              />
            </div>
          )}

          <div className="muted">{product.description}</div>
          <div style={{ background: 'rgba(11,18,32,0.45)', border: '1px solid rgba(230,240,255,0.10)', borderRadius: 12, padding: 10, marginTop: 12 }}>
            { (CATEGORY_FILTERS[product.category] || []).map((filterKey) => {
                const value = product[filterKey]
                if (value === null || value === undefined || value === '') return null

                const stringVal = String(value).toLowerCase()
                const isBoolTrue = value === true || stringVal === 'true'
                const isBoolFalse = value === false || stringVal === 'false'

                if (isBoolFalse) return null

                if (isBoolTrue) {
                  return (
                    <div key={filterKey} style={{ marginBottom: 4, color: 'rgba(230,240,255,0.82)' }}>
                      <strong style={{ color: '#bfffe0' }}>{FILTER_LABELS[filterKey]}</strong>
                    </div>
                  )
                }

                return (
                  <div key={filterKey} style={{ marginBottom: 4, color: 'rgba(230,240,255,0.82)' }}>
                    <strong style={{ color: '#bfffe0' }}>{FILTER_LABELS[filterKey]}:</strong> {String(value)}
                  </div>
                )
            })}
          </div>
          <div className="muted" style={{ marginTop: 8 }}>
            Stock: {product.stock}
          </div>

          <div className="btnRow" style={{ alignItems: 'center' }}>
            <input
              className="input"
              style={{ width: 120 }}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <button className="btn btnPrimary" disabled={adding} onClick={onAddToCart}>
              {adding ? 'Adding...' : 'Add to cart'}
            </button>
            <Link className="btn" to="/cart">
              Go to cart
            </Link>
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="cardTitle">Leave a review</div>
            <div className="muted">Requires verified email in backend.</div>
            <div className="form" style={{ marginTop: 10 }}>
              <div className="field">
                <label>Rating (1-5)</label>
                <input
                  className="input"
                  value={review.rating}
                  onChange={(e) => setReview((s) => ({ ...s, rating: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Comment (optional)</label>
                <textarea
                  className="textarea"
                  value={review.comment}
                  onChange={(e) => setReview((s) => ({ ...s, comment: e.target.value }))}
                />
              </div>
              <div className="btnRow">
                <button className="btn btnPrimary" onClick={onSubmitReview}>
                  Submit
                </button>
              </div>
              {reviewStatus && <div className={reviewStatus.toLowerCase().includes('fail') ? 'alert' : 'muted'}>{reviewStatus}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
