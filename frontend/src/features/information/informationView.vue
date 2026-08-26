<template>
  <main
    class="min-h-screen bg-background-light px-4 py-6 text-text dark:bg-background-dark dark:text-text-dark sm:px-6 lg:px-8"
  >
    <div class="mx-auto flex max-w-7xl flex-col gap-8">

      <!-- Header -->
      <header>
        <p class="text-xs font-bold uppercase tracking-[.14em] text-accent">
          {{ t('information.information') }}
        </p>

        <h1 class="mt-1 text-3xl font-bold">
          {{ t('information.communityInformation') }}
        </h1>

        <p class="mt-2 max-w-2xl text-sm leading-6 opacity-70">
          {{ t('information.communityInformationText') }}
        </p>
      </header>

      <!-- Information sections -->
      <div class="grid gap-6 md:grid-cols-2">

        <section class="rounded-2xl border border-border-border bg-surface p-6 shadow-sm dark:bg-surface-dark">
          <span class="text-3xl">🏠</span>

          <h2 class="mt-4 text-xl font-bold">
            {{ t('information.livingHere') }}
          </h2>

          <p class="mt-2 text-sm leading-6 opacity-70">
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

        <section class="rounded-2xl border border-border-border bg-surface p-6 shadow-sm dark:bg-surface-dark">
          <span class="text-3xl">⚠️</span>

          <h2 class="mt-4 text-xl font-bold">
            {{ t('information.emergencies') }}
          </h2>

          <p class="mt-2 text-sm leading-6 opacity-70">
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

        <section class="rounded-2xl border border-border-border bg-surface p-6 shadow-sm dark:bg-surface-dark">
          <span class="text-3xl">☎️</span>

          <h2 class="mt-4 text-xl font-bold">
            {{ t('information.contact') }}
          </h2>

          <p class="mt-2 text-sm leading-6 opacity-70">
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

        <section class="rounded-2xl border border-border-border bg-surface p-6 shadow-sm dark:bg-surface-dark">
          <span class="text-3xl">🔗</span>

          <h2 class="mt-4 text-xl font-bold">
            {{ t('information.usefullLinks') }}
          </h2>

          <p class="mt-2 text-sm leading-6 opacity-70">
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.info-link {
  @apply block rounded-xl border border-border-border px-4 py-3 text-sm font-semibold transition hover:border-accent hover:bg-accent/5 hover:text-accent;
}
</style>