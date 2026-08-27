<template>
  <main class="mx-auto min-h-screen w-full min-w-0 max-w-4xl px-4 py-6">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="min-w-0"><p class="text-sm font-bold uppercase tracking-wider text-accent">{{ t('adminEvents.internal') }}</p><h1 class="break-words text-2xl font-bold sm:text-3xl">{{ t('adminEvents.title') }}</h1><p class="mt-2 break-words opacity-70">{{ t('adminEvents.help') }}</p></div>
      <router-link to="/admin" class="max-w-full rounded-lg border border-border px-4 py-2 text-center font-semibold">{{ t('adminMain.back') }}</router-link>
    </header>

    <section class="mt-6 min-w-0 rounded-2xl bg-surface p-4 shadow-lg dark:bg-surface-dark sm:p-8">
      <form class="grid min-w-0 gap-5" @submit.prevent="createEvent">
        <div class="min-w-0">
          <p class="font-semibold">{{ t('adminEvents.templates') }}</p>
          <p class="mt-1 text-sm opacity-65">{{ t('adminEvents.templatesHelp') }}</p>
          <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button v-for="template in eventTemplates" :key="template.key" type="button" class="min-w-0 break-words rounded-xl border border-border p-3 text-left transition hover:border-accent hover:bg-accent/5" :class="form.template === template.key ? 'border-accent ring-2 ring-accent' : ''" @click="applyTemplate(template)">
              <span class="text-xl" aria-hidden="true">{{ template.icon }}</span><strong class="mt-1 block">{{ template.label }}</strong><span class="mt-1 block text-xs opacity-65">{{ template.help }}</span>
            </button>
          </div>
        </div>
        <label class="grid min-w-0 gap-1.5"><span class="font-semibold">{{ t('eventsView.title') }}</span><input v-model.trim="form.title" required maxlength="255" class="w-full min-w-0 rounded-lg border border-border p-3" /></label>
        <label class="grid min-w-0 gap-1.5"><span class="font-semibold">{{ t('eventsView.description') }}</span><textarea v-model.trim="form.description" rows="4" maxlength="5000" class="w-full min-w-0 rounded-lg border border-border p-3"></textarea></label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="grid min-w-0 gap-1.5"><span class="font-semibold">{{ t('eventsView.startDate') }}</span><input v-model="form.startDate" required type="date" class="w-full min-w-0 rounded-lg border border-border p-3" /></label>
          <label class="grid min-w-0 gap-1.5"><span class="font-semibold">{{ t('eventsView.endDate') }}</span><input v-model="form.endDate" type="date" :min="form.startDate" class="w-full min-w-0 rounded-lg border border-border p-3" /></label>
        </div>
        <label class="flex items-center gap-2"><input v-model="form.hasTime" type="checkbox" class="h-4 w-4" /><span class="text-sm font-semibold">{{ t('eventsView.specifyTime') }}</span></label>
        <div v-if="form.hasTime" class="grid gap-4 sm:grid-cols-2">
          <label class="grid min-w-0 gap-1.5"><span class="font-semibold">{{ t('eventsView.startTime') }}</span><input v-model="form.startTime" required type="time" class="w-full min-w-0 rounded-lg border border-border p-3" /></label>
          <label class="grid min-w-0 gap-1.5"><span class="font-semibold">{{ t('eventsView.endTime') }}</span><input v-model="form.endTime" required type="time" class="w-full min-w-0 rounded-lg border border-border p-3" /></label>
        </div>
        <label class="grid min-w-0 gap-1.5"><span class="font-semibold">{{ t('eventsView.type') }}</span><select v-model="form.type" class="w-full min-w-0 rounded-lg border border-border p-3"><option value="SAFETY">{{ t('adminEvents.safety') }}</option><option value="MAINTENANCE">{{ t('adminEvents.maintenance') }}</option><option value="MEETING">{{ t('eventsView.meeting') }}</option><option value="OTHER">{{ t('eventsView.other') }}</option></select><span v-if="importantEvent" class="break-words text-sm font-semibold text-warning">{{ t('adminEvents.reminderHelp') }}</span></label>

        <fieldset class="min-w-0 rounded-xl border border-border p-3 sm:p-4">
          <legend class="px-2 font-bold">{{ t('adminEvents.audience') }}</legend>
          <div class="grid gap-3 sm:grid-cols-3">
            <label v-for="scope in scopes" :key="scope.value" class="flex min-w-0 cursor-pointer gap-3 rounded-lg border border-border p-3" :class="form.scope === scope.value ? 'ring-2 ring-accent' : ''"><input v-model="form.scope" type="radio" :value="scope.value" class="shrink-0" /><span class="min-w-0 break-words"><strong class="block">{{ scope.label }}</strong><span class="text-sm opacity-65">{{ scope.help }}</span></span></label>
          </div>
          <label v-if="form.scope === 'house'" class="mt-4 grid min-w-0 gap-1.5"><span class="font-semibold">{{ t('adminEvents.chooseHouse') }}</span><select v-model="form.address" required class="w-full min-w-0 rounded-lg border border-border p-3"><option disabled value="">{{ t('adminEvents.selectHouse') }}</option><option v-for="house in houses" :key="house" :value="house">{{ t('common.houseLabel', { house }) }}</option></select></label>
          <label v-if="form.scope === 'floor'" class="mt-4 grid min-w-0 gap-1.5"><span class="font-semibold">{{ t('adminEvents.chooseFloor') }}</span><select v-model.number="form.dormID" required class="w-full min-w-0 rounded-lg border border-border p-3"><option disabled value="">{{ t('adminEvents.selectFloor') }}</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ t('common.houseLabel', { house: dorm.address }) }} — {{ t('survey.floor', { floor: dorm.floor }) }}</option></select></label>
        </fieldset>

        <p v-if="feedback" class="break-words rounded-lg p-3 font-semibold" :class="success ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'">{{ feedback }}</p>
        <button :disabled="submitting || !dorms.length" class="rounded-lg bg-accent px-5 py-3 font-bold text-white disabled:opacity-50">{{ t(submitting ? 'adminEvents.sending' : 'adminEvents.create') }}</button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiUrl } from '@/shared/composables/api'

