# Raport - Frontend Restaurant Application

## Ministerul Educației Culturii și Cercetării al Republicii Moldova
## Universitatea Tehnică a Moldovei

### Raport
**Asistență pentru programarea client-side (Frontend) a site Web**

**Elevul:** Rotari Alina  
**Grupa:** AAW-221  
**Specialitatea:** Administrarea aplicațiilor WEB  
**Profesor:** Moraru Magdalena  
**Chișinău 2025**

---

## Cuprins

1. [Introducere și Obiective](#1-introducere-și-obiective)
2. [Setarea Mediului Frontend - Vite și React](#2-setarea-mediului-frontend---vite-și-react)
3. [Structura Proiectului Frontend](#3-structura-proiectului-frontend)
4. [Dependințe și Configurare](#4-dependințe-și-configurare)
5. [Rutare și Navigare](#5-rutare-și-navigare)
6. [Gestionarea Stării cu Context API](#6-gestionarea-stării-cu-context-api)
7. [Comunicarea cu API-ul Backend](#7-comunicarea-cu-api-ul-backend)
8. [Pagini Principale și Componentele Lor](#8-pagini-principale-și-componentele-lor)
9. [Autentificare și Autorizare](#9-autentificare-și-autorizare)
10. [Gestionarea Coșului de Cumpărături](#10-gestionarea-coșului-de-cumpărături)
11. [Panou Administrator](#11-panou-administrator)
12. [Styling și Interfața Utilizatorului](#12-styling-și-interfața-utilizatorului)
13. [Testare și Validare Frontend](#13-testare-și-validare-frontend)
14. [Concluzie](#14-concluzie)

---

## 1. Introducere și Obiective

### 1.1 Scopul Laboratorului

Laboratorul de frontend pentru aplicația Restaurant are următoarele obiective:

1. **Crearea unei aplicații React funcționale** cu interfață responsive și intuitiva
2. **Gestionarea stării aplicației** folosind Context API pentru autentificare și coș de cumpărături
3. **Comunicarea cu API-ul backend** prin HTTP (axios) cu tratare corectă a erorilor
4. **Implementarea rutării** pentru navigarea între diferite pagini/secțiuni
5. **Separarea responsabilităților** între componente reutilizabile și pagini specifice
6. **Validarea datelor introduse** de utilizatori înainte de trimitere la server
7. **Testarea interactivă** a funcționalităților frontend prin interfața utilizator

### 1.2 Fluxul Aplicației

```
START → Layout (navbar + routing)
  ↓
  ├─→ HomePage (prezentare generală)
  ├─→ MenuPage (lista produse + filtrare + admin edit)
  ├─→ ProductPage (detalii produs + recenzii + adaugă în coș)
  ├─→ CartPage (coș local + sincronizare backend)
  ├─→ CheckoutPage (finalizare comandă)
  ├─→ AccountPage (login, register, profil, schimbare parolă)
  ├─→ AdminPage (CRUD produse, utilizatori, import/export, proxy)
  └─→ VerifyEmailPage, ResetPasswordPage (fluxuri auxiliare)
```

---

## 2. Setarea Mediului Frontend - Vite și React

### 2.1 Ce este Vite?

**Vite** este o unealtă modernă de build și development server pentru aplicații frontend JavaScript/TypeScript.

**Avantaje Vite:**
- **Hot Module Replacement (HMR)** - actualizare instantanee a browserului la orice schimbare de cod
- **Build rapid** - optimizare pentru development și production
- **Es Module nativ** - suporta modulele ES direct
- **Zero-config** pentru proiecte simple

### 2.2 Inițializarea Proiectului

Proiectul frontend a fost inițializat cu Vite și React:

```bash
npm install react react-dom react-router-dom
npm install axios
npm install --save-dev @vitejs/plugin-react vite eslint
```

**Pachetele instalate:**

1. **react** și **react-dom** - biblioteca React și DOM renderer
2. **react-router-dom** - rutare client-side pentru navigare între pagini
3. **axios** - client HTTP pentru comunicarea cu backend
4. **vite** - build tool și dev server
5. **@vitejs/plugin-react** - plugin Vite pentru React (JSX support)

### 2.3 Fișierul vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/products': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/admin': 'http://localhost:3000',
      '/api': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/test-register': 'http://localhost:3000'
    }
  }
})
```

**Explicație:**

- **plugins: [react()]** - activează suportul JSX cu plugin-ul React
- **server.proxy** - redirecționează cereri către `/auth`, `/products`, etc. la backend-ul rulând pe `http://localhost:3000`

Aceasta permite frontend-ul (rulând pe `http://localhost:5173` în dev) să comunice ușor cu backend-ul.

### 2.4 Pornirea Proiectului

```bash
# Development
npm run dev       # Porneste Vite dev server (localhost:5173)

# Production
npm run build     # Creează build optimizat în dist/
npm run preview   # Previzualizează build-ul în local
```

---

## 3. Structura Proiectului Frontend

### 3.1 Ierarhia Fișierelor

```
frontend/
├── public/                    # Resurse statice
├── src/
│   ├── main.jsx              # Entry point - bootstrap React + providers
│   ├── App.jsx               # Component principal cu rute
│   ├── App.css               # Stiluri globale
│   ├── index.css             # CSS inițial
│   ├── state/                # Gestionare stare (Context API)
│   │   ├── auth/
│   │   │   └── AuthContext.jsx    # Context autentificare + user + cart
│   │   └── cart/
│   │       └── CartContext.jsx    # Context coș cumpărături
│   ├── ui/                   # Componente UI și pagini
│   │   ├── Layout.jsx        # Navbar + routing wrapper
│   │   ├── components/       # Componente reutilizabile
│   │   │   ├── ResultBox.jsx      # Afișare rezultate (tabele/obiecte)
│   │   │   └── useCall.js         # Hook pentru apeluri API
│   │   └── pages/            # Pagini complete
│   │       ├── HomePage.jsx
│   │       ├── MenuPage.jsx
│   │       ├── ProductPage.jsx
│   │       ├── CartPage.jsx
│   │       ├── CheckoutPage.jsx
│   │       ├── AccountPage.jsx
│   │       ├── AdminPage.jsx
│   │       ├── VerifyEmailPage.jsx
│   │       ├── ResetPasswordPage.jsx
│   │       └── ... alte pagini
│   ├── utils/                # Utilitare
│   │   └── apiClient.js      # Configurare axios + helpers
│   └── assets/               # Imagini, icoane, etc.
├── index.html                # Template HTML
├── package.json
├── vite.config.js
└── eslint.config.js
```

### 3.2 Ideologia Structurii

- **state/** - Stare globală (Context API)
- **ui/pages/** - Pagini complete, gestionează logica specifică
- **ui/components/** - Componente reutilizabile și hooks
- **utils/** - Funcții helper, configurări
- **assets/** - Resurse statice

---

## 4. Dependințe și Configurare

### 4.1 package.json - Frontend

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.13.5",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.13.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.1",
    "vite": "^7.3.1"
  }
}
```

**Explicație:**

- **"type": "module"** - activează ES modules nativ (import/export)
- **axios** - client HTTP
- **react-router-dom** - rutare client-side
- **vite** și plugin-urile - build tool

### 4.2 apiClient.js - Configurare Axios

```javascript
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

export const api = axios.create({
  baseURL,
  timeout: 20000  // 20 secunde timeout
})

export function unwrapApiData(response) {
  const payload = response?.data
  if (payload && typeof payload === 'object' && 'data' in payload) 
    return payload.data
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
```

**Componentele apiClient - Explicații detaliate:**

1. **api** - instanța axios cu timeout de 20 secunde
   - `baseURL` - setează URL-ul de bază pentru toate cererile (din variabila de mediu)
   - `timeout: 20000` - dacă backend nu răspunde în 20 secunde, cererea se anulează și se returnează eroare
   - Toți metodele (get, post, put, delete) vor folosi această bază
   
2. **unwrapApiData()** - extrage `data` din răspunsul structurat al backend-ului
   - Backend-ul returnează răspunsuri cu structura: `{ success, statusCode, message, data, errors }`
   - Această funcție extrage direct câmpul `data` pentru a simplifica lucrul cu date
   - Exemplu: dacă backend răspunde cu `{ data: { id: 1, name: 'Pizza' }, ... }`, funcția returnează doar `{ id: 1, name: 'Pizza' }`
   - Dacă răspunsul nu are structura așteptată, returnează întregul payload
   
3. **formatAxiosError()** - formatează erorile Axios în text citeț
   - Extrage status HTTP și mesajul de eroare din răspunsul backend
   - Combină status code cu mesaj pentru a oferi informații complete
   - Utilizat în try-catch blocks pentru a afișa mesaje de eroare prietenoase utilizatorului

---

## 5. Rutare și Navigare

### 5.1 React Router Setup - main.jsx

```javascript
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './state/auth/AuthContext.jsx'
import { CartProvider } from './state/cart/CartContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

**Ierarhie Providers:**

```
BrowserRouter (gestionează URL-uri)
  ↓
AuthProvider (stare autentificare)
  ↓
CartProvider (stare coș)
  ↓
App (componentă principală)
```

### 5.2 App.jsx - Definirea Rutelor

```javascript
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './ui/Layout.jsx'

// Import pagini...

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        
        {/* Redirecturi */}
        <Route path="/dashboard" element={<Navigate to="/menu" replace />} />
        <Route path="/login" element={<Navigate to="/account" replace />} />
        
        {/* Default - 404 catch-all */}
        <Route path="*" element={<Navigate to="/menu" replace />} />
      </Route>
    </Routes>
  )
}
```

**Explicație:**

- **`<Layout />`** - toate rutele sunt wrapped în Layout, deci navbar apare pe toate paginile
- **`path="/products/:id"`** - rută parametrizată pentru detaliile produsului
- **`<Navigate to="/menu" replace />`** - redirecturi pentru rute neexistente

### 5.3 Layout.jsx - Navbar și Routing

```javascript
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext.jsx'
import { useCart } from '../state/cart/CartContext.jsx'

export default function Layout() {
  const auth = useAuth()
  const cart = useCart()

  return (
    <div className="appShell appTheme">
      <nav className="topNav">
        <div className="brand">Restaurant</div>

        <NavLink to="/">Home</NavLink>
        <NavLink to="/menu">Menu</NavLink>
        <NavLink to="/cart">Cart ({cart.count})</NavLink>
        <NavLink to="/account">Account</NavLink>
        {auth.isAdmin && <NavLink to="/admin">Admin</NavLink>}

        <div className="navRight">
          {auth.isAuthed ? (
            <>
              <span className="pill">
                {auth.user?.name || auth.user?.email || 'User'}
              </span>
              <button className="smallButton" onClick={auth.logout}>
                Logout
              </button>
            </>
          ) : (
            <span className="pill">Not logged in</span>
          )}
        </div>
      </nav>

      <Outlet />  {/* Randează pagina curentă */}
    </div>
  )
}
```

**Explicații detaliate:**

1. **Navbar persistent** - apare pe toate paginile
   - `<Layout />` este wrapper pentru toate rutele definite în App.jsx
   - Navbar rămâne vizibil indiferent care pagină e deschisă
   - Stilul `display: flex` cu `justify-content: space-between` aliniază nav items la stânga și butoanele la dreapta

2. **NavLink** - marca clasa "active" la ruta curentă
   - `<NavLink to="/menu">Menu</NavLink>` - routează la /menu și primește automat clasa "active" când URL-ul e /menu
   - CSS-ul stilizează `.active` cu culoare diferită pentru a indica pagina curentă
   - React Router compară URL-ul curent cu atributul `to` și marchează link-ul ca active

3. **Condiții rendering** - "Admin" link doar dacă utilizatorul e admin
   - `{auth.isAdmin && <NavLink to="/admin">Admin</NavLink>}`
   - `auth.isAdmin` este derivat din `user?.role === 'admin'` din AuthContext
   - Link-ul Admin apare DOAR dacă utilizatorul e conectat ȘI rolul lui e admin

4. **Logout button** - apare doar dacă utilizator autentificat
   - Ternary operator: dacă `auth.isAuthed` (adică `token` e setat), afișează nume utilizatorului + logout button
   - Dacă nu e autentificat, afișează "Not logged in"
   - `onClick={auth.logout}` apelează funcția logout din AuthContext care șterge token și user

5. **`<Outlet />`** - placeholder pentru pagina curentă
   - Este provided de React Router
   - Randează componenta paginii curente în locul acelui element
   - Permite Layout (navbar) să rămână constant în timp ce conținutul paginii se schimbă

---

## 6. Gestionarea Stării cu Context API

### 6.1 AuthContext - Autentificare și Utilizator

**Locație:** `src/state/auth/AuthContext.jsx`

#### Structura Context-ului

```javascript
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, unwrapApiData } from '../../utils/apiClient'

const AuthContext = createContext(null)

const STORAGE_KEY = 'restaurantApp.auth'
const CART_KEY = 'restaurantApp.cart'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState(null)
  const [ready, setReady] = useState(false)

  // Persistență localStorage - CICLU 1: Inițializare la mount
  useEffect(() => {
    // 1. Extrage datele salvate din localStorage
    const saved = safeJsonParse(localStorage.getItem(STORAGE_KEY))
    // 2. Dacă există token salvat, restabilește starea de autentificare
    if (saved?.token) {
      setToken(saved.token)      // Setează token JWT
      setUser(saved.user || null) // Setează datele utilizatorului
    }

    // 3. Restabilește și coșul din localStorage
    const savedCart = safeJsonParse(localStorage.getItem(CART_KEY))
    if (savedCart) setCart(savedCart)
    
    // 4. Marchează că inițializarea e completă (evită re-salvări inutile)
    setReady(true)
  }, [])  // [] = se rulează o singură dată la mount

  // Persistență localStorage - CICLU 2: Salvare la schimbări
  useEffect(() => {
    // 1. Nu face nimic până nu e inițializată (evită salvări parțiale)
    if (!ready) return
    
    // 2. Dacă utilizator face logout (token se șterge), elimină din localStorage
    if (!token) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(CART_KEY)
      return
    }
    
    // 3. Dacă utilizator e autentificat, salvează token și datele în localStorage
    // Asta permite ca reîncărcarea paginii să mențină sesiunea
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
  }, [ready, token, user])  // Se rulează când se schimbă ready, token sau user
```

#### Metode din AuthContext

```javascript
async function login(email, password) {
  // 1. Trimite cerere POST la backend cu email și parolă
  const res = await api.post('/auth/login', { email, password })
  // 2. Extrage datele din răspuns (unwrapApiData scoate direct 'data')
  const data = unwrapApiData(res)
  // 3. Salvează token JWT și datele utilizatorului în state
  // Salvarea automată în localStorage e declanșată de useEffect
  setToken(data?.token || null)
  setUser(data?.user || null)
  return data
}

async function logout() {
  try {
    // 1. Anunță backend-ul că utilizatorul se deconectează (curățare sesiuni, etc.)
    await api.post('/auth/logout')
  } finally {
    // 2. Șterge datele din state indiferent dacă cererea reușește
    // 'finally' asigură ștergerea chiar dacă backend e down
    setToken(null)
    setUser(null)
    setCart(null)
    // 3. Șterge din localStorage (localStorage effect va observa schimbarea)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CART_KEY)
  }
}

async function register(body) {
  // 1. Trimite cerere POST cu datele noul utilizator
  const res = await api.post('/auth/register', body)
  // 2. Returnează răspunsul (frontend-ul va afișa mesaj de succes)
  return unwrapApiData(res)
}

async function verifyToken() {
  // 1. Verifică dacă token-ul e încă valid (nu a expirat)
  if (!token) return null
  // 2. Trimite token în header Authorization
  const res = await api.get('/auth/verify-token', {
    headers: { Authorization: `Bearer ${token}` }
  })
  // 3. Extrage datele și actualiz starea
  const data = unwrapApiData(res)
  setUser(data?.user || data || null)
  return data
}

async function addToCart(productId, quantity) {
  // 1. Sincronizează coșul local cu backend (pentru utilizatori conectați)
  const res = await api.post(
    '/users/cart/add',
    { productId: Number(productId), quantity: Number(quantity) },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return unwrapApiData(res)
}
```

#### useAuth Hook

```javascript
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  
  return {
    token: ctx.token,
    user: ctx.user,
    cart: ctx.cart,
    ready: ctx.ready,
    isAuthed: !!ctx.token,
    isAdmin: ctx.user?.role === 'admin',
    
    login: ctx.login,
    logout: ctx.logout,
    register: ctx.register,
    setUser: ctx.setUser,
    addToCart: ctx.addToCart,
    verifyToken: ctx.verifyToken
  }
}
```

### 6.2 CartContext - Coș Cumpărături

**Locație:** `src/state/cart/CartContext.jsx`

```javascript
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'restaurantApp.cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  // Încarcă coșul din localStorage la inițializare
  useEffect(() => {
    const saved = safeJsonParse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(saved)) setItems(saved)
  }, [])

  // Salvează coșul în localStorage ori de câte ori se schimbă
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // Metode pentru manipularea coșului
  function add(product, quantity = 1) {
    // 1. Convertește quantity în număr (cu fallback la 1)
    const qty = Number(quantity) || 1
    // 2. Actualizează state folosind funcția updater
    setItems((prev) => {
      // 3. Caută dacă produsul deja există în coș
      const existing = prev.find((it) => it.product.id === product.id)
      if (existing) {
        // 4a. CALE 1: Produsul e deja în coș - incrementează cantitate
        // Folosim map pentru a crea nou array cu același produs dar cu cantitate actualizată
        return prev.map((it) =>
          it.product.id === product.id
            ? { ...it, quantity: it.quantity + qty }  // Adaugă la cantitate
            : it  // Alte produse rămân neschimbate
        )
      }
      // 4b. CALE 2: Produsul e nou - adaugă la array
      // Spread operator [...prev] păstrează produsele existente
      return [...prev, { product, quantity: qty }]
    })
  }

  function remove(productId) {
    // 1. Șterge din array produsul cu ID-ul dat
    // filter() păstrează doar produsele cu ID-uri diferite
    setItems((prev) => prev.filter((it) => it.product.id !== productId))
  }

  function clear() {
    // 1. Setează array-ul coșului la gol
    setItems([])
  }

  // Calculează total articole și preț
  const count = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
  // reduce() parcurge array-ul și cumulează (sumă) cantitățile
  
  const total = items.reduce(
    (sum, it) =>
      // Pentru fiecare produs: adaugă (cantitate * preț) la sum
      sum + (Number(it.quantity) || 0) * (Number(it.product.price) || 0),
    0  // Inițial sum = 0
  )

  const value = useMemo(
    () => ({ items, add, remove, clear, count, total }),
    [items, count, total]
  )

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
```

**Funcționalități:**

1. **add()** - adaugă produs la coș sau incrementează cantitate
2. **remove()** - șterge produs din coș
3. **clear()** - golește coșul complet
4. **count** - numărul total de articole
5. **total** - preț total

---

## 7. Comunicarea cu API-ul Backend

### 7.1 useCall Hook - Apeluri API Standardizate

**Locație:** `src/ui/components/useCall.js`

```javascript
import { useState } from 'react'
import { formatAxiosError } from '../../utils/apiClient'

export function useCall() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function call(fn) {
    // 1. Setează loading la true, șterge erori anterioare
    setLoading(true)
    setError(null)
    try {
      // 2. Apelează funcția asyncronă (de obicei o cerere API)
      const data = await fn()
      // 3. Dacă reușește, salvează rezultatul
      setResult(data)
      return data
    } catch (e) {
      // 4. Dacă eșuează, formatează eroarea în text citez
      setError(formatAxiosError(e))
      // 5. Șterge rezultatul anterior
      setResult(null)
      return null
    } finally {
      // 6. Se execută indiferent de succes/eșec - setează loading la false
      setLoading(false)
    }
  }

  // Returnează hook-ul cu state și funcția call
  // Componenta folosind hook-ul poate apela: useCall().call(async () => {...})
  return { loading, result, error, call, setResult }
}
```

**Utilizare:**

```javascript
const profileLoadCall = useCall()

// Utilizare în useEffect - apelează o funcție asyncronă
profileLoadCall.call(async () => {
  // 1. useCall setează loading = true, error = null
  
  // 2. Apelează endpoint-ul
  const res = await api.get(`/users/profile/${auth.user.id}`, 
    { headers: authHeaders })
  
  // 3. Extrage datele
  const data = unwrapApiData(res)
  
  // 4. Setează formul cu datele din server
  setProfileForm({
    name: data?.name || '',
    email: data?.email || '',
    phone: data?.phone || '',
    age: data?.age ?? ''
  })
  
  // 5. Returnează datele (useCall le salvează în result)
  return data
})

// Accesare state după call
if (profileLoadCall.loading) return <div>Loading...</div>  // Afișează loading
if (profileLoadCall.error) return <div>{profileLoadCall.error}</div>  // Afișează eroare
return <div>{profileLoadCall.result?.name}</div>  // Afișează rezultat

// Resetare result
profileLoadCall.setResult(null)  // Șterge datele încărcate anterior
```

**De ce useCall e util?**
- Elimină repetarea de cod (loading, error, result sunt la fel în toate componentele)
- Standardizează gestionarea stării asyncrone
- Simplifica try-catch + state management

### 7.2 Tipuri de Apeluri API

#### GET - Preluare Date

```javascript
// Obține lista de produse
const res = await api.get('/products/list')
// res.data are structura: { success, data, message, statusCode }
// Extrage direct 'data' care e un array de produse
const products = unwrapApiData(res)

// Cu parametri (query string)
const res = await api.get('/products/search', {
  params: {
    // Vite proxy + axios transformă asta în URL: /products/search?name=pizza&minPrice=100
    name: 'pizza',
    minPrice: 100,
    maxPrice: 500
  }
})
const filtered = unwrapApiData(res)
```

**Explicație: Ce se trimite în request?**
- URL-ul devine: `/products/search?name=pizza&minPrice=100&maxPrice=500`
- Backend-ul parsează query parameters cu `req.query`
- Returnează lista de produse care respectă filtrele

#### POST - Creare Date

```javascript
// Login - trimite credențiale
const res = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'secret'
})
const auth_data = unwrapApiData(res)  // { token, user }

// Cu headers (token JWT)
// Dacă utilizatorul e conectat, trebuie să trimit token în header Authorization
const res = await api.post('/users/cart/add',
  { productId: 1, quantity: 2 },  // Body-ul cererii
  {
    headers: {
      // Standard Authorization header cu schema Bearer
      Authorization: `Bearer ${auth.token}`
    }
  }
)
const result = unwrapApiData(res)
```

**Explicație: Structura POST request**
- Body: `{ productId: 1, quantity: 2 }` - datele de trimis la server
- Headers: `{ Authorization: 'Bearer token...' }` - autentificare JWT
- Backend parsează body cu `req.body`
- Verifică token din header `req.headers.authorization`

#### PUT - Actualizare Completă

```javascript
// Actualizează TOATE câmpurile utilizatorului
// Dacă un câmp nu e trimis, poate fi șters sau resetat la server
const res = await api.put(
  `/users/edit/${userId}`,
  {
    // TREBUIE trimise TOATE câmpurile
    name: 'Nume Nou',
    email: 'new@email.com',
    phone: '0701234567',
    age: 25
  },
  { headers: { Authorization: `Bearer ${token}` } }
)
const updated = unwrapApiData(res)
```

**Diferența dintre PUT și PATCH:**
- **PUT**: Trimite **TOȚI** parametrii (înlocuire completă)
- **PATCH**: Trimite **DOAR** parametrii care se schimbă (actualizare parțială)
- Exemplu: dacă vrei sa schimbi doar prețul, cu PUT trebuie sa trimiti și celelalte câmpuri, cu PATCH doar prețul

#### PATCH - Actualizare Parțială

```javascript
// Actualizează DOAR prețul - nu e nevoie de alte câmpuri
const res = await api.patch(
  `/products/edit/${productId}`,
  { price: 350 },  // DOAR acest câmp se schimbă
  { headers: { Authorization: `Bearer ${token}` } }
)
const updated = unwrapApiData(res)

// Exemplu 2: Actualizează doar descrierea și stocul
const res2 = await api.patch(
  `/products/edit/${productId}`,
  {
    description: 'Descriere nouă',
    stock: 5
    // Nu trimitem name, price, category - ele rămân neschimbate
  },
  { headers: { Authorization: `Bearer ${token}` } }
)
```

**De ce PATCH e util?**
- Reduce trafic - trimitem doar ce se schimbă
- Evită validări inutile - server nu verifică câmpuri care nu se schimbă
- Previne accidente - nu suprascriu accidental alte câmpuri

#### DELETE - Ștergere

```javascript
// Șterge un produs după ID
const res = await api.delete(
  `/products/delete/${productId}`,
  { headers: { Authorization: `Bearer ${token}` } }
)
const result = unwrapApiData(res)  // { message: 'Product deleted' }

// Șterge un utilizator
const res = await api.delete(
  `/admin/delete/user/${userId}`,
  { headers: { Authorization: `Bearer ${token}` } }
)
```

**Important în DELETE:**
- Nu e body în DELETE (nu e nevoie de date suplimentare)
- ID-ul e în URL (path parameter): `/delete/${productId}`
- Headers se transmit la fel cu token JWT
- Răspunsul e de obicei `{ message: 'Deleted successfully', statusCode: 200 }`
- Ștergerea e **permanentă** - datele nu pot fi recuperate

---

## 8. Pagini Principale și Componentele Lor

### 8.1 HomePage - Pagina Principală

**Locație:** `src/ui/pages/HomePage.jsx`

```javascript
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="hero">
      <h1 className="heroTitle">
        Bun venit — comanda ta preferată, în câteva clickuri
      </h1>
      <p className="heroText">
        Descoperă meniul nostru, adaugă rapid produsele în coș și finalizează 
        comanda cu adresa de livrare și metoda de plată.
      </p>

      <div className="heroBadges">
        <span className="badge">Plată cash/card</span>
        <span className="badge">Checkout simplu</span>
        <span className="badge">Stoc actualizat</span>
      </div>

      <div className="actions">
        <Link to="/menu" className="btn btnPrimary">
          Vezi meniul
        </Link>
        <Link to="/account" className="btn btnGhost">
          Contul meu
        </Link>
      </div>

      {/* Card-uri cu informații */}
      <div className="cards">
        <div className="card">
          <h3 className="cardTitle">Ingrediente proaspete</h3>
          <div className="muted">Gătite cu grijă, pentru gust și calitate</div>
        </div>
        {/* ... alte card-uri ... */}
      </div>
    </div>
  )
}
```

**Funcționalități:**

- Prezentare atractiv a aplicației
- Link-uri către Meniu și Cont
- Card-uri descriptive cu beneficii

### 8.2 MenuPage - Lista Produse

**Locație:** `src/ui/pages/MenuPage.jsx`

Pagina cu cea mai multă logică - permite:

#### Filtrare Produse

```javascript
const [filters, setFilters] = useState({
  name: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  inStock: true
})

