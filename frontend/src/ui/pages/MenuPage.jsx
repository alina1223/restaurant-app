import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, unwrapApiData, getImageUrl } from '../../utils/apiClient'
import { useAuth } from '../../state/auth/AuthContext.jsx'
import { useCart } from '../../state/cart/CartContext.jsx'

const PRODUCT_CATEGORIES = ['Pizza', 'Burger', 'Salată', 'Desert', 'Băutură']

function formatPrice(value) {
  const n = Number(value)
  if (Number.isFinite(n)) return `${n.toFixed(2)} MDL`
  return String(value)
}

export default function MenuPage() {
  const auth = useAuth()
  const cart = useCart()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [products, setProducts] = useState([])

  console.log('[MenuPage] Rendered, products count:', products.length, 'products:', products)

  const [filters, setFilters] = useState({
    name: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    inStock: true
  })

  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({ name: '', price: '', stock: '', category: '', description: '', image: null, imagePreview: null })
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [addingId, setAddingId] = useState(null)

  async function loadProducts(nextFilters) {
    setLoading(true)
    setError('')
    console.log('[MenuPage] loadProducts called with filters:', nextFilters)
    try {
      const f = nextFilters || filters
      const hasAny = Boolean(
        String(f.name || '').trim() ||
          f.category ||
          String(f.minPrice || '').trim() ||
          String(f.maxPrice || '').trim() ||
          f.inStock === true
      )

      const res = hasAny
        ? await api.get('/products/search', {
            params: {
              ...(String(f.name || '').trim() ? { name: String(f.name).trim() } : {}),
              ...(f.category ? { category: f.category } : {}),
              ...(String(f.minPrice || '').trim() ? { minPrice: Number(f.minPrice) } : {}),
              ...(String(f.maxPrice || '').trim() ? { maxPrice: Number(f.maxPrice) } : {}),
              ...(f.inStock ? { inStock: true } : {})
            }
          })
        : await api.get('/products/list')

      console.log('[MenuPage] loadProducts raw response:', res)
      const data = unwrapApiData(res)
      console.log('[MenuPage] loadProducts unwrapped data:', data)
      console.log('[MenuPage] loadProducts isArray:', Array.isArray(data))
      const finalData = Array.isArray(data) ? data : []
      console.log('[MenuPage] loadProducts final products to set:', finalData)
      setProducts(finalData)
    } catch (e) {
      console.error('[MenuPage] loadProducts error:', e)
      setError(e?.response?.data?.message || e.message || 'Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!alive) return
      await loadProducts(filters)
    })()
    return () => {
      alive = false
    }
  }, [])

  async function onAddToCart(productId) {
    setAddingId(productId)
    setError('')
    try {
      const product = products.find((p) => p.id === productId)
      if (product) cart.add(product, 1)
      if (auth.isAuthed) {
        await auth.addToCart(productId, 1)
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to add to cart')
    } finally {
      setAddingId(null)
    }
  }

  function startEdit(product) {
    console.log('[MenuPage] startEdit called for product:', product.id)
    console.log('[MenuPage] auth.isAdmin:', auth.isAdmin)
    console.log('[MenuPage] Setting editingId to:', product.id)
    setEditingId(product.id)
    setEditDraft({
      name: product.name || '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? ''),
      category: product.category || '',
      description: product.description || '',
      image: null,
      imagePreview: product.imagePath || null
    })
    console.log('[MenuPage] startEdit completed')
  }

  function handleEditImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('Doar imagini sunt permise (JPG, PNG, GIF, WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Imaginea trebuie să fie mai mică de 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setEditDraft((s) => ({
        ...s,
        image: file,
        imagePreview: event.target.result
      }))
    }
    reader.readAsDataURL(file)
  }

  async function saveEdit(productId) {
    console.log('[MenuPage] saveEdit called with productId:', productId)
    console.log('[MenuPage] auth.token exists:', !!auth.token)
    
    if (!auth.token) {
      setError('Login as admin to edit products.')
      return
    }

    setSavingId(productId)
    setError('')
    try {
      const fd = new FormData()
      fd.append('name', String(editDraft.name || '').trim())
      fd.append('price', Number(editDraft.price))
      fd.append('stock', Number(editDraft.stock))
      fd.append('category', editDraft.category)
      fd.append('description', String(editDraft.description || '').trim() || '')
      if (editDraft.image) fd.append('image', editDraft.image)

      console.log('[MenuPage] Making PUT request to /products/edit/' + productId)
      const res = await api.put(`/products/edit/${productId}`, fd, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      console.log('[MenuPage] saveEdit raw response:', res)
      const data = unwrapApiData(res)
      console.log('[MenuPage] saveEdit unwrapped data:', data)
      let updated = data?.product || data?.data?.product || data
      console.log('[MenuPage] saveEdit extracted product:', updated)
      // Support Sequelize instance shape
      if (updated && updated.dataValues) updated = updated.dataValues
      const updatedProduct = updated || { id: productId }
      console.log('[MenuPage] saveEdit final updatedProduct:', updatedProduct)

      setEditingId(null)
      // Refresh full list from server to ensure we have latest imagePath and all fields
      try {
        await loadProducts(filters)
      } catch (err) {
        console.error('[MenuPage] loadProducts after edit failed:', err)
      }
    } catch (e) {
      console.error('[MenuPage] saveEdit error:', e)
      const status = e?.response?.status
      if (status === 401) {
        await auth.logout()
        setError('Sesiunea a expirat. Te rog loghează-te din nou ca admin.')
      } else {
        setError(e?.response?.data?.message || e.message || 'Failed to update product')
      }
    } finally {
      setSavingId(null)
    }
  }

  async function deleteProduct(productId) {
    if (!auth.token) {
      setError('Login as admin to delete products.')
      return
    }

    const ok = window.confirm('Sigur vrei să ștergi acest produs?')
    if (!ok) return

    setDeletingId(productId)
    setError('')
    try {
      await api.delete(`/products/delete/${productId}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      if (editingId === productId) setEditingId(null)
    } catch (e) {
      const status = e?.response?.status
      if (status === 401) {
        await auth.logout()
        setError('Sesiunea a expirat. Te rog loghează-te din nou ca admin.')
      } else {
        setError(e?.response?.data?.message || e.message || 'Failed to delete product')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <h1 className="pageTitle">Menu</h1>
      <div className="muted">Alege ce îți place. În coș: {cart.count}</div>
      {error && <div className="alert">{error}</div>}

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Filtru produse</div>
            <div className="muted">Caută după nume / categorie / preț</div>
          </div>
        </div>

        <div className="form" style={{ gridTemplateColumns: '1fr', gap: 10 }}>
          <div className="field">
            <label htmlFor="filter-name">Nume</label>
            <input id="filter-name" autoComplete="off" className="input" value={filters.name} onChange={(e) => setFilters((s) => ({ ...s, name: e.target.value }))} placeholder="ex: Margherita" />
          </div>

          <div className="field">
            <label htmlFor="filter-category">Categorie</label>
            <select id="filter-category" autoComplete="off" className="input" value={filters.category} onChange={(e) => setFilters((s) => ({ ...s, category: e.target.value }))}>
              <option value="">Toate</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="filter-minPrice">Preț minim</label>
            <input id="filter-minPrice" autoComplete="off" className="input" inputMode="decimal" value={filters.minPrice} onChange={(e) => setFilters((s) => ({ ...s, minPrice: e.target.value }))} placeholder="0" />
          </div>

          <div className="field">
            <label htmlFor="filter-maxPrice">Preț maxim</label>
            <input id="filter-maxPrice" autoComplete="off" className="input" inputMode="decimal" value={filters.maxPrice} onChange={(e) => setFilters((s) => ({ ...s, maxPrice: e.target.value }))} placeholder="200" />
          </div>

          <div className="field">
            <label htmlFor="filter-inStock" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                id="filter-inStock"
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => setFilters((s) => ({ ...s, inStock: e.target.checked }))}
              />
              Doar în stoc
            </label>
          </div>
        </div>

        <div className="btnRow">
          <button className="btn btnPrimary" disabled={loading} onClick={() => loadProducts(filters)}>
            Aplică
          </button>
          <button
            className="btn"
            disabled={loading}
            onClick={() => {
              const reset = { name: '', category: '', minPrice: '', maxPrice: '', inStock: true }
              setFilters(reset)
              loadProducts(reset)
            }}
          >
            Resetează
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ marginTop: 14 }}>
          Loading...
        </div>
      ) : (
        <div className="grid" style={{ marginTop: 14 }}>
          {products.map((p) => (
            <article key={p.id} className="card">
              <div className="cardHeader">
                <div>
                  <div className="cardTitle">{p.name}</div>
                  <div className="muted">{p.category}</div>
                </div>
                <div className="price">{formatPrice(p.price)}</div>
              </div>

              {p.imagePath && (
                <div style={{ marginBottom: 10, textAlign: 'center' }}>
                  {console.log('[MenuPage render] Product image:', { id: p.id, name: p.name, imagePath: p.imagePath, imageUrl: getImageUrl(p.imagePath) })}
                  <img 
                    src={getImageUrl(p.imagePath)}
                    alt={p.name}
                    style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: 4, objectFit: 'cover' }}
                  />
                </div>
              )}

              <div className="muted">{p.description}</div>
              <div className="muted" style={{ marginTop: 8 }}>
                Stock: {p.stock}
              </div>

              <div className="btnRow">
                <Link className="btn" to={`/products/${p.id}`}>
                  View
                </Link>
                <button
                  className="btn btnPrimary"
                  disabled={addingId === p.id}
                  onClick={() => onAddToCart(p.id)}
                >
                  {addingId === p.id ? 'Adding...' : 'Add to cart'}
                </button>

                {auth.isAdmin && (
                  <>
                    <button className="btn" onClick={() => startEdit(p)}>
                      Modifică
                    </button>
                    <button className="btn" disabled={deletingId === p.id} onClick={() => deleteProduct(p.id)}>
                      {deletingId === p.id ? 'Se șterge…' : 'Șterge'}
                    </button>
                  </>
                )}
              </div>

              {auth.isAdmin && editingId === p.id && (
                <div className="card" style={{ marginTop: 12, background: 'rgba(29, 78, 216, 0.04)' }}>
                  <div className="cardTitle">Editează produs</div>
                  <div className="form" style={{ marginTop: 10 }}>
                    <div className="field">
                      <label htmlFor={`edit-name-${p.id}`}>Nume</label>
                      <input id={`edit-name-${p.id}`} autoComplete="off" className="input" value={editDraft.name} onChange={(e) => setEditDraft((s) => ({ ...s, name: e.target.value }))} />
                    </div>

                    <div className="field">
                      <label htmlFor={`edit-price-${p.id}`}>Preț</label>
                      <input id={`edit-price-${p.id}`} autoComplete="off" className="input" inputMode="decimal" value={editDraft.price} onChange={(e) => setEditDraft((s) => ({ ...s, price: e.target.value }))} />
                    </div>

                    <div className="field">
                      <label htmlFor={`edit-stock-${p.id}`}>Stoc</label>
                      <input id={`edit-stock-${p.id}`} autoComplete="off" className="input" inputMode="numeric" value={editDraft.stock} onChange={(e) => setEditDraft((s) => ({ ...s, stock: e.target.value }))} />
                    </div>

                    <div className="field">
                      <label htmlFor={`edit-category-${p.id}`}>Categorie</label>
                      <select id={`edit-category-${p.id}`} autoComplete="off" className="input" value={editDraft.category} onChange={(e) => setEditDraft((s) => ({ ...s, category: e.target.value }))}>
                        {PRODUCT_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor={`edit-description-${p.id}`}>Descriere</label>
                      <textarea id={`edit-description-${p.id}`} autoComplete="off" className="textarea" value={editDraft.description} onChange={(e) => setEditDraft((s) => ({ ...s, description: e.target.value }))} />
                    </div>

                    <div className="field">
                      <label htmlFor={`edit-image-${p.id}`}>Imagine (JPG, PNG, GIF, WebP - max 5MB)</label>
                      <input id={`edit-image-${p.id}`} className="input" type="file" autoComplete="off" accept="image/*" onChange={handleEditImageChange} />
                      {editDraft.imagePreview && (
                        <div style={{ marginTop: 10 }}>
                          <img 
                            src={getImageUrl(editDraft.imagePreview)}
                            alt="Preview" 
                            style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: 4 }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="btnRow">
                    <button className="btn btnPrimary" disabled={savingId === p.id} onClick={() => saveEdit(p.id)}>
                      {savingId === p.id ? 'Se salvează…' : 'Salvează'}
                    </button>
                    <button className="btn" disabled={savingId === p.id} onClick={() => setEditingId(null)}>
                      Renunță
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
