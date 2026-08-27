<template>
  <main class="min-h-screen min-w-0 bg-background-light px-4 py-6 text-text dark:bg-background-dark dark:text-text-dark sm:px-6 lg:px-8">
    <div class="mx-auto flex min-w-0 max-w-7xl flex-col gap-6">
      <div v-if="!activeSection" class="grid gap-6 md:grid-cols-2">
        <button class="hub-card" @click="activeSection = 'residents'"><span class="text-4xl">👥</span><h2>{{ t('communityHub.people') }}</h2><p>{{ t('communityHub.residentsChoiceHelp') }}</p></button>
        <router-link to="/cleaning" class="hub-card"><span class="text-4xl">✓</span><h2>{{ t('communityHub.cleaningChoice') }}</h2><p>{{ t('communityHub.cleaningChoiceHelp') }}</p></router-link>
        <router-link to="/events" class="hub-card"><span class="text-4xl">◇</span><h2>{{ t('nav.events') }}</h2><p>{{ t('communityHub.eventsChoiceHelp') }}</p></router-link>
        <router-link to="/chat" class="hub-card"><span class="text-4xl">💬</span><h2>{{ t('nav.chats') }}</h2><p>{{ t('communityHub.chatsChoiceHelp') }}</p></router-link>
      </div>

      <template v-else>
        <header class="flex flex-wrap items-center justify-between gap-3"><h2 class="min-w-0 flex-1 break-words text-3xl font-bold">{{ t('communityHub.people') }}</h2><button class="min-h-11 shrink-0 rounded-xl border border-border-border px-4 py-2 font-bold" @click="activeSection = null">{{ t('common.back') }}</button></header>

      <section v-if="loading" class="grid min-h-64 place-items-center" role="status">
        <div class="text-center"><span class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-accent/20 border-t-accent"></span><p class="mt-4 font-semibold">{{ t('communityHub.loading') }}</p></div>
      </section>

      <section v-else-if="loadError" class="rounded-2xl border border-error/30 bg-error/10 p-5" role="alert">
        <h2 class="font-bold">{{ t('communityHub.loadTitle') }}</h2>
        <p class="mt-1 text-sm opacity-70">{{ loadError }}</p>
        <button class="mt-4 min-h-11 rounded-xl border border-error/40 px-4 py-2 text-sm font-bold" @click="loadCommunity">{{ t('common.retry') }}</button>
      </section>

      <template v-else-if="community">
        <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div class="min-w-0 space-y-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div class="min-w-0"><p class="text-xs font-bold uppercase tracking-[.14em] text-accent">{{ t('communityHub.directory') }}</p><h2 class="mt-1 break-words text-2xl font-bold">{{ t('communityHub.people') }}</h2></div>
              <label class="relative block sm:w-72">
                <span class="sr-only">{{ t('communityHub.search') }}</span>
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-45" aria-hidden="true">⌕</span>
                <input v-model.trim="search" type="search" :placeholder="t('communityHub.searchPlaceholder')" class="w-full rounded-xl border border-border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 dark:bg-surface-dark" />
              </label>
            </div>

            <div v-if="filteredResidents.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <article v-for="resident in filteredResidents" :key="resident.userID" tabindex="0" role="button" :aria-label="t('communityHub.viewProfile', { name: resident.username })" class="group flex min-h-56 min-w-0 cursor-pointer flex-col rounded-2xl border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent dark:bg-surface-dark" :class="resident.isCurrentUser ? 'border-accent/50 ring-1 ring-accent/20' : 'border-border-border'" @click="openResident(resident)" @keydown.enter.prevent="openResident(resident)" @keydown.space.prevent="openResident(resident)">
                <div class="flex items-start justify-between gap-3">
                  <span class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent/10 text-lg font-extrabold text-accent">{{ initials(resident.username) }}</span>
                  <span class="max-w-[55%] rounded-full bg-surface px-3 py-1 text-right text-xs font-bold [overflow-wrap:anywhere] dark:bg-background-dark">{{ t('communityHub.room', { room: resident.roomID }) }}</span>
                </div>
                <div class="mt-4"><div class="flex flex-wrap items-center gap-2"><h3 class="break-words text-lg font-extrabold">{{ resident.username }}</h3><span v-if="resident.isCurrentUser" class="rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">{{ t('common.you') }}</span></div></div>
                <p v-if="resident.bio" class="mt-2 whitespace-pre-line break-words text-sm leading-6 opacity-75">{{ resident.bio }}</p>
                <p v-else class="mt-2 text-sm italic opacity-45">{{ t('communityHub.noBio') }}</p>
              </article>
            </div>
            <div v-else class="rounded-2xl border border-dashed border-border-border px-6 py-14 text-center"><h3 class="font-bold">{{ t('communityHub.noMatch') }}</h3><button class="mt-2 min-h-11 px-2 text-sm font-bold text-accent" @click="search = ''">{{ t('communityHub.clearSearch') }}</button></div>
          </div>

          <aside class="min-w-0 rounded-2xl border border-border-border bg-background p-5 shadow-sm dark:bg-surface-dark lg:sticky lg:top-24">
            <p class="text-xs font-bold uppercase tracking-[.14em] text-accent">{{ t('communityHub.yourIntro') }}</p>
            <h2 class="mt-1 text-xl font-bold">{{ t('communityHub.sayHello') }}</h2>
            <p class="mt-2 break-words text-sm leading-6 opacity-65">{{ t('communityHub.bioHelp') }}</p>
            <form class="mt-4" @submit.prevent="saveBio">
              <label class="sr-only" for="resident-bio">{{ t('communityHub.aboutYou') }}</label>
              <textarea id="resident-bio" v-model="bio" rows="7" maxlength="500" :placeholder="t('communityHub.bioPlaceholder')" class="w-full resize-y rounded-xl border border-border-border bg-background-light p-3 text-sm leading-6 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 dark:bg-background-dark"></textarea>
              <div class="mt-1 flex flex-wrap justify-between gap-x-2 text-xs opacity-50"><span class="break-words">{{ t('communityHub.privacy') }}</span><span class="shrink-0">{{ bio.length }}/500</span></div>
              <button :disabled="saving || !bioChanged" class="mt-4 w-full rounded-xl bg-accent px-4 py-3 font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45">{{ saving ? t('common.saving') : t('communityHub.saveIntro') }}</button>
            </form>
            <p v-if="saveMessage" class="mt-3 text-sm font-semibold" :class="saveFailed ? 'text-error' : 'text-success'" role="status">{{ saveMessage }}</p>
          </aside>
        </section>
      </template>
      </template>
    </div>

    <div v-if="selectedResident" class="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4" role="presentation" @click.self="closeResident">
      <section class="max-h-[calc(100dvh-2rem)] w-full min-w-0 max-w-md overflow-y-auto rounded-3xl bg-background p-5 text-text shadow-2xl dark:bg-surface-dark dark:text-text-dark sm:p-6" role="dialog" aria-modal="true" :aria-labelledby="`resident-${selectedResident.userID}`">
        <div class="flex items-start justify-between gap-4">
          <div class="flex min-w-0 items-center gap-4">
            <span class="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent/10 text-2xl font-extrabold text-accent">{{ initials(selectedResident.username) }}</span>
            <div class="min-w-0"><h2 :id="`resident-${selectedResident.userID}`" class="break-words text-2xl font-extrabold">{{ selectedResident.username }}</h2><p class="break-words text-sm opacity-60">{{ t('communityHub.room', { room: selectedResident.roomID }) }}</p></div>
          </div>
          <button type="button" class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-xl dark:bg-background-dark" :aria-label="t('common.close')" @click="closeResident">×</button>
        </div>
        <div class="mt-6 rounded-2xl bg-surface p-4 dark:bg-background-dark">
          <p class="text-xs font-bold uppercase tracking-wide text-accent">{{ t('communityHub.aboutResident') }}</p>
          <p v-if="selectedResident.bio" class="mt-2 whitespace-pre-line break-words leading-7">{{ selectedResident.bio }}</p>
          <p v-else class="mt-2 italic opacity-50">{{ t('communityHub.noBio') }}</p>
        </div>
        <p v-if="residentActionError" class="mt-4 text-sm font-semibold text-error" role="alert">{{ residentActionError }}</p>
        <div v-if="!selectedResident.isCurrentUser" class="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" class="min-w-0 break-words rounded-xl bg-accent px-4 py-3 font-bold text-white disabled:opacity-45" :disabled="Boolean(residentActionBusy)" @click="startDirectChat">{{ residentActionBusy === 'chat' ? t('communityHub.openingChat') : t('communityHub.startChat') }}</button>
          <button type="button" class="min-w-0 break-words rounded-xl border px-4 py-3 font-bold disabled:opacity-45" :class="selectedResident.isBlocked ? 'border-success/50 text-success' : 'border-border-border opacity-70'" :disabled="Boolean(residentActionBusy)" @click="toggleMessageBlock">
            {{ residentActionBusy === 'block' ? t('common.saving') : selectedResident.isBlocked ? t('communityHub.showMessages') : t('communityHub.hideMessages') }}
          </button>
        </div>
        <p v-if="!selectedResident.isCurrentUser" class="mt-3 text-xs leading-5 opacity-55">{{ selectedResident.isBlocked ? t('communityHub.messagesHiddenHelp') : t('communityHub.hideMessagesHelp') }}</p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { apiUrl } from '@/shared/composables/api'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

