<template>
  <main class="mx-auto min-h-screen max-w-7xl space-y-6 px-4 py-6">
    <header v-if="activeSection" class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ sectionTitle }}</h1>
      </div>
      <button class="rounded-lg border border-border px-4 py-2 font-semibold" @click="activeSection = null">{{ t('adminMain.back') }}</button>
    </header>

    <div v-if="isResearcher" class="grid gap-6 md:grid-cols-2">
      <router-link to="/admin/water-analytics" class="rounded-2xl bg-surface p-8 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark"><div class="text-4xl">📊</div><h2 class="mt-5 text-2xl font-bold">{{ t('nav.waterAnalytics') }}</h2><p class="mt-2 opacity-75">{{ t('adminMain.waterHelp') }}</p></router-link>
      <router-link to="/survey" class="rounded-2xl bg-surface p-8 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark"><div class="text-4xl">≡</div><h2 class="mt-5 text-2xl font-bold">{{ t('nav.surveys') }}</h2><p class="mt-2 opacity-75">{{ t('topbar.surveyDescription') }}</p></router-link>
      <router-link to="/admin/app-usage" class="rounded-2xl bg-surface p-8 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark"><div class="text-4xl">📈</div><h2 class="mt-5 text-2xl font-bold">{{ t('usageAdmin.title') }}</h2><p class="mt-2 opacity-75">{{ t('adminMain.usageHelp') }}</p></router-link>
    </div>
    <div v-else-if="!activeSection" class="grid gap-6 md:grid-cols-2">
      <router-link to="/admin/water-analytics" class="rounded-2xl bg-surface p-8 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark">
        <div class="text-4xl">📊</div>
        <h2 class="mt-5 text-2xl font-bold">{{ t('nav.waterAnalytics') }}</h2>
        <p class="mt-2 opacity-75">{{ t('adminMain.waterHelp') }}</p>
      </router-link>
      <router-link to="/admin/app-usage" class="rounded-2xl bg-surface p-8 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark">
        <div class="text-4xl">📈</div>
        <h2 class="mt-5 text-2xl font-bold">{{ t('usageAdmin.title') }}</h2>
        <p class="mt-2 opacity-75">{{ t('adminMain.usageHelp') }}</p>
      </router-link>
      <router-link to="/admin/events" class="rounded-2xl bg-surface p-8 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark">
        <div class="text-4xl">📅</div>
        <h2 class="mt-5 text-2xl font-bold">{{ t('adminEvents.title') }}</h2>
        <p class="mt-2 opacity-75">{{ t('adminEvents.cardHelp') }}</p>
      </router-link>
      <button class="rounded-2xl bg-surface p-8 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark" @click="openSection('users')">
        <div class="text-4xl">👥</div>
        <h2 class="mt-5 text-2xl font-bold">{{ t('adminMain.users') }}</h2>
        <p class="mt-2 opacity-75">{{ t('adminMain.usersHelp') }}</p>
      </button>
      <button class="rounded-2xl bg-surface p-8 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark" @click="openSection('sensors')">
        <div class="text-4xl">📡</div>
        <h2 class="mt-5 text-2xl font-bold">{{ t('adminMain.sensors') }}</h2>
        <p class="mt-2 opacity-75">{{ t('adminMain.sensorsHelp') }}</p>
      </button>
      <button class="rounded-2xl bg-surface p-8 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark" @click="openSection('buildings')">
        <div class="text-4xl">🏠</div>
        <h2 class="mt-5 text-2xl font-bold">{{ t('adminMain.buildings') }}</h2>
        <p class="mt-2 opacity-75">{{ t('adminMain.buildingsHelp') }}</p>
      </button>
    </div>

    <template v-else-if="activeSection === 'users'">
      <div class="grid gap-6 lg:grid-cols-2">
        <section class="rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark">
          <h2 class="text-2xl font-bold">{{ t('adminMain.addUser') }}</h2>
          <p class="mt-2 text-sm opacity-75">{{ t('adminMain.addUserHelp') }}</p>
          <form class="mt-6 space-y-4" @submit.prevent="createResident(false)">
            <input v-model.trim="email" type="email" required class="w-full rounded border border-border p-3" placeholder="resident@example.com" />
            <select v-if="createRole === 'STUDENT'" v-model.number="dormID" required class="w-full rounded border border-border p-3"><option disabled value="">{{ t('adminMain.selectDorm') }}</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select>
            <select v-if="createRole === 'STUDENT'" v-model.number="roomID" required class="w-full rounded border border-border p-3"><option disabled value="">{{ t('adminMain.selectRoom') }}</option><option v-for="room in selectedRooms(dormID)" :key="room" :value="room">{{ t('adminMain.room', { room }) }}</option></select>
            <select v-model="createRole" class="w-full rounded border border-border p-3"><option value="STUDENT">{{ t('adminMain.student') }}</option><option value="RESEARCHER">{{ t('adminMain.researcher') }}</option><option value="ADMIN">{{ t('adminMain.administrator') }}</option></select>
            <button :disabled="isSubmitting" class="w-full rounded-lg bg-accent p-3 font-semibold text-white disabled:opacity-50">{{ t(isSubmitting ? 'adminMain.creating' : 'adminMain.createAccount') }}</button>
          </form>
          <p v-if="feedbackMessage" class="mt-4 text-center" :class="feedbackClass">{{ feedbackMessage }}</p>
        </section>

        <section class="rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark">
          <h2 class="text-2xl font-bold">{{ t('adminMain.resetTitle') }}</h2>
          <p class="mt-2 text-sm opacity-75">{{ t('adminMain.resetHelp') }}</p>
          <form class="mt-6 space-y-4" @submit.prevent="resetResidentPassword">
            <input v-model.trim="resetEmail" type="email" required class="w-full rounded border border-border p-3" placeholder="resident@example.com" />
            <select v-model.number="resetDormID" required class="w-full rounded border border-border p-3"><option disabled value="">{{ t('adminMain.selectDorm') }}</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select>
            <button :disabled="isResetting" class="w-full rounded-lg bg-red-500 p-3 font-semibold text-white disabled:opacity-50">{{ t(isResetting ? 'adminMain.resetting' : 'adminMain.reset') }}</button>
          </form>
          <p v-if="resetFeedback" class="mt-4 text-center" :class="resetFeedbackClass">{{ resetFeedback }}</p>
        </section>
      </div>

      <section class="rounded-2xl bg-surface p-6 shadow-lg dark:bg-surface-dark">
        <div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-2xl font-bold">{{ t('adminMain.manageUsers') }}</h2><p class="text-sm opacity-75">{{ t('adminMain.manageUsersHelp') }}</p></div><select v-model="filterDorm" class="rounded border border-border p-2"><option value="all">{{ t('adminMain.allDorms') }}</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="String(dorm.dormID)">{{ dormLabel(dorm) }}</option></select></div>
        <div class="mt-5 max-h-[32rem] overflow-auto rounded-lg border border-border/60"><table class="w-full text-left text-sm"><thead class="sticky top-0 z-10 bg-surface shadow-sm dark:bg-surface-dark"><tr class="border-b border-border"><th class="p-3">{{ t('adminMain.emailUsername') }}</th><th class="p-3">{{ t('adminMain.dormRoom') }}</th><th class="p-3">{{ t('adminMain.role') }}</th><th class="p-3">{{ t('adminMain.status') }}</th><th class="p-3"></th></tr></thead><tbody><tr v-for="user in filteredUsers" :key="user.userID" class="border-b border-border/50"><td class="p-3"><div class="font-semibold">{{ user.email }}</div><div class="opacity-70">{{ user.username || t('adminMain.setupIncomplete') }}</div></td><td class="p-3">{{ user.role === 'ADMIN' ? t('adminMain.globalAccess') : `${user.dormID} / ${user.roomID}` }}</td><td class="p-3">{{ t(user.role === 'ADMIN' ? 'adminMain.administrator' : 'adminMain.student') }}</td><td class="p-3">{{ user.active ? (user.mustChangePassword ? t('adminMain.temporaryPassword') : t('common.active')) : t('common.inactive') }}</td><td class="p-3"><button class="rounded bg-accent px-3 py-2 text-white" @click="startEdit(user)">{{ t('adminMain.edit') }}</button></td></tr></tbody></table></div>
      </section>

      <section class="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-surface p-6 shadow-lg dark:bg-surface-dark">
        <div class="max-w-3xl"><h2 class="text-xl font-bold">{{ t('adminMain.schedule') }}</h2><p class="mt-1 text-sm opacity-75">{{ t('adminMain.scheduleHelp') }}</p><p v-if="cleaningFeedback" class="mt-3 text-sm font-semibold" :class="cleaningFeedbackClass">{{ cleaningFeedback }}</p></div>
        <button :disabled="isGeneratingCleaning" class="rounded-lg bg-accent px-5 py-3 font-semibold text-white disabled:opacity-50" @click="generateCleaningSchedule">{{ t(isGeneratingCleaning ? 'adminMain.checkingSchedule' : 'adminMain.generateWeeks') }}</button>
      </section>
    </template>

    <template v-else-if="activeSection === 'buildings'">
      <div class="grid gap-6 lg:grid-cols-2">
        <section class="rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark">
          <h2 class="text-2xl font-bold">{{ t('adminMain.addFloor') }}</h2>
          <p class="mt-2 text-sm opacity-75">{{ t('adminMain.addFloorHelp') }}</p>
          <form class="mt-6 space-y-4" @submit.prevent="createFloor">
            <input v-model.trim="newAddress" required inputmode="numeric" pattern="[0-9]+" maxlength="255" class="w-full rounded border border-border p-3" :placeholder="t('adminMain.addressPlaceholder')" />
            <input v-model.number="newFloor" required type="number" min="-10" max="200" class="w-full rounded border border-border p-3" :placeholder="t('adminMain.floorNumber')" />
            <textarea v-model="newFloorRooms" required rows="4" class="w-full rounded border border-border p-3" :placeholder="t('adminMain.roomsPlaceholder')"></textarea>
            <p class="text-xs opacity-65">{{ t('adminMain.generalChatAutomation') }}</p>
            <button :disabled="isSavingBuilding || !parsedFloorRooms.length" class="w-full rounded-lg bg-accent p-3 font-semibold text-white disabled:opacity-50">{{ t(isSavingBuilding ? 'adminMain.savingBuilding' : 'adminMain.createFloor') }}</button>
          </form>
        </section>

        <section class="rounded-2xl bg-surface p-8 shadow-lg dark:bg-surface-dark">
          <h2 class="text-2xl font-bold">{{ t('adminMain.addRooms') }}</h2>
          <p class="mt-2 text-sm opacity-75">{{ t('adminMain.addRoomsHelp') }}</p>
          <form class="mt-6 space-y-4" @submit.prevent="addRooms">
            <select v-model.number="roomDormID" required class="w-full rounded border border-border p-3"><option disabled value="">{{ t('adminMain.selectDorm') }}</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select>
            <textarea v-model="newRooms" required rows="4" class="w-full rounded border border-border p-3" :placeholder="t('adminMain.roomsPlaceholder')"></textarea>
            <button :disabled="isSavingBuilding || !parsedNewRooms.length" class="w-full rounded-lg bg-accent p-3 font-semibold text-white disabled:opacity-50">{{ t(isSavingBuilding ? 'adminMain.savingBuilding' : 'adminMain.addRoomsAction') }}</button>
          </form>
        </section>
      </div>

      <p v-if="buildingFeedback" class="rounded-lg bg-surface p-4 font-semibold shadow dark:bg-surface-dark" :class="buildingFeedbackClass">{{ buildingFeedback }}</p>

      <section class="rounded-2xl bg-surface p-6 shadow-lg dark:bg-surface-dark">
        <h2 class="text-2xl font-bold">{{ t('adminMain.housesAndFloors') }}</h2>
        <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="dorm in dorms" :key="dorm.dormID" class="rounded-xl border border-border p-4">
            <h3 class="font-bold">{{ t('common.houseLabel', { house: dorm.address }) }}</h3>
            <p class="mt-1 opacity-75">{{ t('survey.floor', { floor: dorm.floor }) }}</p>
            <p class="mt-3 text-sm">{{ t('adminMain.roomCount', { count: dorm.rooms.length }) }}</p>
            <p class="mt-1 break-words text-sm opacity-65">{{ dorm.rooms.join(', ') || '—' }}</p>
          </article>
        </div>
      </section>
    </template>

    <template v-else>
      <section class="rounded-2xl bg-surface p-6 shadow-lg dark:bg-surface-dark">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div><h2 class="text-2xl font-bold">{{ t('adminMain.registeredSensors') }}</h2><p class="text-sm opacity-75">{{ t('adminMain.registeredHelp') }}</p></div>
          <div class="flex flex-wrap gap-3">
            <label class="text-sm font-semibold">{{ t('adminMain.house') }}<select v-model="sensorHouseFilter" class="mt-1 block min-w-44 rounded border border-border p-2 font-normal"><option value="all">{{ t('adminMain.allHouses') }}</option><option v-for="house in sensorHouses" :key="house" :value="house">{{ t('common.houseLabel', { house }) }}</option></select></label>
            <label class="text-sm font-semibold">{{ t('adminMain.floor') }}<select v-model="sensorFloorFilter" class="mt-1 block min-w-32 rounded border border-border p-2 font-normal"><option value="all">{{ t('adminMain.allFloors') }}</option><option v-for="floor in sensorFloors" :key="floor" :value="String(floor)">{{ t('survey.floor', { floor }) }}</option></select></label>
          </div>
        </div>
        <div class="mt-5 max-h-[32rem] overflow-auto rounded-lg border border-border/60">
          <table class="w-full min-w-[900px] text-left text-sm">
            <thead class="sticky top-0 z-10 bg-surface shadow-sm dark:bg-surface-dark"><tr class="border-b border-border"><th v-for="column in sensorColumns" :key="column.key" class="p-3"><button class="flex items-center gap-1 font-semibold" @click="sortSensors(column.key)">{{ column.label }} <span class="opacity-60">{{ sortIndicator(column.key) }}</span></button></th></tr></thead>
            <tbody>
              <tr v-for="sensor in sortedSensors" :key="sensor.sensorCode" tabindex="0" class="cursor-pointer border-b border-border/50 hover:bg-accent/10 focus:bg-accent/10" @click="startSensorEdit(sensor)" @keydown.enter="startSensorEdit(sensor)">
                <td class="p-3 font-mono">{{ sensor.sensorCode }}</td><td class="p-3">{{ sensor.type }}</td><td class="p-3">{{ sensor.location }}</td><td class="p-3">{{ dormName(sensor) }}</td><td class="p-3">{{ formatDate(sensor.recordedAt) }}</td><td class="p-3"><span class="rounded-full px-2 py-1 text-xs font-bold" :class="sensorStatus(sensor).class">{{ sensorStatus(sensor).label }}</span></td><td class="max-w-xs p-3"><p class="line-clamp-2">{{ sensor.adminNote || t('adminMain.noNote') }}</p><p v-if="sensor.noteUpdatedAt" class="mt-1 text-xs opacity-50">{{ t('adminMain.updated', { date: formatDate(sensor.noteUpdatedAt) }) }}</p></td>
              </tr>
              <tr v-if="!sortedSensors.length"><td :colspan="sensorColumns.length" class="p-8 text-center opacity-70">{{ t(sensors.length ? 'adminMain.noSensorMatch' : 'adminMain.noSensors') }}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-2xl bg-surface p-6 shadow-lg dark:bg-surface-dark">
        <h2 class="text-2xl font-bold">{{ t('adminMain.registerSensors') }}</h2>
        <p class="mt-2 text-sm opacity-75">{{ t('adminMain.registerHelp') }}</p>
        <form class="mt-5 grid gap-4 lg:grid-cols-2" @submit.prevent="addSensors">
          <textarea v-model="newSensorCodes" required rows="7" class="rounded border border-border p-3 font-mono" placeholder="8c1f6461900015c1&#10;8c1f6461900015ed&#10;8c1f64619000170a"></textarea>
          <div class="space-y-4">
            <input v-model.trim="newSensorType" required class="w-full rounded border border-border p-3" :placeholder="t('adminMain.sensorType')" />
            <input v-model.trim="newSensorLocation" required class="w-full rounded border border-border p-3" :placeholder="t('adminMain.locationPlaceholder')" />
            <select v-model.number="newSensorDormID" required class="w-full rounded border border-border p-3"><option disabled value="">{{ t('adminMain.selectDorm') }}</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select>
            <button :disabled="isAddingSensors" class="w-full rounded-lg bg-accent p-3 font-semibold text-white disabled:opacity-50">{{ t(isAddingSensors ? 'adminMain.registering' : 'adminMain.registerCount', { count: parsedSensorCodes.length || '' }) }}</button>
          </div>
        </form>
        <p v-if="sensorFeedback" class="mt-4" :class="sensorFeedbackClass">{{ sensorFeedback }}</p>
      </section>

      <section class="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-red-400/60 bg-red-50 p-6 shadow-lg dark:bg-red-950/30">
        <div class="max-w-3xl">
          <h2 class="text-xl font-bold text-red-800 dark:text-red-300">{{ t('adminMain.recovery') }}</h2>
          <p class="mt-1 text-sm font-semibold">{{ t('adminMain.recoveryWarning') }}</p>
          <p class="mt-1 text-sm opacity-80">{{ t('adminMain.recoveryHelp') }}</p>
          <p v-if="historicalImportFeedback" class="mt-3 text-sm font-semibold" :class="historicalImportFeedbackClass">{{ historicalImportFeedback }}</p>
        </div>
        <button :disabled="isImportingHistory" class="rounded-lg bg-red-700 px-5 py-3 font-semibold text-white disabled:opacity-50" @click="importHistoricalData">{{ t(isImportingHistory ? 'adminMain.importing' : 'adminMain.importAll') }}</button>
      </section>
    </template>

    <div v-if="pendingReplacement" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"><div class="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl dark:bg-surface-dark"><h2 class="text-xl font-bold">{{ t('adminMain.occupied') }}</h2><p class="mt-3">{{ t('adminMain.occupiedBy', { name: pendingReplacement.username || pendingReplacement.email }) }}</p><div class="mt-6 flex justify-end gap-3"><button class="rounded border border-border px-4 py-2" @click="pendingReplacement = null">{{ t('common.cancel') }}</button><button class="rounded bg-red-500 px-4 py-2 text-white" @click="confirmReplacement">{{ t('adminMain.replace') }}</button></div></div></div>
    <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"><form class="w-full max-w-lg space-y-4 rounded-lg bg-surface p-6 shadow-xl dark:bg-surface-dark" @submit.prevent="saveUser(false)"><h2 class="text-xl font-bold">{{ t('adminMain.editUser') }}</h2><input v-model.trim="editing.email" type="email" required class="w-full rounded border border-border p-3" /><input v-model.trim="editing.username" class="w-full rounded border border-border p-3" :placeholder="t('adminMain.usernamePlaceholder')" /><div class="grid grid-cols-2 gap-3"><select v-model.number="editing.dormID" class="rounded border border-border p-3"><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select><select v-model.number="editing.roomID" class="rounded border border-border p-3"><option v-for="room in selectedRooms(editing.dormID)" :key="room" :value="room">{{ t('adminMain.room', { room }) }}</option></select></div><div class="grid grid-cols-2 gap-3"><select v-model="editing.role" class="rounded border border-border p-3"><option value="STUDENT">{{ t('adminMain.student') }}</option><option value="RESEARCHER">{{ t('adminMain.researcher') }}</option><option value="ADMIN">{{ t('adminMain.administrator') }}</option></select><label class="flex items-center gap-2 rounded border border-border p-3"><input v-model="editing.active" type="checkbox" /> {{ t('common.active') }}</label></div><p v-if="editFeedback" class="text-red-500">{{ editFeedback }}</p><div class="flex justify-end gap-3"><button type="button" class="rounded border border-border px-4 py-2" @click="editing = null">{{ t('common.cancel') }}</button><button :disabled="isSaving" class="rounded bg-accent px-4 py-2 text-white disabled:opacity-50">{{ t('adminMain.saveChanges') }}</button></div></form></div>
    <div v-if="editingSensor" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"><form class="w-full max-w-lg space-y-4 rounded-lg bg-surface p-6 shadow-xl dark:bg-surface-dark" @submit.prevent="saveSensor"><h2 class="text-xl font-bold">{{ t('adminMain.editSensor') }}</h2><label class="block text-sm font-semibold">{{ t('adminMain.sensorId') }}<input :value="editingSensor.sensorCode" readonly class="mt-1 w-full rounded border border-border bg-black/5 p-3 font-mono opacity-75" /></label><label class="block text-sm font-semibold">{{ t('common.type') }}<input v-model.trim="editingSensor.type" required class="mt-1 w-full rounded border border-border p-3" /></label><label class="block text-sm font-semibold">{{ t('common.location') }}<input v-model.trim="editingSensor.location" required class="mt-1 w-full rounded border border-border p-3" /></label><label class="block text-sm font-semibold">{{ t('adminMain.dorm') }}<select v-model.number="editingSensor.dormID" required class="mt-1 w-full rounded border border-border p-3"><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select></label><label class="block text-sm font-semibold">{{ t('adminMain.adminNote') }}<textarea v-model="editingSensor.adminNote" maxlength="2000" rows="4" class="mt-1 w-full rounded border border-border p-3 font-normal" :placeholder="t('adminMain.notePlaceholder')"></textarea><span class="mt-1 block text-right text-xs font-normal opacity-50">{{ editingSensor.adminNote.length }}/2000</span></label><p v-if="editSensorFeedback" class="text-red-500">{{ editSensorFeedback }}</p><div class="flex justify-end gap-3"><button type="button" class="rounded border border-border px-4 py-2" @click="editingSensor = null">{{ t('common.cancel') }}</button><button :disabled="isSavingSensor" class="rounded bg-accent px-4 py-2 text-white disabled:opacity-50">{{ t('adminMain.saveChanges') }}</button></div></form></div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSocket } from '@/shared/composables/socket'
