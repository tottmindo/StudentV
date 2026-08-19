<template>
  <main class="flex min-h-screen items-center justify-center px-4 py-16 lg:py-8">
    <div class="grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
      <button class="rounded-xl border border-error/40 px-5 py-3 font-bold text-error transition hover:bg-error/10 lg:col-span-2 lg:justify-self-end" @click="signOut">
        {{ t('auth.signOut') }}
      </button>

      <section class="rounded-2xl bg-surface p-6 shadow-lg dark:bg-surface-dark lg:p-8">
        <h2 class="text-xl font-bold">{{ t('account.profile') }}</h2>
        <p class="mt-2 text-sm opacity-75">{{ t('account.emailHelp') }}</p>
        <form class="mt-6 space-y-4" @submit.prevent="save">
        <label class="block">
          <span class="text-sm font-semibold">{{ t('account.loginEmail') }}</span>
          <input :value="email" type="email" disabled class="mt-1 w-full rounded border border-border p-3 opacity-70" />
        </label>
        <label class="block">
          <span class="text-sm font-semibold">{{ t('account.publicUsername') }}</span>
          <input v-model.trim="username" required minlength="3" maxlength="50" autocomplete="nickname"
            class="mt-1 w-full rounded border border-border p-3 focus:ring-2 focus:ring-accent" />
        </label>
        <button :disabled="saving" class="w-full rounded-lg bg-accent p-3 font-semibold text-white disabled:opacity-50">
          {{ saving ? t('account.saving') : t('account.saveUsername') }}
        </button>
        </form>
        <p v-if="message" class="mt-4 text-center" :class="failed ? 'text-red-500' : 'text-green-600'" role="status">{{ message }}</p>
      </section>

      <section class="rounded-2xl bg-surface p-6 shadow-lg dark:bg-surface-dark lg:p-8">
        <h2 class="text-xl font-bold">{{ t('account.changePassword') }}</h2>
        <p class="mt-2 text-sm opacity-75">{{ t('account.passwordHelp') }}</p>
        <form class="mt-6 space-y-4" @submit.prevent="changePassword">
        <input :value="email" type="email" autocomplete="username" readonly tabindex="-1" class="sr-only" aria-hidden="true" />
        <label class="block">
          <span class="text-sm font-semibold">{{ t('account.currentPassword') }}</span>
          <input v-model="currentPassword" type="password" required minlength="6" maxlength="128" autocomplete="current-password"
            class="mt-1 w-full rounded border border-border p-3 focus:ring-2 focus:ring-accent" />
        </label>
        <label class="block">
          <span class="text-sm font-semibold">{{ t('account.newPassword') }}</span>
          <input v-model="newPassword" type="password" required minlength="12" maxlength="128" autocomplete="new-password"
            class="mt-1 w-full rounded border border-border p-3 focus:ring-2 focus:ring-accent" />
        </label>
        <label class="block">
          <span class="text-sm font-semibold">{{ t('account.confirmPassword') }}</span>
          <input v-model="passwordConfirmation" type="password" required minlength="12" maxlength="128" autocomplete="new-password"
            class="mt-1 w-full rounded border border-border p-3 focus:ring-2 focus:ring-accent" />
        </label>
        <button :disabled="changingPassword" class="w-full rounded-lg bg-accent p-3 font-semibold text-white disabled:opacity-50">
          {{ changingPassword ? t('account.changing') : t('account.changePassword') }}
        </button>
        </form>
        <p v-if="passwordMessage" class="mt-4 text-center text-red-500" role="alert">{{ passwordMessage }}</p>
      </section>

    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiUrl } from '@/composables/api'
import { disconnectSocket, getSocket } from '@/composables/socket'
import { clearSession } from '@/composables/session'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const socket = getSocket()
const email = ref('')
const username = ref('')
const message = ref('')
const failed = ref(false)
const saving = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const passwordConfirmation = ref('')
const passwordMessage = ref('')
const changingPassword = ref(false)
const router = useRouter()
const { t } = useI18n()
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('authToken') || ''}` })

onMounted(async () => {
  try {
    const response = await fetch(apiUrl('/api/auth/account'), { headers: headers() })
    const data = await response.json()
    if (!response.ok) throw new Error(t('account.loadError'))
    email.value = data.email
    username.value = data.username || ''
  } catch (error) {
    failed.value = true
    message.value = error instanceof Error ? error.message : t('account.loadError')
  }
})

async function save() {
  saving.value = true
  message.value = ''
  try {
    const response = await fetch(apiUrl('/api/auth/account'), { method: 'PATCH', headers: headers(), body: JSON.stringify({ username: username.value }) })
    const data = await response.json()
    if (!response.ok) throw new Error(t('account.updateError'))
    username.value = data.username
    sessionStorage.setItem('username', data.username)
    failed.value = false
    message.value = t('account.updated')
  } catch (error) {
    failed.value = true
    message.value = error instanceof Error ? error.message : t('account.updateError')
  } finally { saving.value = false }
}

async function changePassword() {
  if (newPassword.value !== passwordConfirmation.value) {
    passwordMessage.value = t('account.mismatch')
    return
  }
  changingPassword.value = true
  passwordMessage.value = ''
  try {
    const response = await fetch(apiUrl('/api/auth/account/password'), {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ currentPassword: currentPassword.value, newPassword: newPassword.value }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(t('account.passwordError'))
    disconnectSocket()
    clearSession()
    await router.replace({ name: 'login' })
  } catch (error) {
    passwordMessage.value = error instanceof Error ? error.message : t('account.passwordError')
  } finally { changingPassword.value = false }
}

async function signOut() {
  disconnectSocket()
  clearSession()
  await router.replace({ name: 'login' })
}
</script>
