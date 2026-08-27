<template>
  <main
    class="min-h-screen bg-background-light px-4 py-6 text-text dark:bg-background-dark dark:text-text-dark sm:px-6 lg:px-8"
  >
    <div class="mx-auto flex min-w-0 max-w-7xl flex-col gap-8">

      <!-- Header -->
      <header>
        <p class="text-xs font-bold uppercase tracking-[.14em] text-accent">
          {{ t('information.information') }}
        </p>

        <h1 class="mt-1 break-words text-3xl font-bold">
          {{ t('information.communityInformation') }}
        </h1>

        <p class="mt-2 max-w-2xl break-words text-sm leading-6 opacity-70">
          {{ t('information.communityInformationText') }}
        </p>
      </header>

      <!-- Information sections -->
      <div class="grid gap-6 md:grid-cols-2">

        <section class="min-w-0 rounded-2xl border border-accent/30 bg-accent/5 p-5 shadow-sm sm:p-6 md:col-span-2">
          <span class="text-3xl">📘</span>

          <h2 class="mt-4 break-words text-xl font-bold">
            {{ t('information.houseGuide') }}
          </h2>

          <p class="mt-2 break-words text-sm leading-6 opacity-70">
            {{ t('information.houseGuideText') }}
          </p>

          <div v-if="houseGuides.length" class="mt-5 grid gap-3 sm:grid-cols-2">
            <a
              v-for="guide in houseGuides"
              :key="guide.house"
              :href="guide.href"
              target="_blank"
              rel="noopener noreferrer"
              class="info-link bg-surface dark:bg-surface-dark"
            >
              <span class="block">{{ t('information.houseGuideLink', { house: guide.house }) }}</span>
              <span class="mt-1 block text-xs font-normal opacity-60">{{ t('information.pdfDocument') }}</span>
            </a>
          </div>

          <p v-else class="mt-5 text-sm opacity-70">
            {{ t('information.loadingHouseGuide') }}
          </p>
        </section>

        <section class="min-w-0 rounded-2xl border border-border-border bg-surface p-5 shadow-sm dark:bg-surface-dark sm:p-6">
          <span class="text-3xl">🏠</span>

          <h2 class="mt-4 break-words text-xl font-bold">
            {{ t('information.livingHere') }}
          </h2>

          <p class="mt-2 break-words text-sm leading-6 opacity-70">
            {{ t('information.livingHereText') }}
          </p>

          <div class="mt-5 space-y-3">
            <a
              href="https://www.nationsgardarna.se/norrlandsgardarna/for-hyresgaster/boendeinformation/"
              target="_blank"
              rel="noopener noreferrer"
              class="info-link"
            >
              {{ t('information.generalLivingInfo')}}
            </a>

            <a
              href="https://www.nationsgardarna.se/norrlandsgardarna/for-hyresgaster/dokument/#ordningsregler"
              target="_blank"
              rel="noopener noreferrer"
              class="info-link"
            >
              {{ t('information.rulesOfProcedure')}}
            </a>

            <a
              href="https://www.nationsgardarna.se/norrlandsgardarna/for-hyresgaster/inflytt/"
              target="_blank"
              rel="noopener noreferrer"
              class="info-link"
            >
              {{ t('information.movingIn')}}
            </a>

            <a
              href="https://www.nationsgardarna.se/norrlandsgardarna/for-hyresgaster/utflytt/"
              target="_blank"
              rel="noopener noreferrer"
              class="info-link"
            >
              {{ t('information.movingOut')}}
            </a>
          </div>
        </section>

        <section class="min-w-0 rounded-2xl border border-border-border bg-surface p-5 shadow-sm dark:bg-surface-dark sm:p-6">
          <span class="text-3xl">⚠️</span>

          <h2 class="mt-4 break-words text-xl font-bold">
            {{ t('information.emergencies') }}
          </h2>

          <p class="mt-2 break-words text-sm leading-6 opacity-70">
            {{ t('information.emergenciesText')}}
          </p>

          <div class="mt-5 space-y-3">
            <a
              href="https://www.nationsgardarna.se/norrlandsgardarna/for-hyresgaster/akuta-arenden/"
              target="_blank"
              rel="noopener noreferrer"
              class="info-link"
            >
              {{ t('information.urgentMatters')}}
            </a>

            <a
              href="https://www.nationsgardarna.se/norrlandsgardarna/for-hyresgaster/felanmalan/"
              target="_blank"
              rel="noopener noreferrer"
              class="info-link"
            >
              {{ t('information.errorReport')}}
            </a>
          </div>
        </section>

        <section class="min-w-0 rounded-2xl border border-border-border bg-surface p-5 shadow-sm dark:bg-surface-dark sm:p-6">
          <span class="text-3xl">☎️</span>

          <h2 class="mt-4 break-words text-xl font-bold">
            {{ t('information.contact') }}
          </h2>

          <p class="mt-2 break-words text-sm leading-6 opacity-70">
            {{ t('information.contactText')}}
          </p>

          <div class="mt-5 space-y-3">
            <a
              href="https://www.nationsgardarna.se/norrlandsgardarna/kontakt-oppettider/"
              target="_blank"
              rel="noopener noreferrer"
              class="info-link"
            >
              {{ t('information.numberOpeningHours')}}
            </a>
          </div>
        </section>

        <section class="min-w-0 rounded-2xl border border-border-border bg-surface p-5 shadow-sm dark:bg-surface-dark sm:p-6">
          <span class="text-3xl">🔗</span>

          <h2 class="mt-4 break-words text-xl font-bold">
            {{ t('information.usefullLinks') }}
          </h2>

          <p class="mt-2 break-words text-sm leading-6 opacity-70">
            {{ t('information.usefullLinksText') }}
          </p>

          <div class="mt-5 space-y-3">
            <a
              href="https://www.norrlandsnation.se/engagera-dig"
              target="_blank"
              rel="noopener noreferrer"
              class="info-link"
            >
              {{ t('information.getInvolved')}}
            </a>
          </div>
        </section>

      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSocket } from '@/shared/composables/socket'
import type { DashboardPayload } from '@/types'

const { t, locale } = useI18n()
const house = ref<number | null>(null)
const role = sessionStorage.getItem('role')
const isResident = role === 'STUDENT'
const socket = getSocket()

function applyDashboard(dashboard: DashboardPayload) {
  house.value = [12, 14].includes(Number(dashboard.user?.house)) ? Number(dashboard.user.house) : null
}

function loadCachedDashboard() {
  try {
    const dashboard = JSON.parse(sessionStorage.getItem('dashboard') || 'null') as DashboardPayload | null
    if (dashboard) applyDashboard(dashboard)
  } catch {
    sessionStorage.removeItem('dashboard')
  }
}

const houseGuides = computed(() => {
  const houses = isResident ? (house.value ? [house.value] : []) : [12, 14]
  const language = locale.value === 'sv' ? 'sv' : 'en'
  return houses.map(houseNumber => ({
    house: houseNumber,
    href: `/documents/studentvagen-${houseNumber}-${language}.pdf`,
  }))
})

onMounted(() => {
  loadCachedDashboard()
  if (isResident) {
    socket.on('dashboard', applyDashboard)
    socket.emit('getDashboard')
  }
})

onBeforeUnmount(() => socket.off('dashboard', applyDashboard))
</script>

<style scoped>
.info-link {
  @apply block min-w-0 rounded-xl border border-border-border px-4 py-3 text-sm font-semibold transition hover:border-accent hover:bg-accent/5 hover:text-accent;
  overflow-wrap: anywhere;
}
</style>
