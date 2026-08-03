<template>
  <NavComponent :socket="socket" menu="home" class="fixed right-4 top-4" />
  <main class="mx-auto min-h-screen max-w-6xl space-y-6 px-4 py-20">
    <div class="grid gap-6 lg:grid-cols-2">
      <section class="rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark">
        <h1 class="text-2xl font-bold">Add a new user</h1>
        <p class="mt-2 text-sm opacity-75">Choose any dorm and room. A temporary password will be emailed to the user.</p>
        <form class="mt-6 space-y-4" @submit.prevent="createResident(false)">
          <input v-model.trim="email" type="email" required class="w-full rounded border border-border p-3" placeholder="resident@example.com" />
          <select v-model.number="dormID" required class="w-full rounded border border-border p-3">
            <option disabled value="">Select dorm</option>
            <option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option>
          </select>
          <select v-model.number="roomID" required class="w-full rounded border border-border p-3">
            <option disabled value="">Select room</option>
            <option v-for="room in selectedRooms(dormID)" :key="room" :value="room">Room {{ room }}</option>
          </select>
          <select v-model="createRole" class="w-full rounded border border-border p-3"><option value="STUDENT">Student</option><option value="ADMIN">Administrator</option></select>
          <button :disabled="isSubmitting" class="w-full rounded-lg bg-accent p-3 font-semibold text-white disabled:opacity-50">
            {{ isSubmitting ? 'Creating and sending…' : 'Create account and send email' }}
          </button>
        </form>
        <p v-if="feedbackMessage" class="mt-4 text-center" :class="feedbackClass">{{ feedbackMessage }}</p>
      </section>

      <section class="rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark">
        <h2 class="text-2xl font-bold">Reset a resident password</h2>
        <p class="mt-2 text-sm opacity-75">This signs out existing sessions and emails a short temporary password.</p>
        <form class="mt-6 space-y-4" @submit.prevent="resetResidentPassword">
          <input v-model.trim="resetEmail" type="email" required class="w-full rounded border border-border p-3" placeholder="resident@example.com" />
          <select v-model.number="resetDormID" required class="w-full rounded border border-border p-3">
            <option disabled value="">Select dorm</option>
            <option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option>
          </select>
          <button :disabled="isResetting" class="w-full rounded-lg bg-red-500 p-3 font-semibold text-white disabled:opacity-50">
            {{ isResetting ? 'Resetting and sending…' : 'Reset password' }}
          </button>
        </form>
        <p v-if="resetFeedback" class="mt-4 text-center" :class="resetFeedbackClass">{{ resetFeedback }}</p>
      </section>
    </div>

    <section class="rounded-2xl bg-surface p-6 shadow-lg dark:bg-surface-dark">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div><h2 class="text-2xl font-bold">Manage users</h2><p class="text-sm opacity-75">Edit users across every dorm.</p></div>
        <select v-model="filterDorm" class="rounded border border-border p-2"><option value="all">All dorms</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="String(dorm.dormID)">{{ dormLabel(dorm) }}</option></select>
      </div>
      <div class="mt-5 overflow-x-auto">
        <table class="w-full text-left text-sm"><thead><tr class="border-b border-border"><th class="p-3">Email / username</th><th class="p-3">Dorm / room</th><th class="p-3">Role</th><th class="p-3">Status</th><th class="p-3"></th></tr></thead>
          <tbody><tr v-for="user in filteredUsers" :key="user.userID" class="border-b border-border/50">
            <td class="p-3"><div class="font-semibold">{{ user.email }}</div><div class="opacity-70">{{ user.username || 'Setup incomplete' }}</div></td>
            <td class="p-3">{{ user.dormID }} / {{ user.roomID }}</td><td class="p-3">{{ user.role }}</td>
            <td class="p-3">{{ user.active ? (user.mustChangePassword ? 'Temporary password' : 'Active') : 'Inactive' }}</td>
            <td class="p-3"><button class="rounded bg-accent px-3 py-2 text-white" @click="startEdit(user)">Edit</button></td>
          </tr></tbody>
        </table>
      </div>
    </section>

    <div v-if="pendingReplacement" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div class="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl dark:bg-surface-dark">
        <h2 class="text-xl font-bold">Room already occupied</h2><p class="mt-3">The room is currently assigned to {{ pendingReplacement.username || pendingReplacement.email }}.</p>
        <div class="mt-6 flex justify-end gap-3"><button class="rounded border border-border px-4 py-2" @click="pendingReplacement = null">Cancel</button><button class="rounded bg-accent px-4 py-2 text-white" @click="confirmReplacement">Replace user</button></div>
      </div>
    </div>

    <div v-if="editing" class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
      <form class="w-full max-w-lg space-y-4 rounded-lg bg-surface p-6 shadow-xl dark:bg-surface-dark" @submit.prevent="saveUser(false)">
        <h2 class="text-xl font-bold">Edit user</h2>
        <input v-model.trim="editing.email" type="email" required class="w-full rounded border border-border p-3" />
        <input v-model.trim="editing.username" class="w-full rounded border border-border p-3" placeholder="Public username (optional)" />
        <div class="grid grid-cols-2 gap-3"><select v-model.number="editing.dormID" class="rounded border border-border p-3"><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select><select v-model.number="editing.roomID" class="rounded border border-border p-3"><option v-for="room in selectedRooms(editing.dormID)" :key="room" :value="room">Room {{ room }}</option></select></div>
        <select v-model="editing.role" class="w-full rounded border border-border p-3"><option value="STUDENT">Student</option><option value="ADMIN">Administrator</option></select>
        <label class="flex items-center gap-2"><input v-model="editing.active" type="checkbox" /> Active account</label>
        <p v-if="editFeedback" class="text-red-500">{{ editFeedback }}</p>
        <div class="flex justify-end gap-3"><button type="button" class="rounded border border-border px-4 py-2" @click="editing = null">Cancel</button><button :disabled="isSaving" class="rounded bg-accent px-4 py-2 text-white disabled:opacity-50">{{ isSaving ? 'Saving…' : 'Save user' }}</button></div>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import NavComponent from '@/components/NavComponent.vue'
