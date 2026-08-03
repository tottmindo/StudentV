<template>
  <main class="flex min-h-screen items-center justify-center px-4">
    <form class="w-full max-w-md space-y-4 rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark" @submit.prevent="submit">
      <h1 class="text-2xl font-bold">Reset your password</h1>
      <input v-model="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required
        class="w-full rounded border border-border p-3" placeholder="New password (at least 12 characters)" />
      <input v-model="confirmation" type="password" autocomplete="new-password" minlength="12" maxlength="128" required
        class="w-full rounded border border-border p-3" placeholder="Confirm new password" />
      <button :disabled="submitting || !token" class="w-full rounded bg-accent p-3 font-semibold text-white disabled:opacity-50">
        {{ submitting ? 'Saving…' : 'Set new password' }}
      </button>
      <p v-if="message" class="text-center text-green-600" role="status">{{ message }}</p>
      <p v-if="error" class="text-center text-red-500" role="alert">{{ error }}</p>
      <router-link v-if="message" to="/" class="block text-center text-accent hover:underline">Continue to login</router-link>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiUrl } from '@/composables/api'

const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token : ''
const password = ref('')
const confirmation = ref('')
const submitting = ref(false)
const message = ref('')
const error = ref(token ? '' : 'This reset link is invalid.')

async function submit() {
  if (password.value !== confirmation.value) {
    error.value = 'The passwords do not match.'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    const response = await fetch(apiUrl('/api/auth/reset-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password.value }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Could not reset the password.')
    message.value = 'Your password has been reset. You can now sign in.'
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not reset the password.'
  } finally {
    submitting.value = false
  }
}
</script>