import { apiUrl } from '@/shared/composables/api'

type Dorm = { dormID: number; floor: number; address: string; rooms: number[] }
type User = { userID: number; email: string; username: string | null; dormID: number | null; roomID: number | null; role: 'STUDENT' | 'RESEARCHER' | 'ADMIN'; active: boolean; mustChangePassword: boolean }
type Sensor = { sensorCode: string; type: string; location: string; dormID: number; dormAddress: string; dormFloor: number; recordedAt: string | null; errorCode: number | null; leakStatus: boolean | null; adminNote: string; noteUpdatedAt: string | null }
type SensorSortKey = keyof Sensor

const socket = getSocket()
const { t, locale } = useI18n()
const isResearcher = computed(() => sessionStorage.getItem('userRole')?.toLowerCase() === 'researcher')
const activeSection = ref<'users' | 'sensors' | 'buildings' | null>(null)
const dorms = ref<Dorm[]>([]), users = ref<User[]>([]), sensors = ref<Sensor[]>([])
const email = ref(''), dormID = ref<number | ''>(''), roomID = ref<number | ''>(''), createRole = ref<'STUDENT' | 'RESEARCHER' | 'ADMIN'>('STUDENT'), filterDorm = ref('all')
const resetEmail = ref(''), resetDormID = ref<number | ''>(''), isSubmitting = ref(false), isResetting = ref(false), isSaving = ref(false)
const isGeneratingCleaning = ref(false), cleaningFeedback = ref(''), cleaningFeedbackClass = ref('')
const feedbackMessage = ref(''), feedbackClass = ref(''), resetFeedback = ref(''), resetFeedbackClass = ref(''), editFeedback = ref('')
const editing = ref<User | null>(null), pendingReplacement = ref<User | null>(null), replacementAction = ref<null | (() => Promise<void>)>(null)
const newSensorCodes = ref(''), newSensorType = ref('Water Meter'), newSensorLocation = ref(''), newSensorDormID = ref<number | ''>(''), isAddingSensors = ref(false)
const sensorFeedback = ref(''), sensorFeedbackClass = ref(''), editingSensor = ref<Sensor | null>(null), editSensorFeedback = ref(''), isSavingSensor = ref(false)
const isImportingHistory = ref(false), historicalImportFeedback = ref(''), historicalImportFeedbackClass = ref('')
const sensorSortKey = ref<SensorSortKey>('sensorCode'), sensorSortDirection = ref<1 | -1>(1)
const sensorHouseFilter = ref('all'), sensorFloorFilter = ref('all')
const newAddress = ref(''), newFloor = ref<number | ''>(''), newFloorRooms = ref(''), roomDormID = ref<number | ''>(''), newRooms = ref('')
const isSavingBuilding = ref(false), buildingFeedback = ref(''), buildingFeedbackClass = ref('')
const sensorColumns = computed<{ key: SensorSortKey; label: string }[]>(() => [{ key: 'sensorCode', label: t('adminMain.sensorId') }, { key: 'type', label: t('common.type') }, { key: 'location', label: t('common.location') }, { key: 'dormAddress', label: t('adminMain.dorm') }, { key: 'recordedAt', label: t('adminMain.lastReading') }, { key: 'errorCode', label: t('adminMain.attention') }, { key: 'adminNote', label: t('adminMain.adminNote') }])

