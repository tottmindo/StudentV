<template>
  <ModalComponent :model-value="modelValue" @update:model-value="close">
    <div class="mx-auto w-full min-w-0 max-w-2xl p-0 sm:p-4">
      <div v-if="loading" class="grid min-h-64 min-w-0 place-items-center" role="status"><div class="min-w-0 text-center"><span class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-accent/20 border-t-accent"></span><p class="mt-4 font-semibold [overflow-wrap:anywhere]">{{ t('survey.loading') }}</p></div></div>
      <div v-else-if="submitted" class="grid min-h-64 min-w-0 place-items-center text-center"><div class="min-w-0 max-w-full"><span class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-2xl text-success">✓</span><h2 class="mt-4 text-xl font-bold [overflow-wrap:anywhere] sm:text-2xl">{{ t('survey.thanks') }}</h2><p class="mt-2 [overflow-wrap:anywhere] opacity-70">{{ t('survey.submitted') }}</p><button class="mt-6 max-w-full whitespace-normal rounded-xl bg-accent px-5 py-2.5 font-bold leading-snug text-white [overflow-wrap:anywhere]" @click="close(false)">{{ t('common.close') }}</button></div></div>
      <form v-else-if="survey" class="min-w-0 max-w-full" @submit.prevent="submitAnswer">
        <p class="pr-8 text-[11px] font-bold uppercase tracking-[.12em] text-accent [overflow-wrap:anywhere] sm:pr-0 sm:text-xs sm:tracking-[.14em]">{{ t('notifications.residentSurvey') }}</p>
        <h2 class="mt-2 pr-8 text-xl font-extrabold leading-tight [overflow-wrap:anywhere] sm:pr-10 sm:text-3xl">{{ survey.question }}</h2>
        <p class="mt-2 text-sm opacity-55">{{ t('survey.number', { id: survey.eID }) }}</p>

        <fieldset v-if="survey.multipleChoice" class="mt-7 space-y-3">
          <legend class="mb-3 font-bold">{{ t('survey.chooseAnswers') }}</legend>
          <label v-for="option in survey.options" :key="option.eID" class="flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border border-border-border bg-surface p-3 transition hover:border-accent dark:bg-background-dark sm:items-center sm:p-4">
            <input v-model="selectedOptions" type="checkbox" :value="option.eID" class="h-5 w-5 shrink-0" />
            <span class="min-w-0 [overflow-wrap:anywhere]">{{ option.optiontext }}</span>
          </label>
        </fieldset>
        <label v-else class="mt-7 block min-w-0"><span class="mb-2 block font-bold [overflow-wrap:anywhere]">{{ t('survey.yourAnswer') }}</span><textarea v-model="answer" rows="6" :placeholder="t('survey.answerPlaceholder')" class="w-full min-w-0 max-w-full p-3 sm:p-4" /></label>

        <p v-if="errorMessage" class="mt-4 text-sm font-bold text-error [overflow-wrap:anywhere]" role="alert">{{ errorMessage }}</p>
        <div class="mt-6 flex justify-end"><button :disabled="submitting" class="w-full max-w-full whitespace-normal rounded-xl bg-accent px-6 py-3 font-bold leading-snug text-white [overflow-wrap:anywhere] disabled:opacity-50 sm:w-auto">{{ submitting ? t('common.saving') : t('survey.submit') }}</button></div>
      </form>
      <div v-else class="grid min-h-64 min-w-0 place-items-center text-center"><div class="min-w-0 max-w-full"><p class="font-bold [overflow-wrap:anywhere]">{{ t('survey.notFound') }}</p><button class="mt-4 max-w-full whitespace-normal rounded-xl border border-border-border px-4 py-2 font-bold leading-snug [overflow-wrap:anywhere]" @click="close(false)">{{ t('common.close') }}</button></div></div>
    </div>
  </ModalComponent>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import ModalComponent from '@/shared/components/ModalComponent.vue'
import { getSocket } from '@/shared/composables/socket'
import { useI18n } from 'vue-i18n'

type Survey = { eID: number; question: string; multipleChoice: boolean; options: { eID: number; optiontext: string }[] }
const props = defineProps<{ modelValue: boolean; surveyId: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; submitted: [surveyID: number] }>()
const socket = getSocket(), { t } = useI18n()
const survey = ref<Survey | null>(null), answer = ref(''), selectedOptions = ref<number[]>([])
const loading = ref(false), submitting = ref(false), submitted = ref(false), errorMessage = ref('')

function handleSurvey(data: Survey | null) { if (!props.modelValue || Number(data?.eID) !== props.surveyId) return; survey.value = data; loading.value = false }
function close(value = false) { if (!submitting.value) emit('update:modelValue', value) }
function submitAnswer() {
  if (!survey.value) return
  if (survey.value.multipleChoice && !selectedOptions.value.length) { errorMessage.value = t('survey.selectOne'); return }
  if (!survey.value.multipleChoice && !answer.value.trim()) { errorMessage.value = t('survey.enterAnswer'); return }
  submitting.value = true; errorMessage.value = ''
  socket.emit('submitAnswer', survey.value.eID, survey.value.multipleChoice ? null : answer.value.trim(), survey.value.multipleChoice ? selectedOptions.value : [], (response: any) => {
    submitting.value = false
    if (response?.error) { errorMessage.value = t('survey.submitError'); return }
    submitted.value = true
    emit('submitted', survey.value!.eID)
  })
}

watch(() => [props.modelValue, props.surveyId] as const, ([open, id]) => {
  if (!open || !id) return
  survey.value = null; answer.value = ''; selectedOptions.value = []; submitted.value = false; errorMessage.value = ''; loading.value = true
  socket.off('surveyData', handleSurvey); socket.on('surveyData', handleSurvey); socket.emit('getSurvey', id)
}, { immediate: true })
watch(() => props.modelValue, open => { if (!open) socket.off('surveyData', handleSurvey) })
onUnmounted(() => socket.off('surveyData', handleSurvey))
</script>
