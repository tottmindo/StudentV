<template>
  <NavComponent :socket="socket" :menu="navMenuType" class="fixed top-4 right-4"/>
  
  <div class="flex flex-col justify-center items-center min-h-screen px-4">

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="w-full max-w-md space-y-4 p-8 rounded-lg bg-surface dark:bg-surface-dark shadow-lg">
      <h1 class="text-2xl font-bold text-headline dark:text-text-dark mb-6">Create New User</h1>

      <input
        type="number"
        class="rounded p-3 w-full mb-4 border border-border dark:border-border focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
        placeholder="Enter roomID"
        v-model="roomID"
        min="1"
        autocomplete="off"
        required
      />

      <input
        type="number"
        class="rounded p-3 w-full mb-4 border border-border dark:border-border focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
        placeholder="Enter dormID"
        v-model="dormID"
        min="1"
        autocomplete="off"
        required
      />

      <select
        class="rounded p-3 w-full mb-4 border border-border dark:border-border focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
        v-model="role"
        autocomplete="off"
        required
      >
        <option value="STUDENT">Student</option>
        <option value="ADMIN">Admin</option>
      </select>

      <input
        type="text"
        class="rounded p-3 w-full mb-4 border border-border dark:border-border focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
        placeholder="Enter username"
        v-model="username"
        autocomplete="off"
        required
      />

      <input
        type="password"
        class="rounded p-3 w-full mb-4 border border-border dark:border-border focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
        placeholder="Enter password"
        v-model="password"
        autocomplete="off"
        required
      />

      <button
        type="submit"
        class="w-full p-3 text-background-light bg-accent dark:bg-accent-dark hover:bg-accent-dark dark:hover:bg-accent text-center rounded-lg font-semibold transition-colors duration-300 disabled:opacity-50"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Creating...' : 'Create User' }}
      </button>
    </form>

    <!-- Feedback Message -->
    <p v-if="feedbackMessage" :class="feedbackClass" class="mt-4 text-center text-lg">
      {{ feedbackMessage }}
    </p>

    <div
      v-if="pendingReplacement"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div class="w-full max-w-md rounded-lg bg-surface dark:bg-surface-dark p-6 shadow-xl">
        <h2 class="text-xl font-bold text-headline dark:text-text-dark">Room already occupied</h2>
        <p class="mt-3 text-text dark:text-text-dark">
          Room {{ roomID }} in dorm {{ dormID }} already has active user
          <strong>{{ pendingReplacement.username }}</strong>.
        </p>
        <p class="mt-2 text-sm opacity-75">
          Creating this account will make {{ pendingReplacement.username }} inactive and move current/future cleaning assignments to the new user.
        </p>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-border px-4 py-2"
            @click="cancelReplacement"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-lg bg-accent px-4 py-2 font-semibold text-white"
            @click="confirmReplacement"
          >
            Replace user
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import NavComponent from '@/components/NavComponent.vue';
import { ref, onMounted, onUnmounted } from 'vue';
import { apiUrl } from '@/composables/api';
import { getSocket } from '@/composables/socket';
const socket = getSocket(); // Import the socket instance from socket.ts

// Reactive variables
const navMenuType = ref('home'); // Menu type for NavComponent

const roomID = ref(''); // roomID input
const dormID = ref(''); // dormID input
const username = ref(''); // Username input
const password = ref(''); // Password input
const role = ref('STUDENT'); // Role input
const feedbackMessage = ref(''); // Feedback message for the user
const feedbackClass = ref(''); // CSS class for feedback message
const waterData = ref(null); // Water data received from the server
const isSubmitting = ref(false);
const pendingReplacement = ref<null | {
  userID: number
  username: string
  role: string
  roomID: number
  dormID: number
}>(null);

onMounted(() => {
  socket.on('DbWaterData', (data: any) => {
    waterData.value = data; // Assign received data to waterData
  });
});

onUnmounted(() => {
  socket.off('DbWaterData'); // Clean up the socket listener when component is unmounted
});
// Function to handle form submission
const handleSubmit = () => {
  if (roomID.value && dormID.value && username.value && password.value && role.value) {
    createUser(false);
  }
};

const getWaterData = () => {
  socket.emit('getDbWaterData', dormID); // Emit event to get water data from the server
}

// Function to create a new user
const createUser = async (replaceExisting: boolean) => {
  isSubmitting.value = true;
  feedbackMessage.value = '';
  feedbackClass.value = '';

  try {
    const response = await fetch(apiUrl('/api/auth/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomID: roomID.value,
        dormID: dormID.value,
        username: username.value,
        password: password.value,
        role: role.value,
        replaceExisting,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      feedbackMessage.value = data.replacedUser
        ? `User created. ${data.replacedUser.username} is now inactive.`
        : 'User created successfully!';
      feedbackClass.value = 'text-green-500';
      username.value = ''; // Clear the input fields
      roomID.value = '';
      dormID.value = '';
      password.value = '';
      role.value = 'STUDENT';
      pendingReplacement.value = null;
    } else {
      const errorData = await response.json();
      if (response.status === 409 && errorData.code === 'ROOM_OCCUPIED') {
        pendingReplacement.value = errorData.existingUser;
        feedbackMessage.value = '';
        return;
      }

      feedbackMessage.value = errorData.error || 'Failed to create user.';
      feedbackClass.value = 'text-red-500';
    }
  } catch (error) {
    feedbackMessage.value = 'An error occurred. Please try again.';
    feedbackClass.value = 'text-red-500';
    console.error('Error creating user:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const confirmReplacement = () => {
  createUser(true);
};

const cancelReplacement = () => {
  pendingReplacement.value = null;
  feedbackMessage.value = 'User creation cancelled.';
  feedbackClass.value = 'text-text dark:text-text-dark';
};
</script>
