<template>
  <main class="flex min-h-screen items-center justify-center px-4">
    <form class="w-full max-w-md space-y-4 rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark" @submit.prevent="submit">
      <h1 class="text-2xl font-bold">{{ t('auth.resetTitle') }}</h1>
      <input v-model="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required
        class="w-full rounded border border-border p-3" :placeholder="t('auth.newPasswordPlaceholder')" />
      <input v-model="confirmation" type="password" autocomplete="new-password" minlength="12" maxlength="128" required
        class="w-full rounded border border-border p-3" :placeholder="t('auth.confirmPassword')" />
      <button :disabled="submitting || !token" class="w-full rounded bg-accent p-3 font-semibold text-white disabled:opacity-50">
        {{ submitting ? t('common.saving') : t('auth.setPassword') }}
      </button>
      <p v-if="message" class="text-center text-green-600" role="status">{{ message }}</p>
      <p v-if="error" class="text-center text-red-500" role="alert">{{ error }}</p>
      <router-link v-if="message" to="/" class="block text-center text-accent hover:underline">{{ t('auth.continueLogin') }}</router-link>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiUrl } from '@/composables/api'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token : ''
const password = ref('')
const confirmation = ref('')
const submitting = ref(false)
const message = ref('')
const { t } = useI18n()
const error = ref(token ? '' : t('auth.invalidLink'))

async function submit() {
  if (password.value !== confirmation.value) {
    error.value = t('auth.passwordMismatch')
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
    if (!response.ok) throw new Error(t('auth.resetError'))
    message.value = t('auth.resetSuccess')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('auth.resetError')
  } finally {
    submitting.value = false
  }
}
</script>