import { apiUrl } from '@/composables/api'
import { getSocket } from '@/composables/socket'

type Dorm = { dormID: number; dormName?: string; rooms: number[] }
type User = { userID: number; email: string; username: string | null; role: 'ADMIN' | 'STUDENT'; dormID: number; roomID: number; active: boolean; mustChangePassword: boolean }
const socket = getSocket(), dorms = ref<Dorm[]>([]), users = ref<User[]>([]), filterDorm = ref('all')
const email = ref(''), dormID = ref<number | ''>(''), roomID = ref<number | ''>(''), createRole = ref<'ADMIN' | 'STUDENT'>('STUDENT'), resetEmail = ref(''), resetDormID = ref<number | ''>('')
const isSubmitting = ref(false), isResetting = ref(false), isSaving = ref(false)
const feedbackMessage = ref(''), feedbackClass = ref(''), resetFeedback = ref(''), resetFeedbackClass = ref(''), editFeedback = ref('')
const editing = ref<User | null>(null), pendingReplacement = ref<null | { email: string; username?: string }>(null), replacementAction = ref<null | (() => Promise<void>)>(null)
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('authToken') || ''}` })
const dormLabel = (d: Dorm) => d.dormName ? `${d.dormName} (${d.dormID})` : `Dorm ${d.dormID}`
const selectedRooms = (id: number | '') => dorms.value.find(d => d.dormID === Number(id))?.rooms || []
const filteredUsers = computed(() => users.value.filter(u => filterDorm.value === 'all' || String(u.dormID) === filterDorm.value))
watch(dormID, () => { roomID.value = '' })
watch(() => editing.value?.dormID, () => { if (editing.value && !selectedRooms(editing.value.dormID).includes(editing.value.roomID)) editing.value.roomID = selectedRooms(editing.value.dormID)[0] })

async function loadAdminData() { const [d, u] = await Promise.all([fetch(apiUrl('/api/auth/admin/dorms'), { headers: headers() }), fetch(apiUrl('/api/auth/admin/users'), { headers: headers() })]); if (!d.ok || !u.ok) throw new Error('Could not load administration data.'); dorms.value = await d.json(); users.value = await u.json() }
onMounted(() => loadAdminData().catch(e => { feedbackMessage.value = e.message; feedbackClass.value = 'text-red-500' }))
async function createResident(replaceExisting: boolean) { isSubmitting.value = true; try { const r = await fetch(apiUrl('/api/auth/residents'), { method: 'POST', headers: headers(), body: JSON.stringify({ email: email.value, dormID: dormID.value, roomID: roomID.value, role: createRole.value, replaceExisting }) }); const data = await r.json(); if (!r.ok) { if (r.status === 409 && data.code === 'ROOM_OCCUPIED') { pendingReplacement.value = data.existingUser; replacementAction.value = () => createResident(true); return } throw new Error(data.error || 'Failed to create account.') } feedbackMessage.value = `Account created and emailed to ${data.email}.`; feedbackClass.value = 'text-green-600'; email.value = ''; createRole.value = 'STUDENT'; await loadAdminData() } catch (e) { feedbackMessage.value = e instanceof Error ? e.message : 'Please try again.'; feedbackClass.value = 'text-red-500' } finally { isSubmitting.value = false } }
async function resetResidentPassword() { if (!confirm(`Reset the password for ${resetEmail.value}?`)) return; isResetting.value = true; try { const r = await fetch(apiUrl('/api/auth/admin/reset-resident-password'), { method: 'POST', headers: headers(), body: JSON.stringify({ email: resetEmail.value, dormID: resetDormID.value }) }); const data = await r.json(); if (!r.ok) throw new Error(data.error); resetFeedback.value = data.message; resetFeedbackClass.value = 'text-green-600'; resetEmail.value = ''; await loadAdminData() } catch (e) { resetFeedback.value = e instanceof Error ? e.message : 'Could not reset password.'; resetFeedbackClass.value = 'text-red-500' } finally { isResetting.value = false } }
function startEdit(user: User) { editing.value = { ...user }; editFeedback.value = '' }
async function saveUser(replaceExisting: boolean) { if (!editing.value) return; isSaving.value = true; editFeedback.value = ''; try { const payload = { ...editing.value, username: editing.value.username?.trim() || null, replaceExisting }; const r = await fetch(apiUrl(`/api/auth/admin/users/${editing.value.userID}`), { method: 'PATCH', headers: headers(), body: JSON.stringify(payload) }); const data = await r.json(); if (!r.ok) { if (r.status === 409 && data.code === 'ROOM_OCCUPIED') { pendingReplacement.value = data.existingUser; replacementAction.value = () => saveUser(true); return } throw new Error(data.error || 'Could not update user.') } editing.value = null; await loadAdminData() } catch (e) { editFeedback.value = e instanceof Error ? e.message : 'Could not update user.' } finally { isSaving.value = false } }
async function confirmReplacement() { const action = replacementAction.value; pendingReplacement.value = null; replacementAction.value = null; if (action) await action() }
</script>