async function loadProducts(nextFilters) {
  const f = nextFilters || filters
  const hasAny = Boolean(
    String(f.name || '').trim() ||
      f.category ||
      String(f.minPrice || '').trim() ||
      String(f.maxPrice || '').trim() ||
      f.inStock === true
  )

  const res = hasAny
    ? await api.get('/products/search', {
        params: {
          ...(String(f.name || '').trim() ? { name: String(f.name).trim() } : {}),
          ...(f.category ? { category: f.category } : {}),
          ...(String(f.minPrice || '').trim() ? { minPrice: Number(f.minPrice) } : {}),
          ...(String(f.maxPrice || '').trim() ? { maxPrice: Number(f.maxPrice) } : {}),
          ...(f.inStock ? { inStock: true } : {})
        }
      })
    : await api.get('/products/list')

  const data = unwrapApiData(res)
  setProducts(Array.isArray(data) ? data : [])
}
```

#### Adaugă la Coș

```javascript
async function onAddToCart(productId) {
  // 1. Marchează că se adaugă articolul (pentru a afișa loading state)
  setAddingId(productId)
  setError('')  // Șterge erorile anterioare
  try {
    // 2. Caută produsul în array-ul de produse
    const product = products.find((p) => p.id === productId)
    // 3. Dacă găsește produsul, adaugă la coșul local (localStorage)
    if (product) cart.add(product, 1)  // Adaugă imediat fără a așteptu backend
    
    // 4. Dacă utilizatorul e conectat, sincronizează și cu backend
    if (auth.isAuthed) {
      await auth.addToCart(productId, 1)  // Trimite la server pentru persistență
    }
  } catch (e) {
    // 5. Handleare eroare - afișează mesaj
    setError(e?.response?.data?.message || e.message)
  } finally {
    // 6. Finalizează - șterge loading state
    setAddingId(null)
  }
}
```

#### CRUD pentru Admin

Dacă utilizatorul e admin, poate:

**Editare produs:**
```javascript
async function saveEdit(productId) {
  // 1. Validare - doar admin autentificat poate edita
  if (!auth.token) {
    setError('Login as admin to edit products.')
    return
  }

  // 2. Marchează că se salvează (pentru disabled button)
  setSavingId(productId)
  setError('')
  try {
    // 3. Pregătește datele pentru trimitere
    const body = {
      name: String(editDraft.name || '').trim(),
      price: Number(editDraft.price),
      stock: Number(editDraft.stock),
      category: editDraft.category,
      description: String(editDraft.description || '').trim() || null
    }

    // 4. Trimite PUT request la backend cu Authorization header
    const res = await api.put(`/products/edit/${productId}`, body, {
      headers: { Authorization: `Bearer ${auth.token}` }  // Atașează token JWT
    })
    
    // 5. Actualizează state-ul local cu datele actualizate
    const data = unwrapApiData(res)
    const updated = data?.product || data?.data?.product || null
    const updatedProduct = updated || { id: productId, ...body }

    // 6. Actualizează produsul din array folosind map
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updatedProduct } : p))
    )
    
    // 7. Ieșe din modul edit
    setEditingId(null)
  } catch (e) {
    // 8. Handleare eroare
    setError(e?.response?.data?.message || e.message || 'Failed to update product')
  } finally {
    // 9. Finalizează - șterge loading state
    setSavingId(null)
  }
}
```

**Ștergere produs:**
```javascript
async function deleteProduct(productId) {
  // 1. Validare - doar admin autentificat
  if (!auth.token) {
    setError('Login as admin to delete products.')
    return
  }

  // 2. Cere confirmare utilizatorului (previne ștergeri accidentale)
  const ok = window.confirm('Sigur vrei să ștergi acest produs?')
  if (!ok) return  // Anulează dacă utilizatorul face click Cancel

  // 3. Marchează ca ștergere în progres
  setDeletingId(productId)
  setError('')
  try {
    // 4. Trimite DELETE request la backend
    await api.delete(`/products/delete/${productId}`, {
      headers: { Authorization: `Bearer ${auth.token}` }  // Atașează token JWT
    })
    
    // 5. Actualizează state-ul local - elimină produsul din array
    setProducts((prev) => prev.filter((p) => p.id !== productId))
    
    // 6. Feedback utilizatorului
    setStatus('Produs șters cu succes.')
  } catch (e) {
    // 7. Handleare eroare - produsul rămâne în interfață
    setError(e?.response?.data?.message || e.message || 'Failed to delete product')
  } finally {
    // 8. Finalizează - șterge loading state
    setDeletingId(null)
  }
}
```

### 8.3 ProductPage - Detalii Produs

**Locație:** `src/ui/pages/ProductPage.jsx`

```javascript
export default function ProductPage() {
  const { id } = useParams()  // Extrage ID din URL
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const [review, setReview] = useState({ rating: 5, comment: '' })

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const res = await api.get(`/products/details/${id}`)
        const data = unwrapApiData(res)
        if (alive) setProduct(data)
      } catch (e) {
        if (alive) setError(e?.response?.data?.message || e.message)
      }
    }
    load()
    return () => { alive = false }
  }, [id])

  async function onAddToCart() {
    if (product) cart.add(product, qty)
    if (auth.isAuthed) {
      await auth.addToCart(id, qty)
    }
  }

  async function onSubmitReview() {
    // 1. Validare - utilizatorul trebuie sa fie conectat pentru a trimite recenzie
    if (!auth.isAuthed) {
      setReviewStatus('Login required.')
      return  // Ieșe din funcție dacă nu e autentificat
    }
    
    // 2. Resetează mesajele anterioare
    setReviewStatus('')
    
    try {
      // 3. Trimite recenzia la backend cu token JWT
      const res = await api.post(
        `/products/${id}/reviews`,
        {
          rating: Number(review.rating),  // Convertește rating în număr
          comment: review.comment || undefined  // Comentariul e opțional
        },
        { headers: { Authorization: `Bearer ${auth.token}` } }  // Autentificare
      )
      
      // 4. Extrage răspunsul
      const data = unwrapApiData(res)
      
      // 5. Afișează mesaj de succes
      setReviewStatus(data?.message || 'Review submitted.')
      
      // 6. Resetează formularul după succes
      setReview({ rating: 5, comment: '' })
    } catch (e) {
      // 7. Handleare eroare
      setReviewStatus(e?.response?.data?.message || e.message || 'Failed to submit review')
    }
  }

  return (
    <div>
      {product && (
        <>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="price">{product.price.toFixed(2)} MDL</div>
          <div className="stock">Stock: {product.stock}</div>

          <input 
            type="number" 
            value={qty} 
            onChange={(e) => setQty(Number(e.target.value))}
            min="1"
            max={product.stock}
          />
          <button onClick={onAddToCart}>Adaugă în coș</button>

          <div className="reviews">
            <h2>Recenzii</h2>
            {/* Formular submit review */}
            <textarea
              value={review.comment}
              onChange={(e) => setReview({ ...review, comment: e.target.value })}
            />
            <button onClick={onSubmitReview}>Trimite recenzie</button>
          </div>
        </>
      )}
    </div>
  )
}
```

**Caracteristici:**

- Afișare detalii produs din `useParams()`
- Input pentru selectare cantitate
- Buton "Adaugă în coș"
- Formular pentru trimitere recenzie
- Sincronizare cu backend dacă autentificat

### 8.4 CartPage - Coș de Cumpărături

```javascript
export default function CartPage() {
  const cart = useCart()
  const auth = useAuth()

  const total = cart.total

  async function syncToBackend() {
    if (!auth.isAuthed) {
      setStatus('Please login to sync cart.')
      return
    }
    for (const item of cart.items) {
      await api.post(
        '/users/cart/add',
        { productId: Number(item.product.id), quantity: Number(item.quantity) },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
    }
    setStatus('Synced to backend.')
  }

  return (
    <div>
      <h1>Cart</h1>

      {cart.items.length === 0 ? (
        <div>Your cart is empty</div>
      ) : (
        <>
          <div className="cartSummary">
            Total: {total.toFixed(2)} MDL
            Items: {cart.count}
          </div>

          {cart.items.map((it) => (
            <div key={it.product.id} className="cartItem">
              <span>{it.product.name}</span>
              <span>Qty: {it.quantity}</span>
              <span>{(it.quantity * it.product.price).toFixed(2)} MDL</span>
              <button onClick={() => cart.remove(it.product.id)}>Remove</button>
            </div>
          ))}

          <button onClick={syncToBackend}>Sync to Backend</button>
          <button onClick={cart.clear}>Clear Cart</button>
          <Link to="/checkout" className="btn btnPrimary">
            Checkout
          </Link>
        </>
      )}
    </div>
  )
}
```

### 8.5 CheckoutPage - Finalizare Comandă

```javascript
export default function CheckoutPage() {
  const auth = useAuth()
  const cart = useCart()

  const [shippingAddress, setShippingAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [order, setOrder] = useState(null)

  const itemsPayload = useMemo(() => {
    return cart.items.map((it) => ({
      productId: Number(it.product.id),
      quantity: Number(it.quantity)
    }))
  }, [cart.items])

  async function placeOrder() {
    // 1. VALIDĂRI PRELIMINARE
    
    // Validare 1: Coșul nu e gol
    if (cart.items.length === 0) {
      setError('Cart is empty.')
      return  // Ieșe din funcție dacă validarea eșuează
    }
    
    // Validare 2: Utilizatorul trebuie să fie conectat
    if (!auth.isAuthed) {
      setError('Please login first.')
      return
    }
    
    // Validare 3: Adresa de livrare - minim 5 caractere
    if (shippingAddress.trim().length < 5) {
      setError('Please provide shipping address.')
      return
    }

    // 2. DACĂ VALIDĂRILE TREC, TRIMITE COMANDA
    setLoading(true)  // Afișează loading state
    try {
      // 3. Pregătește datele pentru trimitere
      // itemsPayload e memoizat pentru performanță
      const res = await api.post(
        '/users/checkout',
        {
          items: itemsPayload,  // Array de { productId, quantity }
          shippingAddress: shippingAddress.trim(),  // Elimină spații
          paymentMethod  // 'cash' sau 'card'
        },
        { headers: { Authorization: `Bearer ${auth.token}` } }  // Token JWT
      )
      
      // 4. Extrage datele comenzii create
      const data = unwrapApiData(res)
      
      // 5. Salvează comanda în state (pentru afișare confirmare)
      setOrder(data?.order || null)
      
      // 6. Golește coșul după o comandă reușită
      cart.clear()
    } catch (e) {
      // 7. Handleare eroare - comanda nu a fost trimisă
      setError(e?.response?.data?.message || formatAxiosError(e))
    } finally {
      // 8. Finalizează - setează loading la false
      setLoading(false)
    }
  }
      cart.clear()
    } catch (e) {
      setError(e?.response?.data?.message || formatAxiosError(e))
    }
  }

  return (
    <div>
      <h1>Checkout</h1>

      <div className="orderSummary">
        <h2>Order Summary</h2>
        <p>Items: {cart.count}</p>
        <p>Total: {cart.total.toFixed(2)} MDL</p>
      </div>

      <div className="form">
        <input
          type="text"
          placeholder="Shipping Address"
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
        />

        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="cash">Cash</option>
          <option value="card">Card</option>
        </select>

        <button onClick={placeOrder} disabled={loading}>
          {loading ? 'Placing order...' : 'Place Order'}
        </button>
      </div>

      {order && (
        <div className="orderSuccess">
          <h2>Order Placed!</h2>
          <p>Order ID: {order.id}</p>
          <p>Status: {order.status}</p>
        </div>
      )}
    </div>
  )
}
```

---

## 9. Autentificare și Autorizare

### 9.1 AccountPage - Login, Register, Profil

**Locație:** `src/ui/pages/AccountPage.jsx`

#### Tab-uri în AccountPage

```javascript
const [tab, setTab] = useState('login')  // login, register, profile, verify, forgot-password
```

#### Login

```javascript
const [loginForm, setLoginForm] = useState({
  email: 'user@example.com',
  password: 'test123456'
})

