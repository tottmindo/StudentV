<template>
  <NavComponent :socket="socket" :menu="navMenuType" class="fixed top-4 right-4"/>
  
  <div class="flex flex-col justify-center items-center h-screen px-4">

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="w-full max-w-md space-y-4 p-8 rounded-2xl bg-secondary shadow-lg">
      <h1 class="text-2xl font-bold text-headline mb-6">Create New User</h1>

      
      <!-- Address Input -->
      <input
        type="text"
        class="rounded p-3 w-full mb-4 border border-border dark:border-dark focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
        placeholder="Enter address"
        v-model="address"
        autocomplete="off"
        required
      />

      <!-- Username Input -->
      <input
        type="text"
        class="rounded p-3 w-full mb-4 border border-border dark:border-dark focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
        placeholder="Enter username"
        v-model="username"
        autocomplete="off"
        required
      />

      <!-- Password Input -->
      <input
        type="password"
        class="rounded p-3 w-full mb-4 border border-border dark:border-dark focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
        placeholder="Enter password"
        v-model="password"
        autocomplete="off"
        required
      />

      <!-- Create User Button -->
      <button
        type="submit"
        class="w-full p-3 text-white bg-primary dark:bg-primary-dark hover:bg-primary-dark dark:hover:bg-primary text-center rounded-xl font-semibold transition-colors duration-300"
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
const address = ref(''); // Address input
const username = ref(''); // Username input
const password = ref(''); // Password input
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
  if (address.value && username.value && password.value) {
    createUser();
  }
};
const dormID = sessionStorage.getItem('dormID');
const getWaterData = () => {
  socket.emit('getDbWaterData', dormID); // Emit event to get water data from the server
}

// Function to create a new user
const createUser = async () => {
  try {
    const response = await fetch(`https://localhost:3000/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: address.value,
        username: username.value,
        password: password.value,
      }),
    });

    if (response.ok) {
      feedbackMessage.value = 'User created successfully!';
      feedbackClass.value = 'text-green-500';
      username.value = ''; // Clear the input fields
      address.value = '';
      password.value = '';
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
