import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, unwrapApiData } from '../../utils/apiClient'
import { useAuth } from '../../state/auth/AuthContext.jsx'

export default function VerifyEmailPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { token: tokenParam } = useParams()
  const [params] = useSearchParams()
  const token = tokenParam || params.get('token') || ''

  const [status, setStatus] = useState('Verifying...')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    async function run() {
      if (!token) {
        setStatus('')
        setError('Missing token. Open the verification link from your email / backend console.')
        return
      }
      try {
        const res = await api.post('/auth/verify-email', { token })
        const data = unwrapApiData(res)
        if (!alive) return
        if (data?.token) auth.setToken(data.token)
        if (data?.user) auth.setUser(data.user)
        setStatus(data?.message || 'Email verified. Redirecting...')

        const redirectTo = typeof data?.redirectTo === 'string' ? data.redirectTo : '/dashboard'
        setTimeout(() => {
          if (!alive) return
          navigate(redirectTo, { replace: true })
        }, 700)
      } catch (e) {
        if (!alive) return
        setError(e?.response?.data?.message || e.message || 'Verification failed')
        setStatus('')
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [token])

  return (
    <div className="card">
      <div className="cardTitle">Email verification</div>
      {status && <div className="muted" style={{ marginTop: 8 }}>{status}</div>}
      {error && <div className="alert">{error}</div>}
      <div className="btnRow" style={{ marginTop: 12 }}>
        <Link className="btn btnPrimary" to="/account">Go to account</Link>
        <Link className="btn" to="/menu">Back to menu</Link>
      </div>
    </div>
  )
}
