<template>
  <main class="chat-page bg-background-light text-text dark:bg-background-dark dark:text-text-dark">
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
            <span class="room-avatar" aria-hidden="true">{{ roomName(room).charAt(0).toUpperCase() }}</span>
            <span class="min-w-0 text-left">
              <strong class="block truncate">{{ roomName(room) }}</strong>
              <span class="block truncate text-sm opacity-60">{{ t('chat.roomNumber', { id: room.chatID }) }}</span>
            </span>
          </button>
        </nav>
      </aside>

      <section v-if="selectedRoom" class="conversation-panel" :aria-label="roomName(selectedRoom)">
        <header class="conversation-header">
          <button class="back-button" type="button" :aria-label="t('chat.backToRooms')" @click="closeMobileRoom">
            <span aria-hidden="true">←</span>
          </button>

          <div class="min-w-0">
            <h2 class="truncate">{{ chatName || roomName(selectedRoom) }}</h2>
            <p>{{ t('chat.roomNumber', { id: selectedRoom.chatID }) }}</p>
          </div>

          <div ref="membersDropdownRef" class="members-dropdown-wrapper">
            <button
              type="button"
              class="members-toggle-button"
              :aria-expanded="showMembersDropdown"
              @click="showMembersDropdown = !showMembersDropdown"
            >
              <span aria-hidden="true">👥</span>
              <span class="font-bold">{{ roomMembers.length }}</span>
              <span class="text-xs transition-transform duration-200" :class="{ 'rotate-180': showMembersDropdown }">▼</span>
            </button>

            <div v-if="showMembersDropdown" class="members-dropdown">
              <div class="members-dropdown-title">
                {{ t('chat.members') }} ({{ roomMembers.length }})
              </div>
              <ul class="members-list">
                <li v-for="(member, idx) in roomMembers" :key="idx" class="member-item">
                  <span class="member-avatar" aria-hidden="true">
                    {{ member.username.charAt(0).toUpperCase() }}
                  </span>
                  <span class="member-name truncate">{{ member.username }}</span>
                </li>
              </ul>
            </div>
          </div>
        </header>
        <div ref="scrollBox" class="message-list" aria-live="polite">
          <div v-if="loadingMessages" class="message-state">{{ t('chat.loadingMessages') }}</div>
          <div v-else-if="chatError" class="message-state text-red-700 dark:text-red-300">{{ chatError }}</div>
          <div v-else-if="messages.length === 0" class="message-state">{{ t('chat.noMessages') }}</div>
          <div
              v-for="msg in messages"
              :key="msg.messageID"
              class="message-row"
              :class="msg.userID === currentUserID ? 'own' : 'other'"
            >
              <div class="message-bubble">
                <div class="message-meta">
                  <strong>
                    {{ msg.userID === currentUserID ? t('chat.you') : msg.username }}
                  </strong>
                  <time :datetime="msg.sentAt">
                    {{ formatTime(msg.sentAt) }}
                  </time>
                </div>

                <p>{{ msg.msg }}</p>

                <div
                  v-if="msg.reactions.length"
                  class="message-reactions"
                >
                  <button
                    v-for="reaction in msg.reactions"
                    :key="reaction.emoji"
                    type="button"
                    class="reaction-button"
                    :class="{ reacted: reaction.reacted }"
                    @click="toggleReaction(msg.messageID, reaction.emoji)"
                  >
                    <span>{{ reaction.emoji }}</span>
                    <span>{{ reaction.count }}</span>
                  </button>
                </div>
              </div>

              <!-- Reaction button OUTSIDE the bubble -->
              <div
                class="reaction-picker-wrapper"
                :data-message-id="msg.messageID"
              >
                <button
                  type="button"
                  class="reaction-add-button"
                  aria-label="Add reaction"
                  @click="openReactionPicker(msg.messageID)"
                >
                  +
                </button>

                <emoji-picker
                  v-if="reactionPickerMessageID === msg.messageID"
                  class="reaction-picker"
                  @emoji-click="(event : CustomEvent <{ unicode : string}>) => addReaction(msg.messageID, event)"
                />
              </div>
            </div>
        </div>
        <form class="composer" @submit.prevent="sendMessage">
        <!-- Emoji picker -->
        <div ref="emojiPickerWrapper" class="emoji-picker-wrapper">
          <button
            type="button"
            class="emoji-button"
            aria-label="Emoji"
            @click="showEmojiPickerElement = !showEmojiPickerElement"
          >
            😊
          </button>
          <emoji-picker
            v-if="showEmojiPickerElement"
            class="emoji-picker"
            @emoji-click="addEmoji"
          />
        </div>
        <label class="sr-only" for="chat-message">
          {{ t('chat.placeholder') }}
        </label>

        <input
          id="chat-message"
          v-model="newMessage"
          type="text"
          maxlength="2000"
          autocomplete="off"
          :placeholder="t('chat.placeholder')"
          :disabled="sending || loadingMessages"
        />

        <button
          type="submit"
          :disabled="sending || !newMessage.trim()"
        >
          {{ t('chat.send') }}
        </button>

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
import "emoji-picker-element"
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'

