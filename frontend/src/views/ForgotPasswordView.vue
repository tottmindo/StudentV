<template>
  <main class="flex min-h-screen items-center justify-center px-4">
    <form class="w-full max-w-md space-y-4 rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark" @submit.prevent="submit">
      <h1 class="text-2xl font-bold">{{ t('auth.forgotTitle') }}</h1>
      <p class="text-sm opacity-75">{{ t('auth.forgotHelp') }}</p>
      <input v-model.trim="email" type="email" autocomplete="email" required
        class="w-full rounded border border-border p-3" placeholder="resident@example.com" />
      <button :disabled="submitting" class="w-full rounded bg-accent p-3 font-semibold text-white disabled:opacity-50">
        {{ submitting ? t('auth.sending') : t('auth.sendReset') }}
      </button>
      <p v-if="message" class="text-center text-green-600" role="status">{{ message }}</p>
      <p v-if="error" class="text-center text-red-500" role="alert">{{ error }}</p>
      <router-link to="/" class="block text-center text-sm text-accent hover:underline">{{ t('auth.backToLogin') }}</router-link>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { apiUrl } from '@/composables/api'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

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
    if (!response.ok) throw new Error(t('auth.tryLater'))
    message.value = data.message
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('auth.tryLater')
  } finally {
    submitting.value = false
  }
}
</script>
