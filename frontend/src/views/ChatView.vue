<template>
  <div class="max-w-5xl mx-auto p-6">

    <div
      v-if="chatRooms.length === 0"
      class="text-center opacity-60"
    >
      No chat rooms found.
    </div>

    <div
      v-for="room in chatRooms"
      :key="room.chatID"
      @click="openChat(room.chatID)"
      class="cursor-pointer rounded-lg p-5 mb-3
             bg-surface dark:bg-surface-dark
             hover:shadow-md hover:opacity-90 transition"
    >
      <h2 class="text-xl font-semibold">
        {{ room.name }}
      </h2>

      <p class="text-sm opacity-60">
        Chat #{{ room.chatID }}
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { getSocket } from "@/composables/socket";

const socket = getSocket();
const router = useRouter();


const chatRooms = ref<any[]>([]);

const dormID = Number(sessionStorage.getItem("dormID"));

function getRooms() {
  socket.emit("getChatRooms");
}

function handleRooms(data: any) {
  chatRooms.value = data;
  console.log("Got chat rooms", data);

}

function openChat(chatID: number) {
  router.push({
    name: "chatRoom",
    params: {
      id: chatID
    }
  });
}

onMounted(() => {
  console.log("calling for chat rooms");
  getRooms();

  socket.on("chatRooms", handleRooms);

});

onUnmounted(() => {
  socket.off("chatRooms", handleRooms);
});
</script>
