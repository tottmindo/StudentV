<template>
  <main class="min-h-screen bg-background-light px-4 py-6 text-text dark:bg-background-dark dark:text-text-dark sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-7xl flex-col gap-6">
      <section class="overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-orange-500 p-6 text-white shadow-lg sm:p-8">
        <div class="max-w-2xl">
          <p class="text-xs font-extrabold uppercase tracking-[.16em] opacity-80">{{ t('nav.residence') }}</p>
          <h2 class="mt-2 text-3xl font-extrabold sm:text-4xl">{{ t('communityHub.hub') }}</h2>
          <p class="mt-3 text-sm leading-6 text-white/85 sm:text-base">{{ t('communityHub.intro') }}</p>
          <p v-if="community" class="mt-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur">
            {{ community.dorm.address }} · {{ t('survey.floor', { floor: community.dorm.floor }) }} · {{ t('communityHub.residents', { count: community.residents.length }) }}
          </p>
        </div>
      </section>

      <section v-if="community" id="task-votes" class="order-last space-y-5 rounded-3xl border border-border-border bg-background p-5 shadow-sm dark:bg-surface-dark sm:p-7">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><p class="text-xs font-bold uppercase tracking-[.14em] text-accent">{{ t('communityHub.sharedCleaning') }}</p><h2 class="mt-1 text-2xl font-extrabold">{{ t('communityHub.rotationTitle') }}</h2><p class="mt-2 max-w-2xl text-sm leading-6 opacity-65">{{ t('communityHub.rotationHelp') }}</p></div>
          <button class="shrink-0 rounded-xl bg-accent px-4 py-3 font-bold text-white" @click="showCreateForm = !showCreateForm">{{ showCreateForm ? t('communityHub.closeForm') : `+ ${t('communityHub.suggestTask')}` }}</button>
        </div>
        <form v-if="showCreateForm" class="grid gap-3 rounded-2xl bg-surface p-4 dark:bg-background-dark sm:grid-cols-2" @submit.prevent="submitNewTask">
          <label class="text-sm font-bold">{{ t('communityHub.taskName') }}<input v-model.trim="taskForm.title" required minlength="2" maxlength="100" class="mt-1 w-full rounded-xl border border-border-border bg-background p-3 font-normal dark:bg-surface-dark" :placeholder="t('communityHub.taskPlaceholder')" /></label>
          <label class="text-sm font-bold">{{ t('communityHub.details') }}<textarea v-model.trim="taskForm.description" maxlength="1000" rows="2" class="mt-1 w-full rounded-xl border border-border-border bg-background p-3 font-normal dark:bg-surface-dark" :placeholder="t('communityHub.detailsPlaceholder')" /></label>
          <label class="flex items-center gap-2 text-sm"><input v-model="taskForm.isImportant" type="checkbox" class="h-4 w-4" /> {{ t('communityHub.markImportant') }}</label>
          <button :disabled="savingTask || taskForm.title.length < 2" class="rounded-xl bg-accent px-4 py-3 font-bold text-white disabled:opacity-45">{{ savingTask ? t('communityHub.startingVote') : t('communityHub.startMajority') }}</button>
        </form>
        <p v-if="taskMessage" class="rounded-xl p-3 text-sm font-semibold" :class="taskFailed ? 'bg-error/10 text-error' : 'bg-success/10 text-success'" role="status">{{ taskMessage }}</p>
        <div v-if="openProposals.length" class="space-y-3">
          <div class="flex items-center justify-between"><h3 class="text-lg font-extrabold">{{ t('communityHub.openVotes') }}</h3><span class="rounded-full bg-error px-3 py-1 text-xs font-extrabold text-white">{{ t('communityHub.needAttention', { count: openProposals.length }) }}</span></div>
          <article v-for="proposal in openProposals" :key="proposal.proposalID" class="rounded-2xl border border-accent/30 bg-accent/5 p-4 sm:p-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:justify-between"><div><p class="text-xs font-bold uppercase tracking-wide text-accent">{{ proposalLabel(proposal) }}</p><h4 class="mt-1 text-lg font-extrabold">{{ proposal.proposalType === 'remove' ? proposal.title : proposal.proposedTitle }}</h4><p v-if="proposal.proposalType === 'change'" class="mt-1 text-sm opacity-60">{{ t('communityHub.currentVersion', { title: proposal.title }) }}</p><p class="mt-2 whitespace-pre-line text-sm opacity-75">{{ proposal.proposalType === 'remove' ? proposal.description : proposal.proposedDescription }}</p><p class="mt-2 text-xs opacity-55">{{ t('communityHub.suggestedBy', { name: proposal.creatorUsername }) }}</p><button v-if="proposal.creatorUserID === community?.currentUserID" class="mt-3 text-sm font-bold text-error hover:underline" @click="cancelVote(proposal)">{{ t('communityHub.cancelVote') }}</button></div><div class="shrink-0 sm:w-56"><p class="text-sm font-bold">{{ t('communityHub.voteCounts', { approve: proposal.approveCount, reject: proposal.rejectCount }) }}</p><div class="mt-2 h-2 overflow-hidden rounded-full bg-black/10"><div class="h-full bg-accent" :style="{ width: `${Math.min(100, proposal.approveCount / proposal.majority * 100)}%` }"></div></div><p class="mt-1 text-xs opacity-55">{{ t('communityHub.approvalsNeeded', { count: proposal.majority }) }}</p><div class="mt-3 grid grid-cols-2 gap-2"><button class="rounded-lg px-3 py-2 text-sm font-bold" :class="proposal.currentUserVote === 'approve' ? 'bg-success text-white' : 'border border-success text-success'" @click="vote(proposal, 'approve')">{{ t(proposal.proposalType === 'change' ? 'communityHub.newVersion' : 'communityHub.approve') }}</button><button class="rounded-lg px-3 py-2 text-sm font-bold" :class="proposal.currentUserVote === 'reject' ? 'bg-error text-white' : 'border border-error text-error'" @click="vote(proposal, 'reject')">{{ t(proposal.proposalType === 'change' ? 'communityHub.keepCurrent' : 'communityHub.reject') }}</button></div></div></div>
          </article>
        </div>
        <div v-else class="rounded-2xl border border-dashed border-border-border p-6 text-center"><h3 class="font-bold">{{ t('communityHub.noVotes') }}</h3><p class="mt-1 text-sm opacity-60">{{ t('communityHub.settled') }}</p></div>
        <div><h3 class="text-lg font-extrabold">{{ t('communityHub.residentTasks') }}</h3><div v-if="taskGovernance.tasks.length" class="mt-3 grid gap-3 md:grid-cols-2"><article v-for="task in taskGovernance.tasks" :key="task.templateID" class="rounded-2xl border border-border-border p-4"><div class="flex items-start justify-between gap-3"><div><h4 class="font-extrabold">{{ task.title }}</h4><p class="mt-1 text-sm opacity-65">{{ task.description || t('communityHub.noInstructions') }}</p><p class="mt-2 text-xs opacity-50">{{ t('communityHub.addedBy', { name: task.creatorUsername }) }}</p></div><span v-if="task.isImportant" class="rounded-full bg-error/10 px-2 py-1 text-xs font-bold text-error">{{ t('communityHub.important') }}</span></div><div class="mt-4 flex gap-2"><button class="rounded-lg border border-border-border px-3 py-2 text-sm font-bold" @click="beginChange(task)">{{ t('communityHub.suggestChange') }}</button><button class="rounded-lg border border-error/40 px-3 py-2 text-sm font-bold text-error" @click="startRemoval(task)">{{ t('communityHub.voteRemove') }}</button></div></article></div><p v-else class="mt-3 text-sm opacity-60">{{ t('communityHub.noApprovedTasks') }}</p></div>
        <form v-if="editingTask" class="grid gap-3 rounded-2xl border border-accent/30 p-4 sm:grid-cols-2" @submit.prevent="submitChange"><div class="sm:col-span-2"><p class="font-extrabold">{{ t('communityHub.suggestVersion', { title: editingTask.title }) }}</p><p class="text-sm opacity-60">{{ t('communityHub.versionHelp') }}</p></div><input v-model.trim="editForm.title" required maxlength="100" class="rounded-xl border border-border-border bg-background-light p-3 dark:bg-background-dark" /><textarea v-model.trim="editForm.description" maxlength="1000" rows="2" class="rounded-xl border border-border-border bg-background-light p-3 dark:bg-background-dark" /><label class="flex items-center gap-2 text-sm"><input v-model="editForm.isImportant" type="checkbox" /> {{ t('communityHub.important') }}</label><div class="flex gap-2"><button type="button" class="flex-1 rounded-xl border px-3 py-2 font-bold" @click="editingTask = null">{{ t('common.cancel') }}</button><button class="flex-1 rounded-xl bg-accent px-3 py-2 font-bold text-white">{{ t('communityHub.startVote') }}</button></div></form>
      </section>

      <section v-if="loading" class="grid min-h-64 place-items-center" role="status">
        <div class="text-center"><span class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-accent/20 border-t-accent"></span><p class="mt-4 font-semibold">{{ t('communityHub.loading') }}</p></div>
      </section>

      <section v-else-if="loadError" class="rounded-2xl border border-error/30 bg-error/10 p-5" role="alert">
        <h2 class="font-bold">{{ t('communityHub.loadTitle') }}</h2>
        <p class="mt-1 text-sm opacity-70">{{ loadError }}</p>
        <button class="mt-4 rounded-xl border border-error/40 px-4 py-2 text-sm font-bold" @click="loadCommunity">{{ t('common.retry') }}</button>
      </section>

      <template v-else-if="community">
        <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div class="space-y-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><p class="text-xs font-bold uppercase tracking-[.14em] text-accent">{{ t('communityHub.directory') }}</p><h2 class="mt-1 text-2xl font-bold">{{ t('communityHub.people') }}</h2></div>
              <label class="relative block sm:w-72">
                <span class="sr-only">{{ t('communityHub.search') }}</span>
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-45" aria-hidden="true">⌕</span>
                <input v-model.trim="search" type="search" :placeholder="t('communityHub.searchPlaceholder')" class="w-full rounded-xl border border-border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 dark:bg-surface-dark" />
              </label>
            </div>

            <div v-if="filteredResidents.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <article v-for="resident in filteredResidents" :key="resident.userID" class="group flex min-h-56 flex-col rounded-2xl border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-surface-dark" :class="resident.isCurrentUser ? 'border-accent/50 ring-1 ring-accent/20' : 'border-border-border'">
                <div class="flex items-start justify-between gap-3">
                  <span class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent/10 text-lg font-extrabold text-accent">{{ initials(resident.username) }}</span>
                  <span class="rounded-full bg-surface px-3 py-1 text-xs font-bold dark:bg-background-dark">{{ t('communityHub.room', { room: resident.roomID }) }}</span>
                </div>
                <div class="mt-4"><div class="flex flex-wrap items-center gap-2"><h3 class="break-words text-lg font-extrabold">{{ resident.username }}</h3><span v-if="resident.isCurrentUser" class="rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">{{ t('common.you') }}</span></div></div>
                <p v-if="resident.bio" class="mt-2 whitespace-pre-line text-sm leading-6 opacity-75">{{ resident.bio }}</p>
                <p v-else class="mt-2 text-sm italic opacity-45">{{ t('communityHub.noBio') }}</p>
              </article>
            </div>
            <div v-else class="rounded-2xl border border-dashed border-border-border px-6 py-14 text-center"><h3 class="font-bold">{{ t('communityHub.noMatch') }}</h3><button class="mt-2 text-sm font-bold text-accent" @click="search = ''">{{ t('communityHub.clearSearch') }}</button></div>
          </div>

          <aside class="rounded-2xl border border-border-border bg-background p-5 shadow-sm dark:bg-surface-dark lg:sticky lg:top-24">
            <p class="text-xs font-bold uppercase tracking-[.14em] text-accent">{{ t('communityHub.yourIntro') }}</p>
            <h2 class="mt-1 text-xl font-bold">{{ t('communityHub.sayHello') }}</h2>
            <p class="mt-2 text-sm leading-6 opacity-65">{{ t('communityHub.bioHelp') }}</p>
            <form class="mt-4" @submit.prevent="saveBio">
              <label class="sr-only" for="resident-bio">{{ t('communityHub.aboutYou') }}</label>
              <textarea id="resident-bio" v-model="bio" rows="7" maxlength="500" :placeholder="t('communityHub.bioPlaceholder')" class="w-full resize-y rounded-xl border border-border-border bg-background-light p-3 text-sm leading-6 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 dark:bg-background-dark"></textarea>
              <div class="mt-1 flex justify-between text-xs opacity-50"><span>{{ t('communityHub.privacy') }}</span><span>{{ bio.length }}/500</span></div>
              <button :disabled="saving || !bioChanged" class="mt-4 w-full rounded-xl bg-accent px-4 py-3 font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45">{{ saving ? t('common.saving') : t('communityHub.saveIntro') }}</button>
            </form>
            <p v-if="saveMessage" class="mt-3 text-sm font-semibold" :class="saveFailed ? 'text-error' : 'text-success'" role="status">{{ saveMessage }}</p>
          </aside>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { apiUrl } from '@/composables/api'
