<template>
  <div class="flex min-h-screen w-screen flex-col items-center justify-center px-4 text-center">
    <div class="w-full max-w-md space-y-8 rounded-2xl bg-surface dark:bg-surface-dark p-8 shadow-lg">
      <div>
        <h1 class="text-3xl font-extrabold">Welcome to DORMS</h1>
        <p class="mt-2  text-text dark:text-text-dark">
          Please enter your username and password below
        </p>
      </div>
      <LoginComponent
        usernameID="username"
        usernamePlaceholder="Enter your username"
        passwordID="password"
        passwordPlaceholder="Enter your password"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import LoginComponent from '@/components/LoginComponent.vue';
</script>
