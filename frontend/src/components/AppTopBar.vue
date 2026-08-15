<template>
  <header class="app-top-bar fixed inset-x-0 top-0 z-50 border-b border-border-border/80 bg-background/95 text-text shadow-sm backdrop-blur dark:bg-background-dark/95 dark:text-text-dark">
    <div class="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
      <button
        class="grid h-11 w-11 shrink-0 place-items-center rounded-xl transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent dark:hover:bg-surface-dark"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="app-navigation"
        aria-label="Open navigation"
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
      <button
        class="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent dark:hover:bg-surface-dark"
        :class="notifications.length ? 'text-accent' : 'opacity-65'"
        type="button"
        :aria-label="notifications.length ? `${notifications.length} notifications` : 'No notifications'"
        @click="notificationsOpen = true"
      >
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        <span v-if="notifications.length" class="absolute right-0.5 top-0.5 min-w-[1.15rem] rounded-full bg-error px-1 text-center text-[10px] font-extrabold leading-[1.15rem] text-white ring-2 ring-background dark:ring-background-dark">
          {{ notifications.length > 99 ? '99+' : notifications.length }}
        </span>
      </button>
      <router-link to="/account" class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent font-bold text-white" :title="userLabel" aria-label="Account settings">
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
      <button ref="closeButton" class="grid h-11 w-11 place-items-center rounded-xl text-2xl hover:bg-surface dark:hover:bg-surface-dark" aria-label="Close navigation" @click="closeMenu">×</button>
    </div>

    <nav class="flex-1 overflow-y-auto p-4" aria-label="Main navigation">
      <router-link v-if="page.action" :to="page.action.to" class="mb-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-white sm:hidden" @click="closeMenu">
        <span aria-hidden="true">{{ page.action.icon }}</span>{{ page.action.label }}
      </router-link>
      <p class="mb-2 px-3 text-xs font-bold uppercase tracking-wider opacity-45">Your residence</p>
      <router-link v-for="item in residentLinks" :key="item.to" :to="item.to" class="nav-link" active-class="nav-link-active" @click="closeMenu">
        <span class="w-6 text-center" aria-hidden="true">{{ item.icon }}</span><span>{{ item.label }}</span>
      </router-link>

      <template v-if="isAdmin">
        <p class="mb-2 mt-6 px-3 text-xs font-bold uppercase tracking-wider opacity-45">Administration</p>
        <router-link v-for="item in adminLinks" :key="item.to" :to="item.to" class="nav-link" active-class="nav-link-active" @click="closeMenu">
          <span class="w-6 text-center" aria-hidden="true">{{ item.icon }}</span><span>{{ item.label }}</span>
        </router-link>
      </template>
    </nav>

    <div class="drawer-footer border-t border-border-border p-4">
      <router-link to="/account" class="mb-2 flex items-center gap-3 rounded-xl p-3 hover:bg-surface dark:hover:bg-surface-dark" @click="closeMenu">
        <span class="grid h-9 w-9 place-items-center rounded-full bg-accent font-bold text-white">{{ initials }}</span>
        <span class="min-w-0"><strong class="block truncate text-sm">{{ userLabel }}</strong><span class="text-xs opacity-55">Account settings</span></span>
      </router-link>
      <button class="w-full rounded-xl px-4 py-2.5 text-left text-sm font-bold text-error hover:bg-error/10" @click="logout">Sign out</button>
    </div>
  </aside>

  <div v-if="notificationsOpen" class="fixed inset-0 z-[80] flex items-end bg-black/45 sm:items-center sm:justify-center sm:p-4" role="presentation" @click.self="closeNotifications">
    <section class="notification-panel flex max-h-[min(80dvh,42rem)] w-full flex-col rounded-t-3xl bg-background text-text shadow-2xl dark:bg-background-dark dark:text-text-dark sm:max-w-lg sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="notifications-title">
      <header class="flex items-start justify-between gap-4 border-b border-border-border p-5">
        <div>
          <p class="text-xs font-bold uppercase tracking-[.14em] text-accent">Attention required</p>
          <h2 id="notifications-title" class="mt-1 text-2xl font-bold">Notifications</h2>
          <p class="mt-1 text-sm opacity-60">{{ notificationSummary }}</p>
        </div>
        <button ref="notificationCloseButton" class="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl hover:bg-surface dark:hover:bg-surface-dark" aria-label="Close notifications" @click="closeNotifications">×</button>
      </header>

      <div class="overflow-y-auto p-4 sm:p-5">
        <button
          v-for="notification in notifications"
          :key="notification.id"
          class="mb-3 flex min-h-16 w-full items-start gap-3 rounded-2xl border border-border-border p-4 text-left transition last:mb-0 hover:border-accent hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-accent"
          @click="openNotification(notification)"
        >
          <span class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-error/10 text-error" aria-hidden="true">!</span>
          <span class="min-w-0 flex-1"><strong class="block">{{ notification.title }}</strong><span class="mt-1 block text-sm opacity-70">{{ notification.description }}</span><span class="mt-2 block text-sm font-bold text-accent">{{ notification.actionLabel || 'View details' }} →</span></span>
        </button>
        <div v-if="!notifications.length" class="px-4 py-12 text-center">
          <span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/10 text-2xl text-success" aria-hidden="true">✓</span>
          <h3 class="mt-4 font-bold">You’re all caught up</h3>
          <p class="mt-1 text-sm opacity-60">Nothing needs your attention right now.</p>
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

