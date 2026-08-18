import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import sv from './locales/sv.json'

function flatten(value: unknown, prefix = ''): Record<string, string> {
  if (typeof value === 'string') return { [prefix]: value }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.entries(value).reduce<Record<string, string>>(
    (result, [key, child]) => Object.assign(result, flatten(child, prefix ? `${prefix}.${key}` : key)),
    {},
  )
}

describe('translation catalogs', () => {
  const english = flatten(en)
  const swedish = flatten(sv)

  it('contains exactly the same keys in English and Swedish', () => {
    expect(Object.keys(swedish).sort()).toEqual(Object.keys(english).sort())
  })

  it.each([
    ['English', english],
    ['Swedish', swedish],
  ])('%s translations are not empty', (_language, catalog) => {
    expect(Object.entries(catalog).filter(([, value]) => !value.trim())).toEqual([])
  })
})
