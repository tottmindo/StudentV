<template>
  <div class="flex min-h-screen w-screen flex-col items-center justify-center px-4 text-center text-text dark:text-text-dark">
    <div class="fixed right-4 top-4 z-10 flex items-center gap-1 rounded-2xl bg-background/90 p-1.5 shadow-sm backdrop-blur dark:bg-surface-dark/90 sm:right-6 sm:top-6">
      <LanguageSelector />
      <ThemeToggle />
    </div>
    <div class="w-full max-w-md space-y-8 rounded-2xl bg-surface dark:bg-surface-dark p-8 shadow-lg">
      <div>
        <h1 class="text-3xl font-extrabold text-accent">{{ t('auth.welcome') }}</h1>
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
import LoginComponent from '@/features/auth/components/LoginComponent.vue';
import LanguageSelector from '@/shared/components/LanguageSelector.vue'
import ThemeToggle from '@/shared/components/ThemeToggle.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
