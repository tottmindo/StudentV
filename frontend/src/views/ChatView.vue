<template>
  <main class="chat-page">
    <section class="chat-shell" :class="{ 'mobile-room-open': selectedRoom }">
      <aside class="room-panel" :aria-label="t('chat.rooms')">
        <header class="room-header"><h1>{{ t('chat.rooms') }}</h1></header>
        <div v-if="loadingRooms" class="panel-state">{{ t('chat.loadingRooms') }}</div>
        <div v-else-if="roomsError" class="panel-state text-red-700 dark:text-red-300">
          {{ roomsError }} <button class="retry-button" type="button" @click="requestRooms">{{ t('chat.retry') }}</button>
        </div>
        <div v-else-if="chatRooms.length === 0" class="panel-state">{{ t('chat.none') }}</div>
        <nav v-else class="room-list">
          <button v-for="room in chatRooms" :key="room.chatID" type="button" class="room-button"
            :class="{ active: room.chatID === selectedRoom?.chatID }"
            :aria-current="room.chatID === selectedRoom?.chatID ? 'page' : undefined" @click="selectRoom(room)">
            <span class="room-avatar" aria-hidden="true">{{ room.name.charAt(0).toUpperCase() }}</span>
            <span class="min-w-0 text-left">
              <strong class="block truncate">{{ room.name }}</strong>
              <span class="block truncate text-sm opacity-60">{{ t('chat.roomNumber', { id: room.chatID }) }}</span>
            </span>
          </button>
        </nav>
      </aside>

      <section v-if="selectedRoom" class="conversation-panel" :aria-label="selectedRoom.name">
        <header class="conversation-header">
          <button class="back-button" type="button" :aria-label="t('chat.backToRooms')" @click="closeMobileRoom"><span aria-hidden="true">←</span></button>
          <div class="min-w-0">
            <h2 class="truncate">{{ chatName || selectedRoom.name }}</h2>
            <p>{{ t('chat.roomNumber', { id: selectedRoom.chatID }) }}</p>
          </div>
        </header>
        <div ref="scrollBox" class="message-list" aria-live="polite">
          <div v-if="loadingMessages" class="message-state">{{ t('chat.loadingMessages') }}</div>
          <div v-else-if="chatError" class="message-state text-red-700 dark:text-red-300">{{ chatError }}</div>
          <div v-else-if="messages.length === 0" class="message-state">{{ t('chat.noMessages') }}</div>
          <div v-for="msg in messages" :key="msg.messageID" class="message-row" :class="msg.userID === currentUserID ? 'own' : 'other'">
            <div class="message-bubble">
              <div class="message-meta">
                <strong>{{ msg.userID === currentUserID ? t('chat.you') : msg.username }}</strong>
                <time :datetime="msg.sentAt">{{ formatTime(msg.sentAt) }}</time>
              </div>
              <p>{{ msg.msg }}</p>
            </div>
          </div>
        </div>
        <form class="composer" @submit.prevent="sendMessage">
          <label class="sr-only" for="chat-message">{{ t('chat.placeholder') }}</label>
          <input id="chat-message" v-model="newMessage" type="text" maxlength="2000" autocomplete="off"
            :placeholder="t('chat.placeholder')" :disabled="sending || loadingMessages" />
          <button type="submit" :disabled="sending || !newMessage.trim()">{{ t('chat.send') }}</button>
        </form>
      </section>

      <section v-else class="empty-conversation">
        <div><span aria-hidden="true">💬</span><h2>{{ t('chat.selectRoom') }}</h2><p>{{ t('chat.selectRoomHelp') }}</p></div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getSocket } from '@/composables/socket'

interface ChatRoom { chatID: number; name: string }
interface ChatMessage { messageID: number; chatID: number; userID: number; username: string; msg: string; sentAt: string }
interface ChatHistory { chatID: number; logs: ChatMessage[]; name?: string }

const socket = getSocket()
const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const currentUserID = Number(sessionStorage.getItem('userID') || 0)
const chatRooms = ref<ChatRoom[]>([])
const selectedRoomID = ref<number | null>(null)
const selectedRoom = computed(() => chatRooms.value.find(room => room.chatID === selectedRoomID.value) ?? null)
const chatName = ref('')
const messages = ref<ChatMessage[]>([])
const newMessage = ref('')
const scrollBox = ref<HTMLElement | null>(null)
const loadingRooms = ref(true)
const loadingMessages = ref(false)
const sending = ref(false)
const roomsError = ref('')
const chatError = ref('')

