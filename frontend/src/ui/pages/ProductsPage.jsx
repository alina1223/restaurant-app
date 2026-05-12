import { useMemo, useState } from 'react'
import { api } from '../../utils/apiClient'
import { useAuth } from '../../state/auth/AuthContext.jsx'
import ResultBox from '../components/ResultBox.jsx'
import { useCall } from '../components/useCall.js'

export default function ProductsPage() {
  const auth = useAuth()

  const listCall = useCall()
  const detailsCall = useCall()
  const createCall = useCall()
  const editCall = useCall()
  const deleteCall = useCall()
  const reviewCall = useCall()

  const [detailsId, setDetailsId] = useState('1')

  const [createBody, setCreateBody] = useState({
    name: 'Pizza Margherita',
    price: 99.5,
    description: 'Classic pizza',
    stock: 10,
    category: 'pizza'
  })

  const [editId, setEditId] = useState('1')
  const [editBodyText, setEditBodyText] = useState('{"price": 120, "stock": 15}')

  const [deleteId, setDeleteId] = useState('1')

  const [reviewProductId, setReviewProductId] = useState('1')
  const [reviewBody, setReviewBody] = useState({ rating: 5, comment: 'Great!' })

  const authHeaders = useMemo(() => {
    return auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
  }, [auth.token])

  return (
    <div className="grid2">
      <section className="panel">
        <h2>GET /products/list</h2>
        <div className="actions">
          <button disabled={listCall.loading} onClick={() => listCall.call(async () => (await api.get('/products/list')).data)}>
            List
          </button>
        </div>
        {listCall.error && <div className="hint">{listCall.error}</div>}
        <ResultBox value={listCall.result} />
      </section>

      <section className="panel">
        <h2>GET /products/details/:id</h2>
        <div className="row">
          <label>Product ID</label>
          <input id="detailsId" name="detailsId" value={detailsId} onChange={(e) => setDetailsId(e.target.value)} />
        </div>
        <div className="actions">
          <button disabled={detailsCall.loading} onClick={() => detailsCall.call(async () => (await api.get(`/products/details/${detailsId}`)).data)}>
            Details
          </button>
        </div>
        {detailsCall.error && <div className="hint">{detailsCall.error}</div>}
        <ResultBox value={detailsCall.result} />
      </section>

      <section className="panel">
        <h2>POST /products/create (admin)</h2>
        <div className="hint">Requires admin token.</div>
        <div className="row">
          <label>Name</label>
          <input id="createName" name="name" value={createBody.name} onChange={(e) => setCreateBody((s) => ({ ...s, name: e.target.value }))} />
        </div>
        <div className="row">
          <label htmlFor="createPrice">Price</label>
          <input id="createPrice" name="price" value={createBody.price} onChange={(e) => setCreateBody((s) => ({ ...s, price: e.target.value }))} />
        </div>
        <div className="row">
          <label htmlFor="createDescription">Description</label>
          <input id="createDescription" name="description" value={createBody.description} onChange={(e) => setCreateBody((s) => ({ ...s, description: e.target.value }))} />
        </div>
        <div className="row">
          <label>Stock</label>
          <input id="createStock" name="stock" value={createBody.stock} onChange={(e) => setCreateBody((s) => ({ ...s, stock: e.target.value }))} />
        </div>
        <div className="row">
          <label htmlFor="createCategory">Category</label>
          <input id="createCategory" name="category" value={createBody.category} onChange={(e) => setCreateBody((s) => ({ ...s, category: e.target.value }))} />
        </div>

        <div className="actions">
          <button
            disabled={createCall.loading || !auth.token}
            onClick={() =>
              createCall.call(async () =>
                (
                  await api.post(
                    '/products/create',
                    {
                      ...createBody,
                      price: Number(createBody.price),
                      stock: Number(createBody.stock)
                    },
                    { headers: authHeaders }
                  )
                ).data
              )
            }
          >
            Create
          </button>
        </div>
        {!auth.token && <div className="hint">Login as admin to use this endpoint.</div>}
        {createCall.error && <div className="hint">{createCall.error}</div>}
        <ResultBox value={createCall.result} />
      </section>

      <section className="panel">
        <h2>PUT /products/edit/:id (admin)</h2>
        <div className="row">
          <label htmlFor="editId2">Product ID</label>
          <input id="editId2" name="editId" value={editId} onChange={(e) => setEditId(e.target.value)} />
        </div>
        <div className="row">
          <label htmlFor="editBodyText2">Body (JSON)</label>
          <textarea id="editBodyText2" name="editBodyText" value={editBodyText} onChange={(e) => setEditBodyText(e.target.value)} />
        </div>
        <div className="actions">
          <button
            disabled={editCall.loading || !auth.token}
            onClick={() =>
              editCall.call(async () => {
                const body = JSON.parse(editBodyText || '{}')
                return (await api.put(`/products/edit/${editId}`, body, { headers: authHeaders })).data
              })
            }
          >
            Update
          </button>
        </div>
        {editCall.error && <div className="hint">{editCall.error}</div>}
        <ResultBox value={editCall.result} />
      </section>

      <section className="panel">
        <h2>DELETE /products/delete/:id (admin)</h2>
        <div className="row">
          <label htmlFor="deleteId2">Product ID</label>
          <input id="deleteId2" name="deleteId" value={deleteId} onChange={(e) => setDeleteId(e.target.value)} />
        </div>
        <div className="actions">
          <button
            disabled={deleteCall.loading || !auth.token}
            onClick={() => deleteCall.call(async () => (await api.delete(`/products/delete/${deleteId}`, { headers: authHeaders })).data)}
          >
            Delete
          </button>
        </div>
        {deleteCall.error && <div className="hint">{deleteCall.error}</div>}
        <ResultBox value={deleteCall.result} />
      </section>

      <section className="panel">
        <h2>POST /products/:id/reviews (verified user)</h2>
        <div className="hint">Requires token + verified email.</div>

        <div className="row">
          <label htmlFor="reviewProductId">Product ID</label>
          <input id="reviewProductId" name="reviewProductId" value={reviewProductId} onChange={(e) => setReviewProductId(e.target.value)} />
        </div>
        <div className="row">
          <label htmlFor="reviewRating">Rating</label>
          <input id="reviewRating" name="rating" value={reviewBody.rating} onChange={(e) => setReviewBody((s) => ({ ...s, rating: e.target.value }))} />
        </div>
        <div className="row">
          <label htmlFor="reviewComment">Comment</label>
          <input id="reviewComment" name="comment" value={reviewBody.comment} onChange={(e) => setReviewBody((s) => ({ ...s, comment: e.target.value }))} />
        </div>

        <div className="actions">
          <button
            disabled={reviewCall.loading || !auth.token}
            onClick={() =>
              reviewCall.call(async () =>
                (
                  await api.post(
                    `/products/${reviewProductId}/reviews`,
                    { rating: Number(reviewBody.rating), comment: reviewBody.comment },
                    { headers: authHeaders }
                  )
                ).data
              )
            }
          >
            Add review
          </button>
        </div>
        {reviewCall.error && <div className="hint">{reviewCall.error}</div>}
        <ResultBox value={reviewCall.result} />
      </section>
    </div>
  )
}