type PageInfo = { title: string; eyebrow: string; description: string; action?: { label: string; to: string; icon: string } }

const route = useRoute()
const router = useRouter()
const socket = getSocket()
const menuOpen = ref(false)
const notificationsOpen = ref(false)
const notifications = ref<AlertItem[]>([])
const dashboardUser = ref<DashboardPayload['user'] | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const notificationCloseButton = ref<HTMLButtonElement | null>(null)
const isAdmin = computed(() => sessionStorage.getItem('userRole')?.toLowerCase() === 'admin')
const userLabel = computed(() => dashboardUser.value?.name || sessionStorage.getItem('username') || sessionStorage.getItem('email') || (isAdmin.value ? 'Administrator' : 'Resident'))
const initials = computed(() => userLabel.value.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'U')
const notificationSummary = computed(() => notifications.value.length === 1 ? '1 item needs your attention' : `${notifications.value.length} items need your attention`)

const residentLinks = [
  { label: 'Home', to: '/home', icon: '⌂' },
  { label: 'Water insights', to: '/stats', icon: '◒' },
  { label: 'Events', to: '/events', icon: '◇' },
  { label: 'Cleaning', to: '/cleaning', icon: '✓' },
  { label: 'Chats', to: '/chat', icon: '○' },
]
const adminLinks = [
  { label: 'Administration', to: '/admin', icon: '⚙' },
  { label: 'Water analytics', to: '/admin/water-analytics', icon: '▥' },
  { label: 'Surveys', to: '/survey', icon: '≡' },
]