function requestRooms() {
  loadingRooms.value = true
  roomsError.value = ''
  socket.emit('getChatRooms')
}

function handleRooms(data: unknown) {
  loadingRooms.value = false
  if (!Array.isArray(data)) { roomsError.value = t('chat.loadFailed'); return }
  chatRooms.value = data.filter((room): room is ChatRoom => Number.isInteger(room?.chatID) && typeof room?.name === 'string')
  const requestedID = Number(route.query.room)
  const requestedRoom = chatRooms.value.find(room => room.chatID === requestedID)
  if (requestedRoom) selectRoom(requestedRoom, false)
  else if (selectedRoomID.value && !selectedRoom.value) leaveCurrentRoom()
}

function selectRoom(room: ChatRoom, updateUrl = true) {
  if (selectedRoomID.value === room.chatID) return
  leaveCurrentRoom()
  selectedRoomID.value = room.chatID
  chatName.value = room.name
  messages.value = []
  chatError.value = ''
  loadingMessages.value = true
  socket.emit('joinChatRoom', room.chatID)
  if (updateUrl) void router.replace({ name: 'chat', query: { room: String(room.chatID) } })
}

function leaveCurrentRoom() {
  if (selectedRoomID.value !== null) socket.emit('leaveChatRoom', selectedRoomID.value)
  selectedRoomID.value = null
  loadingMessages.value = false
}

function closeMobileRoom() {
  leaveCurrentRoom()
  messages.value = []
  void router.replace({ name: 'chat' })
}

function handleHistory(data: ChatHistory) {
  if (!data || data.chatID !== selectedRoomID.value || !Array.isArray(data.logs)) return
  chatName.value = data.name || selectedRoom.value?.name || ''
  messages.value = [...data.logs].reverse()
  loadingMessages.value = false
  scrollToBottom()
}

function handleNewMessage(msg: ChatMessage) {
  if (!msg || msg.chatID !== selectedRoomID.value) return
  if (!messages.value.some(item => item.messageID === msg.messageID)) messages.value.push(msg)
  if (msg.userID !== currentUserID) socket.emit('markChatRead', msg.chatID)
  scrollToBottom()
}

function handleSocketError(error: { message?: string }) {
  if (loadingRooms.value) { loadingRooms.value = false; roomsError.value = error?.message || t('chat.loadFailed') }
  else if (selectedRoomID.value !== null) { loadingMessages.value = false; chatError.value = error?.message || t('chat.loadFailed') }
}

function handleReconnect() {
  requestRooms()
  if (selectedRoomID.value !== null) socket.emit('joinChatRoom', selectedRoomID.value)
}

function handleAuthenticated() {
  requestRooms()
  if (selectedRoomID.value !== null) socket.emit('joinChatRoom', selectedRoomID.value)
}

function sendMessage() {
  const message = newMessage.value.trim()
  if (!message || selectedRoomID.value === null || sending.value) return
  sending.value = true
  socket.timeout(10000).emit('sendMessage', selectedRoomID.value, message, (timeoutError: Error | null, response?: { error?: string }) => {
    sending.value = false
    if (timeoutError || response?.error) { chatError.value = response?.error || t('chat.sendFailed'); return }
    newMessage.value = ''
    chatError.value = ''
  })
}

function scrollToBottom() {
  void nextTick(() => { if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight })
}

function formatTime(date: string) {
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return ''
  const now = new Date()
  const sameDay = value.toDateString() === now.toDateString()
  const options: Intl.DateTimeFormatOptions = sameDay
    ? { hour: '2-digit', minute: '2-digit' }
    : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', ...(value.getFullYear() !== now.getFullYear() && { year: 'numeric' as const }) }
  return new Intl.DateTimeFormat(locale.value, options).format(value)
}

onMounted(() => {
  socket.on('chatRooms', handleRooms)
  socket.on('chatHistory', handleHistory)
  socket.on('newMessage', handleNewMessage)
  socket.on('error', handleSocketError)
  socket.on('connect', handleReconnect)
  socket.on('authenticated', handleAuthenticated)
  requestRooms()
})

onUnmounted(() => {
  leaveCurrentRoom()
  socket.off('chatRooms', handleRooms)
  socket.off('chatHistory', handleHistory)
  socket.off('newMessage', handleNewMessage)
  socket.off('error', handleSocketError)
  socket.off('connect', handleReconnect)
  socket.off('authenticated', handleAuthenticated)
})
</script>

