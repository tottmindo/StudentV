const SESSION_KEYS = [
  'authToken', 'dormID', 'role', 'userRole', 'userID', 'email', 'username',
  'mustChangePassword', 'dashboard', 'events',
]

export function hasSession(): boolean {
  return Boolean(sessionStorage.getItem('authToken'))
}

export function clearSession(): void {
  for (const key of SESSION_KEYS) sessionStorage.removeItem(key)
  window.dispatchEvent(new Event('auth-state-changed'))
}