type Dorm = { dormID: number; address: string; floor: number }
type EventType = 'SAFETY' | 'MAINTENANCE' | 'MEETING' | 'OTHER'
type EventTemplate = { key: string; icon: string; label: string; help: string; title: string; description: string; type: EventType }
const { t } = useI18n()
const dorms = ref<Dorm[]>([]), submitting = ref(false), success = ref(false), feedback = ref('')
const form = reactive({ template: '', title: '', description: '', startDate: '', endDate: '', hasTime: false, startTime: '', endTime: '', type: 'SAFETY' as EventType, scope: 'all' as 'all'|'house'|'floor', address: '', dormID: '' as number|'' })
const houses = computed(() => [...new Set(dorms.value.map(dorm => dorm.address))].sort((a, b) => a.localeCompare(b)))
const importantEvent = computed(() => ['SAFETY', 'MAINTENANCE', 'MEETING'].includes(form.type))
const eventTemplates = computed<EventTemplate[]>(() => [
  { key: 'fire-drill', icon: '🚨', label: t('adminEvents.fireDrill'), help: t('adminEvents.fireDrillHelp'), title: t('adminEvents.fireDrillTitle'), description: t('adminEvents.fireDrillDescription'), type: 'SAFETY' },
  { key: 'maintenance', icon: '🔧', label: t('adminEvents.maintenance'), help: t('adminEvents.maintenanceHelp'), title: t('adminEvents.maintenanceTitle'), description: '', type: 'MAINTENANCE' },
  { key: 'inspection', icon: '📋', label: t('adminEvents.inspection'), help: t('adminEvents.inspectionHelp'), title: t('adminEvents.inspectionTitle'), description: '', type: 'SAFETY' },
  { key: 'meeting', icon: '📣', label: t('eventsView.meeting'), help: t('adminEvents.meetingHelp'), title: t('adminEvents.meetingTitle'), description: '', type: 'MEETING' },
])
const scopes = computed(() => [
  { value: 'all', label: t('adminEvents.all'), help: t('adminEvents.allHelp') },
  { value: 'house', label: t('adminEvents.house'), help: t('adminEvents.houseHelp') },
  { value: 'floor', label: t('adminEvents.floor'), help: t('adminEvents.floorHelp') },
])
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('authToken')}` })
function applyTemplate(template: EventTemplate) { form.template = template.key; form.title = template.title; form.description = template.description; form.type = template.type }
function eventDate(date: string, time: string, end = false) { return new Date(`${date}T${form.hasTime ? time : end ? '23:59' : '00:00'}`).toISOString() }

async function loadDorms() {
  const response = await fetch(apiUrl('/api/auth/admin/dorms'), { headers: headers() })
  if (!response.ok) throw new Error(t('adminEvents.loadError'))
  dorms.value = await response.json()
}
async function createEvent() {
  feedback.value = ''; submitting.value = true
  try {
    const endDate = form.endDate || form.startDate
    const target = form.scope === 'all' ? { scope: 'all' } : form.scope === 'house' ? { scope: 'house', address: form.address } : { scope: 'floor', dormID: form.dormID }
    const response = await fetch(apiUrl('/api/auth/admin/events'), { method: 'POST', headers: headers(), body: JSON.stringify({ title: form.title, description: form.description, startDate: eventDate(form.startDate, form.startTime), endDate: eventDate(endDate, form.endTime, true), type: form.type, target }) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || t('adminEvents.error'))
    success.value = true; feedback.value = t('adminEvents.success', { count: data.count }); form.template = ''; form.title = ''; form.description = ''; form.startDate = ''; form.endDate = ''; form.startTime = ''; form.endTime = ''; form.hasTime = false
  } catch (error) { success.value = false; feedback.value = error instanceof Error ? error.message : t('adminEvents.error') }
  finally { submitting.value = false }
}
onMounted(() => loadDorms().catch(error => { success.value = false; feedback.value = error.message }))
</script>
