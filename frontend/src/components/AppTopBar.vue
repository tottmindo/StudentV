<template>
  <header class="app-top-bar fixed inset-x-0 top-0 z-50 border-b border-border-border/80 bg-background/95 text-text shadow-sm backdrop-blur dark:bg-background-dark/95 dark:text-text-dark">
    <div class="relative mx-auto flex max-w-[1600px] flex-wrap items-center px-3 sm:px-6 xl:h-16 xl:flex-nowrap xl:gap-3">
      <div class="min-w-0 flex-1 py-2 xl:max-w-[25%] xl:py-0">
        <h1 class="truncate text-xs font-bold uppercase tracking-[0.14em] text-accent">{{ page.title }}</h1>
        <p class="truncate text-sm opacity-60">{{ page.description }}</p>
      </div>

      <div class="ml-auto flex shrink-0 items-center gap-1">
        <LanguageSelector />
        <ThemeToggle />
        <button
          class="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent dark:hover:bg-surface-dark"
          :class="[notificationBadgeCount ? 'text-accent' : 'opacity-65', { 'bell-ring': bellRinging }]"
          type="button"
          :aria-label="notificationBadgeCount ? t('notifications.countLabel', { count: notificationBadgeCount }) : t('notifications.noneLabel')"
          @click="openNotifications"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </svg>
          <span v-if="notificationBadgeCount" class="absolute right-0.5 top-0.5 min-w-[1.15rem] rounded-full bg-error px-1 text-center text-[10px] font-extrabold leading-[1.15rem] text-white ring-2 ring-background dark:ring-background-dark">
            {{ notificationBadgeCount > 99 ? '99+' : notificationBadgeCount }}
          </span>
        </button>
        <router-link to="/account" class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent font-bold text-white" :title="userLabel" :aria-label="t('nav.account')">
          {{ initials }}
        </router-link>
      </div>
      <nav
        class="top-navigation order-last flex w-full gap-1 overflow-hidden border-t border-border-border/70 py-2 transition-[max-height,opacity,padding,border-color,transform] duration-300 xl:absolute xl:left-1/2 xl:top-1/2 xl:max-h-none xl:w-[min(38rem,40vw)] xl:-translate-x-1/2 xl:-translate-y-1/2 xl:border-0 xl:py-0 xl:opacity-100"
        :class="navigationVisible ? 'max-h-16 opacity-100' : 'max-h-0 -translate-y-3 border-transparent py-0 opacity-0'"
        :aria-label="t('nav.main')"
      >
        <router-link v-for="item in navigationLinks" :key="item.to" :to="item.to" class="top-nav-link" active-class="top-nav-link-active">
          <span class="text-base" aria-hidden="true">{{ item.icon }}</span><span>{{ item.label }}</span>
        </router-link>
      </nav>
    </div>
  </header>

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
import { getSocket } from '@/shared/composables/socket'
import type { AlertItem, DashboardPayload } from '@/types'
import LanguageSelector from '@/shared/components/LanguageSelector.vue'
import ThemeToggle from '@/shared/components/ThemeToggle.vue'
import { useI18n } from 'vue-i18n'

type PageInfo = { title: string; description: string }
type UnreadChat = { chatID: number; name: string; unreadCount: number; isDirect: boolean; house: string; floor: number }

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const socket = getSocket()
const notificationsOpen = ref(false)
const notifications = ref<AlertItem[]>([])
const unreadChats = ref<UnreadChat[]>([])
const displayedNotifications = ref<AlertItem[]>([])
const bellRinging = ref(false)
const receivedAlertIDs = ref<Set<number>>(new Set())
let bellTimer: ReturnType<typeof setTimeout> | undefined
const dashboardUser = ref<DashboardPayload['user'] | null>(null)
const pendingSurveyIDs = ref<number[]>([])
const communitySummary = ref('')
const notificationCloseButton = ref<HTMLButtonElement | null>(null)
const isAdmin = computed(() => sessionStorage.getItem('userRole')?.toLowerCase() === 'admin')
const isResearcher = computed(() => sessionStorage.getItem('userRole')?.toLowerCase() === 'researcher')
const userLabel = computed(() => dashboardUser.value?.name || sessionStorage.getItem('username') || sessionStorage.getItem('email') || t(isAdmin.value ? 'topbar.administrator' : isResearcher.value ? 'topbar.researcher' : 'topbar.resident'))
const initials = computed(() => userLabel.value.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'U')
const unreadMessageTotal = computed(() => unreadChats.value.reduce((total, room) => total + Number(room.unreadCount), 0))
const chatNotifications = computed<AlertItem[]>(() => unreadChats.value.map(room => ({
  id: 900000000 + room.chatID,
  title: room.isDirect ? room.name : t('chat.generalName', { house: room.house, floor: room.floor }),
  description: t('notifications.unreadChatMessages', { count: room.unreadCount }),
  route: `/chat?room=${room.chatID}`,
  actionLabel: t('notifications.openChat'),
})))
const allNotifications = computed(() => [...chatNotifications.value, ...notifications.value])
const notificationBadgeCount = computed(() => unreadMessageTotal.value + notifications.value.length)
const notificationSummary = computed(() => notificationBadgeCount.value === 1 ? t('notifications.oneNew') : t('notifications.manyNew', { count: notificationBadgeCount.value }))

