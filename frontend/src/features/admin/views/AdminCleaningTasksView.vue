<template>
  <main class="mx-auto min-h-screen w-full min-w-0 max-w-6xl space-y-6 px-4 py-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="break-words text-2xl font-bold sm:text-3xl">{{ t('adminCleaning.title') }}</h1>
        <p class="mt-1 max-w-3xl text-sm opacity-75">{{ t('adminCleaning.help') }}</p>
      </div>
      <router-link to="/admin" class="rounded-lg border border-border px-4 py-2 font-semibold">{{ t('adminMain.back') }}</router-link>
    </header>

    <section class="rounded-2xl bg-surface p-4 shadow-lg dark:bg-surface-dark sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold">{{ t('adminMain.schedule') }}</h2>
          <p class="mt-1 max-w-3xl text-sm opacity-75">{{ t('adminMain.scheduleHelp') }}</p>
        </div>
        <button :disabled="generating" class="rounded-lg bg-accent px-5 py-3 font-semibold text-white disabled:opacity-50" @click="generateSchedule">
          {{ t(generating ? 'adminMain.checkingSchedule' : 'adminMain.generateWeeks') }}
        </button>
      </div>
      <p v-if="scheduleMessage" class="mt-3 text-sm font-semibold" :class="scheduleFailed ? 'text-red-600' : 'text-green-600'" role="status">{{ scheduleMessage }}</p>
    </section>

    <section class="rounded-2xl bg-surface p-4 shadow-lg dark:bg-surface-dark sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-bold">{{ t('adminCleaning.baseTasks') }}</h2>
          <p class="mt-1 text-sm opacity-75">{{ t('adminCleaning.baseTasksHelp') }}</p>
        </div>
        <button v-if="!showForm" class="rounded-lg bg-accent px-4 py-2 font-semibold text-white" @click="startCreate">+ {{ t('adminCleaning.addTask') }}</button>
      </div>

      <form v-if="showForm" class="mt-5 grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2" @submit.prevent="saveTask">
        <h3 class="text-lg font-bold sm:col-span-2">{{ t(editingTask ? 'adminCleaning.editTask' : 'adminCleaning.addTask') }}</h3>
        <label class="text-sm font-semibold">{{ t('adminCleaning.taskName') }}<input v-model.trim="form.title" required minlength="2" maxlength="100" class="mt-1 w-full rounded border border-border p-3 font-normal" /></label>
        <label class="text-sm font-semibold">{{ t('adminCleaning.audience') }}
          <select v-model="form.scope" class="mt-1 w-full rounded border border-border p-3 font-normal">
            <option value="all">{{ t('adminCleaning.everywhere') }}</option>
            <option value="house">{{ t('adminCleaning.oneHouse') }}</option>
            <option value="dorm">{{ t('adminCleaning.oneDorm') }}</option>
          </select>
        </label>
        <label v-if="form.scope === 'house'" class="text-sm font-semibold">{{ t('adminCleaning.house') }}
          <select v-model="form.address" required class="mt-1 w-full rounded border border-border p-3 font-normal"><option disabled value="">{{ t('adminCleaning.selectHouse') }}</option><option v-for="house in houses" :key="house" :value="house">{{ t('common.houseLabel', { house }) }}</option></select>
        </label>
        <label v-if="form.scope === 'dorm'" class="text-sm font-semibold">{{ t('adminCleaning.dorm') }}
          <select v-model.number="form.dormID" required class="mt-1 w-full rounded border border-border p-3 font-normal"><option disabled value="">{{ t('adminMain.selectDorm') }}</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select>
        </label>
        <label class="text-sm font-semibold sm:col-span-2">{{ t('adminCleaning.instructions') }}<textarea v-model.trim="form.description" maxlength="1000" rows="4" class="mt-1 w-full rounded border border-border p-3 font-normal"></textarea></label>
        <label class="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input v-model="form.isImportant" type="checkbox" class="h-4 w-4" />{{ t('adminCleaning.important') }}</label>
        <div class="flex flex-wrap justify-end gap-3 sm:col-span-2">
          <button type="button" class="rounded-lg border border-border px-4 py-2 font-semibold" @click="cancelForm">{{ t('common.cancel') }}</button>
          <button :disabled="saving || !canSave" class="rounded-lg bg-accent px-5 py-2 font-semibold text-white disabled:opacity-50">{{ t(saving ? 'adminCleaning.saving' : 'adminMain.saveChanges') }}</button>
        </div>
      </form>

      <p v-if="message" class="mt-4 rounded-lg p-3 text-sm font-semibold" :class="failed ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'" role="status">{{ message }}</p>
      <p v-if="loading" class="mt-6 text-center opacity-70">{{ t('adminCleaning.loading') }}</p>
      <div v-else-if="tasks.length" class="mt-6 grid gap-4 md:grid-cols-2">
        <article v-for="task in tasks" :key="task.templateID" class="min-w-0 rounded-xl border border-border p-4">
          <div class="flex min-w-0 items-start justify-between gap-3"><div class="min-w-0"><h3 class="break-words text-lg font-bold">{{ task.title }}</h3><p class="mt-1 break-words text-sm opacity-70">{{ task.description || t('adminCleaning.noInstructions') }}</p></div><span v-if="task.isImportant" class="shrink-0 rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">{{ t('adminCleaning.importantBadge') }}</span></div>
          <p class="mt-3 text-sm font-semibold text-accent">{{ scopeLabel(task) }}</p>
          <div class="mt-4 flex flex-wrap gap-2"><button class="rounded-lg border border-border px-3 py-2 text-sm font-semibold" @click="startEdit(task)">{{ t('adminMain.edit') }}</button><button :disabled="removingID === task.templateID" class="rounded-lg border border-red-400 px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-50" @click="removeTask(task)">{{ t('adminCleaning.remove') }}</button></div>
        </article>
      </div>
      <p v-else class="mt-6 text-center opacity-70">{{ t('adminCleaning.noTasks') }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiUrl } from '@/shared/composables/api'