interface ChatRoom { chatID: number; name: string; isDirect: boolean; house: string; floor: number }
interface ChatMessage { messageID: number; chatID: number; userID: number; username: string; msg: string; sentAt: string, reactions : MessageReactions[] }
interface MessageReactions { messageID : number, emoji : string,  count : number, reacted : boolean }
interface ChatHistory { chatID: number; logs: ChatMessage[]; name?: string, reactions: MessageReactions[] }

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
const showEmojiPickerElement = ref(false)
const emojiPickerWrapper = ref<HTMLElement | null>(null)
const reactionPickerMessageID = ref<number | null>(null)
const roomMembers = ref<{ username: string}[]>([])
const showMembersDropdown = ref(false)
const membersDropdownRef = ref<HTMLElement | null>(null)
const reactionPickerWrapper = ref<HTMLElement | null>(null)
const roomName = (room: ChatRoom) => room.isDirect ? room.name : t('chat.generalName', { house: room.house, floor: room.floor })

function handleClickOutsideMembersDropdown(event: MouseEvent) {
  if (
    showMembersDropdown.value &&
    membersDropdownRef.value &&
    !membersDropdownRef.value.contains(event.target as Node)
  ) {
    showMembersDropdown.value = false
  }
}

polyfillCountryFlagEmojis("Twemoji Mozilla")

function handleRoomMembers(data: unknown){
  if (Array.isArray(data)){
    roomMembers.value = data
  }
}

function addEmoji(event: CustomEvent){
  newMessage.value += event.detail.unicode
}

function handleClickOutsideEmojiPicker(event: MouseEvent) {
  const target = event.target as Node

  if (
    showEmojiPickerElement.value &&
    emojiPickerWrapper.value &&
    !emojiPickerWrapper.value.contains(target)
  ) {
    showEmojiPickerElement.value = false
  }

  if (reactionPickerMessageID.value !== null) {
    const picker = document.querySelector(
      `.reaction-picker-wrapper[data-message-id="${reactionPickerMessageID.value}"]`
    )

    if (picker && !picker.contains(target)) {
      reactionPickerMessageID.value = null
    }
  }
}

function openReactionPicker(messageID: number) {
  if (reactionPickerMessageID.value === messageID) {
    reactionPickerMessageID.value = null
  } else {
    reactionPickerMessageID.value = messageID
  }
}

function addReaction(messageID: number, event: CustomEvent) {
  const emoji = event.detail.unicode

  if (!emoji) return

  toggleReaction(messageID, emoji)

  reactionPickerMessageID.value = null
}

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
  chatName.value = roomName(room)
  messages.value = []
  chatError.value = ''
  loadingMessages.value = true
  socket.emit('joinChatRoom', room.chatID)
  socket.emit('getChatMembers', room.chatID)
  if (updateUrl) void router.replace({ name: 'chat', query: { room: String(room.chatID) } })
}

function leaveCurrentRoom() {
  if (selectedRoomID.value !== null) socket.emit('leaveChatRoom', selectedRoomID.value)
  selectedRoomID.value = null
  loadingMessages.value = false
  roomMembers.value = []
  showMembersDropdown.value = false
}

function closeMobileRoom() {
  leaveCurrentRoom()
  messages.value = []
  void router.replace({ name: 'chat' })
}

function handleHistory(data: ChatHistory) {
  if (
    !data ||
    data.chatID !== selectedRoomID.value ||
    !Array.isArray(data.logs)
  ) return

  chatName.value = selectedRoom.value?.isDirect ? (data.name || selectedRoom.value.name) : selectedRoom.value ? roomName(selectedRoom.value) : ''

  const reactions = Array.isArray(data.reactions)
    ? data.reactions
    : []

  messages.value = [...data.logs]
    .reverse()
    .map(message => ({
      ...message,
      reactions: reactions.filter(
        reaction => reaction.messageID === message.messageID
      )
    }))

  loadingMessages.value = false
  scrollToBottom()
}