const sectionTitle = computed(() => t(activeSection.value === 'users' ? 'adminMain.users' : activeSection.value === 'sensors' ? 'adminMain.sensors' : activeSection.value === 'buildings' ? 'adminMain.buildings' : 'adminMain.chooseArea'))
function parseRoomIDs(value: string) {
  const roomIDs: number[] = []
  for (const part of value.split(/[\s,;]+/).filter(Boolean)) {
    const range = part.match(/^(\d+)-(\d+)$/)
    if (range) { const start = Number(range[1]), end = Number(range[2]); if (end >= start && end - start <= 499) for (let room = start; room <= end; room++) roomIDs.push(room) }
    else if (/^\d+$/.test(part) && Number(part) > 0) roomIDs.push(Number(part))
  }
  return [...new Set(roomIDs)].slice(0, 500)
}
const parsedFloorRooms = computed(() => parseRoomIDs(newFloorRooms.value))
const parsedNewRooms = computed(() => parseRoomIDs(newRooms.value))
const parsedSensorCodes = computed(() => [...new Set(newSensorCodes.value.split(/[\s,;]+/).map(code => code.trim().toLowerCase()).filter(Boolean))])
const selectedRooms = (id: number | '' | null) => dorms.value.find(dorm => dorm.dormID === Number(id))?.rooms || []
const dormLabel = (dorm: Dorm) => `${t('common.houseLabel', { house: dorm.address })}, ${t('survey.floor', { floor: dorm.floor })}`
const dormName = (sensor: Sensor) => `${t('common.houseLabel', { house: sensor.dormAddress })}, ${t('survey.floor', { floor: sensor.dormFloor })}`
const filteredUsers = computed(() => users.value.filter(user => filterDorm.value === 'all' || String(user.dormID) === filterDorm.value))
const sensorHouses = computed(() => [...new Set(sensors.value.map(sensor => sensor.dormAddress))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })))
const sensorFloors = computed(() => [...new Set(sensors.value
  .filter(sensor => sensorHouseFilter.value === 'all' || sensor.dormAddress === sensorHouseFilter.value)
  .map(sensor => sensor.dormFloor))].sort((a, b) => a - b))