type Dorm = { dormID: number; floor: number; address: string; rooms: number[] }
type Scope = 'all' | 'house' | 'dorm'
type AdminCleaningTask = { templateID: number; title: string; description: string; isImportant: boolean; scope: Scope; dormID: number | null; houseAddress: string | null; dormAddress: string | null; dormFloor: number | null }

const { t } = useI18n()
const dorms = ref<Dorm[]>([]), tasks = ref<AdminCleaningTask[]>([])
const loading = ref(true), saving = ref(false), removingID = ref<number | null>(null), generating = ref(false)
const message = ref(''), failed = ref(false), scheduleMessage = ref(''), scheduleFailed = ref(false)
const showForm = ref(false), editingTask = ref<AdminCleaningTask | null>(null)
const form = reactive({ title: '', description: '', isImportant: false, scope: 'all' as Scope, address: '', dormID: '' as number | '' })
const houses = computed(() => [...new Set(dorms.value.map(dorm => dorm.address))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })))
const canSave = computed(() => form.title.length >= 2 && (
  form.scope === 'all' || (form.scope === 'house' ? Boolean(form.address) : form.dormID !== '')
))
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('authToken')}` })
const dormLabel = (dorm: Dorm) => `${t('common.houseLabel', { house: dorm.address })}, ${t('survey.floor', { floor: dorm.floor })}`

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(apiUrl(path), { ...options, headers: headers() })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || t('adminCleaning.genericError'))
  return data
}
async function load() {
  loading.value = true
  try {
    const [loadedDorms, loadedTasks] = await Promise.all([request('/api/auth/admin/dorms'), request('/api/auth/admin/cleaning-tasks')])
    dorms.value = loadedDorms; tasks.value = loadedTasks
  } catch (error) { failed.value = true; message.value = error instanceof Error ? error.message : t('adminCleaning.loadError') }
  finally { loading.value = false }
}
function resetForm() { Object.assign(form, { title: '', description: '', isImportant: false, scope: 'all', address: '', dormID: '' }); editingTask.value = null }
function startCreate() { resetForm(); message.value = ''; showForm.value = true }
function startEdit(task: AdminCleaningTask) { editingTask.value = task; Object.assign(form, { title: task.title, description: task.description, isImportant: task.isImportant, scope: task.scope, address: task.houseAddress || '', dormID: task.dormID ?? '' }); message.value = ''; showForm.value = true; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function cancelForm() { resetForm(); showForm.value = false }
function payload() { return { title: form.title, description: form.description, isImportant: form.isImportant, target: form.scope === 'all' ? { scope: 'all' } : form.scope === 'house' ? { scope: 'house', address: form.address } : { scope: 'dorm', dormID: Number(form.dormID) } } }
async function saveTask() {
  if (!canSave.value) return
  saving.value = true; message.value = ''
  try {
    const path = editingTask.value ? `/api/auth/admin/cleaning-tasks/${editingTask.value.templateID}` : '/api/auth/admin/cleaning-tasks'
    await request(path, { method: editingTask.value ? 'PATCH' : 'POST', body: JSON.stringify(payload()) })
    failed.value = false; message.value = t(editingTask.value ? 'adminCleaning.updated' : 'adminCleaning.created'); cancelForm(); await load()
  } catch (error) { failed.value = true; message.value = error instanceof Error ? error.message : t('adminCleaning.genericError') }
  finally { saving.value = false }
}
async function removeTask(task: AdminCleaningTask) {
  if (!confirm(t('adminCleaning.removeConfirm', { title: task.title }))) return
  removingID.value = task.templateID; message.value = ''
  try { await request(`/api/auth/admin/cleaning-tasks/${task.templateID}`, { method: 'DELETE' }); failed.value = false; message.value = t('adminCleaning.removed'); await load() }
  catch (error) { failed.value = true; message.value = error instanceof Error ? error.message : t('adminCleaning.genericError') }
  finally { removingID.value = null }
}
function scopeLabel(task: AdminCleaningTask) { return task.scope === 'all' ? t('adminCleaning.everywhere') : task.scope === 'house' ? t('adminCleaning.houseScope', { house: task.houseAddress }) : t('adminCleaning.dormScope', { house: task.dormAddress, floor: task.dormFloor }) }
async function generateSchedule() {
  generating.value = true; scheduleMessage.value = ''
  try { const data = await request('/api/auth/admin/cleaning-weeks/generate', { method: 'POST' }); scheduleFailed.value = false; scheduleMessage.value = t('adminMain.scheduleSummary', { created: data.summary.weeksCreated, reassigned: data.summary.weeksReassigned, unchanged: data.summary.weeksUnchanged }) }
  catch (error) { scheduleFailed.value = true; scheduleMessage.value = error instanceof Error ? error.message : t('adminMain.scheduleError') }
  finally { generating.value = false }
}
onMounted(load)
</script>
