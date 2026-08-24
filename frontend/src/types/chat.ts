export interface ChatRoom {
  chatID: number
  name: string
  isDirect: boolean
  house: string
  floor: number
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
