<template>
  <NavComponent :socket="socket" :menu="'home'" class="fixed right-4 top-4" />

  <main class="flex min-h-screen flex-col items-center justify-center gap-6 px-4 lg:flex-row">
    <section class="w-full max-w-md rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark">
      <h1 class="text-2xl font-bold text-headline dark:text-text-dark">Add a new resident</h1>
      <p class="mt-2 text-sm text-text dark:text-text-dark">
        Enter their email and room. We’ll email them a temporary password.
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="createResident(false)">
        <label class="block">
          <span class="text-sm font-semibold">Resident email</span>
          <input v-model.trim="email" type="email" autocomplete="email" required
            class="mt-1 w-full rounded border border-border p-3 focus:ring-2 focus:ring-accent"
            placeholder="resident@example.com" />
        </label>
        <label class="block">
          <span class="text-sm font-semibold">Room ID</span>
          <input v-model="roomID" type="number" min="1" required
            class="mt-1 w-full rounded border border-border p-3 focus:ring-2 focus:ring-accent"
            placeholder="101" />
        </label>
        <button type="submit" :disabled="isSubmitting"
          class="w-full rounded-lg bg-accent p-3 font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50">
          {{ isSubmitting ? 'Creating and sending…' : 'Create account and send email' }}
        </button>
      </form>

      <p v-if="feedbackMessage" class="mt-4 text-center" :class="feedbackClass" role="status">
        {{ feedbackMessage }}
      </p>
    </section>

    <section class="w-full max-w-md rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark">
      <h2 class="text-2xl font-bold">Reset a resident password</h2>
      <p class="mt-2 text-sm opacity-75">
        This invalidates their current password and sessions, then emails a new temporary password.
      </p>
      <form class="mt-6 space-y-4" @submit.prevent="resetResidentPassword">
        <label class="block">
          <span class="text-sm font-semibold">Resident email</span>
          <input v-model.trim="resetEmail" type="email" autocomplete="off" required
            class="mt-1 w-full rounded border border-border p-3 focus:ring-2 focus:ring-accent"
            placeholder="resident@example.com" />
        </label>
        <button type="submit" :disabled="isResetting"
          class="w-full rounded-lg bg-red-500 p-3 font-semibold text-white hover:bg-red-600 disabled:opacity-50">
          {{ isResetting ? 'Resetting and sending…' : 'Reset password' }}
        </button>
      </form>
      <p v-if="resetFeedback" class="mt-4 text-center" :class="resetFeedbackClass" role="status">{{ resetFeedback }}</p>
    </section>

    <div v-if="pendingReplacement" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div class="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl dark:bg-surface-dark">
        <h2 class="text-xl font-bold">Room already occupied</h2>
        <p class="mt-3">Room {{ roomID }} currently belongs to <strong>{{ pendingReplacement.username }}</strong>.</p>
        <p class="mt-2 text-sm opacity-75">Replacing them will deactivate their login and transfer current and future cleaning assignments.</p>
        <div class="mt-6 flex justify-end gap-3">
          <button class="rounded-lg border border-border px-4 py-2" @click="pendingReplacement = null">Cancel</button>
          <button class="rounded-lg bg-accent px-4 py-2 font-semibold text-white" @click="createResident(true)">Replace and email</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import NavComponent from '@/components/NavComponent.vue'
import { ref } from 'vue'
import { apiUrl } from '@/composables/api'
import { getSocket } from '@/composables/socket'

const socket = getSocket()
const email = ref('')
const roomID = ref('')
const isSubmitting = ref(false)
const feedbackMessage = ref('')
const feedbackClass = ref('')
const pendingReplacement = ref<null | { username: string }>(null)
const resetEmail = ref('')
const isResetting = ref(false)
const resetFeedback = ref('')
const resetFeedbackClass = ref('')

async function createResident(replaceExisting: boolean) {
  isSubmitting.value = true
  feedbackMessage.value = ''
  try {
    const response = await fetch(apiUrl('/api/auth/residents'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({ email: email.value, roomID: roomID.value, replaceExisting }),
    })
    const data = await response.json()
    if (!response.ok) {
      if (response.status === 409 && data.code === 'ROOM_OCCUPIED') {
        pendingReplacement.value = data.existingUser
        return
      }
      throw new Error(data.error || 'Failed to create the account.')
    }
    feedbackMessage.value = `Account created. The temporary password was sent to ${data.email}.`
    feedbackClass.value = 'text-green-600'
    email.value = ''
    roomID.value = ''
    pendingReplacement.value = null
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : 'Please try again.'
    feedbackClass.value = 'text-red-500'
  } finally {
    isSubmitting.value = false
  }
}

async function resetResidentPassword() {
  if (!window.confirm(`Reset the password for ${resetEmail.value}? Their current sessions will be signed out.`)) return
  isResetting.value = true
  resetFeedback.value = ''
  try {
    const response = await fetch(apiUrl('/api/auth/admin/reset-resident-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({ email: resetEmail.value }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Could not reset the password.')
    resetFeedback.value = data.message
    resetFeedbackClass.value = 'text-green-600'
    resetEmail.value = ''
  } catch (error) {
    resetFeedback.value = error instanceof Error ? error.message : 'Could not reset the password.'
    resetFeedbackClass.value = 'text-red-500'
  } finally {
    isResetting.value = false
  }
}
</script>
