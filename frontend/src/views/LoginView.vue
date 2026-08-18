<template>
  <div class="flex min-h-screen w-screen flex-col items-center justify-center px-4 text-center">
    <div class="w-full max-w-md space-y-8 rounded-2xl bg-surface dark:bg-surface-dark p-8 shadow-lg">
      <div>
        <div class="flex justify-end"><LanguageSelector /></div>
        <h1 class="text-3xl font-extrabold">{{ t('auth.welcome') }}</h1>
        <p class="mt-2  text-text dark:text-text-dark">
          {{ t('auth.instructions') }}
        </p>
      </div>
      <LoginComponent
        usernameID="username"
        :usernamePlaceholder="t('auth.emailPlaceholder')"
        passwordID="password"
        :passwordPlaceholder="t('auth.passwordPlaceholder')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import LoginComponent from '@/components/LoginComponent.vue';
import LanguageSelector from '@/components/LanguageSelector.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
