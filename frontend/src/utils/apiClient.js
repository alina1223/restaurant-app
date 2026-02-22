import axios from 'axios'


const baseURL = import.meta.env.VITE_API_BASE_URL || ''

export const api = axios.create({
  baseURL,
  timeout: 20000
})


export function unwrapApiData(response) {
 
  const payload = response?.data
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data
  return payload
}

export function formatAxiosError(error) {
  if (!error) return 'Unknown error'


  const status = error.response?.status
  const data = error.response?.data

  if (status) {
    const serverMsg =
      typeof data === 'string'
        ? data
        : data?.message || data?.error || JSON.stringify(data)

    return `HTTP ${status}: ${serverMsg}`
  }

  return error.message || String(error)
}
