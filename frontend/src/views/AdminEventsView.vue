<template>
  <main class="mx-auto min-h-screen max-w-4xl px-4 py-6">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div><p class="text-sm font-bold uppercase tracking-wider text-accent">{{ t('adminEvents.internal') }}</p><h1 class="text-3xl font-bold">{{ t('adminEvents.title') }}</h1><p class="mt-2 opacity-70">{{ t('adminEvents.help') }}</p></div>
      <router-link to="/admin" class="rounded-lg border border-border px-4 py-2 font-semibold">{{ t('adminMain.back') }}</router-link>
    </header>

    <section class="mt-6 rounded-2xl bg-surface p-6 shadow-lg dark:bg-surface-dark sm:p-8">
      <form class="grid gap-5" @submit.prevent="createEvent">
        <label class="grid gap-1.5"><span class="font-semibold">{{ t('eventsView.title') }}</span><input v-model.trim="form.title" required maxlength="255" class="rounded-lg border border-border p-3" /></label>
        <label class="grid gap-1.5"><span class="font-semibold">{{ t('eventsView.description') }}</span><textarea v-model.trim="form.description" rows="4" maxlength="5000" class="rounded-lg border border-border p-3"></textarea></label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="grid gap-1.5"><span class="font-semibold">{{ t('adminEvents.starts') }}</span><input v-model="form.startDate" required type="datetime-local" class="rounded-lg border border-border p-3" /></label>
          <label class="grid gap-1.5"><span class="font-semibold">{{ t('adminEvents.ends') }}</span><input v-model="form.endDate" required type="datetime-local" :min="form.startDate" class="rounded-lg border border-border p-3" /></label>
        </div>
        <label class="grid gap-1.5"><span class="font-semibold">{{ t('eventsView.type') }}</span><select v-model="form.type" class="rounded-lg border border-border p-3"><option value="SOCIAL">{{ t('eventsView.social') }}</option><option value="MEETING">{{ t('eventsView.meeting') }}</option><option value="OTHER">{{ t('eventsView.other') }}</option></select></label>

        <fieldset class="rounded-xl border border-border p-4">
          <legend class="px-2 font-bold">{{ t('adminEvents.audience') }}</legend>
          <div class="grid gap-3 sm:grid-cols-3">
            <label v-for="scope in scopes" :key="scope.value" class="flex cursor-pointer gap-3 rounded-lg border border-border p-3" :class="form.scope === scope.value ? 'ring-2 ring-accent' : ''"><input v-model="form.scope" type="radio" :value="scope.value" /><span><strong class="block">{{ scope.label }}</strong><span class="text-sm opacity-65">{{ scope.help }}</span></span></label>
          </div>
          <label v-if="form.scope === 'house'" class="mt-4 grid gap-1.5"><span class="font-semibold">{{ t('adminEvents.chooseHouse') }}</span><select v-model="form.address" required class="rounded-lg border border-border p-3"><option disabled value="">{{ t('adminEvents.selectHouse') }}</option><option v-for="house in houses" :key="house" :value="house">{{ house }}</option></select></label>
          <label v-if="form.scope === 'floor'" class="mt-4 grid gap-1.5"><span class="font-semibold">{{ t('adminEvents.chooseFloor') }}</span><select v-model.number="form.dormID" required class="rounded-lg border border-border p-3"><option disabled value="">{{ t('adminEvents.selectFloor') }}</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dorm.address }} — {{ t('survey.floor', { floor: dorm.floor }) }}</option></select></label>
        </fieldset>

        <p v-if="feedback" class="rounded-lg p-3 font-semibold" :class="success ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'">{{ feedback }}</p>
        <button :disabled="submitting || !dorms.length" class="rounded-lg bg-accent px-5 py-3 font-bold text-white disabled:opacity-50">{{ t(submitting ? 'adminEvents.sending' : 'adminEvents.create') }}</button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiUrl } from '@/composables/api'

type Dorm = { dormID: number; address: string; floor: number }
const { t } = useI18n()
const dorms = ref<Dorm[]>([]), submitting = ref(false), success = ref(false), feedback = ref('')
const form = reactive({ title: '', description: '', startDate: '', endDate: '', type: 'SOCIAL', scope: 'all' as 'all'|'house'|'floor', address: '', dormID: '' as number|'' })
const houses = computed(() => [...new Set(dorms.value.map(dorm => dorm.address))].sort((a, b) => a.localeCompare(b)))
const scopes = computed(() => [
  { value: 'all', label: t('adminEvents.all'), help: t('adminEvents.allHelp') },
  { value: 'house', label: t('adminEvents.house'), help: t('adminEvents.houseHelp') },
  { value: 'floor', label: t('adminEvents.floor'), help: t('adminEvents.floorHelp') },
])
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('authToken')}` })

async function loadDorms() {
  const response = await fetch(apiUrl('/api/auth/admin/dorms'), { headers: headers() })
  if (!response.ok) throw new Error(t('adminEvents.loadError'))
  dorms.value = await response.json()
}
async function createEvent() {
  feedback.value = ''; submitting.value = true
  try {
    const target = form.scope === 'all' ? { scope: 'all' } : form.scope === 'house' ? { scope: 'house', address: form.address } : { scope: 'floor', dormID: form.dormID }
    const response = await fetch(apiUrl('/api/auth/admin/events'), { method: 'POST', headers: headers(), body: JSON.stringify({ title: form.title, description: form.description, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString(), type: form.type, target }) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || t('adminEvents.error'))
    success.value = true; feedback.value = t('adminEvents.success', { count: data.count }); form.title = ''; form.description = ''; form.startDate = ''; form.endDate = ''
  } catch (error) { success.value = false; feedback.value = error instanceof Error ? error.message : t('adminEvents.error') }
  finally { submitting.value = false }
}
onMounted(() => loadDorms().catch(error => { success.value = false; feedback.value = error.message }))
</script>
