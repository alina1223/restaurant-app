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

      <Outlet />
    </div>
  )
}