async function onLogin() {
  try {
    await auth.login(loginForm.email, loginForm.password)
    setStatus('Logged in.')
  } catch (e) {
    setError(e?.response?.data?.message || e.message)
  }
}
```

#### Register

```javascript
const [registerForm, setRegisterForm] = useState({
  name: 'Test User',
  email: 'user@example.com',
  password: 'test123456',
  phone: '069123456',
  age: 25,
  role: 'user',
  department: ''
})

async function onRegister() {
  try {
    const res = await api.post('/auth/register', registerBody)
    unwrapApiData(res)
    setStatus('Account created. Verify your email.')
    setTab('verify')
  } catch (e) {
    const details = e?.response?.data?.errors || []
    if (Array.isArray(details) && details.length > 0) {
      setError('Validare eșuată.')
      setErrorDetails(details)
    } else {
      setError(e?.response?.data?.message || e.message)
    }
  }
}
```

**Validări la register:**
- name: min 3 caractere, text
- email: format email valid
- phone: format +373XXXXXXX sau 0XXXXXXX
- age: minimum 18 ani
- role: user, admin, manager
- department: obligatoriu dacă role = manager

#### Profil - Update

```javascript
async function onSaveProfile() {
  try {
    const body = {
      name: String(profileForm.name || '').trim(),
      email: String(profileForm.email || '').trim(),
      phone: String(profileForm.phone || '').trim(),
      age: profileForm.age === '' ? undefined : Number(profileForm.age)
    }

    const res = await api.put(`/users/edit/${auth.user.id}`, body, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    const data = unwrapApiData(res)
    const updated = data?.user || null
    if (updated) auth.setUser(updated)
    setStatus('Profil actualizat.')
  } catch (e) {
    const details = e?.response?.data?.errors || []
    if (Array.isArray(details) && details.length > 0) {
      setError('Validare eșuată.')
      setErrorDetails(details)
    } else {
      setError(e?.response?.data?.message || e.message)
    }
  }
}
```

#### Schimbare Parolă

```javascript
async function onChangePassword() {
  try {
    const res = await api.put(
      `/users/change-password/${auth.user.id}`,
      {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      },
      { headers: { Authorization: `Bearer ${auth.token}` } }
    )
    const data = unwrapApiData(res)
    setStatus('Password changed.')
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
  } catch (e) {
    setError(e?.response?.data?.message || e.message)
  }
}
```

#### Forgot Password

```javascript
async function onForgotPassword() {
  try {
    const res = await api.post('/auth/forgot-password', { email: forgotEmail })
    const data = unwrapApiData(res)
    setStatus('If email exists, you will receive reset link.')
  } catch (e) {
    setError(e?.response?.data?.message || e.message)
  }
}
```

### 9.2 VerifyEmailPage - Verificare Email

```javascript
export default function VerifyEmailPage() {
  const { token } = useParams()
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    async function verify() {
      try {
        const res = await api.get(`/auth/verify-email/${token}`)
        const data = unwrapApiData(res)
        setStatus('Email verified successfully!')
      } catch (e) {
        setError(e?.response?.data?.message || e.message)
      }
    }

    verify()
  }, [token])

  return (
    <div>
      <h1>Verify Email</h1>
      {error && <div className="alert">{error}</div>}
      {status && <div className="success">{status}</div>}
      {!status && !error && <div>Verifying...</div>}
    </div>
  )
}
```

### 9.3 ResetPasswordPage - Reset Parolă

```javascript
export default function ResetPasswordPage() {
  const { token } = useParams()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  async function onReset() {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      const res = await api.post(`/auth/reset-password/${token}`, {
        newPassword,
        confirmPassword
      })
      const data = unwrapApiData(res)
      setStatus('Password reset successfully!')
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  return (
    <div>
      <h1>Reset Password</h1>
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button onClick={onReset}>Reset Password</button>
      {status && <div className="success">{status}</div>}
      {error && <div className="alert">{error}</div>}
    </div>
  )
}
```

---

## 10. Gestionarea Coșului de Cumpărături

### 10.1 Starea Coșului - CartContext

Coșul este gestionat prin `CartContext` și stocat în `localStorage`:

```javascript
const [items, setItems] = useState([])

useEffect(() => {
  const saved = safeJsonParse(localStorage.getItem(STORAGE_KEY))
  if (Array.isArray(saved)) setItems(saved)
}, [])

useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}, [items])
```

### 10.2 Structura Articolelor din Coș

Fiecare articol în coș:

```javascript
{
  product: {
    id: 1,
    name: "Pizza Margherita",
    price: 250,
    description: "...",
    stock: 10,
    category: "Pizza"
  },
  quantity: 2
}
```

### 10.3 Operații Coș

```javascript
// Adaugă produs
cart.add(product, quantity)

