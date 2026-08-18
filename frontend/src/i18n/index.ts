import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import sv from './locales/sv.json'

export const supportedLocales = ['en', 'sv'] as const
export type AppLocale = (typeof supportedLocales)[number]

function isSupportedLocale(value: string | null): value is AppLocale {
  return supportedLocales.includes(value as AppLocale)
}

function initialLocale(): AppLocale {
  const saved = localStorage.getItem('locale')
  if (isSupportedLocale(saved)) return saved
  const browserLocale = navigator.languages?.[0] || navigator.language
  return browserLocale.toLowerCase().startsWith('sv') ? 'sv' : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages: { en, sv },
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
})

export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
  document.documentElement.lang = locale
}

setLocale(i18n.global.locale.value as AppLocale)
