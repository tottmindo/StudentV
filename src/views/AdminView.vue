<template>
  <NavComponent :socket="socket" :menu="navMenuType" class="fixed top-4 right-4"/>
  
  <div class="flex flex-col justify-center items-center h-screen px-4">

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="w-full max-w-md space-y-4 p-8 rounded-2xl bg-surface dark:bg-surface-dark shadow-lg">
      <h1 class="text-2xl font-bold text-headline dark:text-text-dark mb-6">Create New User</h1>

      
      <!-- roomID Input -->
      <input
        type="text"
        class="rounded p-3 w-full mb-4 border border-border dark:border-border focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
        placeholder="Enter roomID"
        v-model="roomID"
        autocomplete="off"
        required
      />

      <!-- roodormID Input -->
      <input
        type="text"
        class="rounded p-3 w-full mb-4 border border-border dark:border-border focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
        placeholder="Enter dormID"
        v-model="dormID"
        autocomplete="off"
        required
      />
      <!-- role Input -->
      <input
        type="text"
        class="rounded p-3 w-full mb-4 border border-border dark:border-border focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
        placeholder="Enter role"
        v-model="role"
        autocomplete="off"
        required
      />

      <!-- Username Input -->
      <input
        type="text"
        class="rounded p-3 w-full mb-4 border border-border dark:border-border focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
        placeholder="Enter username"
        v-model="username"
        autocomplete="off"
        required
      />

      <!-- Password Input -->
      <input
        type="password"
        class="rounded p-3 w-full mb-4 border border-border dark:border-border focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
        placeholder="Enter password"
        v-model="password"
        autocomplete="off"
        required
      />

      <!-- Create User Button -->
      <button
        type="submit"
        class="w-full p-3 text-background-light bg-accent dark:bg-accent-dark hover:bg-accent-dark dark:hover:bg-accent text-center rounded-xl font-semibold transition-colors duration-300"
      >
        Create User
      </button>
    </form>

    <!-- Feedback Message -->
    <p v-if="feedbackMessage" :class="feedbackClass" class="mt-4 text-center text-lg">
      {{ feedbackMessage }}
    </p>
  </div>
</template>


<script setup lang="ts">
import NavComponent from '@/components/NavComponent.vue';
import { ref, onMounted, onUnmounted } from 'vue';
import { getSocket } from '@/composables/socket';
const socket = getSocket(); // Import the socket instance from socket.ts

// Reactive variables
const navMenuType = ref('home'); // Menu type for NavComponent

const roomID = ref(''); // roomID input
const dormID = ref(''); // dormID input
const username = ref(''); // Username input
const password = ref(''); // Password input
const role = ref(''); // Role input
const feedbackMessage = ref(''); // Feedback message for the user
const feedbackClass = ref(''); // CSS class for feedback message
const waterData = ref(null); // Water data received from the server

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
  if (roomID.value && username.value && password.value && role.value) {
    createUser();
  }
};

const getWaterData = () => {
  socket.emit('getDbWaterData', dormID); // Emit event to get water data from the server
}

// Function to create a new user
const createUser = async () => {
  try {
    const response = await fetch(`http://localhost:3000/api/auth/register`, {
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
      }),
    });

    if (response.ok) {
      feedbackMessage.value = 'User created successfully!';
      feedbackClass.value = 'text-green-500';
      username.value = ''; // Clear the input fields
      roomID.value = '';
      dormID.value = '';
      password.value = '';
      role.value = '';
    } else {
      const errorData = await response.json();
      feedbackMessage.value = errorData.message || 'Failed to create user.';
      feedbackClass.value = 'text-red-500';
    }
  } catch (error) {
    feedbackMessage.value = 'An error occurred. Please try again.';
    feedbackClass.value = 'text-red-500';
    console.error('Error creating user:', error);
  }
};
</script>
