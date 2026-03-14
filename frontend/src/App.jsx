import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './ui/Layout.jsx'

import HomePage from './ui/pages/HomePage.jsx'
import MenuPage from './ui/pages/MenuPage.jsx'
import ProductPage from './ui/pages/ProductPage.jsx'
import CartPage from './ui/pages/CartPage.jsx'
import CheckoutPage from './ui/pages/CheckoutPage.jsx'
import AccountPage from './ui/pages/AccountPage.jsx'
import VerifyEmailPage from './ui/pages/VerifyEmailPage.jsx'
import AdminPage from './ui/pages/AdminPage.jsx'
import ResetPasswordPage from './ui/pages/ResetPasswordPage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        {}
        <Route path="/dashboard" element={<Navigate to="/menu" replace />} />
        <Route path="/login" element={<Navigate to="/account" replace />} />
        <Route path="/resend-verification" element={<Navigate to="/account" replace />} />

        <Route path="/menu" element={<MenuPage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/menu" replace />} />
      </Route>
    </Routes>
  )
}

export default App