function toggleReaction(messageID: number, emoji: string) {
  const chatID = selectedRoomID.value

  if (chatID === null) return

  socket.timeout(10000).emit(
    'toggleMessageReaction',
    messageID,
    chatID,
    emoji,
    (timeoutError: Error | null, response?: { error?: string }) => {
      if (timeoutError) {
        chatError.value = t('chat.reactionFailed')
        return
      }

      if (response?.error) {
        chatError.value = response.error
        return
      }

      chatError.value = ''
    }
  )
}

function handleReactionUpdated(data: {messageID: number
                                      userID: number
                                      emoji: string 
                                      added: boolean}) {
  if (!data) return

  const message = messages.value.find(
    msg => msg.messageID === data.messageID
  )

  if (!message) return

  const existingReaction = message.reactions.find(
    reaction => reaction.emoji === data.emoji
  )

  if (data.added) {
    if (existingReaction) {
      existingReaction.count += 1

      if (data.userID === currentUserID) {
        existingReaction.reacted = true
      }
    } else {
      message.reactions.push({
        messageID: data.messageID,
        emoji: data.emoji,
        count: 1,
        reacted: data.userID === currentUserID
      })
    }
  } else {
    if (!existingReaction) return

    existingReaction.count -= 1

    if (data.userID === currentUserID) {
      existingReaction.reacted = false
    }

    if (existingReaction.count <= 0) {
      message.reactions = message.reactions.filter(
        reaction => reaction.emoji !== data.emoji
      )
    }
  }
}

function handleNewMessage(msg: ChatMessage) {
  if (!msg || msg.chatID !== selectedRoomID.value) return
  if (!messages.value.some(item => item.messageID === msg.messageID)) {
    messages.value.push({
      ...msg,
      reactions: []
    })
  }
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
  socket.on('chatMembers', handleRoomMembers)
  socket.on('messageReactionUpdated', handleReactionUpdated)
  document.addEventListener('click', handleClickOutsideMembersDropdown)

  document.addEventListener('click', handleClickOutsideEmojiPicker)

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
  socket.off('chatMembers', handleRoomMembers)
  socket.off('messageReactionUpdated', handleReactionUpdated)

  document.removeEventListener('click', handleClickOutsideEmojiPicker)
  document.removeEventListener('click', handleClickOutsideMembersDropdown)
})
</script>

<style scoped>
/* Push the dropdown to the top-right corner of the header */
.members-dropdown-wrapper {
  position: relative;
  margin-left: auto;
  flex: none;
}

/* Toggle Button */
.members-toggle-button {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid rgb(56 46 56 / .18);
  border-radius: 0.75rem;
  background: transparent;
  color: inherit;
  font-size: 0.875rem;
  transition: background-color 150ms ease;
}

.members-toggle-button:hover {
  background: rgb(0 0 0 / .06);
}

/* Dropdown Menu */
.members-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 100;
  width: 14rem;
  max-height: 18rem;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid rgb(56 46 56 / .18);
  border-radius: 0.75rem;
  background: #eee4d8;
  box-shadow: 0 10px 25px rgb(0 0 0 / 0.15);
}

.members-dropdown-title {
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid rgb(0 0 0 / .08);
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0.7;
  text-transform: uppercase;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.4rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.6rem;
  border-radius: 0.5rem;
}

.member-avatar {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  flex: none;
  place-items: center;
  border-radius: 999px;
  background: rgb(0 0 0 / .08);
  font-size: 0.75rem;
  font-weight: 800;
}

.member-name {
  font-size: 0.875rem;
}

/* Dark Mode Support */
:global(html.dark .members-toggle-button) {
  border-color: rgb(255 255 255 / .2);
}

:global(html.dark .members-toggle-button:hover) {
  background: rgb(255 255 255 / .08);
}

:global(html.dark .members-dropdown) {
  border-color: rgb(255 255 255 / .2);
  background: #514a58;
}

:global(html.dark .members-dropdown-title) {
  border-color: rgb(255 255 255 / .12);
}

:global(html.dark .member-avatar) {
  background: rgb(255 255 255 / .12);
}
:global(html.dark .reaction-button) {
  border-color: rgb(255 255 255 / .18);
  background: rgb(255 255 255 / .08);
}

:global(html.dark .reaction-button:hover) {
  background: rgb(255 255 255 / .14);
}