const filteredSensors = computed(() => sensors.value.filter(sensor =>
  (sensorHouseFilter.value === 'all' || sensor.dormAddress === sensorHouseFilter.value) &&
  (sensorFloorFilter.value === 'all' || String(sensor.dormFloor) === sensorFloorFilter.value)
))
const sortedSensors = computed(() => [...filteredSensors.value].sort((left, right) => {
  const a = left[sensorSortKey.value], b = right[sensorSortKey.value]
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }) * sensorSortDirection.value
}))

const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('authToken')}` })
async function loadDorms() { const response = await fetch(apiUrl('/api/auth/admin/dorms'), { headers: headers() }); if (!response.ok) throw new Error(t('adminMain.loadDorms')); dorms.value = await response.json() }
async function loadUsers() { const response = await fetch(apiUrl('/api/auth/admin/users'), { headers: headers() }); if (!response.ok) throw new Error(t('adminMain.loadUsers')); users.value = await response.json() }
async function loadSensors() { const response = await fetch(apiUrl('/api/sensor-data/admin/sensors'), { headers: headers() }); if (!response.ok) throw new Error(t('adminMain.loadSensors')); sensors.value = await response.json() }
async function openSection(section: 'users' | 'sensors' | 'buildings') { activeSection.value = section; try { if (section === 'users') await loadUsers(); else if (section === 'sensors') await loadSensors(); else await loadDorms() } catch (error) { sensorFeedback.value = error instanceof Error ? error.message : t('adminMain.loadAdmin'); sensorFeedbackClass.value = 'text-red-500' } }
function sortSensors(key: SensorSortKey) { if (sensorSortKey.value === key) sensorSortDirection.value *= -1; else { sensorSortKey.value = key; sensorSortDirection.value = 1 } }
function sortIndicator(key: SensorSortKey) { return sensorSortKey.value === key ? (sensorSortDirection.value === 1 ? '▲' : '▼') : '↕' }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : t('common.noData') }
function sensorStatus(sensor: Sensor) { if (sensor.leakStatus) return { label: t('adminMain.leakReported'), class: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' }; if (Number(sensor.errorCode)) return { label: t('adminMain.errorCode', { code: sensor.errorCode }), class: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300' }; if (!sensor.recordedAt || Date.now() - new Date(sensor.recordedAt).getTime() > 26 * 60 * 60 * 1000) return { label: t('adminMain.noRecent'), class: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200' }; return { label: t('adminMain.noIssues'), class: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300' } }

async function createFloor() { isSavingBuilding.value = true; buildingFeedback.value = ''; try { const response = await fetch(apiUrl('/api/auth/admin/dorms'), { method: 'POST', headers: headers(), body: JSON.stringify({ address: newAddress.value, floor: newFloor.value, roomIDs: parsedFloorRooms.value }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || t('adminMain.createFloorError')); buildingFeedback.value = t('adminMain.floorCreated', { house: data.address, floor: data.floor, count: data.rooms.length }); buildingFeedbackClass.value = 'text-green-600'; newAddress.value = ''; newFloor.value = ''; newFloorRooms.value = ''; await loadDorms() } catch (error) { buildingFeedback.value = error instanceof Error ? error.message : t('adminMain.createFloorError'); buildingFeedbackClass.value = 'text-red-500' } finally { isSavingBuilding.value = false } }
async function addRooms() { isSavingBuilding.value = true; buildingFeedback.value = ''; try { const response = await fetch(apiUrl(`/api/auth/admin/dorms/${roomDormID.value}/rooms`), { method: 'POST', headers: headers(), body: JSON.stringify({ roomIDs: parsedNewRooms.value }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || t('adminMain.addRoomsError')); buildingFeedback.value = t('adminMain.roomsAdded', { created: data.created.length, skipped: data.skipped.length }); buildingFeedbackClass.value = 'text-green-600'; newRooms.value = ''; await loadDorms() } catch (error) { buildingFeedback.value = error instanceof Error ? error.message : t('adminMain.addRoomsError'); buildingFeedbackClass.value = 'text-red-500' } finally { isSavingBuilding.value = false } }

async function addSensors() { isAddingSensors.value = true; sensorFeedback.value = ''; try { const response = await fetch(apiUrl('/api/sensor-data/admin/sensors'), { method: 'POST', headers: headers(), body: JSON.stringify({ sensorCodes: parsedSensorCodes.value, type: newSensorType.value, location: newSensorLocation.value, dormID: newSensorDormID.value }) }); const data = await response.json(); if (!response.ok) throw new Error(t('adminMain.addSensorsError')); sensorFeedback.value = t('adminMain.sensorsRegistered', { created: data.created.length, skipped: data.skipped.length }); sensorFeedbackClass.value = 'text-green-600'; newSensorCodes.value = ''; await loadSensors() } catch (error) { sensorFeedback.value = error instanceof Error ? error.message : t('adminMain.addSensorsError'); sensorFeedbackClass.value = 'text-red-500' } finally { isAddingSensors.value = false } }
async function importHistoricalData() { if (!confirm(t('adminMain.recoveryConfirm'))) return; isImportingHistory.value = true; historicalImportFeedback.value = t('adminMain.importStarting'); historicalImportFeedbackClass.value = ''; try { const response = await fetch(apiUrl('/api/sensor-data/admin/import-historical'), { method: 'POST', headers: headers() }); if (!response.ok && response.status !== 409) throw new Error(t('adminMain.importStartError')); while (true) { const statusResponse = await fetch(apiUrl('/api/sensor-data/admin/import-historical'), { headers: headers() }); const statusData = await statusResponse.json(); if (!statusResponse.ok) throw new Error(t('adminMain.importProgressError')); const job = statusData.job; const progress = job.progress; if (progress) historicalImportFeedback.value = t('adminMain.importProgress', { completed: progress.batchesCompleted, total: progress.totalBatches, date: formatDate(new Date(progress.startedFrom * 1000).toISOString()), snapshots: progress.snapshots, retries: progress.retries || 0 }); if (job.status === 'completed') { historicalImportFeedback.value = t('adminMain.importComplete', { snapshots: progress.snapshots, batches: progress.totalBatches }); historicalImportFeedbackClass.value = 'text-green-700 dark:text-green-400'; await loadSensors(); break } if (job.status === 'failed') throw new Error(t('adminMain.importFailed')); await new Promise(resolve => setTimeout(resolve, 2000)) } } catch (error) { historicalImportFeedback.value = error instanceof Error ? error.message : t('adminMain.importError'); historicalImportFeedbackClass.value = 'text-red-600' } finally { isImportingHistory.value = false } }
function startSensorEdit(sensor: Sensor) { editingSensor.value = { ...sensor, adminNote: sensor.adminNote || '' }; editSensorFeedback.value = '' }
async function saveSensor() { if (!editingSensor.value) return; isSavingSensor.value = true; editSensorFeedback.value = ''; try { const sensorCode = encodeURIComponent(editingSensor.value.sensorCode); const response = await fetch(apiUrl(`/api/sensor-data/admin/sensors/${sensorCode}`), { method: 'PATCH', headers: headers(), body: JSON.stringify({ type: editingSensor.value.type, location: editingSensor.value.location, dormID: editingSensor.value.dormID }) }); if (!response.ok) throw new Error(t('adminMain.updateSensorError')); const noteResponse = await fetch(apiUrl(`/api/sensor-data/admin/sensors/${sensorCode}/note`), { method: 'PUT', headers: headers(), body: JSON.stringify({ note: editingSensor.value.adminNote }) }); if (!noteResponse.ok) throw new Error(t('adminMain.saveNoteError')); editingSensor.value = null; await loadSensors() } catch (error) { editSensorFeedback.value = error instanceof Error ? error.message : t('adminMain.updateSensorError') } finally { isSavingSensor.value = false } }

async function createResident(replaceExisting: boolean) { isSubmitting.value = true; try { const response = await fetch(apiUrl('/api/auth/residents'), { method: 'POST', headers: headers(), body: JSON.stringify({ email: email.value, dormID: dormID.value, roomID: roomID.value, role: createRole.value, replaceExisting }) }); const data = await response.json(); if (!response.ok) { if (response.status === 409 && data.code === 'ROOM_OCCUPIED') { pendingReplacement.value = data.existingUser; replacementAction.value = () => createResident(true); return } throw new Error(t('adminMain.createError')) } feedbackMessage.value = t('adminMain.accountCreated', { email: data.email }); feedbackClass.value = 'text-green-600'; email.value = ''; createRole.value = 'STUDENT'; await loadUsers() } catch (error) { feedbackMessage.value = error instanceof Error ? error.message : t('adminMain.createError'); feedbackClass.value = 'text-red-500' } finally { isSubmitting.value = false } }
async function resetResidentPassword() { if (!confirm(t('adminMain.resetConfirm', { email: resetEmail.value }))) return; isResetting.value = true; try { const response = await fetch(apiUrl('/api/auth/admin/reset-resident-password'), { method: 'POST', headers: headers(), body: JSON.stringify({ email: resetEmail.value, dormID: resetDormID.value }) }); if (!response.ok) throw new Error(t('adminMain.resetError')); resetFeedback.value = t('adminMain.resetSuccess'); resetFeedbackClass.value = 'text-green-600'; resetEmail.value = ''; await loadUsers() } catch (error) { resetFeedback.value = error instanceof Error ? error.message : t('adminMain.resetError'); resetFeedbackClass.value = 'text-red-500' } finally { isResetting.value = false } }
async function generateCleaningSchedule() { isGeneratingCleaning.value = true; cleaningFeedback.value = ''; try { const response = await fetch(apiUrl('/api/auth/admin/cleaning-weeks/generate'), { method: 'POST', headers: headers() }); const data = await response.json(); if (!response.ok) throw new Error(t('adminMain.scheduleError')); const summary = data.summary; cleaningFeedback.value = t('adminMain.scheduleSummary', { created: summary.weeksCreated, reassigned: summary.weeksReassigned, unchanged: summary.weeksUnchanged }); cleaningFeedbackClass.value = 'text-green-600' } catch (error) { cleaningFeedback.value = error instanceof Error ? error.message : t('adminMain.scheduleError'); cleaningFeedbackClass.value = 'text-red-500' } finally { isGeneratingCleaning.value = false } }
function startEdit(user: User) { editing.value = { ...user }; editFeedback.value = '' }
async function saveUser(replaceExisting: boolean) { if (!editing.value) return; isSaving.value = true; editFeedback.value = ''; try { const payload = { ...editing.value, username: editing.value.username?.trim() || null, replaceExisting }; const response = await fetch(apiUrl(`/api/auth/admin/users/${editing.value.userID}`), { method: 'PATCH', headers: headers(), body: JSON.stringify(payload) }); const data = await response.json(); if (!response.ok) { if (response.status === 409 && data.code === 'ROOM_OCCUPIED') { pendingReplacement.value = data.existingUser; replacementAction.value = () => saveUser(true); return } throw new Error(t('adminMain.updateError')) } editing.value = null; await loadUsers() } catch (error) { editFeedback.value = error instanceof Error ? error.message : t('adminMain.updateError') } finally { isSaving.value = false } }
async function confirmReplacement() { const action = replacementAction.value; pendingReplacement.value = null; replacementAction.value = null; if (action) await action() }

watch(() => [editing.value?.dormID, editing.value?.role], () => {
  if (!editing.value) return
  if (editing.value.role === 'ADMIN' || editing.value.role === 'RESEARCHER') {
    editing.value.dormID = null
    editing.value.roomID = null
  } else if (editing.value.dormID != null && (editing.value.roomID == null || !selectedRooms(editing.value.dormID).includes(editing.value.roomID))) {
    editing.value.roomID = selectedRooms(editing.value.dormID)[0]
  }
})
watch(sensorHouses, houses => { if (sensorHouseFilter.value !== 'all' && !houses.includes(sensorHouseFilter.value)) sensorHouseFilter.value = 'all' })
watch(sensorFloors, floors => { if (sensorFloorFilter.value !== 'all' && !floors.includes(Number(sensorFloorFilter.value))) sensorFloorFilter.value = 'all' })
onMounted(() => { if (!isResearcher.value) loadDorms().catch(error => { feedbackMessage.value = error.message; feedbackClass.value = 'text-red-500' }) })
</script>
