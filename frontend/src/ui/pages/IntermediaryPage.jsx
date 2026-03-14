import { useState } from 'react'
import { api } from '../../utils/apiClient'
import ResultBox from '../components/ResultBox.jsx'
import { useCall } from '../components/useCall.js'

export default function IntermediaryPage() {
  const healthCall = useCall()
  const infoCall = useCall()
  const fetchCall = useCall()
  const transformCall = useCall()

  const [fetchBodyText, setFetchBodyText] = useState(
    JSON.stringify(
      {
        url: 'https://jsonplaceholder.typicode.com/todos/1',
        method: 'GET',
        headers: {},
        data: {}
      },
      null,
      2
    )
  )

  const [transformBodyText, setTransformBodyText] = useState(
    JSON.stringify(
      {
        data: [{ a: 1 }, null, { a: 2 }],
        operation: 'filter'
      },
      null,
      2
    )
  )

  return (
    <div className="grid2">
      <section className="panel">
        <h2>GET /api/intermediary/health</h2>
        <div className="actions">
          <button disabled={healthCall.loading} onClick={() => healthCall.call(async () => (await api.get('/api/intermediary/health')).data)}>
            Call
          </button>
        </div>
        {healthCall.error && <div className="hint">{healthCall.error}</div>}
        <ResultBox value={healthCall.result} />
      </section>

      <section className="panel">
        <h2>GET /api/intermediary/info</h2>
        <div className="actions">
          <button disabled={infoCall.loading} onClick={() => infoCall.call(async () => (await api.get('/api/intermediary/info')).data)}>
            Call
          </button>
        </div>
        {infoCall.error && <div className="hint">{infoCall.error}</div>}
        <ResultBox value={infoCall.result} />
      </section>

      <section className="panel">
        <h2>POST /api/intermediary/fetch</h2>
        <div className="row">
          <label>Body (JSON)</label>
          <textarea value={fetchBodyText} onChange={(e) => setFetchBodyText(e.target.value)} />
        </div>
        <div className="actions">
          <button
            disabled={fetchCall.loading}
            onClick={() =>
              fetchCall.call(async () => {
                const body = JSON.parse(fetchBodyText || '{}')
                return (await api.post('/api/intermediary/fetch', body)).data
              })
            }
          >
            Fetch
          </button>
        </div>
        {fetchCall.error && <div className="hint">{fetchCall.error}</div>}
        <ResultBox value={fetchCall.result} />
      </section>

      <section className="panel">
        <h2>POST /api/intermediary/transform</h2>
        <div className="row">
          <label>Body (JSON)</label>
          <textarea value={transformBodyText} onChange={(e) => setTransformBodyText(e.target.value)} />
        </div>
        <div className="actions">
          <button
            disabled={transformCall.loading}
            onClick={() =>
              transformCall.call(async () => {
                const body = JSON.parse(transformBodyText || '{}')
                return (await api.post('/api/intermediary/transform', body)).data
              })
            }
          >
            Transform
          </button>
        </div>
        {transformCall.error && <div className="hint">{transformCall.error}</div>}
        <ResultBox value={transformCall.result} />
      </section>
    </div>
  )
}
