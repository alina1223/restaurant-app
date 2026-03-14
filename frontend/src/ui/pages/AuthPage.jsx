import { useMemo, useState } from 'react'
import { api } from '../../utils/apiClient'
import { useAuth } from '../../state/auth/AuthContext.jsx'
import ResultBox from '../components/ResultBox.jsx'
import { useCall } from '../components/useCall.js'

export default function AuthPage() {
  const auth = useAuth()

  const registerCall = useCall()
  const loginCall = useCall()
  const verifyEmailCall = useCall()
  const resendCall = useCall()
  const statusCall = useCall()
  const verifyTokenCall = useCall()
  const testEmailCall = useCall()

  const [registerForm, setRegisterForm] = useState({
    name: 'Test User',
    email: 'user@example.com',
    password: 'test123456',
    phone: '069123456',
    age: 25,
    role: 'user',
    department: ''
  })

  const [loginForm, setLoginForm] = useState({ email: 'user@example.com', password: 'test123456' })

  const [tokenToVerify, setTokenToVerify] = useState('')
  const [emailForResend, setEmailForResend] = useState('user@example.com')
  const [emailForStatus, setEmailForStatus] = useState('user@example.com')

  const registerBody = useMemo(() => {
    const body = { ...registerForm }
    body.age = Number(body.age)
    if (body.role !== 'manager') delete body.department
    if (body.role === 'manager' && !body.department) body.department = 'general'
    return body
  }, [registerForm])

  return (
    <div className="grid2">
      <section className="panel">
        <h2>POST /auth/register</h2>
        <div className="row">
          <label>Name</label>
          <input value={registerForm.name} onChange={(e) => setRegisterForm((s) => ({ ...s, name: e.target.value }))} />
        </div>
        <div className="row">
          <label>Email</label>
          <input value={registerForm.email} onChange={(e) => setRegisterForm((s) => ({ ...s, email: e.target.value }))} />
        </div>
        <div className="row">
          <label>Password</label>
          <input type="password" value={registerForm.password} onChange={(e) => setRegisterForm((s) => ({ ...s, password: e.target.value }))} />
        </div>
        <div className="row">
          <label>Phone (MD)</label>
          <input value={registerForm.phone} onChange={(e) => setRegisterForm((s) => ({ ...s, phone: e.target.value }))} />
        </div>
        <div className="row">
          <label>Age</label>
          <input value={registerForm.age} onChange={(e) => setRegisterForm((s) => ({ ...s, age: e.target.value }))} />
        </div>
        <div className="row">
          <label>Role</label>
          <select value={registerForm.role} onChange={(e) => setRegisterForm((s) => ({ ...s, role: e.target.value }))}>
            <option value="user">user</option>
            <option value="admin">admin</option>
            <option value="manager">manager</option>
          </select>
        </div>
        {registerForm.role === 'manager' && (
          <div className="row">
            <label>Department</label>
            <input value={registerForm.department} onChange={(e) => setRegisterForm((s) => ({ ...s, department: e.target.value }))} />
          </div>
        )}

        <div className="actions">
          <button disabled={registerCall.loading} onClick={() => registerCall.call(async () => (await api.post('/auth/register', registerBody)).data)}>
            Register
          </button>
        </div>
        {registerCall.error && <div className="hint">{registerCall.error}</div>}
        <ResultBox value={registerCall.result} />
        <div className="hint">Note: verification link is emailed or printed in backend console (simulation mode).</div>
      </section>

      <section className="panel">
        <h2>POST /auth/login</h2>
        <div className="row">
          <label>Email</label>
          <input value={loginForm.email} onChange={(e) => setLoginForm((s) => ({ ...s, email: e.target.value }))} />
        </div>
        <div className="row">
          <label>Password</label>
          <input type="password" value={loginForm.password} onChange={(e) => setLoginForm((s) => ({ ...s, password: e.target.value }))} />
        </div>
        <div className="actions">
          <button
            disabled={loginCall.loading}
            onClick={() =>
              loginCall.call(async () => {
                const data = await auth.login(loginForm.email, loginForm.password)
                return data
              })
            }
          >
            Login
          </button>
        </div>
        {loginCall.error && <div className="hint">{loginCall.error}</div>}
        <ResultBox value={loginCall.result} />
      </section>

      <section className="panel">
        <h2>POST /auth/verify-email</h2>
        <div className="hint">If you have a token from the verification link, paste it here.</div>
        <div className="row">
          <label>Token</label>
          <input value={tokenToVerify} onChange={(e) => setTokenToVerify(e.target.value)} />
        </div>
        <div className="actions">
          <button disabled={verifyEmailCall.loading} onClick={() => verifyEmailCall.call(async () => (await api.post('/auth/verify-email', { token: tokenToVerify })).data)}>
            Verify
          </button>
        </div>
        {verifyEmailCall.error && <div className="hint">{verifyEmailCall.error}</div>}
        <ResultBox value={verifyEmailCall.result} />
      </section>

      <section className="panel">
        <h2>POST /auth/resend-verification</h2>
        <div className="row">
          <label>Email</label>
          <input value={emailForResend} onChange={(e) => setEmailForResend(e.target.value)} />
        </div>
        <div className="actions">
          <button disabled={resendCall.loading} onClick={() => resendCall.call(async () => (await api.post('/auth/resend-verification', { email: emailForResend })).data)}>
            Resend
          </button>
        </div>
        {resendCall.error && <div className="hint">{resendCall.error}</div>}
        <ResultBox value={resendCall.result} />
      </section>

      <section className="panel">
        <h2>GET /auth/account-status/:email</h2>
        <div className="row">
          <label>Email</label>
          <input value={emailForStatus} onChange={(e) => setEmailForStatus(e.target.value)} />
        </div>
        <div className="actions">
          <button disabled={statusCall.loading} onClick={() => statusCall.call(async () => (await api.get(`/auth/account-status/${encodeURIComponent(emailForStatus)}`)).data)}>
            Check
          </button>
        </div>
        {statusCall.error && <div className="hint">{statusCall.error}</div>}
        <ResultBox value={statusCall.result} />
      </section>

      <section className="panel">
        <h2>GET /auth/verify-token</h2>
        <div className="hint">Requires Authorization: Bearer token.</div>
        <div className="actions">
          <button
            disabled={verifyTokenCall.loading || !auth.token}
            onClick={() =>
              verifyTokenCall.call(async () => {
                const data = await auth.verifyToken()
                return data
              })
            }
          >
            Verify token
          </button>
        </div>
        {!auth.token && <div className="hint">Login first to get a token.</div>}
        {verifyTokenCall.error && <div className="hint">{verifyTokenCall.error}</div>}
        <ResultBox value={verifyTokenCall.result} />
      </section>

      <section className="panel">
        <h2>POST /auth/test-email</h2>
        <div className="hint">Debug endpoint; does not require auth.</div>
        <div className="actions">
          <button disabled={testEmailCall.loading} onClick={() => testEmailCall.call(async () => (await api.post('/auth/test-email', {})).data)}>
            Call
          </button>
        </div>
        {testEmailCall.error && <div className="hint">{testEmailCall.error}</div>}
        <ResultBox value={testEmailCall.result} />
      </section>
    </div>
  )
}
