import React from 'react'

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
  bays: 'Bays',
  vpn: 'VPN',
  rackmount: 'Rackmount',
  wifiStandard: 'Wi-Fi Standard',
  vpnSupport: 'VPN Support',
  resolution: 'Resolution',
  connectivity: 'Connectivity',
  weatherproof: 'Weatherproof',
  raid: 'RAID'
}

export function renderProductForm(formData, setFormData, title, onSubmit, loading, mode = 'create') {
  const selectedCategory = formData.category || PRODUCT_CATEGORIES[0]
  const categoryFilters = CATEGORY_FILTERS[selectedCategory] || []

  return (
    <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <h3>{title}</h3>

      {/* Basic Fields */}
      <div style={{ marginBottom: '15px' }}>
        <label><strong>Nume produs *</strong></label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Fortinet FortiGate 100D"
          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label><strong>Categorie *</strong></label>
        <select
          value={selectedCategory}
          onChange={e => setFormData({ ...formData, category: e.target.value })}
          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          {PRODUCT_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div>
          <label><strong>Preț (MDL) *</strong></label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.00"
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label><strong>Stoc *</strong></label>
          <input
            type="number"
            value={formData.stock}
            onChange={e => setFormData({ ...formData, stock: e.target.value })}
            placeholder="0"
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label><strong>Imagine</strong></label>
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = e => {
                  setFormData({ ...formData, image: file, imagePreview: e.target.result })
                }
                reader.readAsDataURL(file)
              }
            }}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label><strong>Descriere</strong></label>
        <textarea
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descriere produsului..."
          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }}
        />
      </div>

      {formData.imagePreview && (
        <div style={{ marginBottom: '15px' }}>
          <img
            src={formData.imagePreview}
            alt="Preview"
            style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '4px' }}
          />
        </div>
      )}

      {/* Category-specific fields */}
      <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
        <h4>Atribute specifice categoriei: {selectedCategory}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {categoryFilters.map(filterKey => {
            if (filterKey === 'rackmount' || filterKey === 'weatherproof' || filterKey === 'vpnSupport') {
              return (
                <div key={filterKey} style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={formData[filterKey] || false}
                    onChange={e => setFormData({ ...formData, [filterKey]: e.target.checked })}
                    id={filterKey}
                  />
                  <label htmlFor={filterKey} style={{ marginLeft: '8px' }}>
                    {FILTER_LABELS[filterKey]}
                  </label>
                </div>
              )
            }

            if (filterKey === 'bays') {
              return (
                <div key={filterKey}>
                  <label><strong>{FILTER_LABELS[filterKey]}</strong></label>
                  <input
                    type="number"
                    value={formData[filterKey] || ''}
                    onChange={e => setFormData({ ...formData, [filterKey]: e.target.value })}
                    placeholder={FILTER_LABELS[filterKey]}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              )
            }

            return (
              <div key={filterKey}>
                <label><strong>{FILTER_LABELS[filterKey]}</strong></label>
                <input
                  type="text"
                  value={formData[filterKey] || ''}
                  onChange={e => setFormData({ ...formData, [filterKey]: e.target.value })}
                  placeholder={FILTER_LABELS[filterKey]}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        {loading ? 'Se procesează...' : (mode === 'create' ? 'Creează produs' : 'Actualizează produs')}
      </button>
    </div>
  )
}

export const PRODUCT_CATEGORIES_EXPORT = PRODUCT_CATEGORIES
export const CATEGORY_FILTERS_CONFIG = CATEGORY_FILTERS
export const FILTER_LABELS_CONFIG = FILTER_LABELS
