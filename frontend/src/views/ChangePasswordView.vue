<template>
  <main class="flex min-h-screen items-center justify-center px-4">
    <form class="w-full max-w-md space-y-4 rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark" @submit.prevent="submit">
      <h1 class="text-2xl font-bold">Set up your account</h1>
      <p class="text-sm opacity-75">Choose the public username people will see, then replace your temporary password.</p>
      <input :value="email" type="email" autocomplete="username" readonly tabindex="-1" class="sr-only" aria-hidden="true" />
      <label class="block">
        <span class="text-sm font-semibold">Public username</span>
        <input v-model.trim="username" type="text" autocomplete="nickname" required minlength="3" maxlength="50"
          class="mt-1 w-full rounded border border-border p-3" placeholder="How others will see you" />
      </label>
      <input v-model="newPassword" type="password" autocomplete="new-password" required minlength="12" maxlength="128"
        class="w-full rounded border border-border p-3" placeholder="New password (at least 12 characters)" />
      <input v-model="confirmation" type="password" autocomplete="new-password" required minlength="12" maxlength="128"
        class="w-full rounded border border-border p-3" placeholder="Confirm new password" />
      <button :disabled="submitting" class="w-full rounded bg-accent p-3 font-semibold text-white disabled:opacity-50">
        {{ submitting ? 'Saving…' : 'Save password' }}
      </button>
      <p v-if="error" class="text-center text-red-500" role="alert">{{ error }}</p>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiUrl } from '@/composables/api'
import { connectSocket } from '@/composables/socket'

const newPassword = ref('')
const confirmation = ref('')
const error = ref('')
const submitting = ref(false)
const router = useRouter()
const email = sessionStorage.getItem('email') || ''
const username = ref(sessionStorage.getItem('username') || '')

async function submit() {
  if (newPassword.value !== confirmation.value) {
    error.value = 'The new passwords do not match.'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    const response = await fetch(apiUrl('/api/auth/complete-temporary-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({ username: username.value, newPassword: newPassword.value }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Could not change the password.')
    sessionStorage.removeItem('mustChangePassword')
    sessionStorage.setItem('username', data.username || username.value)
    connectSocket(sessionStorage.getItem('authToken') || '')
    await router.push('/home')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not change the password.'
  } finally {
    submitting.value = false
  }
}
</script>
