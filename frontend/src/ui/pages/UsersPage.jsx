import { useMemo, useState } from 'react'
import { api } from '../../utils/apiClient'
import { useAuth } from '../../state/auth/AuthContext.jsx'
import ResultBox from '../components/ResultBox.jsx'
import { useCall } from '../components/useCall.js'

export default function UsersPage() {
  const auth = useAuth()

  const createCall = useCall()
  const editCall = useCall()
  const patchCall = useCall()
  const deleteCall = useCall()
  const profileCall = useCall()
  const listCall = useCall()
  const searchCall = useCall()
  const changePasswordCall = useCall()
  const cartAddCall = useCall()

  const [createBodyText, setCreateBodyText] = useState(
    JSON.stringify(
      {
        name: 'User Two',
        email: 'user2@example.com',
        password: 'test123456',
        phone: '069123456',
        age: 25,
        role: 'user'
      },
      null,
      2
    )
  )

  const [editId, setEditId] = useState('1')
  const [editBodyText, setEditBodyText] = useState('{"name":"Updated Name"}')

  const [patchId, setPatchId] = useState('1')
  const [patchBodyText, setPatchBodyText] = useState('{"phone":"069000000"}')

  const [deleteId, setDeleteId] = useState('1')

  const [profileId, setProfileId] = useState('1')

  const [searchParams, setSearchParams] = useState({ name: '', email: '', role: '' })

  const [changePasswordId, setChangePasswordId] = useState('1')
  const [changePasswordBody, setChangePasswordBody] = useState({ currentPassword: '', newPassword: 'newPass123' })

  const [cartBody, setCartBody] = useState({ productId: 1, quantity: 1 })

  const authHeaders = useMemo(() => {
    return auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
  }, [auth.token])

  return (
    <div className="grid2">
      <section className="panel">
        <h2>POST /users/create</h2>
        <div className="hint">Backwards-compatible user creation (sends verification email).</div>
        <div className="row">
          <label>Body (JSON)</label>
          <textarea value={createBodyText} onChange={(e) => setCreateBodyText(e.target.value)} />
        </div>
        <div className="actions">
          <button
            disabled={createCall.loading}
            onClick={() =>
              createCall.call(async () => {
                const body = JSON.parse(createBodyText || '{}')
                return (await api.post('/users/create', body)).data
              })
            }
          >
            Create
          </button>
        </div>
        {createCall.error && <div className="hint">{createCall.error}</div>}
        <ResultBox value={createCall.result} />
      </section>

      <section className="panel">
        <h2>PUT /users/edit/:id</h2>
        <div className="row">
          <label>User ID</label>
          <input value={editId} onChange={(e) => setEditId(e.target.value)} />
        </div>
        <div className="row">
          <label>Body (JSON)</label>
          <textarea value={editBodyText} onChange={(e) => setEditBodyText(e.target.value)} />
        </div>
        <div className="actions">
          <button
            disabled={editCall.loading}
            onClick={() =>
              editCall.call(async () => {
                const body = JSON.parse(editBodyText || '{}')
                return (await api.put(`/users/edit/${editId}`, body)).data
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
        <h2>PATCH /users/update/:id</h2>
        <div className="row">
          <label>User ID</label>
          <input value={patchId} onChange={(e) => setPatchId(e.target.value)} />
        </div>
        <div className="row">
          <label>Body (JSON)</label>
          <textarea value={patchBodyText} onChange={(e) => setPatchBodyText(e.target.value)} />
        </div>
        <div className="actions">
          <button
            disabled={patchCall.loading}
            onClick={() =>
              patchCall.call(async () => {
                const body = JSON.parse(patchBodyText || '{}')
                return (await api.patch(`/users/update/${patchId}`, body)).data
              })
            }
          >
            Patch
          </button>
        </div>
        {patchCall.error && <div className="hint">{patchCall.error}</div>}
        <ResultBox value={patchCall.result} />
      </section>

      <section className="panel">
        <h2>DELETE /users/delete/:id</h2>
        <div className="hint">This endpoint uses legacy headers role/currentuserid for permission checks.</div>
        <div className="row">
          <label>User ID</label>
          <input value={deleteId} onChange={(e) => setDeleteId(e.target.value)} />
        </div>
        <div className="actions">
          <button disabled={deleteCall.loading} onClick={() => deleteCall.call(async () => (await api.delete(`/users/delete/${deleteId}`)).data)}>
            Delete
          </button>
        </div>
        {deleteCall.error && <div className="hint">{deleteCall.error}</div>}
        <ResultBox value={deleteCall.result} />
      </section>

      <section className="panel">
        <h2>GET /users/profile/:id (auth)</h2>
        <div className="row">
          <label>User ID</label>
          <input value={profileId} onChange={(e) => setProfileId(e.target.value)} />
        </div>
        <div className="actions">
          <button
            disabled={profileCall.loading || !auth.token}
            onClick={() => profileCall.call(async () => (await api.get(`/users/profile/${profileId}`, { headers: authHeaders })).data)}
          >
            Get profile
          </button>
        </div>
        {!auth.token && <div className="hint">Login first (Auth tab).</div>}
        {profileCall.error && <div className="hint">{profileCall.error}</div>}
        <ResultBox value={profileCall.result} />
      </section>

      <section className="panel">
        <h2>GET /users/list (admin)</h2>
        <div className="actions">
          <button disabled={listCall.loading || !auth.token} onClick={() => listCall.call(async () => (await api.get('/users/list', { headers: authHeaders })).data)}>
            List users
          </button>
        </div>
        {listCall.error && <div className="hint">{listCall.error}</div>}
        <ResultBox value={listCall.result} />
      </section>

      <section className="panel">
        <h2>GET /users/search (admin)</h2>
        <div className="row">
          <label>Name</label>
          <input value={searchParams.name} onChange={(e) => setSearchParams((s) => ({ ...s, name: e.target.value }))} />
        </div>
        <div className="row">
          <label>Email</label>
          <input value={searchParams.email} onChange={(e) => setSearchParams((s) => ({ ...s, email: e.target.value }))} />
        </div>
        <div className="row">
          <label>Role</label>
          <input value={searchParams.role} onChange={(e) => setSearchParams((s) => ({ ...s, role: e.target.value }))} />
        </div>
        <div className="actions">
          <button
            disabled={searchCall.loading || !auth.token}
            onClick={() =>
              searchCall.call(async () => {
                const params = {}
                if (searchParams.name) params.name = searchParams.name
                if (searchParams.email) params.email = searchParams.email
                if (searchParams.role) params.role = searchParams.role
                return (await api.get('/users/search', { params, headers: authHeaders })).data
              })
            }
          >
            Search
          </button>
        </div>
        {searchCall.error && <div className="hint">{searchCall.error}</div>}
        <ResultBox value={searchCall.result} />
      </section>

      <section className="panel">
        <h2>PUT /users/change-password/:id (auth)</h2>
        <div className="row">
          <label>User ID</label>
          <input value={changePasswordId} onChange={(e) => setChangePasswordId(e.target.value)} />
        </div>
        <div className="row">
          <label>Current Password (required for non-admin)</label>
          <input type="password" value={changePasswordBody.currentPassword} onChange={(e) => setChangePasswordBody((s) => ({ ...s, currentPassword: e.target.value }))} />
        </div>
        <div className="row">
          <label>New Password</label>
          <input type="password" value={changePasswordBody.newPassword} onChange={(e) => setChangePasswordBody((s) => ({ ...s, newPassword: e.target.value }))} />
        </div>
        <div className="actions">
          <button
            disabled={changePasswordCall.loading || !auth.token}
            onClick={() =>
              changePasswordCall.call(async () =>
                (
                  await api.put(
                    `/users/change-password/${changePasswordId}`,
                    {
                      currentPassword: changePasswordBody.currentPassword,
                      newPassword: changePasswordBody.newPassword
                    },
                    { headers: authHeaders }
                  )
                ).data
              )
            }
          >
            Change password
          </button>
        </div>
        {changePasswordCall.error && <div className="hint">{changePasswordCall.error}</div>}
        <ResultBox value={changePasswordCall.result} />
      </section>

      <section className="panel">
        <h2>POST /users/cart/add (verified user)</h2>
        <div className="hint">Requires token + verified email.</div>
        <div className="row">
          <label>Product ID</label>
          <input value={cartBody.productId} onChange={(e) => setCartBody((s) => ({ ...s, productId: e.target.value }))} />
        </div>
        <div className="row">
          <label>Quantity</label>
          <input value={cartBody.quantity} onChange={(e) => setCartBody((s) => ({ ...s, quantity: e.target.value }))} />
        </div>
        <div className="actions">
          <button
            disabled={cartAddCall.loading || !auth.token}
            onClick={() =>
              cartAddCall.call(async () =>
                (
                  await api.post(
                    '/users/cart/add',
                    { productId: Number(cartBody.productId), quantity: Number(cartBody.quantity) },
                    { headers: authHeaders }
                  )
                ).data
              )
            }
          >
            Add to cart
          </button>
        </div>
        {cartAddCall.error && <div className="hint">{cartAddCall.error}</div>}
        <ResultBox value={cartAddCall.result} />
      </section>
    </div>
  )
}
