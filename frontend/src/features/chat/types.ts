export interface ChatRoom {
  chatID: number
  name: string
  isDirect: boolean
  house: string
  floor: number
}

export function parseChatRoom(value: unknown): ChatRoom | null {
  if (!value || typeof value !== 'object') return null

  const room = value as Record<string, unknown>
  const chatID = Number(room.chatID)
  const name = typeof room.name === 'string' ? room.name : ''
  const house = room.address ?? room.house ?? room.dormAddress
  const floor = Number(room.floor ?? room.dormFloor)
  const isDirect = room.isDirect === true || room.isDirect === 1 || room.isDirect === 'true'

  if (!Number.isInteger(chatID) || !name) return null
  if (!isDirect && (house == null || !String(house).trim() || !Number.isFinite(floor))) return null

  return {
    chatID,
    name,
    isDirect,
    house: house == null ? '' : String(house),
    floor: Number.isFinite(floor) ? floor : 0,
  }
}

export interface MessageReaction {
  messageID: number
  emoji: string
  count: number
  reacted: boolean
}

export interface ChatMessage {
  messageID: number
  chatID: number
  userID: number
  username: string
  msg: string
  sentAt: string
  reactions: MessageReaction[]
}

export interface ChatHistory {
  chatID: number
  logs: ChatMessage[]
  name?: string
  reactions: MessageReaction[]
}
