<template>
  <NavComponent
    :socket="socket"
    :menu="navMenuType"
    class="fixed top-4 right-4 z-50"
  />

  <div class="max-w-3xl mx-auto p-6">

    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold">
        Chat Room {{ chatID }}
      </h1>
    </div>

    <!-- Messages -->
    <div class="flex flex-col gap-3">
      <div
        v-for="msg in messages"
        :key="msg.messageID"
        class="p-3 rounded-lg bg-surface dark:bg-surface-dark"
      >
        <div class="flex justify-between items-center mb-1">
          <p class="text-sm font-semibold">
            User #{{ msg.userID }}
          </p>

          <p class="text-xs opacity-50">
            {{ formatTime(msg.sentAt) }}
          </p>
        </div>

        <p class="text-base">
          {{ msg.msg }}
        </p>
      </div>

      <div
        v-if="messages.length === 0"
        class="text-center opacity-60 mt-6"
      >
        No messages yet.
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import { useRoute } from "vue-router"
import { getSocket } from "@/composables/socket"
import NavComponent from "@/components/NavComponent.vue"

const socket = getSocket()
const route = useRoute()

const navMenuType = ref("home")

const chatID = Number(route.params.id)
const messages = ref<any[]>([])

function joinRoom() {
  socket.emit("joinChatRoom", chatID)
}

function handleHistory(data: any) {
  // depending on backend shape
  const logs = data?.logs ?? data
  messages.value = logs || []
}

function handleNewMessage(msg: any) {
  if (msg.chatID !== chatID) return
  messages.value.push(msg)
}

function formatTime(date: string) {
  if (!date) return ""
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })
}

onMounted(() => {
  joinRoom()

  socket.on("chatHistory", handleHistory)
  socket.on("newMessage", handleNewMessage)
})

onUnmounted(() => {
  socket.off("chatHistory", handleHistory)
  socket.off("newMessage", handleNewMessage)

  socket.emit("leaveChatRoom", chatID)
})
</script>