type Resident = { userID: number; username: string; roomID: number; bio: string; updatedAt: string | null; isCurrentUser: boolean; isBlocked: boolean }
type Community = { dorm: { address: string; floor: number }; currentUserID: number; residents: Resident[] }

const community = ref<Community | null>(null)
const loading = ref(true)
const loadError = ref('')
const search = ref('')
const bio = ref('')
const savedBio = ref('')
const saving = ref(false)
const saveMessage = ref('')
const saveFailed = ref(false)
const { t } = useI18n()
const router = useRouter()
const selectedResident = ref<Resident | null>(null)
const residentActionBusy = ref<'' | 'chat' | 'block'>('')
const residentActionError = ref('')
const activeSection = ref<'residents' | null>(null)
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('authToken') || ''}` })
const bioChanged = computed(() => bio.value.trim() !== savedBio.value)
const filteredResidents = computed(() => {
  const query = search.value.toLocaleLowerCase()
  if (!query) return community.value?.residents || []
  return (community.value?.residents || []).filter(resident => `${resident.username} ${resident.roomID} ${resident.bio}`.toLocaleLowerCase().includes(query))
})

function initials(username: string) { return username.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?' }
function openResident(resident: Resident) { selectedResident.value = resident; residentActionError.value = '' }
function closeResident() { if (!residentActionBusy.value) selectedResident.value = null }

async function startDirectChat() {
  if (!selectedResident.value || selectedResident.value.isCurrentUser) return
  residentActionBusy.value = 'chat'; residentActionError.value = ''
  try {
    const response = await fetch(apiUrl(`/api/community/direct-chat/${selectedResident.value.userID}`), { method: 'POST', headers: headers() })
    const data = await response.json()
    if (!response.ok || !data.chatID) throw new Error(data.error || t('communityHub.chatError'))
    await router.push({ name: 'chat', query: { room: String(data.chatID) } })
  } catch (error) { residentActionError.value = error instanceof Error ? error.message : t('communityHub.chatError') }
  finally { residentActionBusy.value = '' }
}

async function toggleMessageBlock() {
  if (!selectedResident.value || selectedResident.value.isCurrentUser) return
  const resident = selectedResident.value, blocked = !resident.isBlocked
  residentActionBusy.value = 'block'; residentActionError.value = ''
  try {
    const response = await fetch(apiUrl(`/api/community/chat-blocks/${resident.userID}`), { method: 'PUT', headers: headers(), body: JSON.stringify({ blocked }) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || t('communityHub.blockError'))
    resident.isBlocked = data.blocked
  } catch (error) { residentActionError.value = error instanceof Error ? error.message : t('communityHub.blockError') }
  finally { residentActionBusy.value = '' }
}

function handleEscape(event: KeyboardEvent) { if (event.key === 'Escape') closeResident() }

async function loadCommunity() {
  loading.value = true; loadError.value = ''
  try {
    const response = await fetch(apiUrl('/api/community'), { headers: headers() })
    const data = await response.json()
    if (!response.ok) throw new Error(t('communityHub.loadError'))
    community.value = data
    window.dispatchEvent(new CustomEvent('community-summary', { detail: t('communityHub.hubSummary', { house: data.dorm.address, floor: data.dorm.floor, count: data.residents.length }) }))
    const me = data.residents.find((resident: Resident) => resident.isCurrentUser)
    bio.value = me?.bio || ''; savedBio.value = bio.value
  } catch (error) { loadError.value = error instanceof Error ? error.message : t('communityHub.loadError') }
  finally { loading.value = false }
}

async function saveBio() {
  saving.value = true; saveMessage.value = ''
  try {
    const cleanBio = bio.value.trim()
    const response = await fetch(apiUrl('/api/community/profile'), { method: 'PATCH', headers: headers(), body: JSON.stringify({ bio: cleanBio }) })
    const data = await response.json()
    if (!response.ok) throw new Error(t('communityHub.saveError'))
    bio.value = data.bio; savedBio.value = data.bio
    const me = community.value?.residents.find(resident => resident.isCurrentUser)
    if (me) me.bio = data.bio
    saveFailed.value = false; saveMessage.value = t(data.bio ? 'communityHub.bioVisible' : 'communityHub.bioRemoved')
  } catch (error) { saveFailed.value = true; saveMessage.value = error instanceof Error ? error.message : t('communityHub.saveError') }
  finally { saving.value = false }
}

onMounted(() => { void loadCommunity(); window.addEventListener('keydown', handleEscape) })
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<style scoped>
.hub-card { @apply min-w-0 rounded-2xl bg-surface p-6 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark sm:p-8; }
.hub-card h2 { @apply mt-5 break-words text-2xl font-bold; }
.hub-card p { @apply mt-2 break-words opacity-75; }
</style>
