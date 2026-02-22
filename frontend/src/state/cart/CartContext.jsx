import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'restaurantApp.cart'

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    const saved = safeJsonParse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(saved)) setItems(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function add(product, quantity = 1) {
    const qty = Number(quantity) || 1
    setItems((prev) => {
      const existing = prev.find((it) => it.product.id === product.id)
      if (existing) {
        return prev.map((it) => (it.product.id === product.id ? { ...it, quantity: it.quantity + qty } : it))
      }
      return [...prev, { product, quantity: qty }]
    })
  }

  function remove(productId) {
    setItems((prev) => prev.filter((it) => it.product.id !== productId))
  }

  function clear() {
    setItems([])
  }

  const count = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
  const total = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.product.price) || 0), 0)

  const value = useMemo(() => ({ items, add, remove, clear, count, total }), [items, count, total])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