const residentLinks = computed(() => [
  { label: t('nav.home'), to: '/home', icon: '⌂' },
  { label: t('nav.waterInsights'), to: '/stats', icon: '◒' },
  { label: t('nav.community'), to: '/community', icon: '◎' },
  { label: t('nav.information'), to: '/information', icon: 'ℹ' },
])
const adminLinks = computed(() => [
  { label: t('nav.administration'), to: '/admin', icon: '⚙' },
  { label: t('nav.surveys'), to: '/survey', icon: '≡' },
])
const researcherLinks = computed(() => [
  { label: t('nav.waterAnalytics'), to: '/admin/water-analytics', icon: '📊' },
  { label: t('nav.surveys'), to: '/survey', icon: '≡' },
  { label: t('usageAdmin.title'), to: '/admin/app-usage', icon: '📈' },
])
const navigationLinks = computed(() => isAdmin.value ? adminLinks.value : isResearcher.value ? researcherLinks.value : residentLinks.value)
const navigationVisible = ref(true)
let lastScrollY = 0
let scrollDistance = 0

const pages = computed<Record<string, PageInfo>>(() => ({
  stats: { title: t('nav.waterInsights'), description: t('topbar.usageDescription') },
  events: { title: t('nav.events'), description: t('topbar.calendarDescription') },
  community: { title: t('nav.community'), description: communitySummary.value || t('communityHub.intro') },
  cleaning: { title: t('nav.cleaning'), description: t('topbar.cleaningDescription') },
  chat: { title: t('nav.chats'), description: t('topbar.chatDescription') },
  chatRoom: { title: t('topbar.conversation'), description: t('topbar.chatDescription') },
  account: { title: t('nav.account'), description: t('topbar.accountDescription') },
  admin: { title: t('nav.administration'), description: t('topbar.adminDescription') },
  'admin-water-analytics': { title: t('nav.waterAnalytics'), description: t('topbar.waterDescription') },
  survey: { title: t('nav.surveys'), description: t('topbar.surveyDescription') },
  'change-password': { title: t('topbar.finishSetup'), description: t('topbar.setupDescription') },
}))
const homePage = computed<PageInfo>(() => {
  const hour = new Date().getHours()
  const greeting = t(hour < 12 ? 'topbar.morning' : hour < 18 ? 'topbar.afternoon' : 'topbar.evening')
  return { title: t('nav.home'), description: `${greeting}, ${userLabel.value}` }
})
const page = computed(() => route.name === 'home' ? homePage.value : pages.value[String(route.name)] || { title: 'DORMS', description: t('topbar.fallbackDescription') })

