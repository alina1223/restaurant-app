import { useState } from 'react'
import { formatAxiosError } from '../../utils/apiClient'

export function useCall() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function call(fn) {
    setLoading(true)
    setError(null)
    try {
      const data = await fn()
      setResult(data)
      return data
    } catch (e) {
      setError(formatAxiosError(e))
      setResult(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { loading, result, error, call, setResult }
}
