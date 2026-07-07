<template>
  <NavComponent
    :socket="socket"
    :menu="navMenuType"
    class="fixed top-4 right-4 z-50"
  />

  <div class="max-w-3xl mx-auto h-screen flex flex-col p-6">
    <!-- Header -->
    <div class="mb-4">
      <h1 class="text-2xl font-bold">
        {{ chatName !== '' ? chatName : `chat room ${chatID}` }}
      </h1>
    </div>

    <!-- MESSAGES WRAPPER -->
    <!-- Using flex-col-reverse forces the first array item to the bottom -->
    <div
      ref="scrollBox"
      class="flex-1 overflow-y-auto flex flex-col-reverse gap-3 p-2"
    >
      <div
        v-for="msg in messages"
        :key="msg.messageID"
        class="flex w-full"
        :class="msg.userID === currentUserID ? 'justify-end' : 'justify-start'"
      >
        <div 
          class="max-w-[75%] p-3 rounded-2xl shadow-sm"
          :class="msg.userID === currentUserID 
            ? 'bg-accent text-white' 
            : 'bg-surface dark:bg-surface-dark'"
        >
          <div class="flex justify-between items-center mb-1">
            <p class="text-xs font-semibold opacity-70">
              {{ msg.userID === currentUserID ? 'You' : msg.username }}
            </p>
            <p class="text-xs opacity-40 ml-4">
              {{ formatTime(msg.sentAt) }}
            </p>
          </div>

          <p class="text-sm">
            {{ msg.msg }}
          </p>
        </div>
      </div>

      <div
        v-if="messages.length === 0"
        class="text-center opacity-60"
      >
        No messages yet.
      </div>
    </div>

    <!-- INPUT BAR -->
    <div class="mt-4 flex gap-2 items-center border-t pt-3">
      <input
        v-model="newMessage"
        type="text"
        placeholder="Type a message..."
        class="flex-1 px-4 py-2 rounded-lg border
               bg-white dark:bg-background-dark
               focus:outline-none focus:ring-2 focus:ring-accent"
        @keydown.enter="sendMessage"
      />
      <button
        @click="sendMessage"
        class="px-4 py-2 rounded-lg bg-accent text-white font-semibold"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue"
import { useRoute } from "vue-router"
import { getSocket } from "@/composables/socket"
import NavComponent from "@/components/NavComponent.vue"

const socket = getSocket()
const route = useRoute()

const navMenuType = ref("home")

const currentUserID = Number(sessionStorage.getItem('userID') || 0);

const chatID = Number(route.params.id)
const chatName = ref('');
const messages = ref<any[]>([])
const newMessage = ref("")

const scrollBox = ref<HTMLElement | null>(null)

function joinRoom() {
  socket.emit("joinChatRoom", chatID)
}

function handleHistory(data: any) {
  if (!data?.logs) return;
  messages.value = data.logs;
  chatName.value = data.name;
  scrollToBottom(); 
}

function handleNewMessage(msg: any) {
  if (msg.chatID !== chatID) return

  messages.value.unshift(msg)
  scrollToBottom()
}

function sendMessage() {
  if (!newMessage.value.trim()) return

  socket.emit("sendMessage", chatID, newMessage.value)

  newMessage.value = ""
}

function scrollToBottom() {
  nextTick(() => {
    if (scrollBox.value) {
      scrollBox.value.scrollTop = scrollBox.value.scrollHeight
    }
  })
}

function formatTime(date: string) {
  if (!date) return "";
  
  const d = new Date(date);
  const now = new Date();
  
  const isToday = 
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  } else {
    // IF FROM EARLIER YEAR
    if (d.getFullYear() !== now.getFullYear()){
      return d.toLocaleDateString([], { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric' 
        }) + ', ' + d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
        });
    }

    // IF FROM THIS YEAR BUT NOT TODAY
    return d.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    }) + ', ' + d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }
}


onMounted(() => {
  joinRoom();

  socket.on("chatHistory", handleHistory);
  socket.on("newMessage", handleNewMessage);
})

onUnmounted(() => {
  socket.off("chatHistory", handleHistory)
  socket.off("newMessage", handleNewMessage)

  socket.emit("leaveChatRoom", chatID)
})
</script>