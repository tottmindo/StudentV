<template>
  <NavComponent :socket="socket" menu="home" class="fixed right-4 top-4" />
  <main class="mx-auto min-h-screen max-w-7xl space-y-6 px-4 py-20">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wider text-accent">Administration</p>
        <h1 class="text-3xl font-bold">{{ sectionTitle }}</h1>
      </div>
      <button v-if="activeSection" class="rounded-lg border border-border px-4 py-2 font-semibold" @click="activeSection = null">Back to administration</button>
    </header>

    <div v-if="!activeSection" class="grid gap-6 md:grid-cols-2">
      <button class="rounded-2xl bg-surface p-8 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark" @click="openSection('users')">
        <div class="text-4xl">👥</div>
        <h2 class="mt-5 text-2xl font-bold">User administration</h2>
        <p class="mt-2 opacity-75">Create accounts, reset passwords, and edit residents and administrators.</p>
      </button>
      <button class="rounded-2xl bg-surface p-8 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark" @click="openSection('sensors')">
        <div class="text-4xl">📡</div>
        <h2 class="mt-5 text-2xl font-bold">Sensor administration</h2>
        <p class="mt-2 opacity-75">Register sensors, inspect their latest data, and update their information.</p>
      </button>
    </div>

    <template v-else-if="activeSection === 'users'">
      <div class="grid gap-6 lg:grid-cols-2">
        <section class="rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark">
          <h2 class="text-2xl font-bold">Add a new user</h2>
          <p class="mt-2 text-sm opacity-75">Choose any dorm and room. A temporary password will be emailed to the user.</p>
          <form class="mt-6 space-y-4" @submit.prevent="createResident(false)">
            <input v-model.trim="email" type="email" required class="w-full rounded border border-border p-3" placeholder="resident@example.com" />
            <select v-model.number="dormID" required class="w-full rounded border border-border p-3"><option disabled value="">Select dorm</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select>
            <select v-model.number="roomID" required class="w-full rounded border border-border p-3"><option disabled value="">Select room</option><option v-for="room in selectedRooms(dormID)" :key="room" :value="room">Room {{ room }}</option></select>
            <select v-model="createRole" class="w-full rounded border border-border p-3"><option value="STUDENT">Student</option><option value="ADMIN">Administrator</option></select>
            <button :disabled="isSubmitting" class="w-full rounded-lg bg-accent p-3 font-semibold text-white disabled:opacity-50">{{ isSubmitting ? 'Creating and sending…' : 'Create account and send email' }}</button>
          </form>
          <p v-if="feedbackMessage" class="mt-4 text-center" :class="feedbackClass">{{ feedbackMessage }}</p>
        </section>

        <section class="rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark">
          <h2 class="text-2xl font-bold">Reset a resident password</h2>
          <p class="mt-2 text-sm opacity-75">This signs out existing sessions and emails a short temporary password.</p>
          <form class="mt-6 space-y-4" @submit.prevent="resetResidentPassword">
            <input v-model.trim="resetEmail" type="email" required class="w-full rounded border border-border p-3" placeholder="resident@example.com" />
            <select v-model.number="resetDormID" required class="w-full rounded border border-border p-3"><option disabled value="">Select dorm</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select>
            <button :disabled="isResetting" class="w-full rounded-lg bg-red-500 p-3 font-semibold text-white disabled:opacity-50">{{ isResetting ? 'Resetting and sending…' : 'Reset password' }}</button>
          </form>
          <p v-if="resetFeedback" class="mt-4 text-center" :class="resetFeedbackClass">{{ resetFeedback }}</p>
        </section>
      </div>

      <section class="rounded-2xl bg-surface p-6 shadow-lg dark:bg-surface-dark">
        <div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-2xl font-bold">Manage users</h2><p class="text-sm opacity-75">Edit users across every dorm.</p></div><select v-model="filterDorm" class="rounded border border-border p-2"><option value="all">All dorms</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="String(dorm.dormID)">{{ dormLabel(dorm) }}</option></select></div>
        <div class="mt-5 overflow-x-auto"><table class="w-full text-left text-sm"><thead><tr class="border-b border-border"><th class="p-3">Email / username</th><th class="p-3">Dorm / room</th><th class="p-3">Role</th><th class="p-3">Status</th><th class="p-3"></th></tr></thead><tbody><tr v-for="user in filteredUsers" :key="user.userID" class="border-b border-border/50"><td class="p-3"><div class="font-semibold">{{ user.email }}</div><div class="opacity-70">{{ user.username || 'Setup incomplete' }}</div></td><td class="p-3">{{ user.dormID }} / {{ user.roomID }}</td><td class="p-3">{{ user.role }}</td><td class="p-3">{{ user.active ? (user.mustChangePassword ? 'Temporary password' : 'Active') : 'Inactive' }}</td><td class="p-3"><button class="rounded bg-accent px-3 py-2 text-white" @click="startEdit(user)">Edit</button></td></tr></tbody></table></div>
      </section>
    </template>

    <template v-else>
      <section class="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-amber-400/50 bg-amber-50 p-6 shadow-lg dark:bg-amber-950/30">
        <div class="max-w-3xl">
          <h2 class="text-xl font-bold">Initial historical data import</h2>
          <p class="mt-1 text-sm opacity-80">Use this once after setting up the server and database. It imports all configured historical sensor data and may take several minutes.</p>
          <p v-if="historicalImportFeedback" class="mt-3 text-sm font-semibold" :class="historicalImportFeedbackClass">{{ historicalImportFeedback }}</p>
        </div>
        <button :disabled="isImportingHistory" class="rounded-lg bg-amber-600 px-5 py-3 font-semibold text-white disabled:opacity-50" @click="importHistoricalData">{{ isImportingHistory ? 'Importing historical data…' : 'Import all historical data' }}</button>
      </section>

      <section class="rounded-2xl bg-surface p-6 shadow-lg dark:bg-surface-dark">
        <h2 class="text-2xl font-bold">Register sensors</h2>
        <p class="mt-2 text-sm opacity-75">Paste one or many sensor IDs separated by spaces, commas, or new lines. The shared information is applied to every sensor.</p>
        <form class="mt-5 grid gap-4 lg:grid-cols-2" @submit.prevent="addSensors">
          <textarea v-model="newSensorCodes" required rows="7" class="rounded border border-border p-3 font-mono" placeholder="8c1f6461900015c1&#10;8c1f6461900015ed&#10;8c1f64619000170a"></textarea>
          <div class="space-y-4">
            <input v-model.trim="newSensorType" required class="w-full rounded border border-border p-3" placeholder="Sensor type" />
            <input v-model.trim="newSensorLocation" required class="w-full rounded border border-border p-3" placeholder="Location, e.g. basement utility room" />
            <select v-model.number="newSensorDormID" required class="w-full rounded border border-border p-3"><option disabled value="">Select dorm</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select>
            <button :disabled="isAddingSensors" class="w-full rounded-lg bg-accent p-3 font-semibold text-white disabled:opacity-50">{{ isAddingSensors ? 'Registering…' : `Register ${parsedSensorCodes.length || ''} sensor${parsedSensorCodes.length === 1 ? '' : 's'}` }}</button>
          </div>
        </form>
        <p v-if="sensorFeedback" class="mt-4" :class="sensorFeedbackClass">{{ sensorFeedback }}</p>
      </section>

      <section class="rounded-2xl bg-surface p-6 shadow-lg dark:bg-surface-dark">
        <div><h2 class="text-2xl font-bold">Registered sensors</h2><p class="text-sm opacity-75">Click any row to edit its sensor information. Click a column heading to sort.</p></div>
        <div class="mt-5 overflow-x-auto">
          <table class="w-full min-w-[1100px] text-left text-sm">
            <thead><tr class="border-b border-border"><th v-for="column in sensorColumns" :key="column.key" class="p-3"><button class="flex items-center gap-1 font-semibold" @click="sortSensors(column.key)">{{ column.label }} <span class="opacity-60">{{ sortIndicator(column.key) }}</span></button></th></tr></thead>
            <tbody>
              <tr v-for="sensor in sortedSensors" :key="sensor.sensorCode" tabindex="0" class="cursor-pointer border-b border-border/50 hover:bg-accent/10 focus:bg-accent/10" @click="startSensorEdit(sensor)" @keydown.enter="startSensorEdit(sensor)">
                <td class="p-3 font-mono">{{ sensor.sensorCode }}</td><td class="p-3">{{ sensor.type }}</td><td class="p-3">{{ sensor.location }}</td><td class="p-3">{{ dormName(sensor) }}</td><td class="p-3">{{ formatDate(sensor.recordedAt) }}</td><td class="p-3">{{ formatValue(sensor.totalVolume, ' L') }}</td><td class="p-3">{{ formatValue(sensor.ambientTemp, ' °C') }}</td><td class="p-3">{{ formatValue(sensor.humidity, ' %') }}</td><td class="p-3">{{ formatValue(sensor.battery, ' V') }}</td><td class="p-3">{{ sensor.leakStatus == null ? '—' : sensor.leakStatus ? 'Leak detected' : 'No leak' }}</td>
              </tr>
              <tr v-if="!sensors.length"><td :colspan="sensorColumns.length" class="p-8 text-center opacity-70">No sensors have been registered.</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <div v-if="pendingReplacement" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"><div class="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl dark:bg-surface-dark"><h2 class="text-xl font-bold">Room already occupied</h2><p class="mt-3">The room is currently assigned to {{ pendingReplacement.username || pendingReplacement.email }}.</p><div class="mt-6 flex justify-end gap-3"><button class="rounded border border-border px-4 py-2" @click="pendingReplacement = null">Cancel</button><button class="rounded bg-red-500 px-4 py-2 text-white" @click="confirmReplacement">Replace resident</button></div></div></div>
    <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"><form class="w-full max-w-lg space-y-4 rounded-lg bg-surface p-6 shadow-xl dark:bg-surface-dark" @submit.prevent="saveUser(false)"><h2 class="text-xl font-bold">Edit user</h2><input v-model.trim="editing.email" type="email" required class="w-full rounded border border-border p-3" /><input v-model.trim="editing.username" class="w-full rounded border border-border p-3" placeholder="Username (optional until setup)" /><div class="grid grid-cols-2 gap-3"><select v-model.number="editing.dormID" class="rounded border border-border p-3"><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select><select v-model.number="editing.roomID" class="rounded border border-border p-3"><option v-for="room in selectedRooms(editing.dormID)" :key="room" :value="room">Room {{ room }}</option></select></div><div class="grid grid-cols-2 gap-3"><select v-model="editing.role" class="rounded border border-border p-3"><option value="STUDENT">Student</option><option value="ADMIN">Administrator</option></select><label class="flex items-center gap-2 rounded border border-border p-3"><input v-model="editing.active" type="checkbox" /> Active</label></div><p v-if="editFeedback" class="text-red-500">{{ editFeedback }}</p><div class="flex justify-end gap-3"><button type="button" class="rounded border border-border px-4 py-2" @click="editing = null">Cancel</button><button :disabled="isSaving" class="rounded bg-accent px-4 py-2 text-white disabled:opacity-50">Save changes</button></div></form></div>
    <div v-if="editingSensor" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"><form class="w-full max-w-lg space-y-4 rounded-lg bg-surface p-6 shadow-xl dark:bg-surface-dark" @submit.prevent="saveSensor"><h2 class="text-xl font-bold">Edit sensor</h2><label class="block text-sm font-semibold">Sensor ID<input :value="editingSensor.sensorCode" readonly class="mt-1 w-full rounded border border-border bg-black/5 p-3 font-mono opacity-75" /></label><label class="block text-sm font-semibold">Type<input v-model.trim="editingSensor.type" required class="mt-1 w-full rounded border border-border p-3" /></label><label class="block text-sm font-semibold">Location<input v-model.trim="editingSensor.location" required class="mt-1 w-full rounded border border-border p-3" /></label><label class="block text-sm font-semibold">Dorm<select v-model.number="editingSensor.dormID" required class="mt-1 w-full rounded border border-border p-3"><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select></label><p v-if="editSensorFeedback" class="text-red-500">{{ editSensorFeedback }}</p><div class="flex justify-end gap-3"><button type="button" class="rounded border border-border px-4 py-2" @click="editingSensor = null">Cancel</button><button :disabled="isSavingSensor" class="rounded bg-accent px-4 py-2 text-white disabled:opacity-50">Save changes</button></div></form></div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import NavComponent from '@/components/NavComponent.vue'
