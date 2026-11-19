import { useState } from 'react'
import type { AdminUser } from '../../types/admin'
import { adminRequest } from '../../services/api-client'

export function AccountView({ user, onSaved }: { user: AdminUser; onSaved: (user: AdminUser) => void }) {
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone || '')
  const [firstName, setFirstName] = useState(user.fullName.split(' ')[0] || '')
  const [lastName, setLastName] = useState(user.fullName.split(' ').slice(1).join(' '))
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function save(e: React.FormEvent, changePassword = false) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      if (changePassword) {
        await adminRequest('auth/change-password/', { method: 'POST', requireAuth: true, body: JSON.stringify({ old_password: currentPassword, new_password: password }) })
        setCurrentPassword(''); setPassword(''); setMessage('Password changed.')
      } else {
        const saved = await adminRequest<AdminUser>('auth/me/', { method: 'PATCH', requireAuth: true, body: JSON.stringify({ email, phone, first_name: firstName, last_name: lastName }) })
        onSaved({ ...user, ...saved }); setMessage('Account saved.')
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save. Please retry.') }
    finally { setBusy(false) }
  }
  const style = 'block w-full rounded-xl border bg-white p-3 mt-1'
  return <div className="max-w-xl space-y-6"><h1 className="text-2xl font-bold">Your Account</h1>{error && <p role="alert" className="text-red-700">{error}</p>}{message && <p role="status" className="text-emerald-700">{message}</p>}<form onSubmit={save} className="space-y-3"><label className="block">First name<input className={style} value={firstName} onChange={e => setFirstName(e.target.value)} /></label><label className="block">Last name<input className={style} value={lastName} onChange={e => setLastName(e.target.value)} /></label><label className="block">Email<input className={style} type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><label className="block">Phone<input className={style} value={phone} onChange={e => setPhone(e.target.value)} /></label><button disabled={busy} className="rounded-xl bg-[#B84A22] p-3 text-white">Save account</button></form><form onSubmit={e => void save(e, true)} className="space-y-3 border-t pt-5"><h2 className="font-bold">Change password</h2><label className="block">Current password<input type="password" autoComplete="current-password" required className={style} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label><label className="block">New password<input type="password" autoComplete="new-password" required minLength={8} className={style} value={password} onChange={e => setPassword(e.target.value)} /></label><button disabled={busy} className="rounded-xl border bg-white p-3">Update password</button></form></div>
}
