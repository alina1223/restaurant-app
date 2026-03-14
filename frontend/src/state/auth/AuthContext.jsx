import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, unwrapApiData } from '../../utils/apiClient'

const AuthContext = createContext(null)

const STORAGE_KEY = 'restaurantApp.auth'
const CART_KEY = 'restaurantApp.cart'

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = safeJsonParse(localStorage.getItem(STORAGE_KEY))
    if (saved?.token) {
      setToken(saved.token)
      setUser(saved.user || null)
    }

    const savedCart = safeJsonParse(localStorage.getItem(CART_KEY))
    if (savedCart) setCart(savedCart)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    if (!token) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(CART_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
  }, [ready, token, user])

  useEffect(() => {
    if (!ready) return
    if (!token) {
      localStorage.removeItem(CART_KEY)
      return
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [ready, token, cart])

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    const data = unwrapApiData(res)
    setToken(data?.token || null)
    setUser(data?.user || null)
    return data
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      setToken(null)
      setUser(null)
      setCart(null)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(CART_KEY)
    }
  }

  async function verifyToken() {
    if (!token) return null
    const res = await api.get('/auth/verify-token', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = unwrapApiData(res)
    setUser(data?.user || data || null)
    return data
  }

  async function addToCart(productId, quantity = 1) {
    if (!token) throw new Error('Not authenticated')
    const res = await api.post(
      '/users/cart/add',
      { productId: Number(productId), quantity: Number(quantity) },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = unwrapApiData(res)
    const newCart = data?.cart || null
    setCart(newCart)
    return newCart
  }

  const value = useMemo(
    () => ({
      ready,
      token,
      user,
      cart,
      setToken,
      setUser,
      setCart,
      login,
      logout,
      verifyToken,
      addToCart,
      isAuthed: Boolean(token),
      isAdmin: user?.role === 'admin'
    }),
    [ready, token, user, cart]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
