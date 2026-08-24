<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppTopBar from '@/components/AppTopBar.vue'
import SurveyAnswerModal from '@/features/surveys/components/SurveyAnswerModal.vue'
import '@fontsource/nunito-sans';
import '@fontsource/fredoka';
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const isAuthenticated = ref(Boolean(sessionStorage.getItem('authToken')))
const isOffline = ref(!navigator.onLine)
const connectionLost = ref(false)
const surveyModalOpen = ref(false)
const surveyModalID = ref<number | null>(null)
const surveyModalQueue = ref<number[]>([])
const publicRoutes = new Set(['login', 'forgot-password', 'reset-password'])
const showTopBar = computed(() => isAuthenticated.value && !publicRoutes.has(String(route.name)))
const syncAuthentication = () => { isAuthenticated.value = Boolean(sessionStorage.getItem('authToken')) }
const markOnline = () => { isOffline.value = false }
const markOffline = () => { isOffline.value = true }
const markConnectionLost = () => { connectionLost.value = true }
const markConnectionRestored = () => { connectionLost.value = false }
const handleExpiredSession = () => router.replace({ name: 'login', query: { expired: '1' } })
const openSurveyModal = (event: Event) => {
  const detail = (event as CustomEvent<number | { surveyID: number; queue?: number[] }>).detail
  const surveyID = Number(typeof detail === 'object' ? detail.surveyID : detail)
  const requestedQueue = typeof detail === 'object' && Array.isArray(detail.queue) ? detail.queue.map(Number).filter(Boolean) : []
  surveyModalQueue.value = [surveyID, ...requestedQueue.filter(id => id !== surveyID)]
  surveyModalID.value = surveyID
  surveyModalOpen.value = Boolean(surveyID)
}
const handleSurveySubmitted = (surveyID: number) => {
  window.dispatchEvent(new Event('survey-answer-submitted'))
  surveyModalQueue.value = surveyModalQueue.value.filter(id => id !== Number(surveyID))
  const nextSurveyID = surveyModalQueue.value[0]
  if (nextSurveyID) surveyModalID.value = nextSurveyID
}

watch(() => route.fullPath, syncAuthentication, { immediate: true })
onMounted(() => {
  window.addEventListener('auth-state-changed', syncAuthentication)
  window.addEventListener('storage', syncAuthentication)
  window.addEventListener('online', markOnline)
  window.addEventListener('offline', markOffline)
  window.addEventListener('connection-lost', markConnectionLost)
  window.addEventListener('connection-restored', markConnectionRestored)
  window.addEventListener('auth-expired', handleExpiredSession)
  window.addEventListener('open-survey-answer', openSurveyModal)
})
onBeforeUnmount(() => {
  window.removeEventListener('auth-state-changed', syncAuthentication)
  window.removeEventListener('storage', syncAuthentication)
  window.removeEventListener('online', markOnline)
  window.removeEventListener('offline', markOffline)
  window.removeEventListener('connection-lost', markConnectionLost)
  window.removeEventListener('connection-restored', markConnectionRestored)
  window.removeEventListener('auth-expired', handleExpiredSession)
  window.removeEventListener('open-survey-answer', openSurveyModal)
})
</script>

<template>
  <div v-if="isOffline || (isAuthenticated && connectionLost)" class="connection-banner" role="status">
    {{ isOffline ? t('connection.offline') : t('connection.reconnecting') }}
  </div>
  <AppTopBar v-if="showTopBar" />
  <div :class="showTopBar ? 'app-with-top-bar' : ''">
    <router-view />
  </div>
  <SurveyAnswerModal v-if="showTopBar" v-model="surveyModalOpen" :survey-id="surveyModalID" @submitted="handleSurveySubmitted" />
</template>

<style>

html, body, #app {
  min-height: 100%;
}

body {
  margin: 0;
  background: #D9C7A9;
  color: #382E38;
  font-family: 'Nunito Sans', sans-serif;
}

.app-with-top-bar {
  padding-top: calc(7.75rem + env(safe-area-inset-top));
}

@media (min-width: 1280px) {
  .app-with-top-bar { padding-top: calc(4rem + env(safe-area-inset-top)); }
}

.connection-banner {
  position: fixed; inset: 0 0 auto; z-index: 100; padding: .45rem 1rem;
  background: #7c2d12; color: white; text-align: center; font-size: .875rem; font-weight: 700;
}

html.dark body {
  background: #35313B;
  color: #FFF4E8;
}

</style>