import { getSocket } from '@/composables/socket'
import { apiUrl } from '@/composables/api'

type Dorm = { dormID: number; floor: number; address: string; rooms: number[] }
type User = { userID: number; email: string; username: string | null; dormID: number; roomID: number; role: 'STUDENT' | 'ADMIN'; active: boolean; mustChangePassword: boolean }
type Sensor = { sensorCode: string; type: string; location: string; dormID: number; dormAddress: string; dormFloor: number; recordedAt: string | null; totalVolume: number | null; tempMin: number | null; tempMax: number | null; errorCode: number | null; battery: number | null; ambientTemp: number | null; humidity: number | null; leakStatus: boolean | null }
type SensorSortKey = keyof Sensor

const socket = getSocket()
const activeSection = ref<'users' | 'sensors' | null>(null)
const dorms = ref<Dorm[]>([]), users = ref<User[]>([]), sensors = ref<Sensor[]>([])
const email = ref(''), dormID = ref<number | ''>(''), roomID = ref<number | ''>(''), createRole = ref<'STUDENT' | 'ADMIN'>('STUDENT'), filterDorm = ref('all')
const resetEmail = ref(''), resetDormID = ref<number | ''>(''), isSubmitting = ref(false), isResetting = ref(false), isSaving = ref(false)
const feedbackMessage = ref(''), feedbackClass = ref(''), resetFeedback = ref(''), resetFeedbackClass = ref(''), editFeedback = ref('')
const editing = ref<User | null>(null), pendingReplacement = ref<User | null>(null), replacementAction = ref<null | (() => Promise<void>)>(null)
const newSensorCodes = ref(''), newSensorType = ref('Water Meter'), newSensorLocation = ref(''), newSensorDormID = ref<number | ''>(''), isAddingSensors = ref(false)
const sensorFeedback = ref(''), sensorFeedbackClass = ref(''), editingSensor = ref<Sensor | null>(null), editSensorFeedback = ref(''), isSavingSensor = ref(false)
const isImportingHistory = ref(false), historicalImportFeedback = ref(''), historicalImportFeedbackClass = ref('')
const sensorSortKey = ref<SensorSortKey>('sensorCode'), sensorSortDirection = ref<1 | -1>(1)
const sensorColumns: { key: SensorSortKey; label: string }[] = [{ key: 'sensorCode', label: 'Sensor ID' }, { key: 'type', label: 'Type' }, { key: 'location', label: 'Location' }, { key: 'dormAddress', label: 'Dorm' }, { key: 'recordedAt', label: 'Latest reading' }, { key: 'totalVolume', label: 'Total volume' }, { key: 'ambientTemp', label: 'Ambient temp.' }, { key: 'humidity', label: 'Humidity' }, { key: 'battery', label: 'Battery' }, { key: 'leakStatus', label: 'Leak status' }]

