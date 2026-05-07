import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, unwrapApiData } from '../../utils/apiClient'
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

  const currentCategoryFilters = CATEGORY_FILTERS[selectedCategory] || []

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

      // Apply specific category filters
      items = items.filter(p => {
        for (const [key, value] of Object.entries(specificFilters)) {
          if (value && p[key] !== undefined) {
            if (typeof p[key] === 'string') {
              if (!String(p[key]).toLowerCase().includes(String(value).toLowerCase())) {
                return false
              }
            } else if (Array.isArray(p[key])) {
              if (!p[key].map(x => String(x).toLowerCase()).includes(String(value).toLowerCase())) {
                return false
              }
            } else if (p[key] !== value) {
              return false
            }
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
  }, [selectedCategory])

  function handleCategoryChange(cat) {
    setSelectedCategory(cat)
    setSpecificFilters({})
  }

  function handleFilterChange(e) {
    const { name, value } = e.target
    const newFilters = { ...filters, [name]: value }
    setFilters(newFilters)
    loadProducts(newFilters, selectedCategory)
  }

  function handleSpecificFilterChange(e) {
    const { name, value } = e.target
    const newSpecificFilters = { ...specificFilters, [name]: value }
    setSpecificFilters(newSpecificFilters)
  }

  async function addToCart(productId) {
    if (!auth.user) {
      alert('Trebuie să te autentifici pentru a adăuga produse în coș')
      return
    }
    try {
      setAddingId(productId)
      const response = await api.post('/cart/add-item', { productId, quantity: 1 })
      cart.setCartCount((cart.cartCount || 0) + 1)
      alert('Produs adăugat în coș')
    } catch (error) {
      alert('Eroare: ' + (error.message || 'Necunoscut'))
    } finally {
      setAddingId(null)
    }
  }

  async function saveEdit(productId) {
    if (!editDraft.name?.trim()) {
      alert('Numele produsului nu poate fi gol')
      return
    }
    try {
      setSavingId(productId)
      const formData = new FormData()
      for (const [key, value] of Object.entries(editDraft)) {
        if (key !== 'imagePreview') {
          if (value !== null && value !== undefined) {
            formData.append(key, value)
          }
        }
      }

      const response = await api.put(`/admin/edit/${productId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const updated = unwrapApiData(response)
      setProducts(products.map(p => (p.id === productId ? updated : p)))
      setEditingId(null)
      setEditDraft({})
      alert('Produs actualizat')
    } catch (error) {
      alert('Eroare: ' + (error.message || 'Necunoscut'))
    } finally {
      setSavingId(null)
    }
  }

  async function deleteProduct(productId) {
    if (!window.confirm('Ești sigur?')) return
    try {
      setDeletingId(productId)
      await api.delete(`/admin/delete/product/${productId}`)
      setProducts(products.filter(p => p.id !== productId))
      alert('Produs șters')
    } catch (error) {
      alert('Eroare: ' + (error.message || 'Necunoscut'))
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
      vpnSupport: product.vpnSupport || '',
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
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = e => {
        setEditDraft(prev => ({
          ...prev,
          image: file,
          imagePreview: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  function handleEditFieldChange(e) {
    const { name, value, type, checked } = e.target
    const finalValue = type === 'checkbox' ? checked : value
    setEditDraft(prev => ({ ...prev, [name]: finalValue }))
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Hardware Catalog</h1>

      {/* Category Carousel */}
      <div style={{ 
        marginBottom: '30px', 
        display: 'flex', 
        gap: '10px', 
        overflowX: 'auto',
        paddingBottom: '10px'
      }}>
        {PRODUCT_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            style={{
              padding: '12px 24px',
              border: '2px solid ' + (selectedCategory === cat ? '#007bff' : '#ddd'),
              backgroundColor: selectedCategory === cat ? '#007bff' : '#fff',
              color: selectedCategory === cat ? '#fff' : '#000',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: selectedCategory === cat ? 'bold' : 'normal',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Filtre</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {/* General Filters */}
          <div>
            <label>Căutare după nume</label>
            <input
              type="text"
              name="name"
              placeholder="Căutare..."
              value={filters.name}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label>Preț minim (MDL)</label>
            <input
              type="number"
              name="minPrice"
              placeholder="0"
              value={filters.minPrice}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label>Preț maxim (MDL)</label>
            <input
              type="number"
              name="maxPrice"
              placeholder="10000"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                name="inStock"
                checked={filters.inStock}
                onChange={e => {
                  const newFilters = { ...filters, inStock: e.target.checked }
                  setFilters(newFilters)
                  loadProducts(newFilters, selectedCategory)
                }}
              />
              {' '}Doar în stoc
            </label>
          </div>

          {/* Category-specific filters */}
          {currentCategoryFilters.map(filterKey => {
            if (filterKey === 'rackmount' || filterKey === 'weatherproof') {
              return (
                <div key={filterKey}>
                  <label>
                    <input
                      type="checkbox"
                      name={filterKey}
                      checked={specificFilters[filterKey] || false}
                      onChange={e => {
                        const newSpecificFilters = { ...specificFilters, [filterKey]: e.target.checked }
                        setSpecificFilters(newSpecificFilters)
                      }}
                    />
                    {' '}{FILTER_LABELS[filterKey]}
                  </label>
                </div>
              )
            }

            const uniqueValues = [...new Set(
              products
                .filter(p => p[filterKey])
                .map(p => String(p[filterKey]))
            )].sort()

            return (
              <div key={filterKey}>
                <label>{FILTER_LABELS[filterKey]}</label>
                <select
                  name={filterKey}
                  value={specificFilters[filterKey] || ''}
                  onChange={handleSpecificFilterChange}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Toate</option>
                  {uniqueValues.map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      </div>

      {/* Products Grid */}
      {loading && <p>Se încarcă...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '20px' 
        }}>
          {products.map(product => (
            <div 
              key={product.id} 
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                overflow: 'hidden',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {editingId === product.id ? (
                // Edit Mode
                <div style={{ padding: '15px' }}>
                  <h3>Editează produsul</h3>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Nume</label>
                    <input
                      type="text"
                      name="name"
                      value={editDraft.name}
                      onChange={handleEditFieldChange}
                      style={{ width: '100%', padding: '6px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Preț</label>
                    <input
                      type="number"
                      name="price"
                      value={editDraft.price}
                      onChange={handleEditFieldChange}
                      style={{ width: '100%', padding: '6px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Stoc</label>
                    <input
                      type="number"
                      name="stock"
                      value={editDraft.stock}
                      onChange={handleEditFieldChange}
                      style={{ width: '100%', padding: '6px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Descriere</label>
                    <textarea
                      name="description"
                      value={editDraft.description}
                      onChange={handleEditFieldChange}
                      style={{ width: '100%', padding: '6px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}
                    />
                  </div>

                  {/* Category-specific fields */}
                  {currentCategoryFilters.map(filterKey => {
                    if (filterKey === 'rackmount' || filterKey === 'weatherproof') {
                      return (
                        <div key={filterKey} style={{ marginBottom: '10px' }}>
                          <label>
                            <input
                              type="checkbox"
                              name={filterKey}
                              checked={editDraft[filterKey] || false}
                              onChange={handleEditFieldChange}
                            />
                            {' '}{FILTER_LABELS[filterKey]}
                          </label>
                        </div>
                      )
                    }
                    if (filterKey === 'bays') {
                      return (
                        <div key={filterKey} style={{ marginBottom: '10px' }}>
                          <label>{FILTER_LABELS[filterKey]}</label>
                          <input
                            type="number"
                            name={filterKey}
                            value={editDraft[filterKey] || ''}
                            onChange={handleEditFieldChange}
                            style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                          />
                        </div>
                      )
                    }
                    return (
                      <div key={filterKey} style={{ marginBottom: '10px' }}>
                        <label>{FILTER_LABELS[filterKey]}</label>
                        <input
                          type="text"
                          name={filterKey}
                          value={editDraft[filterKey] || ''}
                          onChange={handleEditFieldChange}
                          style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      </div>
                    )
                  })}

                  <div style={{ marginBottom: '10px' }}>
                    <label>Imagine</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ width: '100%', marginBottom: '8px' }}
                    />
                    {editDraft.imagePreview && (
                      <img src={editDraft.imagePreview} style={{ width: '100%', maxHeight: '200px', borderRadius: '4px', marginBottom: '8px' }} alt="Preview" />
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => saveEdit(product.id)}
                      disabled={savingId === product.id}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {savingId === product.id ? 'Se salvează...' : 'Salvează'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Anulează
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  {product.imagePath && (
                    <img 
                      src={product.imagePath} 
                      alt={product.name}
                      style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: '15px' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '8px' }}>{product.name}</h4>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                      {product.description}
                    </p>

                    {/* Display category-specific attributes */}
                    <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '10px', fontSize: '13px' }}>
                      {currentCategoryFilters.map(filterKey => {
                        const value = product[filterKey]
                        if (value !== null && value !== undefined && value !== '' && value !== false) {
                          return (
                            <div key={filterKey} style={{ marginBottom: '4px' }}>
                              <strong>{FILTER_LABELS[filterKey]}:</strong> {String(value)}
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                        {formatPrice(product.price)}
                      </span>
                      <span style={{ 
                        fontSize: '12px',
                        padding: '4px 8px',
                        backgroundColor: product.stock > 0 ? '#d4edda' : '#f8d7da',
                        color: product.stock > 0 ? '#155724' : '#721c24',
                        borderRadius: '4px'
                      }}>
                        {product.stock > 0 ? `${product.stock} în stoc` : 'Epuizat'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <Link
                        to={`/products/${product.id}`}
                        style={{
                          flex: 1,
                          padding: '8px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          textAlign: 'center',
                          fontSize: '14px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Detalii
                      </Link>
                      <button
                        onClick={() => addToCart(product.id)}
                        disabled={addingId === product.id || product.stock === 0}
                        style={{
                          flex: 1,
                          padding: '8px',
                          backgroundColor: product.stock === 0 ? '#ccc' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {addingId === product.id ? '...' : 'Coș'}
                      </button>
                    </div>

                    {auth.user?.role === 'admin' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditMode(product)}
                          style={{
                            flex: 1,
                            padding: '6px',
                            backgroundColor: '#ffc107',
                            color: '#000',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Editează
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          disabled={deletingId === product.id}
                          style={{
                            flex: 1,
                            padding: '6px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
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

      {!loading && !error && products.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666' }}>Nu au fost găsite produse</p>
      )}
    </div>
  )
}
