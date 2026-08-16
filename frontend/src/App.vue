<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppTopBar from '@/components/AppTopBar.vue'
import '@fontsource/nunito-sans';
import '@fontsource/fredoka';

const route = useRoute()
const router = useRouter()
const isAuthenticated = ref(Boolean(sessionStorage.getItem('authToken')))
const isOffline = ref(!navigator.onLine)
const connectionLost = ref(false)
const publicRoutes = new Set(['login', 'forgot-password', 'reset-password'])
const showTopBar = computed(() => isAuthenticated.value && !publicRoutes.has(String(route.name)))
const syncAuthentication = () => { isAuthenticated.value = Boolean(sessionStorage.getItem('authToken')) }
const markOnline = () => { isOffline.value = false }
const markOffline = () => { isOffline.value = true }
const markConnectionLost = () => { connectionLost.value = true }
const markConnectionRestored = () => { connectionLost.value = false }
const handleExpiredSession = () => router.replace({ name: 'login', query: { expired: '1' } })

watch(() => route.fullPath, syncAuthentication, { immediate: true })
onMounted(() => {
  window.addEventListener('auth-state-changed', syncAuthentication)
  window.addEventListener('storage', syncAuthentication)
  window.addEventListener('online', markOnline)
  window.addEventListener('offline', markOffline)
  window.addEventListener('connection-lost', markConnectionLost)
  window.addEventListener('connection-restored', markConnectionRestored)
  window.addEventListener('auth-expired', handleExpiredSession)
})
onBeforeUnmount(() => {
  window.removeEventListener('auth-state-changed', syncAuthentication)
  window.removeEventListener('storage', syncAuthentication)
  window.removeEventListener('online', markOnline)
  window.removeEventListener('offline', markOffline)
  window.removeEventListener('connection-lost', markConnectionLost)
  window.removeEventListener('connection-restored', markConnectionRestored)
  window.removeEventListener('auth-expired', handleExpiredSession)
})
</script>

<template>
  <div v-if="isOffline || (isAuthenticated && connectionLost)" class="connection-banner" role="status">
    {{ isOffline ? 'You’re offline. Changes may not be saved.' : 'Reconnecting…' }}
  </div>
  <AppTopBar v-if="showTopBar" />
  <div :class="showTopBar ? 'app-with-top-bar' : ''">
    <router-view />
  </div>
</template>

<style>

html, body, #app {
  height: 100%;
}

body {
  margin: 0;
  background: #F7F7F5;
  font-family: 'Nunito Sans', sans-serif;
}

.app-with-top-bar {
  padding-top: calc(4rem + env(safe-area-inset-top));
}

.connection-banner {
  position: fixed; inset: 0 0 auto; z-index: 100; padding: .45rem 1rem;
  background: #7c2d12; color: white; text-align: center; font-size: .875rem; font-weight: 700;
}

@media (prefers-color-scheme: dark) {
  body { background: #121212; }
}

</style>
