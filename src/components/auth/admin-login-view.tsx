import { useState, useEffect } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  Lock,
  LogIn,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { AdminUser } from '../../types/admin'
import { ADMIN_API_BASE_URL } from '../../services/api-client'
import { storeAdminSession } from '../../services/admin-session'

interface AdminLoginViewProps {
  onLoginSuccess: (user: AdminUser) => void
}

export function AdminLoginView({ onLoginSuccess }: AdminLoginViewProps) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'offline'>('checking')

  // Check backend connectivity on mount
  useEffect(() => {
    let isMounted = true
    async function checkApi() {
      try {
        const res = await fetch(`${ADMIN_API_BASE_URL}/auth/superadmin/setup/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        if (isMounted) {
          if (res.ok) {
            setApiStatus('connected')
          } else {
            setApiStatus('offline')
          }
        }
      } catch {
        if (isMounted) {
          setApiStatus('offline')
        }
      }
    }
    checkApi()
    return () => {
      isMounted = false
    }
  }, [])

  const handleFillCredentials = (emailVal: string, passVal: string) => {
    setIdentifier(emailVal)
    setPassword(passVal)
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedIdentifier = identifier.trim()
    const trimmedPassword = password.trim()

    if (!trimmedIdentifier || !trimmedPassword) {
      setErrorMessage('Please provide both username/email and your password.')
      return
    }

    setIsLoading(true)

    try {
      // 1. Try real backend authentication
      const response = await fetch(`${ADMIN_API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedIdentifier,
          password: trimmedPassword,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const userObj: AdminUser = {
          id: data.user.id,
          uuid: data.user.uuid,
          username: data.user.username,
          email: data.user.email,
          fullName: data.user.fullName || data.user.username,
          role: data.user.role,
          roleDisplay: data.user.roleDisplay || (data.user.role === 'super_admin' ? 'Super Admin' : 'Admin'),
          avatar: data.user.avatar,
          phone: data.user.phone,
          isStaff: data.user.isStaff ?? true,
          isSuperAdmin: data.user.role === 'super_admin' || data.user.isSuperAdmin,
          permissions: data.user.permissions || [],
        }

        storeAdminSession(data.access, data.refresh, userObj, rememberMe)

        onLoginSuccess(userObj)
        return
      }

      // If backend returned error response (e.g. 400/401)
      const errorData = await response.json().catch(() => null)
      const msg =
        errorData?.detail ||
        errorData?.non_field_errors?.[0] ||
        'Invalid email or password. Please verify your credentials.'
      setErrorMessage(msg)
    } catch {
      // 2. Intelligent local fallback if backend is offline during frontend-only previews
      if (
        (trimmedIdentifier === 'manager@amberspice.com' ||
          trimmedIdentifier === 'superadmin@amberspice.com' ||
          trimmedIdentifier === 'manager' ||
          trimmedIdentifier === 'superadmin') &&
        (trimmedPassword === 'Manager@2026!' || trimmedPassword === 'SuperAdmin@2026!')
      ) {
        const fallbackSuperAdmin: AdminUser = {
          id: 1,
          uuid: 'manager-master-uuid',
          username: 'manager',
          email: 'manager@amberspice.com',
          fullName: 'Tariq Al-Hassan (Whole Manager)',
          role: 'manager',
          roleDisplay: 'Super Admin (Whole Admin Manager)',
          avatar: '/figma-assets/about/about-chef-tariq.png',
          phone: '+353 (89) 948 5800',
          isStaff: true,
          isSuperAdmin: true,
          permissions: ['*'],
        }

        if (rememberMe) {
          localStorage.setItem('amber_admin_token', 'offline-manager-token')
          localStorage.setItem('amber_admin_user', JSON.stringify(fallbackSuperAdmin))
        }

        onLoginSuccess(fallbackSuperAdmin)
        return
      }

      if (
        (trimmedIdentifier === 'staff@amberspice.com' || trimmedIdentifier === 'staff') &&
        (trimmedPassword === 'Staff@2026!' || trimmedPassword === 'staff123')
      ) {
        const fallbackStaff: AdminUser = {
          id: 3,
          uuid: 'staff-master-uuid',
          username: 'staff',
          email: 'staff@amberspice.com',
          fullName: 'Rahim Khan (Operations Staff)',
          role: 'staff',
          roleDisplay: 'Operations Staff (Dishes & Stock)',
          avatar: '/figma-assets/about/about-chef-tariq.png',
          phone: '+353 87 234 5678',
          isStaff: true,
          isSuperAdmin: false,
          permissions: ['orders:view', 'orders:create', 'menu:manage', 'inventory:manage'],
        }

        if (rememberMe) {
          localStorage.setItem('amber_admin_token', 'offline-staff-token')
          localStorage.setItem('amber_admin_user', JSON.stringify(fallbackStaff))
        }

        onLoginSuccess(fallbackStaff)
        return
      }

      if (
        (trimmedIdentifier === 'chef@amberspice.com' ||
          trimmedIdentifier === 'chef@restaurant.com' ||
          trimmedIdentifier === 'chef') &&
        (trimmedPassword === 'Chef@2026!' || trimmedPassword === 'kitchen123')
      ) {
        const fallbackChef: AdminUser = {
          id: 4,
          uuid: 'chef-master-uuid',
          username: 'chef',
          email: 'chef@amberspice.com',
          fullName: 'Chef Marco Rossi (Head Chef)',
          role: 'chef',
          roleDisplay: 'Executive Chef (Kitchen KDS)',
          avatar: '/figma-assets/about/about-chef-tariq.png',
          phone: '+353 89 765 4321',
          isStaff: true,
          isSuperAdmin: false,
          permissions: ['kitchen:view_orders', 'kitchen:update_status'],
        }

        if (rememberMe) {
          localStorage.setItem('amber_admin_token', 'offline-chef-token')
          localStorage.setItem('amber_admin_user', JSON.stringify(fallbackChef))
        }

        onLoginSuccess(fallbackChef)
        return
      }

      if (
        (trimmedIdentifier === 'admin@restaurant.com' || trimmedIdentifier === 'admin') &&
        trimmedPassword === 'admin123'
      ) {
        const fallbackAdmin: AdminUser = {
          id: 2,
          uuid: 'admin-master-uuid',
          username: 'admin',
          email: 'admin@restaurant.com',
          fullName: 'Owner Admin',
          role: 'admin',
          roleDisplay: 'Owner/Admin',
          avatar: '/figma-assets/about/about-chef-tariq.png',
          phone: '+353 (89) 948 5800',
          isStaff: true,
          isSuperAdmin: false,
          permissions: ['*'],
        }

        if (rememberMe) {
          localStorage.setItem('amber_admin_token', 'offline-admin-token')
          localStorage.setItem('amber_admin_user', JSON.stringify(fallbackAdmin))
        }

        onLoginSuccess(fallbackAdmin)
        return
      }

      setErrorMessage('Could not connect to backend server on http://127.0.0.1:8000. Please start the backend service or verify credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#140E0A] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#B84A22] selection:text-white relative overflow-hidden">
      {/* Background Decorative Ambience */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#B84A22]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#FBA138]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-[#140E0A] to-[#100C0A] pointer-events-none" />

      {/* Main Glassmorphic Login Card */}
      <div className="w-full max-w-[460px] relative z-10 bg-[#1C1613]/90 border border-stone-800/80 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-7">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#B84A22] to-[#FBA138] p-0.5 shadow-lg shadow-[#B84A22]/20 mb-2">
            <div className="h-full w-full bg-[#1C1613] rounded-[14px] flex items-center justify-center">
              <Flame className="h-7 w-7 text-[#FBA138]" />
            </div>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>AMBER SPICE</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#B84A22]/20 text-[#FBA138] border border-[#B84A22]/30">
              PORTAL
            </span>
          </h1>
          <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
            The Art of Taste &amp; Tradition
          </p>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-200/90 font-medium bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Super Admin &amp; Management Login
            </span>
          </div>
        </div>

        {/* Backend API Live Status Indicator */}
        <div className="mb-5 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/40 border border-stone-800/70 text-[11px]">
          <span className="text-stone-400 font-medium">Backend API (Port 8000):</span>
          <span className="flex items-center gap-1.5 font-semibold">
            {apiStatus === 'connected' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400">Live &amp; Connected</span>
              </>
            ) : apiStatus === 'offline' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-amber-400">Local / Standalone Mode</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-stone-400 animate-ping" />
                <span className="text-stone-400">Verifying...</span>
              </>
            )}
          </span>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email / Username Field */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="superadmin@amberspice.com"
                className="w-full h-11 bg-black/50 border border-stone-700/80 rounded-xl pl-10 pr-3.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#B84A22] focus:ring-1 focus:ring-[#B84A22] transition"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-300">
                Password
              </label>
              <span className="text-[11px] text-stone-400">Protected</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 bg-black/50 border border-stone-700/80 rounded-xl pl-10 pr-10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#B84A22] focus:ring-1 focus:ring-[#B84A22] transition font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-stone-300 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-stone-700 text-[#B84A22] focus:ring-[#B84A22] bg-black/50"
              />
              <span>Keep workstation authenticated</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-[#B84A22] to-[#FBA138] hover:from-[#a03f1b] hover:to-[#e5922e] text-white text-xs font-bold shadow-lg shadow-[#B84A22]/25 flex items-center justify-center gap-2 active:scale-[0.99] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating Super Admin...
              </span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Enter Admin Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Quick 1-Click Credentials Helper */}
        <div className="mt-7 pt-6 border-t border-stone-800/90 space-y-2.5">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider text-center">
            ⚡ Quick 1-Click Role Login
          </p>

          {/* 1. Manager (Super Admin / Whole Access) */}
          <button
            type="button"
            onClick={() =>
              handleFillCredentials('manager@amberspice.com', 'Manager@2026!')
            }
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-left transition group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>Manager</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-stone-950 font-black">
                    SUPER ADMIN • ALL ACCESS
                  </span>
                </p>
                <p className="text-[10px] text-stone-400 font-mono">
                  manager@amberspice.com
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-amber-300/80 group-hover:text-amber-200">
              Autofill →
            </span>
          </button>

          {/* 2. Operations Staff (Dishes, Inventory, Forward Orders) */}
          <button
            type="button"
            onClick={() => handleFillCredentials('staff@amberspice.com', 'Staff@2026!')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-left transition group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <span>Staff</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-400 text-stone-950 font-black">
                    INVENTORY, DISHES &amp; ORDERS
                  </span>
                </p>
                <p className="text-[10px] text-stone-400 font-mono">staff@amberspice.com</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-blue-300/80 group-hover:text-blue-200">
              Autofill →
            </span>
          </button>

          {/* 3. Chef (Kitchen KDS Only & Stock Alerts) */}
          <button
            type="button"
            onClick={() => handleFillCredentials('chef@amberspice.com', 'Chef@2026!')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 text-left transition group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-300">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                  <span>Chef</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-400 text-stone-950 font-black">
                    KITCHEN KDS &amp; STOCK ALERT
                  </span>
                </p>
                <p className="text-[10px] text-stone-400 font-mono">chef@amberspice.com</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-orange-300/80 group-hover:text-orange-200">
              Autofill →
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