:global(html.dark .reaction-button.reacted) {
  border-color: #cf2e2e;
  background: rgb(207 46 46 / .2);
}
:global(html.dark .reaction-add-button) {
  border-color: rgb(255 255 255 / .18);
  background: rgb(255 255 255 / .08);
}

:global(html.dark .reaction-add-button:hover) {
  background: rgb(255 255 255 / .14);
}

.message-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: .35rem;
  margin-top: .5rem;
}

.reaction-button {
  display: inline-flex;
  align-items: center;
  gap: .25rem;
  padding: .2rem .45rem;
  border: 1px solid rgb(56 46 56 / .18);
  border-radius: 999px;
  background: rgb(255 255 255 / .55);
  font-size: .85rem;
  line-height: 1.2;
}

.reaction-button:hover {
  background: rgb(255 255 255 / .8);
}

.reaction-button.reacted {
  border-color: #cf2e2e;
  background: rgb(207 46 46 / .12);
}

.message-row.own .reaction-button {
  color: inherit;
}
.reaction-picker-wrapper {
  position: static;
  flex: none;
}

.reaction-add-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  padding: 0;
  border: 1px solid rgb(56 46 56 / .18);
  border-radius: 999px;
  background: rgb(255 255 255 / .55);
  font-size: 1rem;
  line-height: 1;
}

.reaction-add-button:hover {
  background: rgb(255 255 255 / .8);
}

.reaction-picker {
  position: absolute;
  bottom: calc(100% + .5rem);
  right: 0;
  z-index: 1000;
}
.emoji-picker-wrapper { position: relative; flex: none; }
.emoji-button { display: flex; align-items: center; justify-content: center; width: 2.75rem; height: 2.75rem; padding: 0;
  margin: 0; border: 1px solid rgb(56 46 56 / .18); border-radius: .75rem; background: transparent; color: inherit;
  font-size: 1.25rem; line-height: 1;}
.emoji-button:hover { background: rgb(0 0 0 / .06);}
.emoji-picker { position: absolute; bottom: calc(100% + .5rem); left: 0; z-index: 100;}
.chat-page { height: calc(100dvh - 4rem - env(safe-area-inset-top)); padding: 1rem; font-family: "Twemoji Mozilla", system-ui, sans-serif; }
.chat-shell { display: grid; grid-template-columns: minmax(15rem, 21rem) minmax(0, 1fr); height: 100%; max-width: 80rem; margin: auto; overflow: hidden; border: 1px solid rgb(56 46 56 / .18); border-radius: 1rem; background: #eee4d8; box-shadow: 0 12px 35px rgb(56 46 56 / .1); }
.room-panel { display: flex; min-width: 0; flex-direction: column; border-right: 1px solid rgb(56 46 56 / .18); background: #cfc0af; }
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
.message-row {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: .4rem;
  margin-bottom: .75rem;
}
.message-row.other {
  justify-content: flex-start;
}
.message-row.own { justify-content: flex-end; }
.message-bubble { max-width: min(75%, 38rem); padding: .7rem .9rem; border-radius: 1rem; background: #d8c9bb; overflow-wrap: anywhere; }
.message-row.own .message-bubble { border-bottom-right-radius: .25rem; background: #cf2e2e; color: white; }
.message-row.other .message-bubble { border-bottom-left-radius: .25rem; }
.message-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: .2rem; font-size: .72rem; opacity: .72; }
.message-bubble p { white-space: pre-wrap; }
.composer { display: flex; gap: .65rem; padding: .85rem max(.85rem, env(safe-area-inset-right)) max(.85rem, env(safe-area-inset-bottom)) max(.85rem, env(safe-area-inset-left)); border-top: 1px solid rgb(0 0 0 / .09); }
.composer input { min-width: 0; flex: 1; padding: .7rem .9rem; font-family: inherit;}
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
:global(html.dark .chat-shell) { border-color: rgb(255 244 232 / .2); background: #48424f; }
:global(html.dark .room-panel) { border-color: rgb(255 244 232 / .2); background: #514a58; }
:global(html.dark .room-header), :global(html.dark .conversation-header), :global(html.dark .composer) { border-color: rgb(255 255 255 / .12); }
:global(html.dark .room-button:hover) { background: rgb(255 255 255 / .07); }
:global(html.dark .message-bubble) { background: #625969; }
:global(html.dark .back-button) { background: rgb(255 255 255 / .09); }
</style>
