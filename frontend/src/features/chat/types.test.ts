import { describe, expect, it } from 'vitest'
import { parseChatRoom } from './types'

describe('parseChatRoom', () => {
  it('preserves house and floor numbers from the current payload', () => {
    expect(parseChatRoom({ chatID: 3, name: 'General', isDirect: false, house: '12', floor: 4 }))
      .toMatchObject({ house: '12', floor: 4 })
  })

  it('accepts legacy dorm location field names', () => {
    expect(parseChatRoom({ chatID: 3, name: 'General', isDirect: false, dormAddress: '14', dormFloor: 2 }))
      .toMatchObject({ house: '14', floor: 2 })
  })

  it('uses the canonical database address field', () => {
    expect(parseChatRoom({ chatID: 3, name: 'General', isDirect: false, address: '12', floor: 5 }))
      .toMatchObject({ house: '12', floor: 5 })
  })

  it('rejects shared rooms without location data', () => {
    expect(parseChatRoom({ chatID: 3, name: 'General', isDirect: false })).toBeNull()
  })
})
