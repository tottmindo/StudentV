<template>
  <NavComponent :socket="socket" menu="home" class="fixed right-4 top-4" />
  <main class="flex min-h-screen items-center justify-center px-4">
    <section class="w-full max-w-md rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark">
      <h1 class="text-2xl font-bold">Account settings</h1>
      <p class="mt-2 text-sm opacity-75">Your email is used privately for login and account recovery.</p>
      <form class="mt-6 space-y-4" @submit.prevent="save">
        <label class="block">
          <span class="text-sm font-semibold">Login email</span>
          <input :value="email" type="email" disabled class="mt-1 w-full rounded border border-border p-3 opacity-70" />
        </label>
        <label class="block">
          <span class="text-sm font-semibold">Public username</span>
          <input v-model.trim="username" required minlength="3" maxlength="50" autocomplete="nickname"
            class="mt-1 w-full rounded border border-border p-3 focus:ring-2 focus:ring-accent" />
        </label>
        <button :disabled="saving" class="w-full rounded-lg bg-accent p-3 font-semibold text-white disabled:opacity-50">
          {{ saving ? 'Saving…' : 'Save username' }}
        </button>
      </form>
      <p v-if="message" class="mt-4 text-center" :class="failed ? 'text-red-500' : 'text-green-600'" role="status">{{ message }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import NavComponent from '@/components/NavComponent.vue'
import { apiUrl } from '@/composables/api'
import { getSocket } from '@/composables/socket'

const socket = getSocket()
const email = ref('')
const username = ref('')
const message = ref('')
const failed = ref(false)
const saving = ref(false)
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('authToken') || ''}` })

onMounted(async () => {
  try {
    const response = await fetch(apiUrl('/api/auth/account'), { headers: headers() })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Could not load your account.')
    email.value = data.email
    username.value = data.username || ''
  } catch (error) {
    failed.value = true
    message.value = error instanceof Error ? error.message : 'Could not load your account.'
  }
})

async function save() {
  saving.value = true
  message.value = ''
  try {
    const response = await fetch(apiUrl('/api/auth/account'), { method: 'PATCH', headers: headers(), body: JSON.stringify({ username: username.value }) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Could not update your username.')
    username.value = data.username
    sessionStorage.setItem('username', data.username)
    failed.value = false
    message.value = 'Your public username was updated.'
  } catch (error) {
    failed.value = true
    message.value = error instanceof Error ? error.message : 'Could not update your username.'
  } finally { saving.value = false }
}
</script>