<style scoped>
.chat-page { height: calc(100dvh - 4rem - env(safe-area-inset-top)); padding: 1rem; }
.chat-shell { display: grid; grid-template-columns: minmax(15rem, 21rem) minmax(0, 1fr); height: 100%; max-width: 80rem; margin: auto; overflow: hidden; border: 1px solid rgb(0 0 0 / .09); border-radius: 1rem; background: white; box-shadow: 0 12px 35px rgb(0 0 0 / .07); }
.room-panel { display: flex; min-width: 0; flex-direction: column; border-right: 1px solid rgb(0 0 0 / .09); background: #f5f4f1; }
.room-header, .conversation-header { min-height: 4.5rem; padding: 1rem 1.25rem; border-bottom: 1px solid rgb(0 0 0 / .09); }
.room-header h1, .conversation-header h2 { font-size: 1.25rem; font-weight: 800; }
.conversation-header { display: flex; align-items: center; gap: .75rem; }
.conversation-header p { font-size: .8rem; opacity: .6; }
.room-list { overflow-y: auto; padding: .6rem; }
.room-button { display: flex; width: 100%; align-items: center; gap: .75rem; padding: .8rem; border-radius: .8rem; transition: background-color 150ms ease; }
.room-button:hover { background: rgb(255 255 255 / .8); }
.room-button.active { background: #cf2e2e; color: white; }
.room-avatar { display: grid; width: 2.6rem; height: 2.6rem; flex: none; place-items: center; border-radius: 999px; background: rgb(0 0 0 / .08); font-weight: 800; }
.room-button.active .room-avatar { background: rgb(255 255 255 / .2); }
.panel-state, .message-state { margin: auto; padding: 2rem; text-align: center; opacity: .75; }
.retry-button { display: block; margin: .75rem auto 0; text-decoration: underline; }
.conversation-panel { display: flex; min-width: 0; min-height: 0; flex-direction: column; }
.message-list { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 1.25rem; }
.message-row { display: flex; margin-bottom: .75rem; }
.message-row.own { justify-content: flex-end; }
.message-bubble { max-width: min(75%, 38rem); padding: .7rem .9rem; border-radius: 1rem; background: #eeedea; overflow-wrap: anywhere; }
.message-row.own .message-bubble { border-bottom-right-radius: .25rem; background: #cf2e2e; color: white; }
.message-row.other .message-bubble { border-bottom-left-radius: .25rem; }
.message-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: .2rem; font-size: .72rem; opacity: .72; }
.message-bubble p { white-space: pre-wrap; }
.composer { display: flex; gap: .65rem; padding: .85rem max(.85rem, env(safe-area-inset-right)) max(.85rem, env(safe-area-inset-bottom)) max(.85rem, env(safe-area-inset-left)); border-top: 1px solid rgb(0 0 0 / .09); }
.composer input { min-width: 0; flex: 1; padding: .7rem .9rem; }
.composer button { padding: .7rem 1.1rem; border-radius: .75rem; background: #cf2e2e; color: white; font-weight: 800; }
.composer button:disabled { cursor: not-allowed; opacity: .45; }
.empty-conversation { display: grid; place-items: center; padding: 2rem; text-align: center; opacity: .65; }
.empty-conversation span { font-size: 2.5rem; }
.empty-conversation h2 { margin-top: .5rem; font-size: 1.25rem; font-weight: 800; }
.back-button { display: none; width: 2.5rem; height: 2.5rem; flex: none; place-items: center; border-radius: 999px; background: rgb(0 0 0 / .06); font-size: 1.35rem; }
@media (max-width: 639px) {
  .chat-page { padding: 0; }
  .chat-shell { display: block; border: 0; border-radius: 0; }
  .room-panel, .conversation-panel { width: 100%; height: 100%; border: 0; }
  .chat-shell.mobile-room-open .room-panel { display: none; }
  .chat-shell:not(.mobile-room-open) .conversation-panel, .empty-conversation { display: none; }
  .back-button { display: grid; }
  .message-list { padding: .85rem; }
  .message-bubble { max-width: 88%; }
}
@media (prefers-color-scheme: dark) {
  .chat-shell { border-color: rgb(255 255 255 / .12); background: #191919; }
  .room-panel { border-color: rgb(255 255 255 / .12); background: #202020; }
  .room-header, .conversation-header, .composer { border-color: rgb(255 255 255 / .12); }
  .room-button:hover { background: rgb(255 255 255 / .07); }
  .message-bubble { background: #292929; }
  .back-button { background: rgb(255 255 255 / .09); }
}
</style>
