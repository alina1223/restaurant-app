import { useMemo, useState } from 'react'
import { api, formatAxiosError, unwrapApiData } from '../../utils/apiClient'
import { useAuth } from '../../state/auth/AuthContext.jsx'
import ResultBox from '../components/ResultBox.jsx'
import { useCall } from '../components/useCall.js'

const PRODUCT_CATEGORIES = ['Pizza', 'Burger', 'Salată', 'Desert', 'Băutură']
const EXPORT_CATEGORIES = [''].concat(['Pizza', 'Burger', 'Salată', 'Paste', 'Băutură', 'Desert'])

export default function AdminPage() {
  const auth = useAuth()

  const importCall = useCall()
  const exportCall = useCall()
  const createProductCall = useCall()
  const editProductCall = useCall()
  const patchProductCall = useCall()
  const deleteProductCall = useCall()
  const reportProductsCall = useCall()
  const reportReviewsCall = useCall()
  const reportUsersCall = useCall()
  const searchUsersCall = useCall()
  const deleteUserCall = useCall()
  const userPdfReportCall = useCall()

  const reportUsersStatsCall = useCall()
  const productsDetailedCall = useCall()
  const reviewsDetailedCall = useCall()
  const cartsReportCall = useCall()
  const activityReportCall = useCall()
  const emailVerificationReportCall = useCall()

  const intermediaryCall = useCall()
  const rateLimitCall = useCall()
  const [intermediaryTitle, setIntermediaryTitle] = useState('Proxy / Intermediary')
  const [intermediaryView, setIntermediaryView] = useState('health')

  const [fetchForm, setFetchForm] = useState({
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    method: 'GET',
    headersText: '{\n  "Accept": "application/json"\n}',
    dataText: '{\n  "title": "Proxy test",\n  "body": "Creat prin serviciul intermediar",\n  "userId": 1\n}'
  })

  const [transformForm, setTransformForm] = useState({
    operation: 'process',
    dataText: '[\n  {"name":"A"},\n  {"name":""},\n  {},\n  null\n]',
    optionsText: '{\n  "pick": ["name"],\n  "rename": {"name": "title"}\n}'
  })

  const [importFile, setImportFile] = useState(null)

  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])

  const [exportFilters, setExportFilters] = useState({
    name: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    minStock: ''
  })

  const [createProduct, setCreateProduct] = useState({
    name: '',
    price: '',
    description: '',
    stock: '',
    category: PRODUCT_CATEGORIES[0],
    image: null,
    imagePreview: null
  })

  const [editProductId, setEditProductId] = useState('')
  const [editProduct, setEditProduct] = useState({
    name: '',
    price: '',
    description: '',
    stock: '',
    category: '',
    image: null,
    imagePreview: null
  })

  const [patchProductId, setPatchProductId] = useState('')
  const [patchProduct, setPatchProduct] = useState({
    name: '',
    price: '',
    description: '',
    stock: '',
    category: ''
  })

  const [deleteProductId, setDeleteProductId] = useState('')

  const [searchUserName, setSearchUserName] = useState('')
  const [deleteUserId, setDeleteUserId] = useState('')
  const [reportUserId, setReportUserId] = useState('')

  const authHeaders = useMemo(() => {
    return auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
  }, [auth.token])

  async function safeApiData(requestFn) {
    try {
      const res = await requestFn()
      return res?.data
    } catch (e) {
      if (e?.response?.data) return e.response.data
      return {
        success: false,
        statusCode: 0,
        message: 'Eroare la cerere',
        error: { message: formatAxiosError(e) }
      }
    }
  }

  function parseJsonText(text, { label, allowEmpty }) {
    const raw = String(text ?? '')
    const trimmed = raw.trim()
    if (!trimmed) {
      if (allowEmpty) return undefined
      throw new Error(`${label} este obligatoriu (JSON)`)
    }
    try {
      return JSON.parse(trimmed)
    } catch {
      throw new Error(`${label} trebuie să fie JSON valid`)
    }
  }

  function parseNumber(value) {
    if (value === '' || value === null || value === undefined) return undefined
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
  }

  function buildProductBody(fields, { requireAll }) {
    const body = {}

    if (requireAll || fields.name !== '') body.name = String(fields.name || '').trim()
    if (requireAll || fields.price !== '') body.price = parseNumber(fields.price)
    if (requireAll || fields.description !== '') body.description = String(fields.description || '').trim()
    if (requireAll || fields.stock !== '') body.stock = parseNumber(fields.stock)
    if (requireAll || fields.category !== '') body.category = fields.category

   
    Object.keys(body).forEach((k) => {
      if (body[k] === undefined) delete body[k]
    })

    return body
  }

  function handleCreateProductImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validare tip fișier
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('Doar imagini sunt permise (JPG, PNG, GIF, WebP)')
      return
    }

    // Validare dimensiune
    if (file.size > 5 * 1024 * 1024) {
      alert('Imaginea trebuie să fie mai mică de 5MB')
      return
    }

    // Creare preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setCreateProduct((s) => ({
        ...s,
        image: file,
        imagePreview: event.target.result
      }))
    }
    reader.readAsDataURL(file)
  }

  function handleEditProductImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validare tip fișier
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('Doar imagini sunt permise (JPG, PNG, GIF, WebP)')
      return
    }

    // Validare dimensiune
    if (file.size > 5 * 1024 * 1024) {
      alert('Imaginea trebuie să fie mai mică de 5MB')
      return
    }

    // Creare preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setEditProduct((s) => ({
        ...s,
        image: file,
        imagePreview: event.target.result
      }))
    }
    reader.readAsDataURL(file)
  }

  function validateCreateProduct() {
    const nameOk = String(createProduct.name || '').trim().length >= 3
    const priceOk = parseNumber(createProduct.price) > 0
    const stockOk = Number.isInteger(parseNumber(createProduct.stock)) && parseNumber(createProduct.stock) >= 0
    const catOk = PRODUCT_CATEGORIES.includes(createProduct.category)
    const desc = String(createProduct.description || '').trim()
    const descOk = createProduct.category === 'Pizza' ? desc.length > 0 && desc.length <= 200 : desc.length <= 200
    return nameOk && priceOk && stockOk && catOk && descOk
  }

  function hasAnyProductField(fields) {
    return Object.values(fields).some((v) => String(v ?? '').trim() !== '')
  }

  async function downloadCsv(filters) {
    const res = await api.get('/admin/products/export', {
      params: filters,
      headers: authHeaders,
      responseType: 'blob'
    })

    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'produse-export.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    return { ok: true, size: blob.size }
  }

  async function loadProducts() {
    const res = await api.get('/admin/report/products', { headers: authHeaders })
    const data = unwrapApiData(res)
    const list = data?.products || []
    setProducts(Array.isArray(list) ? list : [])
    if (!deleteProductId && Array.isArray(list) && list.length) setDeleteProductId(String(list[0].id))
    return res.data
  }

  async function loadUsers() {
    const res = await api.get('/admin/report/users', { headers: authHeaders })
    const data = unwrapApiData(res)
    const list = Array.isArray(data) ? data : []
    setUsers(list)
    if (!deleteUserId && list.length) setDeleteUserId(String(list[0].id))
    if (!reportUserId && list.length) setReportUserId(String(list[0].id))
    return res.data
  }

  async function downloadUserPdfReport(userId) {
    const res = await api.get(`/admin/report/user/${encodeURIComponent(userId)}/pdf`, {
      headers: authHeaders,
      responseType: 'blob'
    })

    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user-${userId}-report.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    return { ok: true, size: blob.size }
  }

  return (
    <div>
      <h1 className="pageTitle">Admin</h1>
      {!auth.token ? <div className="alert">Autentifică-te ca admin ca să folosești aceste rute.</div> : null}

      <div className="grid">
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Import produse (CSV)</div>
              <div className="muted">POST /admin/products/import</div>
            </div>
          </div>

          <div className="form">
            <div className="field">
              <label>Fișier CSV (max 2MB)</label>
              <input className="input" type="file" accept=".csv,text/csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
            </div>
          </div>

          <div className="btnRow">
            <button
              className="btn btnPrimary"
              disabled={importCall.loading || !auth.token || !importFile}
              onClick={() =>
                importCall.call(async () => {
                  const fd = new FormData()
                  fd.append('file', importFile)
                  return (await api.post('/admin/products/import', fd, { headers: { ...authHeaders } })).data
                })
              }
            >
              Import
            </button>
          </div>
          {importCall.error ? <div className="alert">{importCall.error}</div> : null}
          <ResultBox value={importCall.result} />
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Export produse (CSV)</div>
              <div className="muted">GET /admin/products/export</div>
            </div>
          </div>

          <div className="form">
            <div className="field">
              <label>Nume conține</label>
              <input className="input" value={exportFilters.name} onChange={(e) => setExportFilters((s) => ({ ...s, name: e.target.value }))} />
            </div>

            <div className="field">
              <label>Categorie</label>
              <select className="input" value={exportFilters.category} onChange={(e) => setExportFilters((s) => ({ ...s, category: e.target.value }))}>
                {EXPORT_CATEGORIES.map((c) => (
                  <option key={c || 'any'} value={c}>
                    {c || 'Oricare'}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Preț minim</label>
              <input className="input" inputMode="decimal" value={exportFilters.minPrice} onChange={(e) => setExportFilters((s) => ({ ...s, minPrice: e.target.value }))} />
            </div>

            <div className="field">
              <label>Preț maxim</label>
              <input className="input" inputMode="decimal" value={exportFilters.maxPrice} onChange={(e) => setExportFilters((s) => ({ ...s, maxPrice: e.target.value }))} />
            </div>

            <div className="field">
              <label>Stoc minim</label>
              <input className="input" inputMode="numeric" value={exportFilters.minStock} onChange={(e) => setExportFilters((s) => ({ ...s, minStock: e.target.value }))} />
            </div>
          </div>

          <div className="btnRow">
            <button
              className="btn btnPrimary"
              disabled={exportCall.loading || !auth.token}
              onClick={() =>
                exportCall.call(async () => {
                  const filters = {}
                  if (String(exportFilters.name || '').trim()) filters.name = String(exportFilters.name).trim()
                  if (exportFilters.category) filters.category = exportFilters.category
                  if (exportFilters.minPrice !== '') filters.minPrice = parseNumber(exportFilters.minPrice)
                  if (exportFilters.maxPrice !== '') filters.maxPrice = parseNumber(exportFilters.maxPrice)
                  if (exportFilters.minStock !== '') filters.minStock = parseNumber(exportFilters.minStock)
                  return await downloadCsv(filters)
                })
              }
            >
              Export
            </button>
          </div>
          {exportCall.error ? <div className="alert">{exportCall.error}</div> : null}
          <ResultBox value={exportCall.result} />
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Creare produs</div>
              <div className="muted">POST /admin/create/product</div>
            </div>
          </div>

          <div className="form">
            <div className="field">
              <label>Nume</label>
              <input className="input" value={createProduct.name} onChange={(e) => setCreateProduct((s) => ({ ...s, name: e.target.value }))} />
            </div>

            <div className="field">
              <label>Preț</label>
              <input className="input" inputMode="decimal" value={createProduct.price} onChange={(e) => setCreateProduct((s) => ({ ...s, price: e.target.value }))} />
            </div>

            <div className="field">
              <label>Stoc</label>
              <input className="input" inputMode="numeric" value={createProduct.stock} onChange={(e) => setCreateProduct((s) => ({ ...s, stock: e.target.value }))} />
            </div>

            <div className="field">
              <label>Categorie</label>
              <select className="input" value={createProduct.category} onChange={(e) => setCreateProduct((s) => ({ ...s, category: e.target.value }))}>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Descriere {createProduct.category === 'Pizza' ? '(obligatoriu pentru Pizza)' : ''}</label>
              <textarea className="textarea" value={createProduct.description} onChange={(e) => setCreateProduct((s) => ({ ...s, description: e.target.value }))} />
              <div className="hint">Max 200 caractere.</div>
            </div>

            <div className="field">
              <label>Imagine (JPG, PNG, GIF, WebP - max 5MB)</label>
              <input className="input" type="file" accept="image/*" onChange={handleCreateProductImageChange} />
              {createProduct.imagePreview && (
                <div style={{ marginTop: 10 }}>
                  <img src={createProduct.imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: 4 }} />
                </div>
              )}
            </div>
          </div>

          <div className="btnRow">
            <button
              className="btn btnPrimary"
              disabled={createProductCall.loading || !auth.token || !validateCreateProduct()}
              onClick={() =>
                createProductCall.call(async () => {
                  const fd = new FormData()
                  fd.append('name', createProduct.name)
                  fd.append('price', createProduct.price)
                  fd.append('description', createProduct.description)
                  fd.append('stock', createProduct.stock)
                  fd.append('category', createProduct.category)
                  if (createProduct.image) fd.append('image', createProduct.image)
                  const apiRes = await api.post('/products/create', fd, { headers: authHeaders })
                  console.log('🔍 POST /products/create response:', apiRes.data)
                  const result = apiRes.data
                  // Reset form after success
                  setCreateProduct({
                    name: '',
                    price: '',
                    description: '',
                    stock: '',
                    category: PRODUCT_CATEGORIES[0],
                    image: null,
                    imagePreview: null
                  })
                  return result
                })
              }
            >
              Create
            </button>
          </div>
          {createProductCall.error ? <div className="alert">{createProductCall.error}</div> : null}
          <ResultBox value={createProductCall.result} />
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Update produs (PUT)</div>
              <div className="muted">PUT /admin/edit/:id</div>
            </div>
          </div>

          <div className="form">
            <div className="field">
              <label>Product ID</label>
              <input className="input" inputMode="numeric" value={editProductId} onChange={(e) => setEditProductId(e.target.value)} />
            </div>

            <div className="field">
              <label>Nume (opțional)</label>
              <input className="input" value={editProduct.name} onChange={(e) => setEditProduct((s) => ({ ...s, name: e.target.value }))} />
            </div>

            <div className="field">
              <label>Preț (opțional)</label>
              <input className="input" inputMode="decimal" value={editProduct.price} onChange={(e) => setEditProduct((s) => ({ ...s, price: e.target.value }))} />
            </div>

            <div className="field">
              <label>Stoc (opțional)</label>
              <input className="input" inputMode="numeric" value={editProduct.stock} onChange={(e) => setEditProduct((s) => ({ ...s, stock: e.target.value }))} />
            </div>

            <div className="field">
              <label>Categorie (opțional)</label>
              <select className="input" value={editProduct.category} onChange={(e) => setEditProduct((s) => ({ ...s, category: e.target.value }))}>
                <option value="">(nu schimba)</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Descriere (opțional)</label>
              <textarea className="textarea" value={editProduct.description} onChange={(e) => setEditProduct((s) => ({ ...s, description: e.target.value }))} />
            </div>

            <div className="field">
              <label>Imagine (opțional) - JPG, PNG, GIF, WebP (max 5MB)</label>
              <input className="input" type="file" accept="image/*" onChange={handleEditProductImageChange} />
              {editProduct.imagePreview && (
                <div style={{ marginTop: 10 }}>
                  <img src={editProduct.imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: 4 }} />
                </div>
              )}
            </div>
          </div>

          <div className="btnRow">
            <button
              className="btn btnPrimary"
              disabled={editProductCall.loading || !auth.token || !String(editProductId).trim() || !hasAnyProductField(editProduct)}
              onClick={() =>
                editProductCall.call(async () => {
                  const fd = new FormData()
                  if (editProduct.name !== '') fd.append('name', editProduct.name)
                  if (editProduct.price !== '') fd.append('price', editProduct.price)
                  if (editProduct.description !== '') fd.append('description', editProduct.description)
                  if (editProduct.stock !== '') fd.append('stock', editProduct.stock)
                  if (editProduct.category !== '') fd.append('category', editProduct.category)
                  if (editProduct.image) fd.append('image', editProduct.image)
                  return (await api.put(`/products/edit/${editProductId}`, fd, { headers: authHeaders })).data
                })
              }
            >
              Update
            </button>
          </div>
          {editProductCall.error ? <div className="alert">{editProductCall.error}</div> : null}
          <ResultBox value={editProductCall.result} />
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Patch produs (PATCH)</div>
              <div className="muted">PATCH /admin/update/:id</div>
            </div>
          </div>

          <div className="form">
            <div className="field">
              <label>Product ID</label>
              <input className="input" inputMode="numeric" value={patchProductId} onChange={(e) => setPatchProductId(e.target.value)} />
            </div>

            <div className="field">
              <label>Stoc (opțional)</label>
              <input className="input" inputMode="numeric" value={patchProduct.stock} onChange={(e) => setPatchProduct((s) => ({ ...s, stock: e.target.value }))} />
            </div>

            <div className="field">
              <label>Preț (opțional)</label>
              <input className="input" inputMode="decimal" value={patchProduct.price} onChange={(e) => setPatchProduct((s) => ({ ...s, price: e.target.value }))} />
            </div>

            <div className="field">
              <label>Categorie (opțional)</label>
              <select className="input" value={patchProduct.category} onChange={(e) => setPatchProduct((s) => ({ ...s, category: e.target.value }))}>
                <option value="">(nu schimba)</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Nume (opțional)</label>
              <input className="input" value={patchProduct.name} onChange={(e) => setPatchProduct((s) => ({ ...s, name: e.target.value }))} />
            </div>

            <div className="field">
              <label>Descriere (opțional)</label>
              <textarea className="textarea" value={patchProduct.description} onChange={(e) => setPatchProduct((s) => ({ ...s, description: e.target.value }))} />
            </div>
          </div>

          <div className="btnRow">
            <button
              className="btn btnPrimary"
              disabled={patchProductCall.loading || !auth.token || !String(patchProductId).trim() || !hasAnyProductField(patchProduct)}
              onClick={() =>
                patchProductCall.call(async () => {
                  const body = buildProductBody(patchProduct, { requireAll: false })
                  return (await api.patch(`/admin/update/${patchProductId}`, body, { headers: authHeaders })).data
                })
              }
            >
              Patch
            </button>
          </div>
          {patchProductCall.error ? <div className="alert">{patchProductCall.error}</div> : null}
          <ResultBox value={patchProductCall.result} />
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Ștergere produs</div>
              <div className="muted">DELETE /admin/delete/product/:id</div>
            </div>
          </div>

          <div className="form">
            <div className="field">
              <label>Produs</label>
              {products.length ? (
                <select className="input" value={deleteProductId} onChange={(e) => setDeleteProductId(e.target.value)}>
                  {products.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.id} — {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input className="input" inputMode="numeric" placeholder="ID produs" value={deleteProductId} onChange={(e) => setDeleteProductId(e.target.value)} />
              )}
              <div className="hint">Tip: apasă "Load products" ca să ai listă.</div>
            </div>
          </div>

          <div className="btnRow">
            <button className="btn" disabled={reportProductsCall.loading || !auth.token} onClick={() => reportProductsCall.call(loadProducts)}>
              Load products
            </button>
            <button
              className="btn btnPrimary"
              disabled={deleteProductCall.loading || !auth.token || !String(deleteProductId).trim()}
              onClick={() =>
                deleteProductCall.call(async () => (await api.delete(`/admin/delete/product/${deleteProductId}`, { headers: authHeaders })).data)
              }
            >
              Delete
            </button>
          </div>
          {deleteProductCall.error ? <div className="alert">{deleteProductCall.error}</div> : null}
          <ResultBox value={deleteProductCall.result} />
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Utilizatori</div>
              <div className="muted">GET /admin/report/users • GET /admin/search/users • GET /admin/report/user/:id/pdf • DELETE /admin/delete/user/:id</div>
            </div>
          </div>

          <div className="btnRow">
            <button className="btn" disabled={reportUsersCall.loading || !auth.token} onClick={() => reportUsersCall.call(loadUsers)}>
              Load users
            </button>
          </div>

          <div className="form">
            <div className="field">
              <label>Raport PDF user</label>
              {users.length ? (
                <select className="input" value={reportUserId} onChange={(e) => setReportUserId(e.target.value)}>
                  {users.map((u) => (
                    <option key={u.id} value={String(u.id)}>
                      {u.id} — {u.email} ({u.role})
                    </option>
                  ))}
                </select>
              ) : (
                <input className="input" inputMode="numeric" placeholder="ID user" value={reportUserId} onChange={(e) => setReportUserId(e.target.value)} />
              )}
              <div className="hint">Tip: apasă "Load users" ca să ai listă.</div>
            </div>
          </div>
          <div className="btnRow">
            <button
              className="btn btnPrimary"
              disabled={userPdfReportCall.loading || !auth.token || !String(reportUserId).trim()}
              onClick={() => userPdfReportCall.call(async () => downloadUserPdfReport(reportUserId))}
            >
              Descarcă PDF
            </button>
          </div>
          {userPdfReportCall.error ? <div className="alert">{userPdfReportCall.error}</div> : null}
          <ResultBox value={userPdfReportCall.result} />

          <div className="form">
            <div className="field">
              <label>Caută după nume</label>
              <input className="input" value={searchUserName} onChange={(e) => setSearchUserName(e.target.value)} />
            </div>
          </div>
          <div className="btnRow">
            <button
              className="btn btnPrimary"
              disabled={searchUsersCall.loading || !auth.token}
              onClick={() =>
                searchUsersCall.call(async () =>
                  (
                    await api.get('/admin/search/users', {
                      params: searchUserName ? { name: searchUserName } : {},
                      headers: authHeaders
                    })
                  ).data
                )
              }
            >
              Search
            </button>
          </div>
          {searchUsersCall.error ? <div className="alert">{searchUsersCall.error}</div> : null}
          <ResultBox value={searchUsersCall.result} />

          <div className="resultSpacer" />

          <div className="form">
            <div className="field">
              <label>Șterge user</label>
              {users.length ? (
                <select className="input" value={deleteUserId} onChange={(e) => setDeleteUserId(e.target.value)}>
                  {users.map((u) => (
                    <option key={u.id} value={String(u.id)}>
                      {u.id} — {u.email} ({u.role})
                    </option>
                  ))}
                </select>
              ) : (
                <input className="input" inputMode="numeric" placeholder="ID user" value={deleteUserId} onChange={(e) => setDeleteUserId(e.target.value)} />
              )}
            </div>
          </div>
          <div className="btnRow">
            <button
              className="btn btnPrimary"
              disabled={deleteUserCall.loading || !auth.token || !String(deleteUserId).trim()}
              onClick={() => deleteUserCall.call(async () => (await api.delete(`/admin/delete/user/${deleteUserId}`, { headers: authHeaders })).data)}
            >
              Delete user
            </button>
          </div>
          {deleteUserCall.error ? <div className="alert">{deleteUserCall.error}</div> : null}
          <ResultBox value={deleteUserCall.result} />
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Rapoarte</div>
              <div className="muted">Statistici & overview</div>
            </div>
          </div>

          <div className="btnRow">
            <button className="btn" disabled={reportReviewsCall.loading || !auth.token} onClick={() => reportReviewsCall.call(async () => (await api.get('/admin/report/reviews', { headers: authHeaders })).data)}>
              Reviews
            </button>
            <button className="btn" disabled={productsDetailedCall.loading || !auth.token} onClick={() => productsDetailedCall.call(async () => (await api.get('/admin/report/products-detailed', { headers: authHeaders })).data)}>
              Products detailed
            </button>
            <button className="btn" disabled={reviewsDetailedCall.loading || !auth.token} onClick={() => reviewsDetailedCall.call(async () => (await api.get('/admin/report/reviews-detailed', { headers: authHeaders })).data)}>
              Reviews detailed
            </button>
            <button className="btn" disabled={cartsReportCall.loading || !auth.token} onClick={() => cartsReportCall.call(async () => (await api.get('/admin/report/carts', { headers: authHeaders })).data)}>
              Carts
            </button>
            <button className="btn" disabled={activityReportCall.loading || !auth.token} onClick={() => activityReportCall.call(async () => (await api.get('/admin/report/activity', { headers: authHeaders })).data)}>
              Activity
            </button>
            <button className="btn" disabled={emailVerificationReportCall.loading || !auth.token} onClick={() => emailVerificationReportCall.call(async () => (await api.get('/admin/report/email-verification', { headers: authHeaders })).data)}>
              Email verification
            </button>
            <button className="btn" disabled={reportUsersStatsCall.loading || !auth.token} onClick={() => reportUsersStatsCall.call(async () => (await api.get('/admin/report/users', { headers: authHeaders })).data)}>
              Users
            </button>
          </div>

          {reportReviewsCall.error ? <div className="alert">{reportReviewsCall.error}</div> : null}
          <ResultBox title="Reviews" value={reportReviewsCall.result} />

          {productsDetailedCall.error ? <div className="alert">{productsDetailedCall.error}</div> : null}
          <ResultBox title="Products detailed" value={productsDetailedCall.result} />

          {reviewsDetailedCall.error ? <div className="alert">{reviewsDetailedCall.error}</div> : null}
          <ResultBox title="Reviews detailed" value={reviewsDetailedCall.result} />

          {cartsReportCall.error ? <div className="alert">{cartsReportCall.error}</div> : null}
          <ResultBox title="Carts" value={cartsReportCall.result} />

          {activityReportCall.error ? <div className="alert">{activityReportCall.error}</div> : null}
          <ResultBox title="Activity" value={activityReportCall.result} />

          {emailVerificationReportCall.error ? <div className="alert">{emailVerificationReportCall.error}</div> : null}
          <ResultBox title="Email verification" value={emailVerificationReportCall.result} />

          {reportUsersStatsCall.error ? <div className="alert">{reportUsersStatsCall.error}</div> : null}
          <ResultBox title="Users" value={reportUsersStatsCall.result} />
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Proxy / Intermediary</div>
              <div className="muted">GET /api/intermediary/health • GET /api/intermediary/info • POST /api/intermediary/fetch • POST /api/intermediary/transform</div>
            </div>
          </div>

          <div className="btnRow">
            <button
              className="btn"
              disabled={intermediaryCall.loading || !auth.token}
              onClick={() =>
                intermediaryCall.call(async () => {
                  setIntermediaryView('health')
                  setIntermediaryTitle('✅ HEALTH - Verifică conexiunea (GET)')
                  return await safeApiData(() => api.get('/api/intermediary/health', { headers: authHeaders }))
                })
              }
            >
              HEALTH
            </button>

            <button
              className="btn"
              disabled={intermediaryCall.loading || !auth.token}
              onClick={() =>
                intermediaryCall.call(async () => {
                  setIntermediaryView('info')
                  setIntermediaryTitle('✅ INFO - Vede configurația (GET)')
                  return await safeApiData(() => api.get('/api/intermediary/info', { headers: authHeaders }))
                })
              }
            >
              INFO
            </button>

            <button
              className="btn"
              disabled={!auth.token}
              onClick={() => setIntermediaryView('fetch')}
            >
              FETCH
            </button>

            <button
              className="btn"
              disabled={!auth.token}
              onClick={() => setIntermediaryView('transform')}
            >
              TRANSFORM
            </button>

            <button
              className="btn"
              disabled={!auth.token}
              onClick={() => setIntermediaryView('rate')}
            >
              RATE LIMIT
            </button>
          </div>

          {intermediaryView === 'fetch' ? (
            <>
              <div className="btnRow">
                <button
                  className="btn"
                  disabled={intermediaryCall.loading || !auth.token}
                  onClick={() =>
                    intermediaryCall.call(async () => {
                      setIntermediaryTitle('✅ FETCH - GET - Prelucrează date externe (POST)')
                      return await safeApiData(() =>
                        api.post(
                          '/api/intermediary/fetch',
                          {
                            url: String(fetchForm.url || '').trim(),
                            method: 'GET',
                            data: {}
                          },
                          { headers: authHeaders }
                        )
                      )
                    })
                  }
                >
                  FETCH GET
                </button>

                <button
                  className="btn"
                  disabled={intermediaryCall.loading || !auth.token}
                  onClick={() =>
                    intermediaryCall.call(async () => {
                      setIntermediaryTitle('✅ FETCH - POST - Creează date externe (POST)')
                      return await safeApiData(() =>
                        api.post(
                          '/api/intermediary/fetch',
                          {
                            url: String(fetchForm.url || '').trim(),
                            method: 'POST',
                            data: {
                              title: 'Proxy test',
                              body: 'Creat prin serviciul intermediar',
                              userId: 1
                            }
                          },
                          { headers: authHeaders }
                        )
                      )
                    })
                  }
                >
                  FETCH POST
                </button>
              </div>

              <div className="form">
                <div className="field">
                  <label>FETCH - URL</label>
                  <input className="input" value={fetchForm.url} onChange={(e) => setFetchForm((s) => ({ ...s, url: e.target.value }))} />
                </div>

                <div className="field">
                  <label>FETCH - Metodă</label>
                  <select className="input" value={fetchForm.method} onChange={(e) => setFetchForm((s) => ({ ...s, method: e.target.value }))}>
                    {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>FETCH - Headers (JSON, opțional)</label>
                  <textarea className="textarea" value={fetchForm.headersText} onChange={(e) => setFetchForm((s) => ({ ...s, headersText: e.target.value }))} />
                </div>

                <div className="field">
                  <label>FETCH - Data (JSON, opțional)</label>
                  <textarea className="textarea" value={fetchForm.dataText} onChange={(e) => setFetchForm((s) => ({ ...s, dataText: e.target.value }))} />
                  <div className="hint">Pentru GET poți lăsa gol. Pentru POST/PUT trimite un obiect JSON.</div>
                </div>
              </div>

              <div className="btnRow">
                <button
                  className="btn btnPrimary"
                  disabled={intermediaryCall.loading || !auth.token}
                  onClick={() =>
                    intermediaryCall.call(async () => {
                      const url = String(fetchForm.url || '').trim()
                      const method = String(fetchForm.method || 'GET').toUpperCase()
                      const headers = parseJsonText(fetchForm.headersText, { label: 'Headers', allowEmpty: true })
                      const data = parseJsonText(fetchForm.dataText, { label: 'Data', allowEmpty: true })

                      setIntermediaryTitle(`FETCH (manual) ${method}`)
                      return await safeApiData(() =>
                        api.post(
                          '/api/intermediary/fetch',
                          {
                            url,
                            method,
                            headers: headers || undefined,
                            data: data || undefined
                          },
                          { headers: authHeaders }
                        )
                      )
                    })
                  }
                >
                  Send FETCH
                </button>

                <button
                  className="btn"
                  disabled={intermediaryCall.loading || !auth.token}
                  onClick={() =>
                    intermediaryCall.call(async () => {
                      setIntermediaryTitle('✅ FETCH - Invalid URL - Vede validare (POST - expect 400)')
                      return await safeApiData(() =>
                        api.post(
                          '/api/intermediary/fetch',
                          {
                            url: 'not-a-url',
                            method: 'GET',
                            data: {}
                          },
                          { headers: authHeaders }
                        )
                      )
                    })
                  }
                >
                  FETCH Invalid URL
                </button>
              </div>
            </>
          ) : null}

          {intermediaryView === 'transform' ? (
            <>
              <div className="form">
                <div className="field">
                  <label>TRANSFORM - Operație</label>
                  <select className="input" value={transformForm.operation} onChange={(e) => setTransformForm((s) => ({ ...s, operation: e.target.value }))}>
                    {['process', 'filter', 'aggregate', 'map'].map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>

                {transformForm.operation === 'map' ? (
                  <div className="field">
                    <label>TRANSFORM - Options (JSON, opțional)</label>
                    <textarea className="textarea" value={transformForm.optionsText} onChange={(e) => setTransformForm((s) => ({ ...s, optionsText: e.target.value }))} />
                    <div className="hint">Ex: pick (selectează câmpuri) și rename (redenumește chei).</div>
                  </div>
                ) : null}

                <div className="field">
                  <label>TRANSFORM - Data (JSON, obligatoriu)</label>
                  <textarea className="textarea" value={transformForm.dataText} onChange={(e) => setTransformForm((s) => ({ ...s, dataText: e.target.value }))} />
                  <div className="hint">Poate fi obiect sau array JSON.</div>
                </div>
              </div>

              <div className="btnRow">
                <button
                  className="btn btnPrimary"
                  disabled={intermediaryCall.loading || !auth.token}
                  onClick={() =>
                    intermediaryCall.call(async () => {
                      const operation = String(transformForm.operation || 'process')
                      const data = parseJsonText(transformForm.dataText, { label: 'Data', allowEmpty: true })

                      const options =
                        operation === 'map'
                          ? parseJsonText(transformForm.optionsText, { label: 'Options', allowEmpty: true })
                          : undefined

                      setIntermediaryTitle(`TRANSFORM (manual) ${operation}`)
                      const payload = {
                        operation,
                        ...(data === undefined ? {} : { data }),
                        ...(options ? { options } : {})
                      }

                      return await safeApiData(() => api.post('/api/intermediary/transform', payload, { headers: authHeaders }))
                    })
                  }
                >
                  Send TRANSFORM
                </button>

                <button
                  className="btn"
                  disabled={intermediaryCall.loading || !auth.token}
                  onClick={() =>
                    intermediaryCall.call(async () => {
                      setIntermediaryTitle('✅ TRANSFORM - Missing Data - Error handling (POST - expect 400)')
                      return await safeApiData(() => api.post('/api/intermediary/transform', { operation: 'process' }, { headers: authHeaders }))
                    })
                  }
                >
                  TRANSFORM Missing Data
                </button>
              </div>
            </>
          ) : null}

          {intermediaryView === 'rate' ? (
            <div className="btnRow">
              <button
                className="btn btnPrimary"
                disabled={rateLimitCall.loading || !auth.token}
                onClick={() =>
                  rateLimitCall.call(async () => {
                    setIntermediaryTitle('⚠️ RATE LIMIT - 6 cereri rapid (a 6-a = 429)')
                    const results = []
                    for (let i = 1; i <= 6; i++) {
                      const data = await safeApiData(() => api.get('/api/intermediary/health', { headers: authHeaders }))
                      results.push({ request: i, ok: Boolean(data?.success), statusCode: data?.statusCode ?? null, message: data?.message ?? null })
                    }
                    return {
                      success: true,
                      message: 'Test rate limit executat',
                      data: { results }
                    }
                  })
                }
              >
                Test Rate Limit
              </button>
            </div>
          ) : null}

          {intermediaryCall.error ? <div className="alert">{intermediaryCall.error}</div> : null}
          <ResultBox title={intermediaryTitle} value={intermediaryCall.result} />

          {rateLimitCall.error ? <div className="alert">{rateLimitCall.error}</div> : null}
          <ResultBox title="Rate limit" value={rateLimitCall.result} />
        </div>

      </div>
    </div>
  )
}