// Șterge produs
cart.remove(productId)

// Golește coșul
cart.clear()

// Accesează
cart.items      // array de articole
cart.count      // număr total articole
cart.total      // preț total
```

### 10.4 Sincronizare cu Backend

Coșul local (localStorage) poate fi sincronizat cu backend:

```javascript
async function syncToBackend() {
  if (!auth.isAuthed) return

  for (const item of cart.items) {
    await api.post(
      '/users/cart/add',
      { productId: Number(item.product.id), quantity: Number(item.quantity) },
      { headers: { Authorization: `Bearer ${auth.token}` } }
    )
  }
}
```

---

## 11. Panou Administrator

### 11.1 AdminPage - Logica Complexă

**Locație:** `src/ui/pages/AdminPage.jsx`

AdminPage este cea mai complexă pagină cu peste 1000 linii. Oferă:

#### 1. Gestionare Produse

**Create Product:**
```javascript
const [createProduct, setCreateProduct] = useState({
  name: '',
  price: '',
  description: '',
  stock: '',
  category: PRODUCT_CATEGORIES[0]
})

async function createNewProduct() {
  const body = buildProductBody(createProduct, { requireAll: true })
  
  const res = await api.post('/admin/create/product', body, {
    headers: { Authorization: `Bearer ${auth.token}` }
  })
  const data = unwrapApiData(res)
  setProducts([...products, data.product || data])
  setCreateProduct({ name: '', price: '', description: '', stock: '', category: '' })
}
```

**Edit Product (PUT):**
```javascript
async function editProduct() {
  const body = buildProductBody(editProduct, { requireAll: true })
  
  const res = await api.put(
    `/admin/edit/${editProductId}`,
    body,
    { headers: { Authorization: `Bearer ${auth.token}` } }
  )
  const data = unwrapApiData(res)
  setProducts((prev) =>
    prev.map((p) => (p.id === editProductId ? { ...p, ...data.product } : p))
  )
  setEditProductId('')
}
```

**Patch Product (PATCH - update parțial):**
```javascript
async function patchProduct() {
  const body = buildProductBody(patchProduct, { requireAll: false })
  
  const res = await api.patch(
    `/admin/patch/${patchProductId}`,
    body,
    { headers: { Authorization: `Bearer ${auth.token}` } }
  )
  const data = unwrapApiData(res)
  setProducts((prev) =>
    prev.map((p) => (p.id === patchProductId ? { ...p, ...data.product } : p))
  )
  setPatchProductId('')
}
```

**Delete Product:**
```javascript
async function deleteProduct() {
  const ok = window.confirm('Delete this product?')
  if (!ok) return

  const res = await api.delete(
    `/admin/delete/product/${deleteProductId}`,
    { headers: { Authorization: `Bearer ${auth.token}` } }
  )
  setProducts((prev) => prev.filter((p) => p.id !== deleteProductId))
  setDeleteProductId('')
}
```

#### 2. Import/Export CSV

**Import:**
```javascript
const [importFile, setImportFile] = useState(null)

