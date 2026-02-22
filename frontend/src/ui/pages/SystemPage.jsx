import { useState } from 'react'
import ResultBox from '../components/ResultBox.jsx'
import { useCall } from '../components/useCall.js'
import { api } from '../../utils/apiClient'

export default function SystemPage() {
  const health = useCall()
  const root = useCall()
  const testRegister = useCall()

  const [testEmail, setTestEmail] = useState('test@example.com')

  return (
    <div className="grid2">
      <section className="panel">
        <h2>GET /health</h2>
        <div className="actions">
          <button disabled={health.loading} onClick={() => health.call(async () => (await api.get('/health')).data)}>
            Call
          </button>
        </div>
        {health.error && <div className="hint">{health.error}</div>}
        <ResultBox value={health.result} />
      </section>

      <section className="panel">
        <h2>GET /</h2>
        <div className="hint">API root returns documentation JSON.</div>
        <div className="actions">
          <button disabled={root.loading} onClick={() => root.call(async () => (await api.get('/')).data)}>
            Call
          </button>
        </div>
        {root.error && <div className="hint">{root.error}</div>}
        <ResultBox value={root.result} />
      </section>

      <section className="panel">
        <h2>POST /test-register</h2>
        <div className="hint">Quick registration helper from backend (prints verification link in backend console).</div>

        <div className="row">
          <label>Email</label>
          <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
        </div>

        <div className="actions">
          <button
            disabled={testRegister.loading}
            onClick={() =>
              testRegister.call(async () =>
                (
                  await api.post('/test-register', {
                    email: testEmail,
                    password: 'test123456',
                    name: 'Test User',
                    phone: '069123456',
                    age: 25
                  })
                ).data
              )
            }
          >
            Call
          </button>
        </div>

        {testRegister.error && <div className="hint">{testRegister.error}</div>}
        <ResultBox value={testRegister.result} />
      </section>
    </div>
  )
}
