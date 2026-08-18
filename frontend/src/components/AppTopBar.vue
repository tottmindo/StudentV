<template>
  <header class="app-top-bar fixed inset-x-0 top-0 z-50 border-b border-border-border/80 bg-background/95 text-text shadow-sm backdrop-blur dark:bg-background-dark/95 dark:text-text-dark">
    <div class="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
      <button
        class="grid h-11 w-11 shrink-0 place-items-center rounded-xl transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent dark:hover:bg-surface-dark"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="app-navigation"
        :aria-label="t('nav.open')"
        @click="menuOpen = !menuOpen"
      >
        <span class="space-y-1.5" aria-hidden="true">
          <span class="block h-0.5 w-5 rounded bg-current"></span>
          <span class="block h-0.5 w-5 rounded bg-current"></span>
          <span class="block h-0.5 w-5 rounded bg-current"></span>
        </span>
      </button>

      <div class="min-w-0 flex-1">
        <p class="truncate text-xs font-bold uppercase tracking-[0.14em] text-accent">{{ page.eyebrow }}</p>
        <div class="flex min-w-0 items-baseline gap-2">
          <h1 class="truncate text-base font-bold sm:text-lg">{{ page.title }}</h1>
          <span class="hidden truncate text-sm opacity-55 md:inline">{{ page.description }}</span>
        </div>
      </div>

      <router-link
        v-if="page.action"
        :to="page.action.to"
        class="hidden items-center gap-2 rounded-xl border border-border-border px-3 py-2 text-sm font-bold transition hover:bg-surface sm:inline-flex dark:hover:bg-surface-dark"
      >
        <span aria-hidden="true">{{ page.action.icon }}</span>{{ page.action.label }}
      </router-link>
      <LanguageSelector class="hidden sm:inline-flex" />
      <button
        class="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent dark:hover:bg-surface-dark"
        :class="[notifications.length ? 'text-accent' : 'opacity-65', { 'bell-ring': bellRinging }]"
        type="button"
        :aria-label="notifications.length ? t('notifications.countLabel', { count: notifications.length }) : t('notifications.noneLabel')"
        @click="openNotifications"
      >
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        <span v-if="notifications.length" class="absolute right-0.5 top-0.5 min-w-[1.15rem] rounded-full bg-error px-1 text-center text-[10px] font-extrabold leading-[1.15rem] text-white ring-2 ring-background dark:ring-background-dark">
          {{ notifications.length > 99 ? '99+' : notifications.length }}
        </span>
      </button>
      <router-link to="/account" class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent font-bold text-white" :title="userLabel" :aria-label="t('nav.account')">
        {{ initials }}
      </router-link>
    </div>
  </header>

  <div v-if="menuOpen" class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" @click="closeMenu"></div>
  <aside
    id="app-navigation"
    class="mobile-drawer fixed inset-y-0 left-0 z-[70] flex w-[min(21rem,88vw)] flex-col bg-background text-text shadow-2xl transition-transform duration-300 dark:bg-background-dark dark:text-text-dark"
    :class="menuOpen ? 'translate-x-0' : '-translate-x-full'"
    :aria-hidden="!menuOpen"
    :inert="!menuOpen"
  >
    <div class="flex h-16 items-center justify-between border-b border-border-border px-5">
      <router-link to="/home" class="text-xl font-extrabold tracking-tight" @click="closeMenu">DORMS</router-link>
      <button ref="closeButton" class="grid h-11 w-11 place-items-center rounded-xl text-2xl hover:bg-surface dark:hover:bg-surface-dark" :aria-label="t('nav.close')" @click="closeMenu">×</button>
    </div>

    <nav class="flex-1 overflow-y-auto p-4" :aria-label="t('nav.main')">
      <router-link v-if="page.action" :to="page.action.to" class="mb-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-white sm:hidden" @click="closeMenu">
        <span aria-hidden="true">{{ page.action.icon }}</span>{{ page.action.label }}
      </router-link>
      <p class="mb-2 px-3 text-xs font-bold uppercase tracking-wider opacity-45">{{ t('nav.residence') }}</p>
      <router-link v-for="item in visibleResidentLinks" :key="item.to" :to="item.to" class="nav-link" active-class="nav-link-active" @click="closeMenu">
        <span class="w-6 text-center" aria-hidden="true">{{ item.icon }}</span><span>{{ item.label }}</span>
      </router-link>

      <template v-if="isAdmin">
        <p class="mb-2 mt-6 px-3 text-xs font-bold uppercase tracking-wider opacity-45">{{ t('nav.administration') }}</p>
        <router-link v-for="item in adminLinks" :key="item.to" :to="item.to" class="nav-link" active-class="nav-link-active" @click="closeMenu">
          <span class="w-6 text-center" aria-hidden="true">{{ item.icon }}</span><span>{{ item.label }}</span>
        </router-link>
      </template>
    </nav>

    <div class="drawer-footer border-t border-border-border p-4">
      <router-link to="/account" class="mb-2 flex items-center gap-3 rounded-xl p-3 hover:bg-surface dark:hover:bg-surface-dark" @click="closeMenu">
        <span class="grid h-9 w-9 place-items-center rounded-full bg-accent font-bold text-white">{{ initials }}</span>
        <span class="min-w-0"><strong class="block truncate text-sm">{{ userLabel }}</strong><span class="text-xs opacity-55">{{ t('nav.account') }}</span></span>
      </router-link>
      <div class="mb-2 sm:hidden"><LanguageSelector /></div>
      <button class="w-full rounded-xl px-4 py-2.5 text-left text-sm font-bold text-error hover:bg-error/10" @click="logout">{{ t('auth.signOut') }}</button>
    </div>
  </aside>

  <div v-if="notificationsOpen" class="fixed inset-0 z-[80] flex items-end bg-black/45 sm:items-center sm:justify-center sm:p-4" role="presentation" @click.self="closeNotifications">
    <section class="notification-panel flex max-h-[min(80dvh,42rem)] w-full flex-col rounded-t-3xl bg-background text-text shadow-2xl dark:bg-background-dark dark:text-text-dark sm:max-w-lg sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="notifications-title">
      <header class="flex items-start justify-between gap-4 border-b border-border-border p-5">
        <div>
          <p class="text-xs font-bold uppercase tracking-[.14em] text-accent">{{ t('notifications.attention') }}</p>
          <h2 id="notifications-title" class="mt-1 text-2xl font-bold">{{ t('notifications.title') }}</h2>
          <p class="mt-1 text-sm opacity-60">{{ notificationSummary }}</p>
        </div>
        <button ref="notificationCloseButton" class="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl hover:bg-surface dark:hover:bg-surface-dark" :aria-label="t('notifications.close')" @click="closeNotifications">×</button>
      </header>

      <div class="overflow-y-auto p-4 sm:p-5">
        <button
          v-for="notification in displayedNotifications"
          :key="notification.id"
          class="mb-3 flex min-h-16 w-full items-start gap-3 rounded-2xl border border-border-border p-4 text-left transition last:mb-0 hover:border-accent hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-accent"
          @click="openNotification(notification)"
        >
          <span class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-error/10 text-error" aria-hidden="true">!</span>
          <span class="min-w-0 flex-1"><strong class="block">{{ notification.title }}</strong><span class="mt-1 block text-sm opacity-70">{{ notification.description }}</span><span class="mt-2 block text-sm font-bold text-accent">{{ notification.actionLabel || t('common.viewDetails') }} →</span></span>
        </button>
        <div v-if="!displayedNotifications.length" class="px-4 py-12 text-center">
          <span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/10 text-2xl text-success" aria-hidden="true">✓</span>
          <h3 class="mt-4 font-bold">{{ t('notifications.caughtUp') }}</h3>
          <p class="mt-1 text-sm opacity-60">{{ t('notifications.nothingPending') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { disconnectSocket, getSocket } from '@/composables/socket'
import { clearSession } from '@/composables/session'
import type { AlertItem, DashboardPayload } from '@/types'
import LanguageSelector from '@/components/LanguageSelector.vue'
import { useI18n } from 'vue-i18n'

type PageInfo = { title: string; eyebrow: string; description: string; action?: { label: string; to: string; icon: string } }

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const socket = getSocket()
const menuOpen = ref(false)
const notificationsOpen = ref(false)
const notifications = ref<AlertItem[]>([])
const displayedNotifications = ref<AlertItem[]>([])
const bellRinging = ref(false)
const receivedAlertIDs = ref<Set<number>>(new Set())
let bellTimer: ReturnType<typeof setTimeout> | undefined
const dashboardUser = ref<DashboardPayload['user'] | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const notificationCloseButton = ref<HTMLButtonElement | null>(null)
const isAdmin = computed(() => sessionStorage.getItem('userRole')?.toLowerCase() === 'admin')
const userLabel = computed(() => dashboardUser.value?.name || sessionStorage.getItem('username') || sessionStorage.getItem('email') || t(isAdmin.value ? 'topbar.administrator' : 'topbar.resident'))
const initials = computed(() => userLabel.value.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'U')
const notificationSummary = computed(() => displayedNotifications.value.length === 1 ? t('notifications.oneNew') : t('notifications.manyNew', { count: displayedNotifications.value.length }))

const residentLinks = computed(() => [
  { label: t('nav.home'), to: '/home', icon: '⌂' },
  { label: t('nav.waterInsights'), to: '/stats', icon: '◒' },
  { label: t('nav.events'), to: '/events', icon: '◇' },
  { label: t('nav.community'), to: '/community', icon: '◎' },
  { label: t('nav.cleaning'), to: '/cleaning', icon: '✓' },
  { label: t('nav.chats'), to: '/chat', icon: '○' },
])
const visibleResidentLinks = computed(() => isAdmin.value ? residentLinks.value.filter(item => item.to !== '/community') : residentLinks.value)
const adminLinks = computed(() => [
  { label: t('nav.administration'), to: '/admin', icon: '⚙' },
  { label: t('nav.waterAnalytics'), to: '/admin/water-analytics', icon: '▥' },
  { label: t('nav.surveys'), to: '/survey', icon: '≡' },
])

const pages = computed<Record<string, PageInfo>>(() => ({
  stats: { title: t('nav.waterInsights'), eyebrow: t('topbar.yourFloor'), description: t('topbar.usageDescription'), action: { label: t('nav.home'), to: '/home', icon: '⌂' } },
  events: { title: t('nav.events'), eyebrow: t('nav.community'), description: t('topbar.calendarDescription'), action: { label: t('nav.cleaning'), to: '/cleaning', icon: '✓' } },
  community: { title: t('nav.community'), eyebrow: t('nav.residence'), description: t('topbar.calendarDescription'), action: { label: t('nav.chats'), to: '/chat', icon: '○' } },
  cleaning: { title: t('nav.cleaning'), eyebrow: t('topbar.sharedSpaces'), description: t('topbar.cleaningDescription'), action: { label: t('nav.events'), to: '/events', icon: '◇' } },
  chat: { title: t('nav.chats'), eyebrow: t('nav.community'), description: t('topbar.chatDescription') },
  chatRoom: { title: t('topbar.conversation'), eyebrow: t('nav.chats'), description: t('topbar.chatDescription'), action: { label: t('topbar.allChats'), to: '/chat', icon: '←' } },
  account: { title: t('nav.account'), eyebrow: t('topbar.yourProfile'), description: t('topbar.accountDescription'), action: { label: t('nav.home'), to: '/home', icon: '⌂' } },
  admin: { title: t('nav.administration'), eyebrow: t('topbar.management'), description: t('topbar.adminDescription') },
  'admin-water-analytics': { title: t('nav.waterAnalytics'), eyebrow: t('nav.administration'), description: t('topbar.waterDescription'), action: { label: t('nav.administration'), to: '/admin', icon: '←' } },
  survey: { title: t('nav.surveys'), eyebrow: t('nav.administration'), description: t('topbar.surveyDescription'), action: { label: t('topbar.newSurvey'), to: '/createSurvey', icon: '+' } },
  createSurvey: { title: t(route.params.id ? 'topbar.editSurvey' : 'topbar.createSurvey'), eyebrow: t('nav.surveys'), description: t('topbar.buildQuestions'), action: { label: t('topbar.allSurveys'), to: '/survey', icon: '←' } },
  answerSurvey: { title: t('topbar.survey'), eyebrow: t('topbar.yourFeedback'), description: t('topbar.shareExperience'), action: { label: t('common.back'), to: '/home', icon: '←' } },
  'change-password': { title: t('topbar.finishSetup'), eyebrow: t('topbar.security'), description: t('topbar.setupDescription') },
}))
const homePage = computed<PageInfo>(() => {
  const user = dashboardUser.value
  const hour = new Date().getHours()
  const greeting = t(hour < 12 ? 'topbar.morning' : hour < 18 ? 'topbar.afternoon' : 'topbar.evening')
  const location = user ? t('topbar.location', { house: user.house, floor: user.floor, room: user.room }) : t('topbar.glance')
  return { title: userLabel.value, eyebrow: greeting, description: location, action: { label: t('topbar.viewWater'), to: '/stats', icon: '◒' } }
})
const page = computed(() => route.name === 'home' ? homePage.value : pages.value[String(route.name)] || { title: 'DORMS', eyebrow: t('topbar.residence'), description: t('topbar.fallbackDescription') })

function closeMenu() { menuOpen.value = false }
function closeNotifications() { notificationsOpen.value = false }
function notificationStorageKey(userID?: number) { return `read-dashboard-alerts:${userID || 'resident'}` }
function readAlertIDs(userID?: number) {
  try { return new Set<number>(JSON.parse(localStorage.getItem(notificationStorageKey(userID)) || '[]')) }
  catch { return new Set<number>() }
}
function markNotificationsRead() {
  const userID = dashboardUser.value?.id
  const readIDs = readAlertIDs(userID)
  displayedNotifications.value.forEach(item => readIDs.add(item.id))
  localStorage.setItem(notificationStorageKey(userID), JSON.stringify([...readIDs].slice(-500)))
  notifications.value = []
}
function openNotifications() {
  displayedNotifications.value = [...notifications.value]
  notificationsOpen.value = true
  markNotificationsRead()
}
function openNotification(notification: AlertItem) { closeNotifications(); router.push(notification.route || '/home') }
function logout() { disconnectSocket(); clearSession(); closeMenu(); router.replace({ name: 'login' }) }
function dashboardNotifications(dashboard: DashboardPayload) {
  const surveyAlerts: AlertItem[] = (dashboard.pendingSurveys || []).map(survey => ({
    id: 700000 + Number(survey.eID),
    title: t('notifications.residentSurvey'),
    description: survey.question,
    route: `/answerSurvey/${survey.eID}`,
    actionLabel: t('notifications.shareAnswer'),
  }))
  return [...(dashboard.alerts || []), ...surveyAlerts]
}
watch(() => route.fullPath, closeMenu)
watch([menuOpen, notificationsOpen], async ([menuIsOpen, modalIsOpen]) => {
  document.body.style.overflow = menuIsOpen || modalIsOpen ? 'hidden' : ''
  if (menuIsOpen) { await nextTick(); closeButton.value?.focus() }
  if (modalIsOpen) { await nextTick(); notificationCloseButton.value?.focus() }
})
function receiveDashboard(dashboard: DashboardPayload) {
  dashboardUser.value = dashboard.user
  const alerts = dashboardNotifications(dashboard)
  const readIDs = readAlertIDs(dashboard.user.id)
  notifications.value = alerts.filter(alert => !readIDs.has(alert.id))
  const hasNewArrival = receivedAlertIDs.value.size > 0 && alerts.some(alert => !receivedAlertIDs.value.has(alert.id) && !readIDs.has(alert.id))
  receivedAlertIDs.value = new Set(alerts.map(alert => alert.id))
  if (hasNewArrival) {
    bellRinging.value = false
    requestAnimationFrame(() => {
      bellRinging.value = true
      if (bellTimer) clearTimeout(bellTimer)
      bellTimer = setTimeout(() => { bellRinging.value = false }, 1400)
    })
  }
  sessionStorage.setItem('dashboard', JSON.stringify(dashboard))
}
function loadCachedNotifications() {
  try {
    const cached = JSON.parse(sessionStorage.getItem('dashboard') || 'null') as DashboardPayload | null
    dashboardUser.value = cached?.user || null
    const alerts = cached ? dashboardNotifications(cached) : []
    const readIDs = readAlertIDs(cached?.user?.id)
    notifications.value = alerts.filter(alert => !readIDs.has(alert.id))
    receivedAlertIDs.value = new Set(alerts.map(alert => alert.id))
  } catch { notifications.value = [] }
}
function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (notificationsOpen.value) closeNotifications()
  else closeMenu()
}
function requestDashboard() { if (!isAdmin.value) socket.emit('getDashboard') }
onMounted(() => {
  loadCachedNotifications()
  socket.on('dashboard', receiveDashboard)
  socket.on('connect', requestDashboard)
  socket.on('swapRequestUpdated', requestDashboard)
  socket.on('cleaningTaskProposalsUpdated', requestDashboard)
  requestDashboard()
  window.addEventListener('keydown', handleKeydown)
})
onBeforeUnmount(() => {
  socket.off('dashboard', receiveDashboard)
  socket.off('connect', requestDashboard)
  socket.off('swapRequestUpdated', requestDashboard)
  socket.off('cleaningTaskProposalsUpdated', requestDashboard)
  if (bellTimer) clearTimeout(bellTimer)
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.app-top-bar { padding-top: env(safe-area-inset-top); }
.mobile-drawer { padding-top: env(safe-area-inset-top); }
.drawer-footer { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
.notification-panel { padding-bottom: env(safe-area-inset-bottom); }
.bell-ring svg { transform-origin: 50% 15%; animation: bell-ring 1.1s ease-in-out; }
@keyframes bell-ring {
  0%, 100% { transform: rotate(0); }
  15%, 45%, 75% { transform: rotate(16deg); }
  30%, 60%, 90% { transform: rotate(-16deg); }
}
@media (prefers-reduced-motion: reduce) { .bell-ring svg { animation: none; } }
.nav-link { @apply mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition hover:bg-surface dark:hover:bg-surface-dark; }
.nav-link-active { @apply bg-accent text-white hover:bg-accent dark:hover:bg-accent; }
@media (max-width: 380px) {
  .app-top-bar > div { gap: .5rem; padding-left: .625rem; padding-right: .625rem; }
}
</style>
