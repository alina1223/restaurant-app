import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, unwrapApiData, getImageUrl } from '../../utils/apiClient'
import { useAuth } from '../../state/auth/AuthContext.jsx'
import { useCart } from '../../state/cart/CartContext.jsx'

const PRODUCT_CATEGORIES = ['Firewall', 'Router', 'Camera', 'NAS']

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

function getUniqueSortedValues(products, key) {
  const set = new Set()
  for (const p of products) {
    const v = p?.[key]
    if (v === null || v === undefined || v === '') continue
    set.add(String(v))
  }
  return [...set].sort()
}

export default function CatalogPage() {
  const auth = useAuth()
  const cart = useCart()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [products, setProducts] = useState([])

  const [selectedCategory, setSelectedCategory] = useState('Firewall')
  const [filters, setFilters] = useState({
    name: '',
    minPrice: '',
    maxPrice: '',
    inStock: true
  })

  const [specificFilters, setSpecificFilters] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [addingId, setAddingId] = useState(null)

  const currentCategoryFilters = useMemo(() => CATEGORY_FILTERS[selectedCategory] || [], [selectedCategory])

  async function loadProducts(nextFilters, nextCategory) {
    setLoading(true)
    setError('')
    try {
      const f = nextFilters || filters
      const cat = nextCategory || selectedCategory

      const query = new URLSearchParams()
      if (String(f.name || '').trim()) query.append('name', f.name)
      query.append('category', cat)
      if (String(f.minPrice || '').trim()) query.append('minPrice', f.minPrice)
      if (String(f.maxPrice || '').trim()) query.append('maxPrice', f.maxPrice)
      if (f.inStock === true) query.append('inStock', 'true')

      const url = `/products/search?${query.toString()}`
      const response = await api.get(url)
      let items = unwrapApiData(response)
      items = Array.isArray(items) ? items : []

      items = items.filter((p) => {
        for (const [key, value] of Object.entries(specificFilters)) {
          if (!value) continue
          if (p[key] === undefined) continue

          if (typeof p[key] === 'string') {
            if (!String(p[key]).toLowerCase().includes(String(value).toLowerCase())) return false
          } else if (Array.isArray(p[key])) {
            if (!p[key].map((x) => String(x).toLowerCase()).includes(String(value).toLowerCase())) return false
          } else {
            if (p[key] !== value) return false
          }
        }
        return true
      })

      setProducts(items)
      setError('')
    } catch (err) {
      setError('Eroare la încărcarea produselor: ' + (err.message || 'Necunoscut'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSpecificFilters({})
    loadProducts(filters, selectedCategory)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory])

  function handleCategoryChange(cat) {
    setSelectedCategory(cat)
    setSpecificFilters({})
  }

  function handleFilterChange(e) {
    const { name, value } = e.target
    setFilters((s) => ({ ...s, [name]: value }))
  }

  function handleSpecificFilterChange(e) {
    const { name, value } = e.target
    setSpecificFilters((s) => ({ ...s, [name]: value }))
  }

  async function addToCart(productId) {
    if (!auth.user || !auth.token) {
      alert('Trebuie să te autentifici pentru a adăuga produse în coș')
      return
    }
    try {
      setAddingId(productId)
      const product = products.find((p) => p.id === productId)
      if (product) cart.add(product, 1)

      await api.post(
        '/users/cart/add',
        { productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      alert('Produs adăugat în coș')
    } catch (e) {
      alert('Eroare: ' + (e?.response?.data?.message || e.message || 'Necunoscut'))
    } finally {
      setAddingId(null)
    }
  }

  async function saveEdit(productId) {
    if (!editDraft?.name?.trim()) {
      alert('Numele produsului nu poate fi gol')
      return
    }
    try {
      setSavingId(productId)
      const formData = new FormData()

      for (const [key, value] of Object.entries(editDraft)) {
        if (key === 'imagePreview') continue
        if (value === null || value === undefined) continue
        // don't overwrite with empty strings
        if (typeof value === 'string' && value.trim() === '') continue
        formData.append(key, value)
      }

      const response = await api.put(`/admin/edit/${productId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const payload = unwrapApiData(response)
      const updated = payload?.product || payload?.data || payload
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)))

      setEditingId(null)
      setEditDraft({})
      alert('Produs actualizat')
    } catch (e) {
      const serverMsg = e?.response?.data?.message
      const serverErrors = e?.response?.data?.errors
      const extra = serverErrors ? `\n${JSON.stringify(serverErrors)}` : ''
      alert('Eroare: ' + (serverMsg || e?.message || 'Necunoscut') + extra)
    } finally {
      setSavingId(null)
    }
  }

  async function deleteProduct(productId) {
    if (!window.confirm('Ești sigur?')) return
    try {
      setDeletingId(productId)
      await api.delete(`/admin/delete/product/${productId}`)
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      alert('Produs șters')
    } catch (e) {
      alert('Eroare: ' + (e.message || 'Necunoscut'))
    } finally {
      setDeletingId(null)
    }
  }

  function openEditMode(product) {
    setEditingId(product.id)
    setEditDraft({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      description: product.description,
      brand: product.brand || '',
      ram: product.ram || '',
      ports: product.ports || '',
      throughput: product.throughput || '',
      vpn: product.vpn || '',
      rackmount: product.rackmount || false,
      wifiStandard: product.wifiStandard || '',
      vpnSupport: product.vpnSupport || false,
      resolution: product.resolution || '',
      connectivity: product.connectivity || '',
      weatherproof: product.weatherproof || false,
      bays: product.bays || '',
      raid: product.raid || '',
      image: null,
      imagePreview: null
    })
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      setEditDraft((prev) => ({
        ...prev,
        image: file,
        imagePreview: ev.target.result
      }))
    }
    reader.readAsDataURL(file)
  }

  function handleEditFieldChange(e) {
    const { name, value, type, checked } = e.target
    const finalValue = type === 'checkbox' ? checked : value
    setEditDraft((prev) => ({ ...prev, [name]: finalValue }))
  }

  return (
    <div className="catalogPage catalogPageWrap">
      <h1 className="catalogPageTitle">Hardware Catalog</h1>

      {/* Category Carousel */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
        {PRODUCT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className="btn"
            style={{
              borderRadius: 14,
              border: '1px solid rgba(45, 255, 111, 0.30)',
              background: selectedCategory === cat ? 'rgba(45, 255, 111, 0.12)' : 'rgba(11, 18, 32, 0.45)',
              color: selectedCategory === cat ? '#bfffe0' : 'rgba(230, 240, 255, 0.86)',
              fontWeight: 900,
              minWidth: 98
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 className="cardTitle" style={{ marginTop: 0 }}>
          Filtre
        </h3>

        <div className="btnRow">
          <button className="btn btnPrimary" onClick={() => loadProducts(filters, selectedCategory)} disabled={loading}>
            Aplică filtrele
          </button>

          <button
            className="btn"
            disabled={loading}
            onClick={() => {
              const reset = { name: '', minPrice: '', maxPrice: '', inStock: true }
              setFilters(reset)
              setSpecificFilters({})
              loadProducts(reset, selectedCategory)
            }}
          >
            Resetează
          </button>
        </div>

        <div className="form" style={{ marginTop: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="field">
            <label htmlFor="catalog-filter-name">Căutare după nume</label>
            <input id="catalog-filter-name" autoComplete="off" className="input" type="text" name="name" placeholder="Căutare..." value={filters.name} onChange={handleFilterChange} />
          </div>

          <div className="field">
            <label htmlFor="catalog-filter-minPrice">Preț minim (MDL)</label>
            <input id="catalog-filter-minPrice" autoComplete="off" className="input" type="number" name="minPrice" placeholder="0" value={filters.minPrice} onChange={handleFilterChange} />
          </div>

          <div className="field">
            <label htmlFor="catalog-filter-maxPrice">Preț maxim (MDL)</label>
            <input id="catalog-filter-maxPrice" autoComplete="off" className="input" type="number" name="maxPrice" placeholder="10000" value={filters.maxPrice} onChange={handleFilterChange} />
          </div>

          <div className="field">
            <label htmlFor="catalog-filter-inStock" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                id="catalog-filter-inStock"
                type="checkbox"
                name="inStock"
                checked={filters.inStock}
                onChange={(e) => setFilters((s) => ({ ...s, inStock: e.target.checked }))}
              />
              Doar în stoc
            </label>
          </div>

          {currentCategoryFilters.map((filterKey) => {
            if (filterKey === 'rackmount' || filterKey === 'weatherproof' || filterKey === 'vpnSupport') {
              return (
                <div key={`${selectedCategory}-${filterKey}`} className="field">
                  <label htmlFor={`filter-${filterKey}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      id={`filter-${filterKey}`}
                      type="checkbox"
                      name={filterKey}
                      checked={Boolean(specificFilters[filterKey])}
                      onChange={(e) => setSpecificFilters((s) => ({ ...s, [filterKey]: e.target.checked }))}
                    />
                    {FILTER_LABELS[filterKey]}
                  </label>
                </div>
              )
            }

            const uniqueValues = getUniqueSortedValues(products, filterKey)

            return (
              <div key={filterKey} className="field">
                <label htmlFor={`select-${filterKey}`}>{FILTER_LABELS[filterKey]}</label>
                <select
                  id={`select-${filterKey}`}
                  autoComplete="off"
                  className="input"
                  name={filterKey}
                  value={specificFilters[filterKey] || ''}
                  onChange={handleSpecificFilterChange}
                >
                  <option value="">Toate</option>
                  {uniqueValues.map((val) => (
                    <option key={`${filterKey}-${val}`} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      </div>

      {/* Products Grid */}
      {loading && <p className="muted">Se încarcă...</p>}
      {error && <div className="alert">{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {products.map((product) => (
            <div
              key={product.id || `prod-${Math.random().toString(36).slice(2,7)}`}
              className="card"
              style={{ overflow: 'hidden', borderRadius: 16, border: '1px solid rgba(230,240,255,0.12)' }}
            >
              {editingId === product.id ? (
                <div style={{ padding: 12 }}>
                  <div className="cardTitle" style={{ marginBottom: 10 }}>
                    Editează produsul
                  </div>

                  <div className="form" style={{ gridTemplateColumns: '1fr', gap: 10 }}>
                    <div className="field">
                      <label htmlFor={`catalog-edit-name-${product.id}`}>Nume</label>
                      <input id={`catalog-edit-name-${product.id}`} autoComplete="off" className="input" type="text" name="name" value={editDraft.name} onChange={handleEditFieldChange} />
                    </div>

                    <div className="field">
                      <label htmlFor={`catalog-edit-price-${product.id}`}>Preț</label>
                      <input id={`catalog-edit-price-${product.id}`} autoComplete="off" className="input" type="number" name="price" value={editDraft.price} onChange={handleEditFieldChange} />
                    </div>

                    <div className="field">
                      <label htmlFor={`catalog-edit-stock-${product.id}`}>Stoc</label>
                      <input id={`catalog-edit-stock-${product.id}`} autoComplete="off" className="input" type="number" name="stock" value={editDraft.stock} onChange={handleEditFieldChange} />
                    </div>

                    <div className="field">
                      <label htmlFor={`catalog-edit-description-${product.id}`}>Descriere</label>
                      <textarea id={`catalog-edit-description-${product.id}`} autoComplete="off" className="textarea" name="description" value={editDraft.description} onChange={handleEditFieldChange} />
                    </div>

                    {currentCategoryFilters.map((filterKey) => {
                      if (filterKey === 'rackmount' || filterKey === 'weatherproof' || filterKey === 'vpnSupport') {
                        return (
                          <div key={filterKey} className="field">
                            <label htmlFor={`edit-checkbox-${product.id}-${filterKey}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <input id={`edit-checkbox-${product.id}-${filterKey}`} type="checkbox" name={filterKey} checked={Boolean(editDraft[filterKey])} onChange={handleEditFieldChange} />
                              {FILTER_LABELS[filterKey]}
                            </label>
                          </div>
                        )
                      }

                      if (filterKey === 'bays') {
                        return (
                          <div key={filterKey} className="field">
                            <label htmlFor={`edit-bays-${product.id}-${filterKey}`}>{FILTER_LABELS[filterKey]}</label>
                            <input id={`edit-bays-${product.id}-${filterKey}`} autoComplete="off" className="input" type="number" name={filterKey} value={editDraft[filterKey] || ''} onChange={handleEditFieldChange} />
                          </div>
                        )
                      }

                      return (
                        <div key={filterKey} className="field">
                          <label htmlFor={`edit-attr-${product.id}-${filterKey}`}>{FILTER_LABELS[filterKey]}</label>
                          <input id={`edit-attr-${product.id}-${filterKey}`} autoComplete="off" className="input" type="text" name={filterKey} value={editDraft[filterKey] || ''} onChange={handleEditFieldChange} />
                        </div>
                      )
                    })}

                    <div className="field">
                      <label htmlFor={`catalog-edit-image-${product.id}`}>Imagine</label>
                      <input id={`catalog-edit-image-${product.id}`} autoComplete="off" type="file" accept="image/*" onChange={handleImageChange} className="input" />
                      {editDraft.imagePreview && (
                        <img
                          src={editDraft.imagePreview}
                          alt="Preview"
                          style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12, marginTop: 10 }}
                        />
                      )}
                    </div>

                    <div className="btnRow">
                      <button className="btn btnPrimary" disabled={savingId === product.id} onClick={() => saveEdit(product.id)}>
                        {savingId === product.id ? 'Se salvează…' : 'Salvează'}
                      </button>
                      <button className="btn" onClick={() => setEditingId(null)}>
                        Anulează
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {product.imagePath && (
                    <img
                      src={getImageUrl(product.imagePath)}
                      alt={product.name}
                      style={{ width: '100%', height: 190, objectFit: 'cover', borderBottom: '1px solid rgba(230,240,255,0.10)' }}
                    />
                  )}

                  <div style={{ padding: 12 }}>
                    <div className="cardTitle" style={{ fontSize: 18, marginBottom: 6 }}>
                      {product.name}
                    </div>

                    <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
                      {product.description}
                    </div>

                    {/* Attributes */}
                    <div style={{ background: 'rgba(11,18,32,0.45)', border: '1px solid rgba(230,240,255,0.10)', borderRadius: 12, padding: 10, marginBottom: 10 }}>
                      {currentCategoryFilters.map((filterKey) => {
                        const value = product[filterKey]
                        if (value === null || value === undefined || value === '' ) return null

                        const stringVal = String(value).toLowerCase()
                        const isBoolTrue = value === true || stringVal === 'true'
                        const isBoolFalse = value === false || stringVal === 'false'

                        if (isBoolFalse) return null

                        if (isBoolTrue) {
                          return (
                            <div key={`${product.id}-${filterKey}`} style={{ marginBottom: 4, color: 'rgba(230,240,255,0.82)' }}>
                              <strong style={{ color: '#bfffe0' }}>{FILTER_LABELS[filterKey]}</strong>
                            </div>
                          )
                        }

                        return (
                          <div key={`${product.id}-${filterKey}`} style={{ marginBottom: 4, color: 'rgba(230,240,255,0.82)' }}>
                            <strong style={{ color: '#bfffe0' }}>{FILTER_LABELS[filterKey]}:</strong> {String(value)}
                          </div>
                        )
                      })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div className="price" style={{ fontSize: 20 }}>
                        {formatPrice(product.price)}
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          padding: '6px 10px',
                          borderRadius: 999,
                          background: product.stock > 0 ? 'rgba(45,255,111,0.14)' : 'rgba(255,59,92,0.10)',
                          border: `1px solid ${product.stock > 0 ? 'rgba(45,255,111,0.35)' : 'rgba(255,59,92,0.35)'}`,
                          color: product.stock > 0 ? '#bfffe0' : '#ffd0da'
                        }}
                      >
                        {product.stock > 0 ? `${product.stock} în stoc` : 'Epuizat'}
                      </div>
                    </div>

                    <div className="btnRow" style={{ marginTop: 0 }}>
                      <Link className="btn" to={`/products/${product.id}`}>
                        Detalii
                      </Link>

                      <button
                        className="btn btnPrimary"
                        onClick={() => addToCart(product.id)}
                        disabled={addingId === product.id || product.stock === 0}
                        style={{ opacity: product.stock === 0 ? 0.6 : 1 }}
                      >
                        {addingId === product.id ? '...' : 'Coș'}
                      </button>
                    </div>

                    {auth.user?.role === 'admin' && (
                      <div className="btnRow" style={{ marginTop: 10 }}>
                        <button className="btn" onClick={() => openEditMode(product)} style={{ borderColor: 'rgba(255,191,0,0.45)' }}>
                          Editează
                        </button>
                        <button
                          className="btn"
                          onClick={() => deleteProduct(product.id)}
                          disabled={deletingId === product.id}
                          style={{ borderColor: 'rgba(255,59,92,0.45)', color: deletingId === product.id ? 'rgba(230,240,255,0.7)' : '#ffd0da' }}
                        >
                          {deletingId === product.id ? '...' : 'Șterge'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && products.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>Nu au fost găsite produse</p>}
    </div>
  )
}
