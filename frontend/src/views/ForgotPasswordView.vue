<template>
  <main class="flex min-h-screen items-center justify-center px-4">
    <form class="w-full max-w-md space-y-4 rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark" @submit.prevent="submit">
      <h1 class="text-2xl font-bold">Forgot your password?</h1>
      <p class="text-sm opacity-75">Enter your account email. If it matches an active account, we’ll send a secure reset link.</p>
      <input v-model.trim="email" type="email" autocomplete="email" required
        class="w-full rounded border border-border p-3" placeholder="resident@example.com" />
      <button :disabled="submitting" class="w-full rounded bg-accent p-3 font-semibold text-white disabled:opacity-50">
        {{ submitting ? 'Sending…' : 'Send reset link' }}
      </button>
      <p v-if="message" class="text-center text-green-600" role="status">{{ message }}</p>
      <p v-if="error" class="text-center text-red-500" role="alert">{{ error }}</p>
      <router-link to="/" class="block text-center text-sm text-accent hover:underline">Back to login</router-link>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { apiUrl } from '@/composables/api'

const email = ref('')
const submitting = ref(false)
const message = ref('')
const error = ref('')

async function submit() {
  submitting.value = true
  message.value = ''
  error.value = ''
  try {
    const response = await fetch(apiUrl('/api/auth/forgot-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Please try again later.')
    message.value = data.message
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Please try again later.'
  } finally {
    submitting.value = false
  }
}
</script>
