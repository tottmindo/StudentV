import { ref } from 'vue'

export type AppTheme = 'light' | 'dark'

const STORAGE_KEY = 'theme'
const isDark = ref(false)

function preferredTheme(): AppTheme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function setTheme(theme: AppTheme) {
  isDark.value = theme === 'dark'
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem(STORAGE_KEY, theme)
}

export function initializeTheme() {
  setTheme(preferredTheme())
}

export function useTheme() {
  const toggleTheme = () => setTheme(isDark.value ? 'light' : 'dark')
  return { isDark, toggleTheme }
}