async function importCSV() {
  if (!importFile) return

  const formData = new FormData()
  formData.append('file', importFile)

  const res = await api.post('/admin/products/import', formData, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'multipart/form-data'
    }
  })
  const data = unwrapApiData(res)
  // Afișează rezultate import
  importCall.setResult(data)
  setImportFile(null)
}
```

**Export:**
```javascript
const [exportFilters, setExportFilters] = useState({
  name: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  minStock: ''
})

async function exportCSV() {
  const params = new URLSearchParams()
  if (exportFilters.name) params.append('name', exportFilters.name)
  if (exportFilters.category) params.append('category', exportFilters.category)
  if (exportFilters.minPrice) params.append('minPrice', exportFilters.minPrice)
  if (exportFilters.maxPrice) params.append('maxPrice', exportFilters.maxPrice)
  if (exportFilters.minStock) params.append('minStock', exportFilters.minStock)

  const res = await api.get(`/admin/products/export?${params.toString()}`, {
    headers: { Authorization: `Bearer ${auth.token}` }
  })
  const data = unwrapApiData(res)
  exportCall.setResult(data)
}
```

#### 3. Gestionare Utilizatori

**Search Users:**
```javascript
async function searchUsers() {
  const res = await api.get('/admin/search/users', {
    params: { name: searchUserName || undefined },
    headers: { Authorization: `Bearer ${auth.token}` }
  })
  const data = unwrapApiData(res)
  setUsers(Array.isArray(data) ? data : [])
  searchUsersCall.setResult(data)
}
```

**Delete User:**
```javascript
async function deleteUser() {
  const ok = window.confirm('Delete this user?')
  if (!ok) return

  const res = await api.delete(
    `/admin/delete/user/${deleteUserId}`,
    { headers: { Authorization: `Bearer ${auth.token}` } }
  )
  setUsers((prev) => prev.filter((u) => u.id !== deleteUserId))
  deleteUserCall.setResult({ message: 'User deleted' })
  setDeleteUserId('')
}
```

#### 4. Serviciul Intermediar (Proxy)

**Health Check:**
```javascript
async function checkHealth() {
  const res = await api.get('/api/intermediary/health')
  intermediaryCall.setResult(res.data)
  setIntermediaryTitle('Health Status')
}
```

**Fetch (Proxy către API extern):**
```javascript
const [fetchForm, setFetchForm] = useState({
  url: 'https://jsonplaceholder.typicode.com/posts/1',
  method: 'GET',
  headersText: '{"Accept": "application/json"}',
  dataText: '{"title": "Test"}'
})

