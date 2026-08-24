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
        autocomplete="email"
        required
        class="w-full p-3 rounded border border-border text placeholder-text-light bg-background-light
               focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
               dark:bg-background-dark dark:text-text-dark dark:placeholder-text-text-dark dark:border-border"
      />

      <!-- Password Input -->
      <input
        type="password"
        :id="passwordID"
        v-model="password"
        :placeholder="passwordPlaceholder"
        autocomplete="current-password"
        required
        class="w-full p-3 rounded border border-border text placeholder-text-light bg-background-light
               focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
               dark:bg-background-dark dark:text-text-dark dark:placeholder-text-text-dark dark:border-border"
      />

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="isSubmitting"
        class="w-full p-3 rounded font-semibold text-background-light bg-accent hover:bg-accent-dark transition-colors disabled:cursor-wait disabled:opacity-60
               dark:bg-accent-dark dark:hover:bg-accent"
      >
        {{ isSubmitting ? t('auth.signingIn') : t('auth.login') }}
      </button>
      <router-link to="/forgot-password" class="block text-center text-sm text-accent hover:underline">
        {{ t('auth.forgotPassword') }}
      </router-link>
    </form>
  </div>
</template>


<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useRoute } from 'vue-router';
  import { apiUrl } from '@/composables/api';
  import { connectSocket } from '@/composables/socket';
  import { useI18n } from 'vue-i18n'

  const props = defineProps<{
      usernameID: string;
      usernamePlaceholder: string;
      passwordID: string;
      passwordPlaceholder: string;
    }>();

  const username = ref('');
  const password = ref('');
  const router = useRouter();
  const route = useRoute();
  const isSubmitting = ref(false);
  const { t } = useI18n()

  const login = async () => {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username.value,
          password: password.value,
        }),
      });

      if (!response.ok) {
        throw new Error(t('auth.loginFailed'));
      }

      const data = await response.json();

      const token = data?.token;
      const dormID = data?.dormID ?? data?.dormId;
      const userID = data?.userID ?? data?.userId;
      const role = data?.role;
      const isAdmin = role === 'ADMIN';
      const isGlobalRole = isAdmin || role === 'RESEARCHER';

      if (!token || !userID || !role || (!isGlobalRole && !dormID)) {
        throw new Error(t('auth.loginFailed'));
      }

      // Save the token in sessionStorage
      sessionStorage.setItem('authToken', String(token));
      if (isGlobalRole) sessionStorage.removeItem('dormID');
      else sessionStorage.setItem('dormID', String(dormID));
      sessionStorage.setItem('role', String(role));
      sessionStorage.setItem('userID', String(userID));
      sessionStorage.setItem('email', String(data.email || username.value.trim().toLowerCase()));
      // Never show dashboard data cached for a previous authenticated session.
      sessionStorage.removeItem('dashboard');
      if (data.username) sessionStorage.setItem('username', String(data.username));
      else sessionStorage.removeItem('username');

      if (data.mustChangePassword) {
        sessionStorage.setItem('mustChangePassword', 'true');
      } else {
        sessionStorage.removeItem('mustChangePassword');
      }

      sessionStorage.setItem('userRole', isAdmin ? 'admin' : role === 'RESEARCHER' ? 'researcher' : 'user');

      // Temporary accounts must choose a permanent password before opening app data.
      if (!data.mustChangePassword) {
        const socket = connectSocket(String(token));
        if (socket) {
          socket.on('connect', () => {
            console.log('Socket connected with dorm ID:', data.dormID);
          });
        }
      }

      // Redirect to the home view
      const requestedPath = typeof route.query.redirect === 'string' && /^\/(?!\/)/.test(route.query.redirect)
        ? route.query.redirect
        : (isGlobalRole ? '/admin' : '/home');
      await router.replace(data.mustChangePassword ? '/change-password' : requestedPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('auth.loginFailed');
      alert(errorMessage);
    } finally {
      isSubmitting.value = false;
    }
  };

</script>