const pages: Record<string, PageInfo> = {
  stats: { title: 'Water insights', eyebrow: 'Your floor', description: 'Usage, patterns and comparisons', action: { label: 'Home', to: '/home', icon: '⌂' } },
  events: { title: 'Events', eyebrow: 'Community', description: 'Calendar and upcoming activities', action: { label: 'Cleaning', to: '/cleaning', icon: '✓' } },
  cleaning: { title: 'Cleaning', eyebrow: 'Shared spaces', description: 'Schedule, tasks and swaps', action: { label: 'Events', to: '/events', icon: '◇' } },
  chat: { title: 'Chats', eyebrow: 'Community', description: 'Conversations in your residence' },
  chatRoom: { title: 'Conversation', eyebrow: 'Chats', description: 'Messages from your residence', action: { label: 'All chats', to: '/chat', icon: '←' } },
  account: { title: 'Account settings', eyebrow: 'Your profile', description: 'Profile and login security', action: { label: 'Home', to: '/home', icon: '⌂' } },
  admin: { title: 'Administration', eyebrow: 'Management', description: 'Residents, sensors and services' },
  'admin-water-analytics': { title: 'Water analytics', eyebrow: 'Administration', description: 'Floor comparisons and meter health', action: { label: 'Admin', to: '/admin', icon: '←' } },
  survey: { title: 'Surveys', eyebrow: 'Administration', description: 'Create and manage resident surveys', action: { label: 'New survey', to: '/createSurvey', icon: '+' } },
  createSurvey: { title: route.params.id ? 'Edit survey' : 'Create survey', eyebrow: 'Surveys', description: 'Build questions for residents', action: { label: 'All surveys', to: '/survey', icon: '←' } },
  answerSurvey: { title: 'Survey', eyebrow: 'Your feedback', description: 'Share your experience', action: { label: 'Back', to: '/home', icon: '←' } },
  'change-password': { title: 'Finish account setup', eyebrow: 'Security', description: 'Choose your profile and password' },
}
const homePage = computed<PageInfo>(() => {
  const user = dashboardUser.value
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const location = user ? `${user.house} · Floor ${user.floor} · Room ${user.room}` : 'Your residence at a glance'
  return { title: userLabel.value, eyebrow: greeting, description: location, action: { label: 'View water use', to: '/stats', icon: '◒' } }
})
const page = computed(() => route.name === 'home' ? homePage.value : pages[String(route.name)] || { title: 'DORMS', eyebrow: 'Residence', description: 'Student living, made simpler' })

function closeMenu() { menuOpen.value = false }
function closeNotifications() { notificationsOpen.value = false }
function openNotification(notification: AlertItem) { closeNotifications(); router.push(notification.route || '/home') }
function logout() { disconnectSocket(); clearSession(); closeMenu(); router.replace({ name: 'login' }) }
watch(() => route.fullPath, closeMenu)
watch([menuOpen, notificationsOpen], async ([menuIsOpen, modalIsOpen]) => {
  document.body.style.overflow = menuIsOpen || modalIsOpen ? 'hidden' : ''
  if (menuIsOpen) { await nextTick(); closeButton.value?.focus() }
  if (modalIsOpen) { await nextTick(); notificationCloseButton.value?.focus() }
})
function receiveDashboard(dashboard: DashboardPayload) {
  notifications.value = dashboard.alerts || []
  dashboardUser.value = dashboard.user
  sessionStorage.setItem('dashboard', JSON.stringify(dashboard))
}
function loadCachedNotifications() {
  try {
    const cached = JSON.parse(sessionStorage.getItem('dashboard') || 'null') as DashboardPayload | null
    notifications.value = cached?.alerts || []
    dashboardUser.value = cached?.user || null
  } catch { notifications.value = [] }
}
function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (notificationsOpen.value) closeNotifications()
  else closeMenu()
}
function requestDashboard() { socket.emit('getDashboard') }
onMounted(() => {
  loadCachedNotifications()
  socket.on('dashboard', receiveDashboard)
  socket.on('connect', requestDashboard)
  requestDashboard()
  window.addEventListener('keydown', handleKeydown)
})
onBeforeUnmount(() => {
  socket.off('dashboard', receiveDashboard)
  socket.off('connect', requestDashboard)
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.app-top-bar { padding-top: env(safe-area-inset-top); }
.mobile-drawer { padding-top: env(safe-area-inset-top); }
.drawer-footer { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
.notification-panel { padding-bottom: env(safe-area-inset-bottom); }
.nav-link { @apply mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition hover:bg-surface dark:hover:bg-surface-dark; }
.nav-link-active { @apply bg-accent text-white hover:bg-accent dark:hover:bg-accent; }
@media (max-width: 380px) {
  .app-top-bar > div { gap: .5rem; padding-left: .625rem; padding-right: .625rem; }
}
</style>
