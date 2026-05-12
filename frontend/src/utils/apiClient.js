import axios from 'axios'


let baseURL = import.meta.env.VITE_API_BASE_URL || ''

// In development, if baseURL is not set, use localhost:3000
if (!baseURL && (import.meta.env.DEV || window.location.port === '5173')) {
  baseURL = 'http://localhost:3000'
}

export const api = axios.create({
  baseURL,
  timeout: 20000
})

// Attach Authorization header automatically from stored auth object
api.interceptors.request.use(
  (config) => {
    try {
      const saved = JSON.parse(localStorage.getItem('restaurantApp.auth') || 'null')
      const token = saved?.token
      if (token) {
        config.headers = config.headers || {}
        // don't overwrite if already provided
        if (!config.headers.Authorization && !config.headers['Authorization']) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    } catch (err) {
      // ignore
    }
    return config
  },
  (error) => Promise.reject(error)
)


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

export function getImageUrl(imagePath) {
  if (!imagePath) return null
  if (imagePath.startsWith('http')) return imagePath
  if (imagePath.startsWith('data:')) return imagePath
  
  // Use the API's configured baseURL
  const baseURL = api.defaults.baseURL
  if (baseURL) {
    const url = `${baseURL}${imagePath}`
    console.log('[getImageUrl] Using api.defaults.baseURL:', { imagePath, baseURL, url })
    return url
  }
  
  // Fallback: should not reach here if apiClient is configured correctly
  console.warn('[getImageUrl] No baseURL configured!', { imagePath })
  return imagePath
}
