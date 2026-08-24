<template>
  <main class="min-h-screen bg-background-light px-4 py-6 text-text dark:bg-background-dark dark:text-text-dark sm:px-6 lg:h-[calc(100dvh-7.75rem)] lg:min-h-0 lg:overflow-hidden lg:px-8 xl:h-[calc(100dvh-4rem)]">
    <div class="mx-auto flex max-w-7xl flex-col gap-6 lg:h-full">
      <section class="grid min-h-0 gap-6 lg:h-full lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.45fr)] lg:items-stretch">
        <aside class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border-border bg-background shadow-sm dark:bg-surface-dark lg:h-full">
          <div class="shrink-0 border-b border-border-border p-4 sm:p-5">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2"><h2 class="text-xl font-bold">{{ t('survey.surveyList') }}</h2><span class="rounded-full bg-surface px-2.5 py-1 text-xs font-bold dark:bg-background-dark">{{ filteredSurveys.length }}</span></div>
              <button type="button" class="inline-flex shrink-0 items-center justify-center rounded-lg bg-accent px-3 py-2 text-sm font-bold text-white transition hover:brightness-95" @click="createModalOpen = true">+ {{ t('surveyBuilder.create') }}</button>
            </div>
            <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label><span class="mb-1.5 block text-xs font-bold uppercase tracking-wide opacity-60">{{ t('survey.status') }}</span><select v-model="statusFilter" class="w-full px-3 py-2.5 text-sm"><option value="all">{{ t('survey.all') }}</option><option value="active">{{ t('common.active') }}</option><option value="inactive">{{ t('common.inactive') }}</option></select></label>
              <label><span class="mb-1.5 block text-xs font-bold uppercase tracking-wide opacity-60">{{ t('survey.corridor') }}</span><select v-model="dormFilter" class="w-full px-3 py-2.5 text-sm"><option :value="null">{{ t('survey.allCorridors') }}</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ t('common.houseLabel', { house: dorm.address }) }} — {{ t('survey.floor', { floor: dorm.floor }) }}</option></select></label>
            </div>
          </div>

          <div v-if="filteredSurveys.length" class="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-gutter:stable] sm:p-4">
            <button v-for="survey in filteredSurveys" :key="survey.eID" type="button" class="mb-2 w-full rounded-xl border p-4 text-left transition last:mb-0 hover:border-accent/50 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent dark:hover:bg-background-dark" :class="selectedSurveyID === Number(survey.eID) ? 'border-accent bg-accent/10 shadow-sm' : 'border-transparent bg-surface/60 dark:bg-background-dark/35'" :aria-pressed="selectedSurveyID === Number(survey.eID)" @click="selectSurvey(survey)">
              <div class="flex items-start justify-between gap-3"><h3 class="min-w-0 font-bold leading-snug">{{ survey.question }}</h3><span class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold" :class="survey.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'">{{ t(survey.active ? 'common.active' : 'common.inactive') }}</span></div>
              <div class="mt-3 flex items-center justify-between gap-3 text-xs opacity-60"><span>{{ survey.dormID === null ? t('survey.allCorridors') : getDormName(survey.dormID) }}</span><span>#{{ survey.eID }}</span></div>
            </button>
          </div>
          <div v-else class="grid min-h-52 flex-1 place-items-center p-8 text-center"><div><p class="font-bold">{{ t('survey.none') }}</p><p class="mt-1 text-sm opacity-55">{{ t('survey.adjustFilters') }}</p></div></div>
        </aside>

        <section class="min-w-0 lg:h-full lg:overflow-y-auto lg:pr-1 [scrollbar-gutter:stable]">
          <CreateSurveyComponent v-if="selectedSurvey" :key="selectedSurvey.eID" :survey="selectedSurvey" @deleted="handleSurveyDelete" />
          <div v-else-if="selectedSurveyID" class="grid min-h-80 place-items-center rounded-2xl border border-border-border bg-background p-8 text-center dark:bg-surface-dark" role="status"><div><span class="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-accent/20 border-t-accent"></span><p class="mt-4 font-bold">{{ t('survey.loading') }}</p></div></div>
          <div v-else class="grid min-h-80 place-items-center rounded-2xl border border-dashed border-border-border bg-background/70 p-8 text-center dark:bg-surface-dark/70"><div class="max-w-sm"><span class="text-4xl" aria-hidden="true">☷</span><h2 class="mt-4 text-xl font-bold">{{ t('survey.selectTitle') }}</h2><p class="mt-2 text-sm leading-6 opacity-60">{{ t('survey.selectHelp') }}</p></div></div>
        </section>
      </section>
    </div>
    <ModalComponent v-model="createModalOpen">
      <CreateSurveyComponent @created="handleSurveyCreated" />
    </ModalComponent>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { apiUrl } from '@/shared/composables/api'