const sectionTitle = computed(() => activeSection.value === 'users' ? 'User administration' : activeSection.value === 'sensors' ? 'Sensor administration' : 'Choose an administration area')
const parsedSensorCodes = computed(() => [...new Set(newSensorCodes.value.split(/[\s,;]+/).map(code => code.trim().toLowerCase()).filter(Boolean))])
const selectedRooms = (id: number | '') => dorms.value.find(dorm => dorm.dormID === Number(id))?.rooms || []
const dormLabel = (dorm: Dorm) => `${dorm.address}, floor ${dorm.floor}`
const dormName = (sensor: Sensor) => `${sensor.dormAddress}, floor ${sensor.dormFloor}`
const filteredUsers = computed(() => users.value.filter(user => filterDorm.value === 'all' || String(user.dormID) === filterDorm.value))
const sortedSensors = computed(() => [...sensors.value].sort((left, right) => {
  const a = left[sensorSortKey.value], b = right[sensorSortKey.value]
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }) * sensorSortDirection.value
}))

const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('authToken')}` })
async function loadDorms() { const response = await fetch(apiUrl('/api/auth/admin/dorms'), { headers: headers() }); if (!response.ok) throw new Error('Could not load dorms.'); dorms.value = await response.json() }
async function loadUsers() { const response = await fetch(apiUrl('/api/auth/admin/users'), { headers: headers() }); if (!response.ok) throw new Error('Could not load users.'); users.value = await response.json() }
async function loadSensors() { const response = await fetch(apiUrl('/api/sensor-data/admin/sensors'), { headers: headers() }); if (!response.ok) throw new Error('Could not load sensors.'); sensors.value = await response.json() }
async function openSection(section: 'users' | 'sensors') { activeSection.value = section; try { await (section === 'users' ? loadUsers() : loadSensors()) } catch (error) { sensorFeedback.value = error instanceof Error ? error.message : 'Could not load administration data.'; sensorFeedbackClass.value = 'text-red-500' } }
function sortSensors(key: SensorSortKey) { if (sensorSortKey.value === key) sensorSortDirection.value *= -1; else { sensorSortKey.value = key; sensorSortDirection.value = 1 } }
function sortIndicator(key: SensorSortKey) { return sensorSortKey.value === key ? (sensorSortDirection.value === 1 ? '▲' : '▼') : '↕' }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'No data' }
function formatValue(value: number | null, suffix: string) { return value == null ? '—' : `${Number(value).toLocaleString()}${suffix}` }

async function addSensors() { isAddingSensors.value = true; sensorFeedback.value = ''; try { const response = await fetch(apiUrl('/api/sensor-data/admin/sensors'), { method: 'POST', headers: headers(), body: JSON.stringify({ sensorCodes: parsedSensorCodes.value, type: newSensorType.value, location: newSensorLocation.value, dormID: newSensorDormID.value }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not add sensors.'); sensorFeedback.value = `${data.created.length} sensor(s) registered.${data.skipped.length ? ` ${data.skipped.length} already existed and were skipped.` : ''}`; sensorFeedbackClass.value = 'text-green-600'; newSensorCodes.value = ''; await loadSensors() } catch (error) { sensorFeedback.value = error instanceof Error ? error.message : 'Could not add sensors.'; sensorFeedbackClass.value = 'text-red-500' } finally { isAddingSensors.value = false } }
async function importHistoricalData() { if (!confirm('Resume importing historical sensor data? The server will continue from shortly before the newest stored reading.')) return; isImportingHistory.value = true; historicalImportFeedback.value = 'Starting or reconnecting to the historical import…'; historicalImportFeedbackClass.value = ''; try { const response = await fetch(apiUrl('/api/sensor-data/admin/import-historical'), { method: 'POST', headers: headers() }); const data = await response.json(); if (!response.ok && response.status !== 409) throw new Error(data.error || 'Could not start historical sensor import.'); while (true) { const statusResponse = await fetch(apiUrl('/api/sensor-data/admin/import-historical'), { headers: headers() }); const statusData = await statusResponse.json(); if (!statusResponse.ok) throw new Error(statusData.error || 'Could not read import progress. Sign in again to reconnect; the server import will continue.'); const job = statusData.job; const progress = job.progress; if (progress) historicalImportFeedback.value = `Importing batch ${progress.batchesCompleted} of ${progress.totalBatches} from ${formatDate(new Date(progress.startedFrom * 1000).toISOString())} — ${progress.snapshots} snapshots processed${progress.retries ? `, ${progress.retries} retries` : ''}.`; if (job.status === 'completed') { historicalImportFeedback.value = `Import complete: ${progress.snapshots} snapshots processed across ${progress.totalBatches} batches.`; historicalImportFeedbackClass.value = 'text-green-700 dark:text-green-400'; await loadSensors(); break } if (job.status === 'failed') throw new Error(job.error || 'Historical sensor import failed.'); await new Promise(resolve => setTimeout(resolve, 2000)) } } catch (error) { historicalImportFeedback.value = error instanceof Error ? error.message : 'Could not import historical sensor data.'; historicalImportFeedbackClass.value = 'text-red-600' } finally { isImportingHistory.value = false } }
function startSensorEdit(sensor: Sensor) { editingSensor.value = { ...sensor }; editSensorFeedback.value = '' }
async function saveSensor() { if (!editingSensor.value) return; isSavingSensor.value = true; editSensorFeedback.value = ''; try { const response = await fetch(apiUrl(`/api/sensor-data/admin/sensors/${encodeURIComponent(editingSensor.value.sensorCode)}`), { method: 'PATCH', headers: headers(), body: JSON.stringify({ type: editingSensor.value.type, location: editingSensor.value.location, dormID: editingSensor.value.dormID }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not update sensor.'); editingSensor.value = null; await loadSensors() } catch (error) { editSensorFeedback.value = error instanceof Error ? error.message : 'Could not update sensor.' } finally { isSavingSensor.value = false } }

async function createResident(replaceExisting: boolean) { isSubmitting.value = true; try { const response = await fetch(apiUrl('/api/auth/residents'), { method: 'POST', headers: headers(), body: JSON.stringify({ email: email.value, dormID: dormID.value, roomID: roomID.value, role: createRole.value, replaceExisting }) }); const data = await response.json(); if (!response.ok) { if (response.status === 409 && data.code === 'ROOM_OCCUPIED') { pendingReplacement.value = data.existingUser; replacementAction.value = () => createResident(true); return } throw new Error(data.error || 'Failed to create account.') } feedbackMessage.value = `Account created and emailed to ${data.email}.`; feedbackClass.value = 'text-green-600'; email.value = ''; createRole.value = 'STUDENT'; await loadUsers() } catch (error) { feedbackMessage.value = error instanceof Error ? error.message : 'Could not create user.'; feedbackClass.value = 'text-red-500' } finally { isSubmitting.value = false } }
async function resetResidentPassword() { if (!confirm(`Reset the password for ${resetEmail.value}?`)) return; isResetting.value = true; try { const response = await fetch(apiUrl('/api/auth/admin/reset-resident-password'), { method: 'POST', headers: headers(), body: JSON.stringify({ email: resetEmail.value, dormID: resetDormID.value }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); resetFeedback.value = data.message; resetFeedbackClass.value = 'text-green-600'; resetEmail.value = ''; await loadUsers() } catch (error) { resetFeedback.value = error instanceof Error ? error.message : 'Could not reset password.'; resetFeedbackClass.value = 'text-red-500' } finally { isResetting.value = false } }
function startEdit(user: User) { editing.value = { ...user }; editFeedback.value = '' }
async function saveUser(replaceExisting: boolean) { if (!editing.value) return; isSaving.value = true; editFeedback.value = ''; try { const payload = { ...editing.value, username: editing.value.username?.trim() || null, replaceExisting }; const response = await fetch(apiUrl(`/api/auth/admin/users/${editing.value.userID}`), { method: 'PATCH', headers: headers(), body: JSON.stringify(payload) }); const data = await response.json(); if (!response.ok) { if (response.status === 409 && data.code === 'ROOM_OCCUPIED') { pendingReplacement.value = data.existingUser; replacementAction.value = () => saveUser(true); return } throw new Error(data.error || 'Could not update user.') } editing.value = null; await loadUsers() } catch (error) { editFeedback.value = error instanceof Error ? error.message : 'Could not update user.' } finally { isSaving.value = false } }
async function confirmReplacement() { const action = replacementAction.value; pendingReplacement.value = null; replacementAction.value = null; if (action) await action() }

watch(() => editing.value?.dormID, () => { if (editing.value && !selectedRooms(editing.value.dormID).includes(editing.value.roomID)) editing.value.roomID = selectedRooms(editing.value.dormID)[0] })
onMounted(() => loadDorms().catch(error => { feedbackMessage.value = error.message; feedbackClass.value = 'text-red-500' }))
</script>