import { getSocket } from '@/composables/socket'
import { useI18n } from 'vue-i18n'

type Resident = { userID: number; username: string; roomID: number; bio: string; updatedAt: string | null; isCurrentUser: boolean }
type Community = { dorm: { address: string; floor: number }; currentUserID: number; residents: Resident[] }
type RotationTask = { templateID: number; title: string; description: string; isImportant: boolean; creatorUsername: string }
type TaskProposal = { proposalID: number; proposalType: 'add'|'change'|'remove'; targetTemplateID: number|null; proposedTitle:string|null; proposedDescription:string; proposedIsImportant:boolean|null; creatorUserID:number; creatorUsername:string; status:string; title:string|null; description:string; approveCount:number; rejectCount:number; eligibleVoters:number; currentUserVote:'approve'|'reject'|null; majority:number }

const community = ref<Community | null>(null)
const loading = ref(true)
const loadError = ref('')
const search = ref('')
const bio = ref('')
const savedBio = ref('')
const saving = ref(false)
const saveMessage = ref('')
const saveFailed = ref(false)
const socket = getSocket()
const { t } = useI18n()
const taskGovernance = reactive<{ tasks: RotationTask[]; proposals: TaskProposal[] }>({ tasks: [], proposals: [] })
const showCreateForm = ref(false), savingTask = ref(false), taskMessage = ref(''), taskFailed = ref(false)
const taskForm = reactive({ title: '', description: '', isImportant: false })
const editingTask = ref<RotationTask|null>(null)
const editForm = reactive({ title: '', description: '', isImportant: false })
const openProposals = computed(() => taskGovernance.proposals.filter(p => p.status === 'open').map(p => ({ ...p, majority: Math.floor(Number(p.eligibleVoters) / 2) + 1 })))
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('authToken') || ''}` })
const bioChanged = computed(() => bio.value.trim() !== savedBio.value)
const filteredResidents = computed(() => {
  const query = search.value.toLocaleLowerCase()
  if (!query) return community.value?.residents || []
  return (community.value?.residents || []).filter(resident => `${resident.username} ${resident.roomID} ${resident.bio}`.toLocaleLowerCase().includes(query))
})

function initials(username: string) { return username.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?' }

async function loadCommunity() {
  loading.value = true; loadError.value = ''
  try {
    const response = await fetch(apiUrl('/api/community'), { headers: headers() })
    const data = await response.json()
    if (!response.ok) throw new Error(t('communityHub.loadError'))
    community.value = data
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

async function taskRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(apiUrl(path), { ...options, headers: headers() }); const data = await response.json()
  if (!response.ok) throw new Error(t('communityHub.tasksError')); return data
}
async function loadTaskGovernance() { try { const data = await taskRequest('/api/community/cleaning-tasks'); taskGovernance.tasks = data.tasks; taskGovernance.proposals = data.proposals } catch (error) { taskFailed.value = true; taskMessage.value = error instanceof Error ? error.message : t('communityHub.votesError') } }
async function performTaskAction(action: () => Promise<unknown>, success: string) { savingTask.value = true; taskMessage.value = ''; try { await action(); taskFailed.value = false; taskMessage.value = success; await loadTaskGovernance() } catch (error) { taskFailed.value = true; taskMessage.value = error instanceof Error ? error.message : t('communityHub.genericError') } finally { savingTask.value = false } }
async function submitNewTask() { await performTaskAction(() => taskRequest('/api/community/cleaning-tasks/proposals', { method: 'POST', body: JSON.stringify(taskForm) }), t('communityHub.proposalOpen')); if (!taskFailed.value) { Object.assign(taskForm, { title: '', description: '', isImportant: false }); showCreateForm.value = false } }
function beginChange(task: RotationTask) { editingTask.value = task; Object.assign(editForm, { title: task.title, description: task.description, isImportant: task.isImportant }); requestAnimationFrame(() => document.getElementById('task-votes')?.scrollIntoView({ behavior: 'smooth' })) }
async function submitChange() { if (!editingTask.value) return; await performTaskAction(() => taskRequest(`/api/community/cleaning-tasks/${editingTask.value!.templateID}/change`, { method: 'POST', body: JSON.stringify(editForm) }), t('communityHub.changeOpen')); if (!taskFailed.value) editingTask.value = null }
async function startRemoval(task: RotationTask) { await performTaskAction(() => taskRequest(`/api/community/cleaning-tasks/${task.templateID}/remove`, { method: 'POST' }), t('communityHub.removalOpen', { title: task.title })) }
async function vote(proposal: TaskProposal, choice: 'approve'|'reject') { await performTaskAction(() => taskRequest(`/api/community/cleaning-tasks/proposals/${proposal.proposalID}/vote`, { method: 'POST', body: JSON.stringify({ choice }) }), t('communityHub.voteRecorded')) }
async function cancelVote(proposal: TaskProposal) { await performTaskAction(() => taskRequest(`/api/community/cleaning-tasks/proposals/${proposal.proposalID}`, { method: 'DELETE' }), t('communityHub.voteCancelled')) }
function proposalLabel(proposal: TaskProposal) { return t(proposal.proposalType === 'add' ? 'communityHub.addRotation' : proposal.proposalType === 'remove' ? 'communityHub.removeRotation' : 'communityHub.chooseVersion') }

function refreshTaskVotes() { void loadTaskGovernance() }
onMounted(() => { void loadCommunity(); void loadTaskGovernance(); socket.on('cleaningTaskProposalsUpdated', refreshTaskVotes); if (location.hash === '#task-votes') setTimeout(() => document.getElementById('task-votes')?.scrollIntoView({ behavior: 'smooth' }), 100) })
onBeforeUnmount(() => socket.off('cleaningTaskProposalsUpdated', refreshTaskVotes))
</script>