function closeNotifications() { notificationsOpen.value = false }
function notificationStorageKey(userID?: number) { return `read-dashboard-alerts:${userID || 'resident'}` }
function readAlertIDs(userID?: number) {
  try { return new Set<number>(JSON.parse(localStorage.getItem(notificationStorageKey(userID)) || '[]')) }
  catch { return new Set<number>() }
}
function markNotificationsRead() {
  const userID = dashboardUser.value?.id
  const readIDs = readAlertIDs(userID)
  displayedNotifications.value.filter(item => item.dismissible !== false).forEach(item => readIDs.add(item.id))
  localStorage.setItem(notificationStorageKey(userID), JSON.stringify([...readIDs].slice(-500)))
  notifications.value = notifications.value.filter(item => item.dismissible === false)
}
function openNotifications() {
  displayedNotifications.value = [...allNotifications.value]
  notificationsOpen.value = true
  markNotificationsRead()
}
function openNotification(notification: AlertItem) {
  closeNotifications()
  const surveyID = notification.id === 700000 ? pendingSurveyIDs.value[0] : 0
  if (surveyID) { window.dispatchEvent(new CustomEvent('open-survey-answer', { detail: { surveyID, queue: pendingSurveyIDs.value } })); return }
  router.push(notification.route || '/home')
}
function dashboardNotifications(dashboard: DashboardPayload) {
  const pendingCount = dashboard.pendingSurveys?.length || 0
  const surveyAlerts: AlertItem[] = pendingCount ? [{
    id: 700000,
    title: t('notifications.pendingSurveys'),
    description: t('notifications.pendingSurveyCount', { count: pendingCount }),
    actionLabel: t('notifications.answerSurveys'),
    dismissible: false,
  }] : []
  return [...(dashboard.alerts || []), ...surveyAlerts]
}
watch(notificationsOpen, async (modalIsOpen) => {
  document.body.style.overflow = modalIsOpen ? 'hidden' : ''
  if (modalIsOpen) { await nextTick(); notificationCloseButton.value?.focus() }
})
function receiveDashboard(dashboard: DashboardPayload) {
  dashboardUser.value = dashboard.user
  pendingSurveyIDs.value = (dashboard.pendingSurveys || []).map(survey => Number(survey.eID))
  const alerts = dashboardNotifications(dashboard)
  const readIDs = readAlertIDs(dashboard.user.id)
  notifications.value = alerts.filter(alert => alert.dismissible === false || !readIDs.has(alert.id))
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
    pendingSurveyIDs.value = (cached?.pendingSurveys || []).map(survey => Number(survey.eID))
    const alerts = cached ? dashboardNotifications(cached) : []
    const readIDs = readAlertIDs(cached?.user?.id)
    notifications.value = alerts.filter(alert => alert.dismissible === false || !readIDs.has(alert.id))
    receivedAlertIDs.value = new Set(alerts.map(alert => alert.id))
  } catch { notifications.value = [] }
}
function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (notificationsOpen.value) closeNotifications()
}
function handleScroll() {
  const currentScrollY = Math.max(window.scrollY, 0)
  const delta = currentScrollY - lastScrollY
  if (!delta) return
  if ((delta > 0) !== (scrollDistance > 0)) scrollDistance = 0
  scrollDistance += delta
  if (currentScrollY < 32) navigationVisible.value = true
  else if (scrollDistance > 24 && currentScrollY > 80) navigationVisible.value = false
  else if (scrollDistance < -12) navigationVisible.value = true
  if (Math.abs(scrollDistance) >= 24) scrollDistance = 0
  lastScrollY = currentScrollY
}
function requestDashboard() { if (!isAdmin.value) socket.emit('getDashboard') }
function receiveCommunitySummary(event: Event) { communitySummary.value = (event as CustomEvent<string>).detail || '' }
function requestUnreadChats() { if (!isAdmin.value) socket.emit('getChatUnreadCounts') }
function receiveUnreadChats(data: unknown) {
  if (!Array.isArray(data)) return
  const previous = unreadMessageTotal.value
  const activeChatID = route.name === 'chat' ? Number(route.query.room) : 0
  unreadChats.value = data.filter((room): room is UnreadChat => Number.isInteger(room?.chatID) && room.chatID !== activeChatID && typeof room?.name === 'string' && Number(room?.unreadCount) > 0)
  if (unreadMessageTotal.value > previous) {
    bellRinging.value = false
    requestAnimationFrame(() => {
      bellRinging.value = true
      if (bellTimer) clearTimeout(bellTimer)
      bellTimer = setTimeout(() => { bellRinging.value = false }, 1400)
    })
  }
}
onMounted(() => {
  lastScrollY = Math.max(window.scrollY, 0)
  loadCachedNotifications()
  socket.on('dashboard', receiveDashboard)
  socket.on('connect', requestDashboard)
  socket.on('authenticated', requestUnreadChats)
  socket.on('swapRequestUpdated', requestDashboard)
  socket.on('cleaningTaskProposalsUpdated', requestDashboard)
  socket.on('eventInvitationsUpdated', requestDashboard)
  socket.on('chatUnreadCounts', receiveUnreadChats)
  requestDashboard()
  requestUnreadChats()
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('community-summary', receiveCommunitySummary)
  window.addEventListener('survey-answer-submitted', requestDashboard)
  window.addEventListener('scroll', handleScroll, { passive: true })
})
onBeforeUnmount(() => {
  socket.off('dashboard', receiveDashboard)
  socket.off('connect', requestDashboard)
  socket.off('authenticated', requestUnreadChats)
  socket.off('swapRequestUpdated', requestDashboard)
  socket.off('cleaningTaskProposalsUpdated', requestDashboard)
  socket.off('eventInvitationsUpdated', requestDashboard)
  socket.off('chatUnreadCounts', receiveUnreadChats)
  if (bellTimer) clearTimeout(bellTimer)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('community-summary', receiveCommunitySummary)
  window.removeEventListener('survey-answer-submitted', requestDashboard)
  window.removeEventListener('scroll', handleScroll)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.app-top-bar { padding-top: env(safe-area-inset-top); }
.notification-panel { padding-bottom: env(safe-area-inset-bottom); }
.top-nav-link { @apply flex min-h-11 min-w-0 flex-1 basis-0 items-center justify-center gap-2 rounded-xl px-2 text-center text-sm font-bold transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent dark:hover:bg-surface-dark; }
.top-nav-link-active { @apply bg-accent text-white hover:bg-accent dark:hover:bg-accent; }
.bell-ring svg { transform-origin: 50% 15%; animation: bell-ring 1.1s ease-in-out; }
@keyframes bell-ring {
  0%, 100% { transform: rotate(0); }
  15%, 45%, 75% { transform: rotate(16deg); }
  30%, 60%, 90% { transform: rotate(-16deg); }
}
@media (prefers-reduced-motion: reduce) { .bell-ring svg { animation: none; } }
@media (max-width: 380px) {
  .app-top-bar > div { gap: .5rem; padding-left: .625rem; padding-right: .625rem; }
}
</style>