async function fetchExternal() {
  const headers = parseJsonText(fetchForm.headersText, {
    label: 'Headers',
    allowEmpty: true
  })
  const data = parseJsonText(fetchForm.dataText, {
    label: 'Data',
    allowEmpty: true
  })

  const res = await api.post('/api/intermediary/fetch', {
    url: fetchForm.url,
    method: fetchForm.method,
    headers,
    data
  }, {
    headers: { Authorization: `Bearer ${auth.token}` }
  })

  intermediaryCall.setResult(res.data)
  setIntermediaryTitle('Fetch Result')
}
```

**Transform (Procesare date local):**
```javascript
const [transformForm, setTransformForm] = useState({
  operation: 'process',  // process, filter, aggregate, map
  dataText: '[]',
  optionsText: '{}'
})

async function transformData() {
  const data = parseJsonText(transformForm.dataText, { label: 'Data' })
  const options = parseJsonText(transformForm.optionsText, {
    label: 'Options',
    allowEmpty: true
  })

  const res = await api.post('/api/intermediary/transform', {
    operation: transformForm.operation,
    data,
    options
  }, {
    headers: { Authorization: `Bearer ${auth.token}` }
  })

  intermediaryCall.setResult(res.data)
  setIntermediaryTitle('Transform Result')
}
```

### 11.2 ResultBox - Afișare Rezultate

**Locație:** `src/ui/components/ResultBox.jsx`

```javascript
export default function ResultBox({ title = 'Result', value }) {
  let message = ''
  let data = value

  if (isPlainObject(value) && 'data' in value && ('success' in value || 'statusCode' in value)) {
    message = typeof value.message === 'string' ? value.message : ''
    data = value.data
  }

  let body = null

  if (Array.isArray(data)) {
    const allObjects = data.every((x) => isPlainObject(x))
    body = allObjects ? <Table rows={data} /> : <div>{data.join('\n')}</div>
  } else if (isPlainObject(data)) {
    const arrayKeys = Object.keys(data).filter((k) => Array.isArray(data[k]))
    if (arrayKeys.length) {
      body = (
        <>
          <KeyValue obj={data} />
          {arrayKeys.map((k) => (
            <div key={k}>
              <div className="resultSubTitle">{k}</div>
              <Table rows={data[k]} />
            </div>
          ))}
        </>
      )
    } else {
      body = <KeyValue obj={data} />
    }
  } else {
    body = <div className="resultText">{String(data)}</div>
  }

  return (
    <div className="resultBox">
      {message && <div className="resultMessage">{message}</div>}
      {body}
    </div>
  )
}
```

**Componentă Table (pentru afișare date tabular):**

```javascript
function Table({ rows }) {
  const safeRows = Array.isArray(rows) ? rows : []
  const cols = collectColumns(safeRows)
  if (!cols.length) return <div>—</div>

  return (
    <div className="resultTableWrap">
      <table className="resultTable">
        <thead>
          <tr>
            {cols.map((c) => <th key={c}>{c}</th>)}
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
```

---

## 12. Styling și Interfața Utilizatorului

### 12.1 CSS Global - App.css

Aplicația folosește CSS clasic fără framework CSS (Bootstrap, Tailwind):

```css
/* Design System */
:root {
  --primary: #3b82f6;      /* Blue */
  --success: #10b981;      /* Green */
  --danger: #ef4444;       /* Red */
  --warning: #f59e0b;      /* Amber */
  --muted: #6b7280;        /* Gray */
  --bg: #ffffff;
  --text: #0f172a;
  --border: rgba(15, 23, 42, 0.1);
}

/* Layout */
.appShell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.topNav {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand {
  font-weight: 700;
  font-size: 20px;
}

.topNav a {
  text-decoration: none;
  color: var(--text);
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 200ms;
}

.topNav a:hover {
  background: rgba(59, 130, 246, 0.1);
}

.topNav a.active {
  background: var(--primary);
  color: white;
}

/* Main Content */
main {
  flex: 1;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Butoane */
.btn {
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  font-size: 14px;
  transition: all 200ms;
}

.btn:hover:not(:disabled) {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btnPrimary {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.btnPrimary:hover:not(:disabled) {
  background: #2563eb;
}

.btnGhost {
  background: transparent;
  border: 2px solid var(--primary);
  color: var(--primary);
}

/* Card */
.card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.cardTitle {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.muted {
  color: var(--muted);
  font-size: 14px;
}

/* Form */
input, textarea, select {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Alertă */
.alert {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.success {
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #166534;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

/* Hero Section */
.hero {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, var(--primary), #06b6d4);
  color: white;
  border-radius: 12px;
  margin-bottom: 24px;
}

.heroTitle {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.heroBadges {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
}

/* Table */
.resultTable {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
}

.resultTable th {
  background: var(--border);
  padding: 8px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid var(--border);
}

.resultTable td {
  padding: 8px;
  border-bottom: 1px solid var(--border);
}

.resultTable tr:hover {
  background: rgba(59, 130, 246, 0.05);
}

/* Responsive */
@media (max-width: 768px) {
  .topNav {
    gap: 12px;
    flex-wrap: wrap;
  }

  .card {
    padding: 12px;
  }

  .heroTitle {
    font-size: 24px;
  }

  input, textarea, select {
    width: 100%;
    box-sizing: border-box;
  }
}
```

### 12.2 Responsive Design

Frontend-ul e responsive:

```css
@media (max-width: 1024px) {
  .cards {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .cards {
    grid-template-columns: 1fr;
  }

  .topNav {
    flex-wrap: wrap;
  }

  main {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .heroTitle {
    font-size: 20px;
  }

  .btn {
    width: 100%;
  }
}
```

---

## 13.5 Explicații Detailate - Patternuri React și Concepte Cheie

Această secțiune rezumă conceptele React importante folosite în toată aplicația.

### Pattern 1: useEffect Dependencies

```javascript
// CICLU 1: Se rulează o singură dată la mount
useEffect(() => {
  console.log('Se rulează o singură dată!')
  loadData()
}, [])  // Array gol = no dependencies

// CICLU 2: Se rulează când se schimbă dependency
useEffect(() => {
  console.log('Se rulează ori de câte ori se schimbă userId')
  loadUserData(userId)
}, [userId])  // Array cu dependency = se rulează când userId se schimbă

// CICLU 3: Se rulează la fiecare render (NU RECOMANDАТ!)
useEffect(() => {
  console.log('Se rulează la FIECARE render - evită asta!')
})  // Fără array = no dependencies specified
```

**Reguli importante:**
- `[]` → Se rulează o singură dată la mount (perfect pentru încărcare date)
- `[dep1, dep2]` → Se rulează când orice dependency se schimbă
- Fără array → Se rulează la fiecare render (performance killer!)

### Pattern 2: Conditional Rendering

```javascript
// VARIANTA 1: if statement
if (loading) return <div>Loading...</div>
if (error) return <div>Error: {error}</div>
return <div>{data}</div>

// VARIANTA 2: Ternary operator (mai compact)
return loading ? <div>Loading...</div> : <div>{data}</div>

// VARIANTA 3: Ternary nested (pentru multiple condiții)
return loading 
  ? <div>Loading...</div> 
  : error 
  ? <div>Error: {error}</div>
  : <div>{data}</div>

// VARIANTA 4: Logical AND (dacă TRUE, randează pe dreapta)
{isAdmin && <NavLink to="/admin">Admin</NavLink>}

// VARIANTA 5: Switch statement (pentru mai multe cazuri)
switch (status) {
  case 'loading':
    return <div>Loading...</div>
  case 'error':
    return <div>Error</div>
  case 'success':
    return <div>{data}</div>
  default:
    return null
}
```

### Pattern 3: Array Transformations

```javascript
// MAP - transforma fiecare element
const doubled = [1, 2, 3].map(n => n * 2)  // [2, 4, 6]
const names = products.map(p => p.name)    // [Pizza, Burger, Salată]

// FILTER - păstrează doar elementele care îndeplinesc condiție
const active = products.filter(p => p.stock > 0)
const admins = users.filter(u => u.role === 'admin')

// FIND - returneaza PRIMUL element care îndeplinește condiție
const pizza = products.find(p => p.id === 1)
const user = users.find(u => u.email === 'test@email.com')

// REDUCE - cumulează/calculează o valoare
const total = items.reduce((sum, item) => sum + item.price, 0)
const count = items.reduce((n, item) => n + item.quantity, 0)

// SORT - ordoneaza array-ul
const sorted = products.sort((a, b) => a.price - b.price)

// INCLUDES - verifică dacă array conține element
if (cartIds.includes(productId)) { ... }

// SOME - verifică dacă VREUN element îndeplinește condiție
if (products.some(p => p.stock === 0)) { ... }

// EVERY - verifică dacă TOȚI elementele îndeplinesc condiție
if (products.every(p => p.stock > 0)) { ... }
```

### Pattern 4: Spread Operator

```javascript
// SPREAD în array - copiază și adaugă
const arr1 = [1, 2, 3]
const arr2 = [...arr1, 4, 5]  // [1, 2, 3, 4, 5]

// SPREAD în obiect - copiază și suprascrie
const user = { name: 'John', age: 25 }
const updated = { ...user, age: 26 }  // { name: 'John', age: 26 }

// SPREAD pentru exclude - merge cu ternary
const items = [1, 2, 3, 4, 5]
const filtered = items.filter(x => x !== 3)  // [1, 2, 4, 5]

// SPREAD în function arguments
const nums = [1, 2, 3]
sum(...nums)  // Echivalent cu sum(1, 2, 3)
```

### Pattern 5: Ternary și Logical Operators

```javascript
// Ternary cu variabilă
const message = isAdmin ? 'Admin Panel' : 'User Panel'

// Logical AND (dacă TRUE, randează pe dreapta)
{isLoggedIn && <button>Logout</button>}

// Logical OR (dacă stânga e falsy, randează pe dreapta)
const displayName = user?.name || 'Guest'

// Short-circuit evaluation
const value = condition && expensiveCalculation()
// Dacă condition e FALSE, expensiveCalculation nu se rulează

// Nullish coalescing (??) - diferit de || (nu trateaza false/0 ca null)
const count = value ?? 0  // Folosește 0 dacă value e null/undefined
```

### Pattern 6: try-catch-finally

```javascript
async function fetchData() {
  setLoading(true)
  setError(null)
  
  try {
    // BLOC TRY - codul normal
    const res = await api.get('/data')
    const data = unwrapApiData(res)
    setData(data)
  } catch (e) {
    // BLOC CATCH - se rulează dacă se aruncă eroare
    setError(e.message)
    setData(null)
  } finally {
    // BLOC FINALLY - se rulează INDIFERENT de try/catch
    setLoading(false)
  }
}
```

**De ce finally e important?**
- Asigură că `setLoading(false)` se execută chiar și dacă cererea eșuează
- Previne blocarea UI-ului în stare de loading permanent

### Pattern 7: Component Lifecycle cu useEffect

```javascript
export function MyComponent() {
  const [data, setData] = useState(null)

  // MOUNT (componentă apare pe ecran)
  useEffect(() => {
    console.log('Component mounted')
    loadData()
    
    // CLEANUP (componentă dispare de pe ecran)
    return () => {
      console.log('Component unmounted')
      // Gestionează cleanup: cancel timers, unsubscribe, etc.
    }
  }, [])

  // UPDATE (dependency s-a schimbat)
  useEffect(() => {
    console.log('Data changed')
    handleDataChange(data)
  }, [data])

  return <div>{data}</div>
}
```

**Lifecycle în componente funcționale:**
- Mount: useEffect cu `[]`
- Update: useEffect cu dependencies
- Unmount: return din useEffect (cleanup function)

---

## 13. Testare și Validare Frontend

### 13.1 Testare Manuală - Fluxuri Principale

#### Flux 1: Vizitator Neautentificat

```
1. Accesează / (HomePage)
   - Afișează welcome message
   - Button "Vezi meniul" și "Contul meu"

2. Merge la /menu (MenuPage)
   - Lista produse se încarcă din GET /products/list
   - Poate filtra după name, category, price, stock
   - Adaugă produse în coș (local, fără backend)
   - Nu vede butoane edit/delete

3. Clică pe produs → /products/:id (ProductPage)
   - Afișează detalii
   - Poate adăuga în coș
   - Nu poate trimite recenzie ("Login required")

4. Merge la /cart (CartPage)
   - Afișează coșul local
   - Butoane: Sync to Backend (disabled), Clear, Checkout (disabled)

5. Merge la /account (AccountPage)
   - Tab "Login" este activ
   - Introduce email/password
   - Click Login → POST /auth/login
   - Dacă succes → redirectare, auth.token salvat, navbar se actualizează
```

#### Flux 2: Utilizator Autentificat

```
1. După login, navbar arată:
   - User name/email în pill
   - Logout button
   - "Admin" link (dacă admin)

2. /account (AccountPage)
   - Tab "Profile" se activează automat
   - Afișează datele utilizatorului
   - Poate edita name, email, phone, age
   - PUT /users/edit/:id

3. /cart → /checkout (CheckoutPage)
   - Introduce shipping address
   - Alege payment method (cash/card)
   - Click "Place Order"
   - POST /users/checkout
   - Coșul se golește, afișează order confirmation

4. /products/:id
   - Buton "Submit Review" activ
   - Alege rating (1-5), scrie comment
   - POST /products/:id/reviews
```

#### Flux 3: Administrator

```
1. Login cu role admin

2. /admin (AdminPage)
   - Tab-uri: Products, Users, Intermediary
   
   Tab Products:
   - Formular "Create Product"
   - POST /admin/create/product
   - Tabel cu produse existente
   - Edit (PUT) și Patch (PATCH) produse
   - Delete produs
   - Import CSV → POST /admin/products/import
   - Export CSV cu filtre → GET /admin/products/export

   Tab Users:
   - Căutare utilizatori → GET /admin/search/users?name=...
   - Delete user → DELETE /admin/delete/user/:id

   Tab Intermediary:
   - Health check → GET /api/intermediary/health
   - Fetch extern → POST /api/intermediary/fetch
   - Transform data → POST /api/intermediary/transform
```

### 13.2 Validări Frontend

#### Validări în Register

```javascript
if (!name || name.length < 3) setError('Name minimum 3 characters')
if (!email.includes('@')) setError('Invalid email')
if (!phone.match(/^\+?373|0\d{9}$/)) setError('Invalid phone format')
if (age < 18) setError('Minimum age 18')
if (role === 'manager' && !department) setError('Department required for manager')
```

#### Validări în Checkout

```javascript
if (cart.items.length === 0) setError('Cart is empty')
if (!auth.isAuthed) setError('Please login')
if (shippingAddress.length < 5) setError('Invalid address')
```

#### Validări în Admin Import

```javascript
if (!importFile) setError('Please select file')
if (importFile.type !== 'text/csv') setError('File must be CSV')
if (importFile.size > 2 * 1024 * 1024) setError('File too large (max 2MB)')
```

### 13.3 Tratare Erori HTTP

```javascript
export function formatAxiosError(error) {
  const status = error.response?.status
  const data = error.response?.data

  if (status === 400) {
    return 'Bad Request: ' + data.message
  }
  if (status === 401) {
    return 'Unauthorized: Please login'
  }
  if (status === 403) {
    return 'Forbidden: Access denied'
  }
  if (status === 404) {
    return 'Not Found: Resource does not exist'
  }
  if (status === 429) {
    return 'Too Many Requests: Please try later'
  }
  if (status === 500) {
    return 'Server Error: Please try later'
  }

  return error.message || 'Unknown error'
}
```

### 13.4 Testare cu Browser DevTools

**Network Tab:**
- Verifică cereri HTTP (método, status, payload)
- Monitorizează traffic toward backend

**Console:**
- Nu trebuie erori JavaScript
- Logs suplimentare pentru debugging

**Application Tab:**
- localStorage → restaurantApp.auth (token + user)
- localStorage → restaurantApp.cart (articole din coș)

**React DevTools Extension:**
- Inspecționează componente
- Verifica props și state
- Trace re-renders

---

## 14. Concluzie

### 14.1 Realizări

Aplicația frontend **Restaurant** este o aplicație React modernă, fully functional care:

1. **Permite vizitatorilor** să navigheze meniu, vadă detalii produse și să adauge în coș
2. **Gestionează autentificare** cu token JWT, salvare stare în localStorage
3. **Sincronizează stare locală cu backend** - coș, comenzi, profil
4. **Oferă panou admin** cu CRUD complet, import/export CSV, proxy/intermediary
5. **Implementează validări** la nivel client (email, phone, age, etc.)
6. **Foloseste React best practices:**
   - Context API pentru stare globală
   - React Router pentru rutare
   - Hooks (useState, useEffect, useMemo, useContext)
   - Componente reutilizabile
   - Tratare erori HTTP

### 14.2 Tehnologii Folosite

| Tehnologie | Rol | Versiune |
|------------|-----|----------|
| React | UI framework | 19.2.0 |
| React Router DOM | Client-side routing | 7.13.0 |
| Vite | Build tool + Dev server | 7.3.1 |
| Axios | HTTP client | 1.13.5 |
| Context API | State management | (built-in) |

### 14.3 Structura Finală

```
Frontend (Vite + React)
├── Routing (React Router)
├── State Management
│   ├── AuthContext (login, register, profil, cart)
│   └── CartContext (articole, count, total)
├── Pages
│   ├── HomePage, MenuPage, ProductPage
│   ├── CartPage, CheckoutPage
│   ├── AccountPage (login, register, profil, password)
│   ├── AdminPage (CRUD, CSV, proxy)
│   └── VerifyEmailPage, ResetPasswordPage
├── Components
│   ├── Layout (navbar persistent)
│   ├── ResultBox (afișare tabele/obiecte)
│   └── useCall (hook standard pentru API)
├── Utils
│   └── apiClient (axios config + helpers)
└── Styling (CSS custom)
```

### 14.4 Fluxuri Principale

1. **Login** → SET token + user în Auth context
2. **Browse Menu** → GET /products/list cu filtrare
3. **Add to Cart** → Salvează local + PUT /users/cart/add dacă autentificat
4. **Checkout** → POST /users/checkout cu items + address
5. **Admin CRUD** → PUT/POST/PATCH/DELETE cu headers Authorization
6. **Admin CSV** → POST /admin/products/import, GET /admin/products/export

### 14.5 Observații Finale

Frontend-ul este:

- **Scalabil** - ușor de adăugat noi pagini/features
- **Maintainable** - cod bine organizat cu componente reutilizabile
- **Responsive** - funcționează pe desktop, tablet, mobile
- **Secure** - token JWT stocat, headers Authorization pe apeluri sensibile
- **User-friendly** - validări clare, erori citeț, loading states

Integrarea cu backend este completă:
- Comunicare HTTP prin axios
- Handleare erori (400, 401, 403, 404, 429, 500)
- Persistență stare (localStorage)
- Sincronizare client-server

Proiectul demonstrează o înțelegere profundă a:
- React hooks și Context API
- Rutare și navigare client-side
- HTTP requests și error handling
- State management patterns
- UI/UX design principles

---

**Data:** Februarie 2026  
**Autor:** Rotari Alina  
**Status:** Finalizat



