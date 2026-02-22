function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function formatCell(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v)
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

function collectColumns(rows) {
  const set = new Set()
  for (const row of rows) {
    if (!isPlainObject(row)) continue
    for (const key of Object.keys(row)) set.add(key)
  }
  return Array.from(set)
}

function Table({ rows }) {
  const safeRows = Array.isArray(rows) ? rows : []
  const cols = collectColumns(safeRows)
  if (!cols.length) return <div className="resultEmpty">—</div>

  return (
    <div className="resultTableWrap">
      <table className="resultTable">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeRows.map((r, idx) => (
            <tr key={idx}>
              {cols.map((c) => (
                <td key={c}>{formatCell(isPlainObject(r) ? r[c] : '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function KeyValue({ obj }) {
  const entries = Object.entries(obj || {}).filter(([, v]) => !Array.isArray(v))
  if (!entries.length) return null
  return (
    <dl className="resultKV">
      {entries.map(([k, v]) => (
        <div className="resultKVRow" key={k}>
          <dt>{k}</dt>
          <dd>{formatCell(v)}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function ResultBox({ title = 'Result', value }) {
  let message = ''
  let data = value

  if (isPlainObject(value) && 'data' in value && ('success' in value || 'statusCode' in value)) {
    message = typeof value.message === 'string' ? value.message : ''
    data = value.data
  }

  const empty = data === undefined || data === null || (typeof data === 'string' && data.trim() === '')

  let body = null

  if (Array.isArray(data)) {
    const allObjects = data.every((x) => isPlainObject(x))
    body = allObjects ? <Table rows={data} /> : <div className="resultText">{data.map(formatCell).join('\n') || '—'}</div>
  } else if (isPlainObject(data)) {
    
    const arrayKeys = Object.keys(data).filter((k) => Array.isArray(data[k]))
    if (arrayKeys.length) {
      body = (
        <>
          <KeyValue obj={data} />
          {arrayKeys.map((k, idx) => (
            <div key={k}>
              <div className="resultSpacer" />
              <div className="resultSubTitle">{k}</div>
              <Table rows={data[k]} />
              {idx === arrayKeys.length - 1 ? null : <div className="resultSpacer" />}
            </div>
          ))}
        </>
      )
    } else {
      body = <KeyValue obj={data} />
    }
  } else {
    body = <div className="resultText">{empty ? '—' : formatCell(data)}</div>
  }

  return (
    <div className="result" aria-label={title}>
      {message ? <div className="resultMessage">{message}</div> : null}
      {body}
    </div>
  )
}
