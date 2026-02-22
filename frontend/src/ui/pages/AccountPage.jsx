import { useEffect, useMemo, useState } from 'react'
import { api, unwrapApiData } from '../../utils/apiClient'
import { useAuth } from '../../state/auth/AuthContext.jsx'
import { useCall } from '../components/useCall.js'

export default function AccountPage() {
  const auth = useAuth()

  const profileLoadCall = useCall()
  const profileSaveCall = useCall()
  const changePasswordCall = useCall()
  const forgotPasswordCall = useCall()

  const [tab, setTab] = useState('login')
  const [error, setError] = useState('')
  const [errorDetails, setErrorDetails] = useState([])
  const [status, setStatus] = useState('')

  const [loginForm, setLoginForm] = useState({ email: 'user@example.com', password: 'test123456' })

  const [forgotEmail, setForgotEmail] = useState('user@example.com')

  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', age: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const [registerForm, setRegisterForm] = useState({
    name: 'Test User',
    email: 'user@example.com',
    password: 'test123456',
    phone: '069123456',
    age: 25,
    role: 'user',
    department: ''
  })

  const [resendEmail, setResendEmail] = useState('user@example.com')

  const authHeaders = useMemo(() => {
    return auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
  }, [auth.token])

  useEffect(() => {
    if (auth.isAuthed) setTab('profile')
  }, [auth.isAuthed])

  useEffect(() => {
    if (!auth.isAuthed) return
    if (tab !== 'profile') return
    if (!auth.user?.id) return
    if (profileLoadCall.loading) return
    if (profileLoadCall.result) return

    profileLoadCall.call(async () => {
      const res = await api.get(`/users/profile/${auth.user.id}`, { headers: authHeaders })
      const data = unwrapApiData(res)
      setProfileForm({
        name: data?.name || '',
        email: data?.email || '',
        phone: data?.phone || '',
        age: data?.age ?? ''
      })
      return data
    })
  }, [auth.isAuthed, auth.user?.id, authHeaders, tab, profileLoadCall])

  const registerBody = useMemo(() => {
    const body = { ...registerForm }
    body.age = Number(body.age)
    if (body.role !== 'manager') delete body.department
    if (body.role === 'manager' && !body.department) body.department = 'general'
    return body
  }, [registerForm])

  async function onLogin() {
    setError('')
    setErrorDetails([])
    setStatus('')
    try {
      await auth.login(loginForm.email, loginForm.password)
      setStatus('Logged in.')
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Login failed')
    }
  }

  async function onRegister() {
    setError('')
    setErrorDetails([])
    setStatus('')
    try {
      const res = await api.post('/auth/register', registerBody)
      unwrapApiData(res)
      setStatus('Account created. Please verify your email by clicking the link sent to your email (or shown in backend console). Verification will happen automatically in the browser.')
      setTab('verify')
    } catch (e) {
      const payload = e?.response?.data
      const details = payload?.errors || payload?.data?.errors || []
      if (Array.isArray(details) && details.length > 0) {
        setError('Validare eșuată. Verifică câmpurile de mai jos.')
        setErrorDetails(details)
      } else {
        setError(payload?.message || e.message || 'Register failed')
      }
    }
  }

  async function onResend() {
    setError('')
    setErrorDetails([])
    setStatus('')
    try {
      const res = await api.post('/auth/resend-verification', { email: resendEmail })
      const data = unwrapApiData(res)
      setStatus(data?.message || 'Verification email sent.')
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Resend failed')
    }
  }

  async function onVerifyToken() {
    setError('')
    setErrorDetails([])
    setStatus('')
    try {
      const res = await api.get('/auth/verify-token', { headers: authHeaders })
      const data = unwrapApiData(res)
      setStatus(data?.message || 'Token valid.')
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Token verification failed')
    }
  }

  async function onForgotPassword() {
    setError('')
    setErrorDetails([])
    setStatus('')
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail })
      const data = unwrapApiData(res)
      setStatus(data?.message || 'Dacă emailul există, vei primi un link de resetare.')
    } catch (e) {
      const payload = e?.response?.data
      const details = payload?.errors || payload?.data?.errors || []
      if (Array.isArray(details) && details.length > 0) {
        setError('Validare eșuată. Verifică câmpurile de mai jos.')
        setErrorDetails(details)
      } else {
        setError(payload?.message || payload?.error || e.message || 'Forgot password failed')
      }
    }
  }

  async function onSaveProfile() {
    setError('')
    setErrorDetails([])
    setStatus('')

    try {
      const body = {
        name: String(profileForm.name || '').trim(),
        email: String(profileForm.email || '').trim(),
        phone: String(profileForm.phone || '').trim(),
        age: profileForm.age === '' ? undefined : Number(profileForm.age)
      }

      Object.keys(body).forEach((k) => {
        if (body[k] === undefined || body[k] === '') delete body[k]
      })

      const res = await api.put(`/users/edit/${auth.user.id}`, body, { headers: authHeaders })
      const data = unwrapApiData(res)
      const updated = data?.user || null
      if (updated) auth.setUser(updated)
      setStatus('Profil actualizat.')
    } catch (e) {
      const payload = e?.response?.data
      const details = payload?.errors || payload?.data?.errors || []
      if (Array.isArray(details) && details.length > 0) {
        setError('Validare eșuată. Verifică câmpurile de mai jos.')
        setErrorDetails(details)
      } else {
        setError(payload?.message || e.message || 'Profile update failed')
      }
    }
  }

  async function onChangePassword() {
    setError('')
    setErrorDetails([])
    setStatus('')
    try {
      const res = await api.put(
        `/users/change-password/${auth.user.id}`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        },
        { headers: authHeaders }
      )

      setStatus(res?.data?.message || 'Parola a fost schimbată.')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (e) {
      const payload = e?.response?.data
      const details = payload?.errors || payload?.data?.errors || []
      if (Array.isArray(details) && details.length > 0) {
        setError('Validare eșuată. Verifică câmpurile de mai jos.')
        setErrorDetails(details)
      } else {
        setError(payload?.message || payload?.error || e.message || 'Change password failed')
      }
    }
  }

  async function onDeleteAccount() {
    setError('')
    setErrorDetails([])
    setStatus('')

    const ok = window.confirm('Ești sigur că vrei să-ți ștergi contul? Această acțiune este ireversibilă.')
    if (!ok) return

    try {
      await api.delete(`/users/delete/${auth.user.id}`, { headers: authHeaders })
      setStatus('Cont șters. Te deloghez...')
      await auth.logout()
      setTab('login')
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e.message || 'Delete failed')
    }
  }

  return (
    <div>
      <h1 className="pageTitle">Account</h1>

      <div className="btnRow">
        {!auth.isAuthed && (
          <>
            <button className={tab === 'login' ? 'btn btnPrimary' : 'btn'} onClick={() => setTab('login')}>
              Login
            </button>
            <button className={tab === 'register' ? 'btn btnPrimary' : 'btn'} onClick={() => setTab('register')}>
              Register
            </button>
            <button className={tab === 'verify' ? 'btn btnPrimary' : 'btn'} onClick={() => setTab('verify')}>
              Verify email
            </button>
            <button className={tab === 'forgot' ? 'btn btnPrimary' : 'btn'} onClick={() => setTab('forgot')}>
              Am uitat parola
            </button>
          </>
        )}

        {auth.isAuthed && (
          <>
            <button className={tab === 'profile' ? 'btn btnPrimary' : 'btn'} onClick={() => setTab('profile')}>
              Profile
            </button>

          </>
        )}
      </div>

      {error && (
        <div className="alert">
          <div>{error}</div>
          {Array.isArray(errorDetails) && errorDetails.length > 0 ? (
            <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
              {errorDetails.map((it, idx) => (
                <li key={idx}>
                  <strong>{it?.path || it?.param || 'field'}</strong>: {it?.msg || it?.message || 'invalid'}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
      {status && <div className="card" style={{ marginTop: 12 }}>{status}</div>}

      {tab === 'login' && !auth.isAuthed && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="cardTitle">Login</div>
          <div className="form" style={{ marginTop: 10 }}>
            <div className="field">
              <label>Email</label>
              <input className="input" value={loginForm.email} onChange={(e) => setLoginForm((s) => ({ ...s, email: e.target.value }))} />
            </div>
            <div className="field">
              <label>Password</label>
              <input className="input" type="password" value={loginForm.password} onChange={(e) => setLoginForm((s) => ({ ...s, password: e.target.value }))} />
            </div>
            <div className="btnRow">
              <button className="btn btnPrimary" onClick={onLogin}>
                Login
              </button>
              <button className="btn" onClick={() => setTab('forgot')}>
                Am uitat parola
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'forgot' && !auth.isAuthed && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="cardTitle">Am uitat parola</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Introdu emailul și vei primi un link pentru resetarea parolei.
          </div>
          <div className="form" style={{ marginTop: 10 }}>
            <div className="field">
              <label>Email</label>
              <input className="input" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            </div>
            <div className="btnRow">
              <button className="btn btnPrimary" disabled={forgotPasswordCall.loading} onClick={() => forgotPasswordCall.call(onForgotPassword)}>
                Trimite link
              </button>
              <button className="btn" disabled={forgotPasswordCall.loading} onClick={() => setTab('login')}>
                Înapoi
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'register' && !auth.isAuthed && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="cardTitle">Create account</div>
          <div className="form" style={{ marginTop: 10 }}>
            <div className="field">
              <label>Name</label>
              <input className="input" value={registerForm.name} onChange={(e) => setRegisterForm((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" value={registerForm.email} onChange={(e) => setRegisterForm((s) => ({ ...s, email: e.target.value }))} />
            </div>
            <div className="field">
              <label>Password</label>
              <input className="input" type="password" value={registerForm.password} onChange={(e) => setRegisterForm((s) => ({ ...s, password: e.target.value }))} />
            </div>
            <div className="field">
              <label>Phone (MD)</label>
              <input className="input" value={registerForm.phone} onChange={(e) => setRegisterForm((s) => ({ ...s, phone: e.target.value }))} />
            </div>
            <div className="field">
              <label>Age</label>
              <input className="input" value={registerForm.age} onChange={(e) => setRegisterForm((s) => ({ ...s, age: e.target.value }))} />
            </div>
            <div className="field">
              <label>Role</label>
              <select className="input" value={registerForm.role} onChange={(e) => setRegisterForm((s) => ({ ...s, role: e.target.value }))}>
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="manager">manager</option>
              </select>
            </div>
            {registerForm.role === 'manager' && (
              <div className="field">
                <label>Department</label>
                <input className="input" value={registerForm.department} onChange={(e) => setRegisterForm((s) => ({ ...s, department: e.target.value }))} />
              </div>
            )}
            <div className="btnRow">
              <button className="btn btnPrimary" onClick={onRegister}>
                Register
              </button>
            </div>
            <div className="muted">After register, verify email before login.</div>
          </div>
        </div>
      )}

      {tab === 'verify' && !auth.isAuthed && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="cardTitle">Verify email</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Open the verification link from your email (or backend console). You will be verified automatically and redirected back.
          </div>

          <div className="cardTitle" style={{ marginTop: 14 }}>Resend verification</div>
          <div className="form" style={{ marginTop: 10 }}>
            <div className="field">
              <label>Email</label>
              <input className="input" value={resendEmail} onChange={(e) => setResendEmail(e.target.value)} />
            </div>
            <div className="btnRow">
              <button className="btn" onClick={onResend}>
                Resend
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'profile' && auth.isAuthed && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="cardTitle">Profile</div>
          <div className="muted" style={{ marginTop: 6 }}>
            {auth.user?.email} · role: {auth.user?.role}
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            Email verified: {String(auth.user?.isEmailVerified ?? 'unknown')}
          </div>

          <div className="resultSpacer" />

          <div className="cardTitle">Date personale</div>
          <div className="form" style={{ marginTop: 10 }}>
            <div className="field">
              <label>Name</label>
              <input className="input" value={profileForm.name} onChange={(e) => setProfileForm((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" value={profileForm.email} onChange={(e) => setProfileForm((s) => ({ ...s, email: e.target.value }))} />
            </div>
            <div className="field">
              <label>Phone (MD)</label>
              <input className="input" value={profileForm.phone} onChange={(e) => setProfileForm((s) => ({ ...s, phone: e.target.value }))} />
            </div>
            <div className="field">
              <label>Age</label>
              <input className="input" inputMode="numeric" value={profileForm.age} onChange={(e) => setProfileForm((s) => ({ ...s, age: e.target.value }))} />
            </div>
            <div className="muted">Rolul nu poate fi modificat din profil.</div>
            <div className="btnRow" style={{ marginTop: 10 }}>
              <button className="btn btnPrimary" disabled={profileSaveCall.loading} onClick={() => profileSaveCall.call(onSaveProfile)}>
                Salvează
              </button>
              <button className="btn" disabled={profileLoadCall.loading} onClick={() => {
                profileLoadCall.reset?.()
                profileLoadCall.call(async () => {
                  const res = await api.get(`/users/profile/${auth.user.id}`, { headers: authHeaders })
                  const data = unwrapApiData(res)
                  setProfileForm({ name: data?.name || '', email: data?.email || '', phone: data?.phone || '', age: data?.age ?? '' })
                  return data
                })
              }}>
                Reîncarcă
              </button>
            </div>
          </div>

          <div className="resultSpacer" />

          <div className="cardTitle">Schimbă parola</div>
          <div className="form" style={{ marginTop: 10 }}>
            <div className="field">
              <label>Parola curentă</label>
              <input className="input" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((s) => ({ ...s, currentPassword: e.target.value }))} />
            </div>
            <div className="field">
              <label>Parola nouă</label>
              <input className="input" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((s) => ({ ...s, newPassword: e.target.value }))} />
            </div>
            <div className="field">
              <label>Confirmă parola</label>
              <input className="input" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((s) => ({ ...s, confirmPassword: e.target.value }))} />
            </div>
            <div className="btnRow" style={{ marginTop: 10 }}>
              <button className="btn btnPrimary" disabled={changePasswordCall.loading} onClick={() => changePasswordCall.call(onChangePassword)}>
                Schimbă parola
              </button>
            </div>
          </div>

          <div className="resultSpacer" />

          <div className="cardTitle">Șterge cont</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Ștergerea contului va elimina datele tale (comenzi/recenzii). Vei primi și un email de confirmare.
          </div>
          <div className="btnRow" style={{ marginTop: 10 }}>
            <button className="btn" onClick={onDeleteAccount}>
              Șterge contul
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