import { getSocket } from '@/shared/composables/socket'
import CreateSurveyComponent from '@/features/surveys/components/CreateSurveyComponent.vue'
import ModalComponent from '@/shared/components/ModalComponent.vue'
import { useI18n } from 'vue-i18n'

type Dorm = { dormID: number; address: string; floor: number }
type Survey = { eID: number; question: string; active: boolean; expiresAt: Date; multipleChoice: boolean; dormID: number | null; options: { eID: number; optiontext: string }[] }
const socket = getSocket()
const { t } = useI18n()
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('authToken')}` })
const surveys = ref<Survey[]>([])
const selectedSurvey = ref<Survey | null>(null)
const selectedSurveyID = ref<number | null>(null)
const createModalOpen = ref(false)
const statusFilter = ref<'all' | 'active' | 'inactive'>('all')
const dormFilter = ref<number | null>(null)
const dorms = ref<Dorm[]>([])

const filteredSurveys = computed(() => surveys.value.filter(survey => {
  const statusMatches = statusFilter.value === 'all' || (statusFilter.value === 'active' && survey.active) || (statusFilter.value === 'inactive' && !survey.active)
  return statusMatches && (dormFilter.value === null || survey.dormID === dormFilter.value)
}))
watch(filteredSurveys, visible => { if (selectedSurveyID.value && !visible.some(survey => Number(survey.eID) === selectedSurveyID.value)) { selectedSurveyID.value = null; selectedSurvey.value = null } })
function getDormName(dormID: number) { const dorm = dorms.value.find(item => item.dormID === dormID); return dorm ? `${t('common.houseLabel', { house: dorm.address })} — ${t('survey.floor', { floor: dorm.floor })}` : t('survey.unknownCorridor') }
function selectSurvey(survey: Survey) { selectedSurveyID.value = Number(survey.eID); selectedSurvey.value = null; socket.emit('getSurvey', selectedSurveyID.value) }
function handleSurveys(data: Survey[]) { const merged = new Map(surveys.value.map(survey => [survey.eID, survey])); data.forEach(survey => merged.set(survey.eID, survey)); surveys.value = Array.from(merged.values()).sort((a, b) => b.eID - a.eID) }
function handleSurveyData(survey: Survey | null) { if (!survey?.eID || Number(survey.eID) !== selectedSurveyID.value) return; selectedSurvey.value = survey; const index = surveys.value.findIndex(item => Number(item.eID) === Number(survey.eID)); if (index >= 0) surveys.value[index] = survey }
function handleSurveyUpdate(updated: Survey) { if (!updated?.eID) return; const exists = surveys.value.some(survey => Number(survey.eID) === Number(updated.eID)); surveys.value = exists ? surveys.value.map(survey => Number(survey.eID) === Number(updated.eID) ? { ...survey, ...updated } : survey) : [updated, ...surveys.value]; if (selectedSurveyID.value === Number(updated.eID) && selectedSurvey.value) selectedSurvey.value = { ...selectedSurvey.value, ...updated } }
function handleSurveyCreated(survey: Survey) { createModalOpen.value = false; handleSurveyUpdate(survey) }
function handleSurveyDelete(payload: { eID: number } | number) { const id = Number(typeof payload === 'number' ? payload : payload?.eID); if (!id) return; surveys.value = surveys.value.filter(survey => Number(survey.eID) !== id); if (selectedSurveyID.value === id) { selectedSurveyID.value = null; selectedSurvey.value = null } }
async function loadDorms() { const response = await fetch(apiUrl('/api/auth/admin/dorms'), { headers: headers() }); if (!response.ok) throw new Error(t('survey.loadDormsError')); dorms.value = await response.json() }

onMounted(() => { socket.on('allSurveys', handleSurveys); socket.on('surveyData', handleSurveyData); socket.on('surveyCreated', handleSurveyUpdate); socket.on('surveyUpdated', handleSurveyUpdate); socket.on('surveyDeleted', handleSurveyDelete); void loadDorms(); socket.emit('getSurveyAll') })
onUnmounted(() => { socket.off('allSurveys', handleSurveys); socket.off('surveyData', handleSurveyData); socket.off('surveyCreated', handleSurveyUpdate); socket.off('surveyUpdated', handleSurveyUpdate); socket.off('surveyDeleted', handleSurveyDelete) })
</script>
