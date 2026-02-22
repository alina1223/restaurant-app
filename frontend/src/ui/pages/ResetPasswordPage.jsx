import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, unwrapApiData } from '../../utils/apiClient'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const params = useParams()
  const token = params.token

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(() => {
    return String(form.newPassword || '').length >= 6 && form.newPassword === form.confirmPassword
  }, [form])

  async function onSubmit() {
    setError('')
    setStatus('')
    setLoading(true)
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword
      })
      const data = unwrapApiData(res)
      setStatus(data?.message || 'Parola a fost resetată cu succes.')
      setTimeout(() => navigate('/account'), 800)
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="pageTitle">Resetare parolă</h1>

      {error ? <div className="alert">{error}</div> : null}
      {status ? <div className="card" style={{ marginTop: 12 }}>{status}</div> : null}

      <div className="card" style={{ marginTop: 12 }}>
        <div className="cardTitle">Setează o parolă nouă</div>
        <div className="form" style={{ marginTop: 10 }}>
          <div className="field">
            <label>Parolă nouă (min 6)</label>
            <input
              className="input"
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm((s) => ({ ...s, newPassword: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Confirmă parola</label>
            <input
              className="input"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))}
            />
          </div>

          <div className="btnRow">
            <button className="btn btnPrimary" disabled={loading || !canSubmit} onClick={onSubmit}>
              Resetează parola
            </button>
            <button className="btn" disabled={loading} onClick={() => navigate('/account')}>
              Înapoi
            </button>
          </div>

          <div className="muted">Linkul de resetare expiră. Dacă nu funcționează, cere unul nou.</div>
        </div>
      </div>
    </div>
  )
}
