<template>
  <div class="grid gap-8">
    <!-- Form -->
    <form @submit.prevent="login" class="w-full max-w-md space-y-4">
      
      <!-- Username Input -->
      <input
        type="text"
        :id="usernameID"
        v-model="username"
        :placeholder="usernamePlaceholder"
        autocomplete="off"
        required
        class="w-full p-3 rounded border border-border text-text placeholder-text-light bg-background-light
               focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
               dark:bg-background-dark dark:text-text-dark dark:placeholder-text-dark dark:border-border-dark"
      />

      <!-- Password Input -->
      <input
        type="password"
        :id="passwordID"
        v-model="password"
        :placeholder="passwordPlaceholder"
        autocomplete="off"
        required
        class="w-full p-3 rounded border border-border text-text placeholder-text-light bg-background-light
               focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
               dark:bg-background-dark dark:text-text-dark dark:placeholder-text-dark dark:border-border-dark"
      />

      <!-- Submit Button -->
      <button
        type="submit"
        class="w-full p-3 rounded font-semibold text-white bg-primary hover:bg-primary-light transition-colors
               dark:bg-primary-dark dark:hover:bg-secondary-dark"
      >
        Login
      </button>
    </form>
  </div>
</template>


<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { connectSocket } from '@/composables/socket';



  const props = defineProps<{
      usernameID: string;
      usernamePlaceholder: string;
      passwordID: string;
      passwordPlaceholder: string;
    }>();

  const username = ref('');
  const password = ref('');
  const router = useRouter();

  const login = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.value,
          password: password.value,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = typeof errorData.error === 'string' 
          ? errorData.error 
          : JSON.stringify(errorData.error || 'Login failed');
        throw new Error(errorMessage);
      }

      const data = await response.json();

      const token = data?.token;
      const dormID = data?.dormID ?? data?.dormId;
      const userID = data?.userID ?? data?.userId;
      const role = data?.role;

      if (!token || !dormID || !userID || !role) {
        throw new Error('Login response is missing required fields.');
      }

      // Save the token in sessionStorage
      sessionStorage.setItem('authToken', String(token));
      sessionStorage.setItem('dormID', String(dormID));
      sessionStorage.setItem('role', String(role));
      sessionStorage.setItem('userID', String(userID));

      if (role === 'ADMIN') {
        sessionStorage.setItem('userRole', 'admin');
      } else {
        sessionStorage.setItem('userRole', 'user');
      }

      // After successful login
      const socket = connectSocket(String(token));

      if (socket) {
        socket.on('connect', () => {
          console.log('Socket connected with dorm ID:', data.dormID);
        });
      } else {
        console.error('Failed to connect socket: socket is undefined.');
      }

      // Redirect to the home view
      router.push('/home');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      alert(errorMessage);
    }
  };

</script>