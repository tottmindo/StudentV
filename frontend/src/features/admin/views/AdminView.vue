<template>
  <main class="mx-auto min-h-screen w-full min-w-0 max-w-7xl space-y-6 px-4 py-6">
    <header v-if="activeSection" class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="break-words text-2xl font-bold sm:text-3xl">{{ sectionTitle }}</h1>
      </div>
      <button class="rounded-lg border border-border px-4 py-2 font-semibold" @click="activeSection = null">{{ t('adminMain.back') }}</button>
    </header>

    <div v-if="isResearcher" class="grid gap-6 md:grid-cols-2">
      <router-link to="/admin/water-analytics" class="min-w-0 break-words rounded-2xl bg-surface p-5 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark sm:p-8"><div class="text-4xl">📊</div><h2 class="mt-5 text-xl font-bold sm:text-2xl">{{ t('nav.waterAnalytics') }}</h2><p class="mt-2 opacity-75">{{ t('adminMain.waterHelp') }}</p></router-link>
      <router-link to="/survey" class="min-w-0 break-words rounded-2xl bg-surface p-5 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark sm:p-8"><div class="text-4xl">≡</div><h2 class="mt-5 text-xl font-bold sm:text-2xl">{{ t('nav.surveys') }}</h2><p class="mt-2 opacity-75">{{ t('topbar.surveyDescription') }}</p></router-link>
      <router-link to="/admin/app-usage" class="min-w-0 break-words rounded-2xl bg-surface p-5 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark sm:p-8"><div class="text-4xl">📈</div><h2 class="mt-5 text-xl font-bold sm:text-2xl">{{ t('usageAdmin.title') }}</h2><p class="mt-2 opacity-75">{{ t('adminMain.usageHelp') }}</p></router-link>
    </div>
    <div v-else-if="!activeSection" class="grid gap-6 md:grid-cols-2">
      <router-link to="/admin/water-analytics" class="min-w-0 break-words rounded-2xl bg-surface p-5 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark sm:p-8">
        <div class="text-4xl">📊</div>
        <h2 class="mt-5 text-xl font-bold sm:text-2xl">{{ t('nav.waterAnalytics') }}</h2>
        <p class="mt-2 opacity-75">{{ t('adminMain.waterHelp') }}</p>
      </router-link>
      <router-link to="/admin/app-usage" class="min-w-0 break-words rounded-2xl bg-surface p-5 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark sm:p-8">
        <div class="text-4xl">📈</div>
        <h2 class="mt-5 text-xl font-bold sm:text-2xl">{{ t('usageAdmin.title') }}</h2>
        <p class="mt-2 opacity-75">{{ t('adminMain.usageHelp') }}</p>
      </router-link>
      <router-link to="/admin/events" class="min-w-0 break-words rounded-2xl bg-surface p-5 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark sm:p-8">
        <div class="text-4xl">📅</div>
        <h2 class="mt-5 text-xl font-bold sm:text-2xl">{{ t('adminEvents.title') }}</h2>
        <p class="mt-2 opacity-75">{{ t('adminEvents.cardHelp') }}</p>
      </router-link>
      <router-link to="/admin/cleaning-tasks" class="min-w-0 break-words rounded-2xl bg-surface p-5 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark sm:p-8">
        <div class="text-4xl">🧹</div>
        <h2 class="mt-5 text-xl font-bold sm:text-2xl">{{ t('adminCleaning.title') }}</h2>
        <p class="mt-2 opacity-75">{{ t('adminCleaning.cardHelp') }}</p>
      </router-link>
      <button class="min-w-0 break-words rounded-2xl bg-surface p-5 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark sm:p-8" @click="openSection('users')">
        <div class="text-4xl">👥</div>
        <h2 class="mt-5 text-xl font-bold sm:text-2xl">{{ t('adminMain.users') }}</h2>
        <p class="mt-2 opacity-75">{{ t('adminMain.usersHelp') }}</p>
      </button>
      <button class="min-w-0 break-words rounded-2xl bg-surface p-5 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark sm:p-8" @click="openSection('sensors')">
        <div class="text-4xl">📡</div>
        <h2 class="mt-5 text-xl font-bold sm:text-2xl">{{ t('adminMain.sensors') }}</h2>
        <p class="mt-2 opacity-75">{{ t('adminMain.sensorsHelp') }}</p>
      </button>
      <button class="min-w-0 break-words rounded-2xl bg-surface p-5 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-surface-dark sm:p-8" @click="openSection('buildings')">
        <div class="text-4xl">🏠</div>
        <h2 class="mt-5 text-xl font-bold sm:text-2xl">{{ t('adminMain.buildings') }}</h2>
        <p class="mt-2 opacity-75">{{ t('adminMain.buildingsHelp') }}</p>
      </button>
    </div>

    <template v-else-if="activeSection === 'users'">
      <section class="min-w-0 rounded-2xl bg-surface p-4 shadow-lg dark:bg-surface-dark sm:p-6">
        <div class="flex min-w-0 flex-wrap items-center justify-between gap-3"><div class="min-w-0 break-words"><h2 class="text-xl font-bold sm:text-2xl">{{ t('adminMain.manageUsers') }}</h2><p class="text-sm opacity-75">{{ t('adminMain.manageUsersHelp') }}</p></div><div class="flex min-w-0 max-w-full flex-wrap gap-3"><button class="max-w-full whitespace-normal break-words rounded border border-accent px-4 py-2 font-semibold text-accent" @click="openResidentImport">{{ t('adminMain.updateResidents') }}</button><button class="max-w-full whitespace-normal break-words rounded bg-accent px-4 py-2 font-semibold text-white" @click="openAddUserModal">{{ t('adminMain.addUser') }}</button><button class="max-w-full whitespace-normal break-words rounded border border-border px-4 py-2 font-semibold" :aria-pressed="!showInactiveUsers" @click="showInactiveUsers = !showInactiveUsers">{{ t(showInactiveUsers ? 'adminMain.hideInactive' : 'adminMain.showInactive') }}</button><select v-model="filterDorm" class="max-w-full min-w-0 rounded border border-border p-2"><option value="all">{{ t('adminMain.allDorms') }}</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="String(dorm.dormID)">{{ dormLabel(dorm) }}</option></select></div></div>
        <div class="mt-5 max-h-[32rem] max-w-full overflow-auto rounded-lg border border-border/60"><table class="w-full min-w-[44rem] text-left text-sm"><thead class="sticky top-0 z-10 bg-surface shadow-sm dark:bg-surface-dark"><tr class="border-b border-border"><th class="p-3">{{ t('adminMain.emailUsername') }}</th><th class="p-3">{{ t('adminMain.roomLabel') }}</th><th class="p-3">{{ t('adminMain.role') }}</th><th class="p-3">{{ t('adminMain.status') }}</th><th class="p-3"></th></tr></thead><tbody><tr v-for="user in filteredUsers" :key="user.userID" class="border-b border-border/50"><td class="max-w-72 break-all p-3"><div class="font-semibold">{{ user.email }}</div><div class="break-words opacity-70">{{ user.username || t('adminMain.setupIncomplete') }}</div></td><td class="p-3">{{ user.role === 'ADMIN' ? t('adminMain.globalAccess') : user.roomID }}</td><td class="p-3">{{ t(user.role === 'ADMIN' ? 'adminMain.administrator' : 'adminMain.student') }}</td><td class="p-3">{{ user.active ? (user.mustChangePassword ? t('adminMain.temporaryPassword') : t('common.active')) : t('common.inactive') }}</td><td class="p-3"><button class="rounded bg-accent px-3 py-2 text-white" @click="startEdit(user)">{{ t('adminMain.edit') }}</button></td></tr></tbody></table></div>
      </section>

      <section class="flex min-w-0 flex-wrap items-center justify-between gap-5 rounded-2xl bg-surface p-4 shadow-lg dark:bg-surface-dark sm:p-6">
        <div class="min-w-0 max-w-3xl break-words"><h2 class="text-xl font-bold">{{ t('adminMain.schedule') }}</h2><p class="mt-1 text-sm opacity-75">{{ t('adminMain.scheduleHelp') }}</p><p v-if="cleaningFeedback" class="mt-3 text-sm font-semibold" :class="cleaningFeedbackClass">{{ cleaningFeedback }}</p></div>
        <button :disabled="isGeneratingCleaning" class="max-w-full whitespace-normal break-words rounded-lg bg-accent px-5 py-3 font-semibold text-white disabled:opacity-50" @click="generateCleaningSchedule">{{ t(isGeneratingCleaning ? 'adminMain.checkingSchedule' : 'adminMain.generateWeeks') }}</button>
      </section>
    </template>

    <template v-else-if="activeSection === 'buildings'">
      <div class="grid gap-6 lg:grid-cols-2">
        <section class="min-w-0 rounded-2xl bg-surface p-5 shadow-lg dark:bg-surface-dark sm:p-8">
          <h2 class="break-words text-xl font-bold sm:text-2xl">{{ t('adminMain.addFloor') }}</h2>
          <p class="mt-2 text-sm opacity-75">{{ t('adminMain.addFloorHelp') }}</p>
          <form class="mt-6 space-y-4" @submit.prevent="createFloor">
            <input v-model.trim="newAddress" required inputmode="numeric" pattern="[0-9]+" maxlength="255" class="w-full rounded border border-border p-3" :placeholder="t('adminMain.addressPlaceholder')" />
            <select v-model="floorCreationMode" class="w-full rounded border border-border p-3">
              <option value="single">{{ t('adminMain.singleFloor') }}</option>
              <option value="range">{{ t('adminMain.floorRange') }}</option>
            </select>
            <div class="grid gap-4" :class="floorCreationMode === 'range' ? 'sm:grid-cols-2' : ''">
              <input v-model.number="newFloor" required type="number" min="-10" max="200" class="w-full rounded border border-border p-3" :placeholder="t(floorCreationMode === 'range' ? 'adminMain.firstFloor' : 'adminMain.floorNumber')" />
              <input v-if="floorCreationMode === 'range'" v-model.number="newFloorTo" required type="number" :min="newFloor === '' ? -10 : newFloor" max="200" class="w-full rounded border border-border p-3" :placeholder="t('adminMain.lastFloor')" />
            </div>
            <select v-model="newFloorRoomFormat" class="w-full rounded border border-border p-3">
              <option value="local">{{ t('adminMain.shortRoomNumbers') }}</option>
              <option value="full">{{ t('adminMain.completeRoomNumbers') }}</option>
            </select>
            <textarea v-model="newFloorRooms" required rows="4" class="w-full rounded border border-border p-3" :placeholder="t(newFloorRoomFormat === 'local' ? 'adminMain.shortRoomsPlaceholder' : 'adminMain.fullRoomsPlaceholder')"></textarea>
            <p class="text-xs opacity-65">{{ t(newFloorRoomFormat === 'local' ? 'adminMain.shortRoomsHelp' : 'adminMain.fullRoomsHelp') }}</p>
            <p class="text-xs opacity-65">{{ t('adminMain.generalChatAutomation') }}</p>
            <button :disabled="isSavingBuilding || !parsedFloorRooms.length || !validFloorSelection" class="w-full rounded-lg bg-accent p-3 font-semibold text-white disabled:opacity-50">{{ t(isSavingBuilding ? 'adminMain.savingBuilding' : 'adminMain.createFloor') }}</button>
          </form>
        </section>

        <section class="min-w-0 rounded-2xl bg-surface p-5 shadow-lg dark:bg-surface-dark sm:p-8">
          <h2 class="break-words text-xl font-bold sm:text-2xl">{{ t('adminMain.addRooms') }}</h2>
          <p class="mt-2 text-sm opacity-75">{{ t('adminMain.addRoomsHelp') }}</p>
          <form class="mt-6 space-y-4" @submit.prevent="addRooms">
            <select v-model.number="roomDormID" required class="w-full rounded border border-border p-3"><option disabled value="">{{ t('adminMain.selectDorm') }}</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select>
            <select v-model="newRoomFormat" class="w-full rounded border border-border p-3"><option value="local">{{ t('adminMain.shortRoomNumbers') }}</option><option value="full">{{ t('adminMain.completeRoomNumbers') }}</option></select>
            <textarea v-model="newRooms" required rows="4" class="w-full rounded border border-border p-3" :placeholder="t(newRoomFormat === 'local' ? 'adminMain.shortRoomsPlaceholder' : 'adminMain.fullRoomsPlaceholder')"></textarea>
            <p class="text-xs opacity-65">{{ t(newRoomFormat === 'local' ? 'adminMain.shortRoomsHelp' : 'adminMain.fullRoomsHelp') }}</p>
            <button :disabled="isSavingBuilding || !parsedNewRooms.length" class="w-full rounded-lg bg-accent p-3 font-semibold text-white disabled:opacity-50">{{ t(isSavingBuilding ? 'adminMain.savingBuilding' : 'adminMain.addRoomsAction') }}</button>
          </form>
        </section>
      </div>

      <p v-if="buildingFeedback" class="rounded-lg bg-surface p-4 font-semibold shadow dark:bg-surface-dark" :class="buildingFeedbackClass">{{ buildingFeedback }}</p>

      <section class="min-w-0 rounded-2xl bg-surface p-4 shadow-lg dark:bg-surface-dark sm:p-6">
        <h2 class="break-words text-xl font-bold sm:text-2xl">{{ t('adminMain.housesAndFloors') }}</h2>
        <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="dorm in dorms" :key="dorm.dormID" class="min-w-0 break-words rounded-xl border border-border p-4">
            <h3 class="font-bold">{{ t('common.houseLabel', { house: dorm.address }) }}</h3>
            <p class="mt-1 opacity-75">{{ t('survey.floor', { floor: dorm.floor }) }}</p>
            <p class="mt-3 text-sm">{{ t('adminMain.roomCount', { count: dorm.rooms.length }) }}</p>
            <p class="mt-1 break-words text-sm opacity-65">{{ dorm.rooms.join(', ') || '—' }}</p>
          </article>
        </div>
      </section>
    </template>

    <template v-else>
      <section class="min-w-0 rounded-2xl bg-surface p-4 shadow-lg dark:bg-surface-dark sm:p-6">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="min-w-0 break-words"><h2 class="text-xl font-bold sm:text-2xl">{{ t('adminMain.registeredSensors') }}</h2><p class="text-sm opacity-75">{{ t('adminMain.registeredHelp') }}</p></div>
          <div class="flex w-full min-w-0 flex-wrap gap-3 sm:w-auto">
            <label class="w-full min-w-0 text-sm font-semibold sm:w-auto">{{ t('adminMain.house') }}<select v-model="sensorHouseFilter" class="mt-1 block w-full min-w-0 rounded border border-border p-2 font-normal sm:min-w-44"><option value="all">{{ t('adminMain.allHouses') }}</option><option v-for="house in sensorHouses" :key="house" :value="house">{{ t('common.houseLabel', { house }) }}</option></select></label>
            <label class="w-full min-w-0 text-sm font-semibold sm:w-auto">{{ t('adminMain.floor') }}<select v-model="sensorFloorFilter" class="mt-1 block w-full min-w-0 rounded border border-border p-2 font-normal sm:min-w-32"><option value="all">{{ t('adminMain.allFloors') }}</option><option v-for="floor in sensorFloors" :key="floor" :value="String(floor)">{{ t('survey.floor', { floor }) }}</option></select></label>
          </div>
        </div>
        <div class="mt-5 max-h-[32rem] max-w-full overflow-auto rounded-lg border border-border/60">
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

      <section class="min-w-0 rounded-2xl bg-surface p-4 shadow-lg dark:bg-surface-dark sm:p-6">
        <h2 class="break-words text-xl font-bold sm:text-2xl">{{ t('adminMain.registerSensors') }}</h2>
        <p class="mt-2 text-sm opacity-75">{{ t('adminMain.registerHelp') }}</p>
        <div class="mt-5 flex max-w-full flex-wrap gap-2" role="tablist">
          <button type="button" class="max-w-full whitespace-normal break-words rounded-lg px-4 py-2 font-semibold" :class="sensorEntryMode === 'single' ? 'bg-accent text-white' : 'border border-border'" @click="sensorEntryMode = 'single'">{{ t('adminMain.oneSensor') }}</button>
          <button type="button" class="max-w-full whitespace-normal break-words rounded-lg px-4 py-2 font-semibold" :class="sensorEntryMode === 'bulk' ? 'bg-accent text-white' : 'border border-border'" @click="sensorEntryMode = 'bulk'">{{ t('adminMain.multipleSensors') }}</button>
        </div>
        <form v-if="sensorEntryMode === 'single'" class="mt-5 grid gap-4 md:grid-cols-2" @submit.prevent="addSensors">
          <label class="text-sm font-semibold">{{ t('adminMain.devEui') }}<input v-model.trim="singleSensorDevEUI" required maxlength="16" pattern="[0-9A-Fa-f]{16}" class="mt-1 w-full rounded border border-border p-3 font-mono" placeholder="8C1F64619000228D" /></label>
          <label class="text-sm font-semibold">{{ t('adminMain.houseAndFloor') }}<select v-model.number="singleSensorDormID" required class="mt-1 w-full rounded border border-border p-3 font-normal"><option disabled value="">{{ t('adminMain.selectDorm') }}</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select></label>
          <label class="text-sm font-semibold">{{ t('adminMain.placement') }}<select v-model="singleSensorPlacement" class="mt-1 w-full rounded border border-border p-3 font-normal"><option>Kitchen</option><option>Left Shower</option><option>Right Shower</option></select></label>
          <label class="text-sm font-semibold">{{ t('adminMain.waterType') }}<select v-model="singleSensorWaterType" class="mt-1 w-full rounded border border-border p-3 font-normal"><option value="Cold Water">{{ t('adminMain.coldWater') }}</option><option value="Warm Water">{{ t('adminMain.warmWater') }}</option></select></label>
          <p class="text-xs opacity-65 md:col-span-2">{{ t('adminMain.singleExample') }}</p>
          <button :disabled="isAddingSensors" class="rounded-lg bg-accent p-3 font-semibold text-white disabled:opacity-50 md:col-span-2">{{ t(isAddingSensors ? 'adminMain.registering' : 'adminMain.registerOne') }}</button>
        </form>
        <form v-else class="mt-5 space-y-4" @submit.prevent="addSensors">
          <div class="rounded-lg border border-border bg-black/[.03] p-4 text-sm dark:bg-white/[.03]"><p class="font-semibold">{{ t('adminMain.csvInstructions') }}</p><code class="mt-2 block overflow-x-auto whitespace-pre font-mono text-xs">House Number,Floor Number,Sensor Placement,Water Type,DevEUI
14,3,Left Shower,Cold Water,8C1F64619000228D
14,3,Left Shower,Warm Water,8C1F646190001BEA</code></div>
          <label class="block min-w-0 text-sm font-semibold">{{ t('adminMain.csvFile') }}<input type="file" accept=".csv,text/csv" class="mt-1 block w-full min-w-0 max-w-full rounded border border-border p-3 font-normal" @change="loadSensorCsvFile" /></label>
          <label class="block text-sm font-semibold">{{ t('adminMain.csvData') }}<textarea v-model="sensorCsv" required rows="10" class="mt-1 w-full rounded border border-border p-3 font-mono text-sm" :placeholder="sensorCsvExample"></textarea></label>
          <p v-if="sensorCsvError" class="text-sm font-semibold text-red-500">{{ sensorCsvError }}</p>
          <p v-else-if="parsedCsvSensors.length" class="text-sm text-green-700 dark:text-green-400">{{ t('adminMain.csvReady', { count: parsedCsvSensors.length }) }}</p>
          <button :disabled="isAddingSensors || !!sensorCsvError || !parsedCsvSensors.length" class="w-full rounded-lg bg-accent p-3 font-semibold text-white disabled:opacity-50">{{ t(isAddingSensors ? 'adminMain.registering' : 'adminMain.registerCount', { count: parsedCsvSensors.length }) }}</button>
        </form>
        <p v-if="sensorFeedback" class="mt-4" :class="sensorFeedbackClass">{{ sensorFeedback }}</p>
      </section>

      <section class="flex min-w-0 flex-wrap items-center justify-between gap-5 rounded-2xl border border-red-400/60 bg-red-50 p-4 shadow-lg dark:bg-red-950/30 sm:p-6">
        <div class="min-w-0 max-w-3xl break-words">
          <h2 class="text-xl font-bold text-red-800 dark:text-red-300">{{ t('adminMain.recovery') }}</h2>
          <p class="mt-1 text-sm font-semibold">{{ t('adminMain.recoveryWarning') }}</p>
          <p class="mt-1 text-sm opacity-80">{{ t('adminMain.recoveryHelp') }}</p>
          <p v-if="historicalImportFeedback" class="mt-3 text-sm font-semibold" :class="historicalImportFeedbackClass">{{ historicalImportFeedback }}</p>
        </div>
        <button :disabled="isImportingHistory" class="max-w-full whitespace-normal break-words rounded-lg bg-red-700 px-5 py-3 font-semibold text-white disabled:opacity-50" @click="importHistoricalData">{{ t(isImportingHistory ? 'adminMain.importing' : 'adminMain.importAll') }}</button>
      </section>
    </template>

    <div v-if="isResidentImportOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"><div class="flex max-h-full w-full max-w-5xl flex-col rounded-lg bg-surface p-6 shadow-xl dark:bg-surface-dark"><div><h2 class="text-xl font-bold">{{ t('adminMain.updateResidents') }}</h2><p class="mt-2 text-sm opacity-75">{{ t('adminMain.residentImportHelp') }}</p></div><label class="mt-5 block text-sm font-semibold">{{ t('adminMain.residentWorkbook') }}<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="mt-1 block w-full rounded border border-border p-3 font-normal" @change="previewResidentWorkbook" /></label><p v-if="residentImportFeedback" class="mt-3 text-sm font-semibold" :class="residentImportFeedbackClass">{{ residentImportFeedback }}</p><div v-if="residentImportRows.length" class="mt-5 min-h-0 flex-1 overflow-auto rounded border border-border"><table class="w-full min-w-[850px] text-left text-sm"><thead class="sticky top-0 bg-surface shadow-sm dark:bg-surface-dark"><tr><th class="p-3">{{ t('adminMain.include') }}</th><th class="p-3">{{ t('adminMain.roomLabel') }}</th><th class="p-3">{{ t('adminMain.currentResident') }}</th><th class="p-3">{{ t('adminMain.importedResident') }}</th><th class="p-3">{{ t('adminMain.fromDate') }}</th><th class="p-3">{{ t('adminMain.toDate') }}</th><th class="p-3">{{ t('adminMain.status') }}</th></tr></thead><tbody><tr v-for="row in residentImportRows" :key="row.rowNumber" class="border-t border-border/50"><td class="p-3"><input v-model="selectedResidentRows" type="checkbox" :value="row.rowNumber" :disabled="row.status === 'invalid'" :aria-label="t('adminMain.includeRoom', { room: row.object })" /></td><td class="p-3 font-semibold">{{ row.object }}</td><td class="p-3">{{ row.currentEmail || '—' }}</td><td class="p-3">{{ row.vacant ? t('adminMain.vacant') : (row.email || '—') }}</td><td class="p-3">{{ row.fromDate }}</td><td class="p-3">{{ row.toDate }}</td><td class="p-3"><span :class="row.issue ? 'text-red-600' : row.status === 'vacant' ? 'text-orange-600' : 'text-blue-600'">{{ row.issue || t(`adminMain.importStatus.${row.status}`) }}</span></td></tr></tbody></table></div><div class="mt-5 flex flex-wrap items-center justify-between gap-3"><p class="text-sm opacity-75">{{ t('adminMain.matchedNotShown', { count: residentImportMatched }) }}</p><div class="flex gap-3"><button :disabled="isResidentImportBusy" class="rounded border border-border px-4 py-2 disabled:opacity-50" @click="closeResidentImport">{{ t('common.cancel') }}</button><button :disabled="isResidentImportBusy || !selectedResidentRows.length" class="rounded bg-accent px-4 py-2 font-bold text-white disabled:opacity-50" @click="applyResidentImport">{{ t(isResidentImportBusy ? 'adminMain.updatingResidents' : 'adminMain.sendResidentEmails', { count: selectedResidentRows.length }) }}</button></div></div></div></div>
    <div v-if="pendingReplacement" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"><div class="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl dark:bg-surface-dark"><h2 class="text-xl font-bold">{{ t('adminMain.occupied') }}</h2><p class="mt-3">{{ t('adminMain.occupiedBy', { name: pendingReplacement.username || pendingReplacement.email }) }}</p><div class="mt-6 flex justify-end gap-3"><button class="rounded border border-border px-4 py-2" @click="pendingReplacement = null">{{ t('common.cancel') }}</button><button class="rounded bg-red-500 px-4 py-2 text-white" @click="confirmReplacement">{{ t('adminMain.replace') }}</button></div></div></div>
    <div v-if="isAddUserModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"><form class="w-full max-w-lg space-y-5 rounded-lg bg-surface p-6 shadow-xl dark:bg-surface-dark" @submit.prevent="createResident(false)"><div><p class="text-xs font-bold uppercase tracking-[.14em] text-accent">{{ t('adminMain.accountCreation') }}</p><h2 class="mt-1 text-xl font-bold">{{ t('adminMain.addUser') }}</h2><p class="mt-2 text-sm opacity-75">{{ t('adminMain.addUserHelp') }}</p></div><label class="block text-sm font-semibold">{{ t('adminMain.emailAddress') }}<input v-model.trim="newUserEmail" type="email" required maxlength="255" autocomplete="off" class="mt-1 w-full rounded-lg border border-border p-3 font-normal" placeholder="resident@example.com" /><span class="mt-1 block text-xs font-normal opacity-65">{{ t('adminMain.emailDeliveryExplanation') }}</span></label><label class="block text-sm font-semibold">{{ t('adminMain.role') }}<select v-model="createRole" class="mt-1 w-full rounded-lg border border-border p-3 font-normal"><option value="STUDENT">{{ t('adminMain.student') }}</option><option value="RESEARCHER">{{ t('adminMain.researcher') }}</option><option value="ADMIN">{{ t('adminMain.administrator') }}</option></select></label><div v-if="createRole === 'STUDENT'" class="grid gap-4 sm:grid-cols-2"><label class="block text-sm font-semibold">{{ t('adminMain.houseAndFloor') }}<select v-model.number="dormID" required class="mt-1 w-full rounded-lg border border-border p-3 font-normal"><option disabled value="">{{ t('adminMain.selectDorm') }}</option><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select></label><label class="block text-sm font-semibold">{{ t('adminMain.roomLabel') }}<select v-model.number="roomID" required :disabled="dormID === ''" class="mt-1 w-full rounded-lg border border-border p-3 font-normal disabled:cursor-not-allowed disabled:opacity-50"><option disabled value="">{{ t('adminMain.selectRoom') }}</option><option v-for="room in availableCreateRooms" :key="room" :value="room">{{ t('adminMain.room', { room }) }}</option></select></label></div><p v-if="feedbackMessage" class="rounded-lg p-3 text-center text-sm font-semibold" :class="feedbackClass">{{ feedbackMessage }}</p><div class="flex justify-end gap-3"><button type="button" :disabled="isSubmitting" class="rounded border border-border px-4 py-2 disabled:opacity-50" @click="isAddUserModalOpen = false">{{ t('common.cancel') }}</button><button :disabled="isSubmitting || !canCreateUser" class="rounded bg-accent px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{{ t(isSubmitting ? 'adminMain.creating' : 'adminMain.createAndEmail') }}</button></div></form></div>
    <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"><form class="w-full max-w-lg space-y-4 rounded-lg bg-surface p-6 shadow-xl dark:bg-surface-dark" @submit.prevent="saveUser(false)"><h2 class="text-xl font-bold">{{ t('adminMain.editUser') }}</h2><input v-model.trim="editing.email" type="email" required class="w-full rounded border border-border p-3" /><input v-model.trim="editing.username" class="w-full rounded border border-border p-3" :placeholder="t('adminMain.usernamePlaceholder')" /><div class="grid grid-cols-2 gap-3"><select v-model.number="editing.dormID" class="rounded border border-border p-3"><option v-for="dorm in dorms" :key="dorm.dormID" :value="dorm.dormID">{{ dormLabel(dorm) }}</option></select><select v-model.number="editing.roomID" class="rounded border border-border p-3"><option v-for="room in selectedRooms(editing.dormID)" :key="room" :value="room">{{ t('adminMain.room', { room }) }}</option></select></div><div class="grid grid-cols-2 gap-3"><select v-model="editing.role" class="rounded border border-border p-3"><option value="STUDENT">{{ t('adminMain.student') }}</option><option value="RESEARCHER">{{ t('adminMain.researcher') }}</option><option value="ADMIN">{{ t('adminMain.administrator') }}</option></select><label class="flex items-center gap-2 rounded border border-border p-3"><input v-model="editing.active" type="checkbox" /> {{ t('common.active') }}</label></div><button v-if="editing.role === 'STUDENT'" type="button" :disabled="isResetting" class="w-full rounded-lg bg-red-500 p-3 font-semibold text-white disabled:opacity-50" @click="resetResidentPassword">{{ t(isResetting ? 'adminMain.resetting' : 'adminMain.reset') }}</button><p v-if="editFeedback" :class="editFeedbackClass">{{ editFeedback }}</p><div class="flex justify-end gap-3"><button type="button" class="rounded border border-border px-4 py-2" @click="editing = null">{{ t('common.cancel') }}</button><button :disabled="isSaving || isResetting" class="rounded bg-accent px-4 py-2 text-white disabled:opacity-50">{{ t('adminMain.saveChanges') }}</button></div></form></div>
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
type ResidentImportRow = { rowNumber: number; object: string; roomID: number | null; dormID: number | null; fromDate: string; toDate: string; email: string; vacant: boolean; currentEmail: string | null; status: 'match' | 'create' | 'replace' | 'vacant' | 'invalid'; issue: string | null }
type ResidentImportRequestRow = { roomID: number; dormID: number; email: string; vacant: boolean }
type ResidentImportResult = { roomID: number; dormID: number; email?: string; status: 'created' | 'vacant' | 'failed'; code?: string; error?: string }
type Sensor = { sensorCode: string; type: string; location: string; dormID: number; dormAddress: string; dormFloor: number; recordedAt: string | null; errorCode: number | null; leakStatus: boolean | null; adminNote: string; noteUpdatedAt: string | null }
type SensorSortKey = keyof Sensor

const socket = getSocket()
const { t, locale } = useI18n()
const RESIDENT_IMPORT_BATCH_SIZE = 10
const isResearcher = computed(() => sessionStorage.getItem('userRole')?.toLowerCase() === 'researcher')
const activeSection = ref<'users' | 'sensors' | 'buildings' | null>(null)
const dorms = ref<Dorm[]>([]), users = ref<User[]>([]), sensors = ref<Sensor[]>([])
const newUserEmail = ref(''), dormID = ref<number | ''>(''), roomID = ref<number | ''>(''), createRole = ref<'STUDENT' | 'RESEARCHER' | 'ADMIN'>('STUDENT'), filterDorm = ref('all'), showInactiveUsers = ref(true)
const isAddUserModalOpen = ref(false)
const isResidentImportOpen = ref(false), isResidentImportBusy = ref(false), residentImportRows = ref<ResidentImportRow[]>([]), residentImportMatched = ref(0), selectedResidentRows = ref<number[]>([])
const residentImportFeedback = ref(''), residentImportFeedbackClass = ref('text-red-500')
const isSubmitting = ref(false), isResetting = ref(false), isSaving = ref(false)
const isGeneratingCleaning = ref(false), cleaningFeedback = ref(''), cleaningFeedbackClass = ref('')
const feedbackMessage = ref(''), feedbackClass = ref(''), editFeedback = ref(''), editFeedbackClass = ref('text-red-500')
const editing = ref<User | null>(null), pendingReplacement = ref<User | null>(null), replacementAction = ref<null | (() => Promise<void>)>(null)
type NewSensor = { sensorCode: string; type: string; location: string; dormID: number }
const sensorEntryMode = ref<'single' | 'bulk'>('single'), singleSensorDevEUI = ref(''), singleSensorDormID = ref<number | ''>(''), singleSensorPlacement = ref('Kitchen'), singleSensorWaterType = ref<'Cold Water' | 'Warm Water'>('Cold Water')
const sensorCsv = ref(''), isAddingSensors = ref(false)
const sensorFeedback = ref(''), sensorFeedbackClass = ref(''), editingSensor = ref<Sensor | null>(null), editSensorFeedback = ref(''), isSavingSensor = ref(false)
const isImportingHistory = ref(false), historicalImportFeedback = ref(''), historicalImportFeedbackClass = ref('')
const sensorSortKey = ref<SensorSortKey>('sensorCode'), sensorSortDirection = ref<1 | -1>(1)
const sensorHouseFilter = ref('all'), sensorFloorFilter = ref('all')
const newAddress = ref(''), floorCreationMode = ref<'single' | 'range'>('single'), newFloor = ref<number | ''>(''), newFloorTo = ref<number | ''>(''), newFloorRoomFormat = ref<'local' | 'full'>('local'), newFloorRooms = ref(''), roomDormID = ref<number | ''>(''), newRoomFormat = ref<'local' | 'full'>('local'), newRooms = ref('')
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
const validFloorSelection = computed(() => newFloor.value !== '' && (floorCreationMode.value === 'single' || (newFloorTo.value !== '' && newFloorTo.value >= newFloor.value && newFloorTo.value - newFloor.value < 50)))
const parsedNewRooms = computed(() => parseRoomIDs(newRooms.value))
const sensorCsvExample = 'House Number,Floor Number,Sensor Placement,Water Type,DevEUI\n14,3,Left Shower,Cold Water,8C1F64619000228D'
function parseCsvLine(line: string) {
  const values: string[] = []; let value = ''; let quoted = false
  for (let index = 0; index < line.length; index++) { const char = line[index]; if (char === '"' && quoted && line[index + 1] === '"') { value += '"'; index++ } else if (char === '"') quoted = !quoted; else if (char === ',' && !quoted) { values.push(value.trim()); value = '' } else value += char }
  values.push(value.trim()); return quoted ? null : values
}
const csvParseResult = computed<{ sensors: NewSensor[]; error: string }>(() => {
  if (!sensorCsv.value.trim()) return { sensors: [], error: '' }
  const lines = sensorCsv.value.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim())
  const header = parseCsvLine(lines[0])?.map(value => value.toLowerCase())
  const expected = ['house number', 'floor number', 'sensor placement', 'water type', 'deveui']
  if (!header || header.length !== expected.length || expected.some((value, index) => header[index] !== value)) return { sensors: [], error: t('adminMain.csvHeaderError') }
  const sensors: NewSensor[] = []; const seen = new Set<string>()
  for (let index = 1; index < lines.length; index++) {
    const row = parseCsvLine(lines[index]); if (!row || row.length !== 5) return { sensors: [], error: t('adminMain.csvColumnError', { row: index + 1 }) }
    const [house, floor, rawPlacement, rawWaterType, rawDevEUI] = row
    const dorm = dorms.value.find(item => item.address.trim().toLowerCase() === house.trim().toLowerCase() && item.floor === Number(floor))
    if (!dorm) return { sensors: [], error: t('adminMain.csvDormError', { row: index + 1, house, floor }) }
    const placement = ({ kitchen: 'Kitchen', 'left shower': 'Left Shower', 'right shower': 'Right Shower', 'shower right': 'Right Shower' } as Record<string, string>)[rawPlacement.toLowerCase()]
    if (!placement) return { sensors: [], error: t('adminMain.csvPlacementError', { row: index + 1 }) }
    const waterType = ({ cw: 'Cold Water', 'cold water': 'Cold Water', ww: 'Warm Water', 'warm water': 'Warm Water' } as Record<string, string>)[rawWaterType.toLowerCase()]
    if (!waterType) return { sensors: [], error: t('adminMain.csvWaterError', { row: index + 1 }) }
    const sensorCode = rawDevEUI.toLowerCase(); if (!/^[0-9a-f]{16}$/.test(sensorCode)) return { sensors: [], error: t('adminMain.csvDevEuiError', { row: index + 1 }) }
    if (seen.has(sensorCode)) return { sensors: [], error: t('adminMain.csvDuplicateError', { row: index + 1, devEui: rawDevEUI }) }; seen.add(sensorCode)
    sensors.push({ sensorCode, type: `${waterType} Meter`, location: placement, dormID: dorm.dormID })
  }
  return sensors.length ? { sensors, error: '' } : { sensors: [], error: t('adminMain.csvNoRows') }
})
const parsedCsvSensors = computed(() => csvParseResult.value.sensors)
const sensorCsvError = computed(() => csvParseResult.value.error)
const selectedRooms = (id: number | '' | null) => dorms.value.find(dorm => dorm.dormID === Number(id))?.rooms || []
const availableCreateRooms = computed(() => selectedRooms(dormID.value))
const canCreateUser = computed(() => {
  if (!newUserEmail.value.trim()) return false
  return createRole.value !== 'STUDENT' || (dormID.value !== '' && roomID.value !== '' && availableCreateRooms.value.includes(Number(roomID.value)))
})
const dormLabel = (dorm: Dorm) => `${t('common.houseLabel', { house: dorm.address })}, ${t('survey.floor', { floor: dorm.floor })}`
const dormName = (sensor: Sensor) => `${t('common.houseLabel', { house: sensor.dormAddress })}, ${t('survey.floor', { floor: sensor.dormFloor })}`
const filteredUsers = computed(() => users.value.filter(user =>
  (showInactiveUsers.value || user.active) &&
  (filterDorm.value === 'all' || String(user.dormID) === filterDorm.value)
))
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

async function createFloor() { isSavingBuilding.value = true; buildingFeedback.value = ''; try { const payload = { address: newAddress.value, floor: newFloor.value, ...(floorCreationMode.value === 'range' ? { floorTo: newFloorTo.value } : {}), roomNumbers: parsedFloorRooms.value, roomNumberFormat: newFloorRoomFormat.value }; const response = await fetch(apiUrl('/api/auth/admin/dorms'), { method: 'POST', headers: headers(), body: JSON.stringify(payload) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || t('adminMain.createFloorError')); buildingFeedback.value = data.floors.length === 1 ? t('adminMain.floorCreated', { house: data.address, floor: data.floorFrom, count: data.totalRooms }) : t('adminMain.floorRangeCreated', { house: data.address, from: data.floorFrom, to: data.floorTo, floors: data.floors.length, rooms: data.totalRooms }); buildingFeedbackClass.value = 'text-green-600'; newAddress.value = ''; newFloor.value = ''; newFloorTo.value = ''; newFloorRooms.value = ''; await loadDorms() } catch (error) { buildingFeedback.value = error instanceof Error ? error.message : t('adminMain.createFloorError'); buildingFeedbackClass.value = 'text-red-500' } finally { isSavingBuilding.value = false } }
async function addRooms() { isSavingBuilding.value = true; buildingFeedback.value = ''; try { const response = await fetch(apiUrl(`/api/auth/admin/dorms/${roomDormID.value}/rooms`), { method: 'POST', headers: headers(), body: JSON.stringify({ roomNumbers: parsedNewRooms.value, roomNumberFormat: newRoomFormat.value }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || t('adminMain.addRoomsError')); buildingFeedback.value = t('adminMain.roomsAdded', { created: data.created.length, skipped: data.skipped.length }); buildingFeedbackClass.value = 'text-green-600'; newRooms.value = ''; await loadDorms() } catch (error) { buildingFeedback.value = error instanceof Error ? error.message : t('adminMain.addRoomsError'); buildingFeedbackClass.value = 'text-red-500' } finally { isSavingBuilding.value = false } }

async function loadSensorCsvFile(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (file) sensorCsv.value = await file.text() }
async function addSensors() { const sensors: NewSensor[] = sensorEntryMode.value === 'single' ? [{ sensorCode: singleSensorDevEUI.value.toLowerCase(), type: `${singleSensorWaterType.value} Meter`, location: singleSensorPlacement.value, dormID: Number(singleSensorDormID.value) }] : parsedCsvSensors.value; if (!sensors.length) return; isAddingSensors.value = true; sensorFeedback.value = ''; try { const response = await fetch(apiUrl('/api/sensor-data/admin/sensors'), { method: 'POST', headers: headers(), body: JSON.stringify({ sensors }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || t('adminMain.addSensorsError')); sensorFeedback.value = t('adminMain.sensorsRegistered', { created: data.created.length, skipped: data.skipped.length }); sensorFeedbackClass.value = 'text-green-600'; if (sensorEntryMode.value === 'single') singleSensorDevEUI.value = ''; else sensorCsv.value = ''; await loadSensors() } catch (error) { sensorFeedback.value = error instanceof Error ? error.message : t('adminMain.addSensorsError'); sensorFeedbackClass.value = 'text-red-500' } finally { isAddingSensors.value = false } }
async function importHistoricalData() { if (!confirm(t('adminMain.recoveryConfirm'))) return; isImportingHistory.value = true; historicalImportFeedback.value = t('adminMain.importStarting'); historicalImportFeedbackClass.value = ''; try { const response = await fetch(apiUrl('/api/sensor-data/admin/import-historical'), { method: 'POST', headers: headers() }); if (!response.ok && response.status !== 409) throw new Error(t('adminMain.importStartError')); while (true) { const statusResponse = await fetch(apiUrl('/api/sensor-data/admin/import-historical'), { headers: headers() }); const statusData = await statusResponse.json(); if (!statusResponse.ok) throw new Error(t('adminMain.importProgressError')); const job = statusData.job; const progress = job.progress; if (progress) historicalImportFeedback.value = t('adminMain.importProgress', { completed: progress.batchesCompleted, total: progress.totalBatches, date: formatDate(new Date(progress.startedFrom * 1000).toISOString()), snapshots: progress.snapshots, retries: progress.retries || 0 }); if (job.status === 'completed') { historicalImportFeedback.value = t('adminMain.importComplete', { snapshots: progress.snapshots, batches: progress.totalBatches }); historicalImportFeedbackClass.value = 'text-green-700 dark:text-green-400'; await loadSensors(); break } if (job.status === 'failed') throw new Error(t('adminMain.importFailed')); await new Promise(resolve => setTimeout(resolve, 2000)) } } catch (error) { historicalImportFeedback.value = error instanceof Error ? error.message : t('adminMain.importError'); historicalImportFeedbackClass.value = 'text-red-600' } finally { isImportingHistory.value = false } }
function startSensorEdit(sensor: Sensor) { editingSensor.value = { ...sensor, adminNote: sensor.adminNote || '' }; editSensorFeedback.value = '' }
async function saveSensor() { if (!editingSensor.value) return; isSavingSensor.value = true; editSensorFeedback.value = ''; try { const sensorCode = encodeURIComponent(editingSensor.value.sensorCode); const response = await fetch(apiUrl(`/api/sensor-data/admin/sensors/${sensorCode}`), { method: 'PATCH', headers: headers(), body: JSON.stringify({ type: editingSensor.value.type, location: editingSensor.value.location, dormID: editingSensor.value.dormID }) }); if (!response.ok) throw new Error(t('adminMain.updateSensorError')); const noteResponse = await fetch(apiUrl(`/api/sensor-data/admin/sensors/${sensorCode}/note`), { method: 'PUT', headers: headers(), body: JSON.stringify({ note: editingSensor.value.adminNote }) }); if (!noteResponse.ok) throw new Error(t('adminMain.saveNoteError')); editingSensor.value = null; await loadSensors() } catch (error) { editSensorFeedback.value = error instanceof Error ? error.message : t('adminMain.updateSensorError') } finally { isSavingSensor.value = false } }

type CreateUserRequest = { email: string; dormID: number | null; roomID: number | null; role: User['role']; replaceExisting: boolean }
function createUserRequest(replaceExisting: boolean): CreateUserRequest {
  const isStudent = createRole.value === 'STUDENT'
  return {
    email: newUserEmail.value.trim(),
    dormID: isStudent ? Number(dormID.value) : null,
    roomID: isStudent ? Number(roomID.value) : null,
    role: createRole.value,
    replaceExisting,
  }
}
async function createResident(replaceExisting: boolean) {
  if (isSubmitting.value || (!replaceExisting && !canCreateUser.value)) return
  const request = createUserRequest(replaceExisting)
  isSubmitting.value = true
  feedbackMessage.value = ''
  try {
    const response = await fetch(apiUrl('/api/auth/residents'), { method: 'POST', headers: headers(), body: JSON.stringify(request) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (response.status === 409 && data.code === 'ROOM_OCCUPIED') {
        pendingReplacement.value = data.existingUser
        replacementAction.value = () => createResident(true)
        return
      }
      throw new Error(data.error || t('adminMain.createError'))
    }
    feedbackMessage.value = t('adminMain.accountCreated', { email: data.email })
    newUserEmail.value = ''
    feedbackClass.value = 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
    if (request.role === 'STUDENT') roomID.value = ''
    await loadUsers()
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : t('adminMain.createError')
    feedbackClass.value = 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
  } finally {
    isSubmitting.value = false
  }
}
async function resetResidentPassword() { if (!editing.value || editing.value.role !== 'STUDENT' || editing.value.dormID == null) return; if (!confirm(t('adminMain.resetConfirm', { email: editing.value.email }))) return; isResetting.value = true; editFeedback.value = ''; try { const response = await fetch(apiUrl('/api/auth/admin/reset-resident-password'), { method: 'POST', headers: headers(), body: JSON.stringify({ email: editing.value.email, dormID: editing.value.dormID }) }); if (!response.ok) throw new Error(t('adminMain.resetError')); editFeedback.value = t('adminMain.resetSuccess'); editFeedbackClass.value = 'text-green-600'; await loadUsers() } catch (error) { editFeedback.value = error instanceof Error ? error.message : t('adminMain.resetError'); editFeedbackClass.value = 'text-red-500' } finally { isResetting.value = false } }
async function generateCleaningSchedule() { isGeneratingCleaning.value = true; cleaningFeedback.value = ''; try { const response = await fetch(apiUrl('/api/auth/admin/cleaning-weeks/generate'), { method: 'POST', headers: headers() }); const data = await response.json(); if (!response.ok) throw new Error(t('adminMain.scheduleError')); const summary = data.summary; cleaningFeedback.value = t('adminMain.scheduleSummary', { created: summary.weeksCreated, reassigned: summary.weeksReassigned, unchanged: summary.weeksUnchanged }); cleaningFeedbackClass.value = 'text-green-600' } catch (error) { cleaningFeedback.value = error instanceof Error ? error.message : t('adminMain.scheduleError'); cleaningFeedbackClass.value = 'text-red-500' } finally { isGeneratingCleaning.value = false } }
function openAddUserModal() { feedbackMessage.value = ''; isAddUserModalOpen.value = true }
function openResidentImport() { residentImportRows.value = []; selectedResidentRows.value = []; residentImportFeedback.value = ''; isResidentImportOpen.value = true }
function closeResidentImport() { if (!isResidentImportBusy.value) isResidentImportOpen.value = false }
async function previewResidentWorkbook(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  isResidentImportBusy.value = true; residentImportFeedback.value = ''; residentImportRows.value = []
  try {
    const form = new FormData(); form.append('file', file)
    const response = await fetch(apiUrl('/api/auth/admin/resident-import/preview'), { method: 'POST', headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken')}` }, body: form })
    const data = await response.json(); if (!response.ok) throw new Error(data.error || t('adminMain.residentImportReadError'))
    residentImportRows.value = data.rows.filter((row: ResidentImportRow) => row.status !== 'match')
    residentImportMatched.value = data.matched
    selectedResidentRows.value = residentImportRows.value.filter(row => row.status !== 'invalid').map(row => row.rowNumber)
    residentImportFeedback.value = t('adminMain.residentImportReady', { count: residentImportRows.value.length }); residentImportFeedbackClass.value = 'text-green-600'
  } catch (error) { residentImportFeedback.value = error instanceof Error ? error.message : t('adminMain.residentImportReadError'); residentImportFeedbackClass.value = 'text-red-500' }
  finally { isResidentImportBusy.value = false }
}
async function applyResidentImport() {
  const selected = new Set(selectedResidentRows.value)
  const sourceRows = residentImportRows.value.filter(row => selected.has(row.rowNumber) && row.roomID != null && row.dormID != null)
  const rows: ResidentImportRequestRow[] = sourceRows.map(row => ({ roomID: row.roomID!, dormID: row.dormID!, email: row.vacant ? '' : row.email, vacant: row.vacant }))
  if (!sourceRows.length) return
  isResidentImportBusy.value = true; residentImportFeedback.value = ''
  const results: ResidentImportResult[] = []
  try {
    for (let offset = 0; offset < rows.length; offset += RESIDENT_IMPORT_BATCH_SIZE) {
      const batch = rows.slice(offset, offset + RESIDENT_IMPORT_BATCH_SIZE)
      residentImportFeedback.value = t('adminMain.residentImportProgress', { completed: offset, total: rows.length })
      try {
        const response = await fetch(apiUrl('/api/auth/admin/resident-import/apply'), { method: 'POST', headers: headers(), body: JSON.stringify({ rows: batch }) })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          const details = Array.isArray(data.error)
            ? data.error.map((issue: { message?: string }) => issue.message).filter(Boolean).join(' ')
            : typeof data.error === 'string' ? data.error : ''
          throw new Error(details || t('adminMain.residentImportApplyError'))
        }
        if (!Array.isArray(data.results)) throw new Error(t('adminMain.residentImportApplyError'))
        results.push(...data.results)
      } catch (error) {
        const message = error instanceof Error ? error.message : t('adminMain.residentImportApplyError')
        results.push(...batch.map(row => ({ ...row, status: 'failed' as const, code: 'REQUEST_FAILED', error: message })))
      }
    }

    const failures = results.filter(result => result.status === 'failed')
    const succeeded = results.length - failures.length
    residentImportFeedback.value = t('adminMain.residentImportComplete', { succeeded, failed: failures.length })
    residentImportFeedbackClass.value = failures.length ? 'text-orange-600' : 'text-green-600'
    if (failures.length) {
      const failuresByRoom = new Map(failures.map(result => [`${result.dormID}:${result.roomID}`, result]))
      residentImportRows.value = sourceRows
        .filter(row => failuresByRoom.has(`${row.dormID}:${row.roomID}`))
        .map(row => ({ ...row, issue: failuresByRoom.get(`${row.dormID}:${row.roomID}`)?.error || t('adminMain.residentImportApplyError') }))
      selectedResidentRows.value = residentImportRows.value.map(row => row.rowNumber)
    } else {
      residentImportRows.value = []
      selectedResidentRows.value = []
    }
    if (succeeded) await loadUsers()
  } finally {
    isResidentImportBusy.value = false
  }
}
function startEdit(user: User) { editing.value = { ...user }; editFeedback.value = ''; editFeedbackClass.value = 'text-red-500' }
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
watch(dormID, () => {
  if (!availableCreateRooms.value.includes(Number(roomID.value))) roomID.value = ''
})
watch(createRole, role => {
  if (role !== 'STUDENT') {
    dormID.value = ''
    roomID.value = ''
  }
  feedbackMessage.value = ''
})
watch(sensorHouses, houses => { if (sensorHouseFilter.value !== 'all' && !houses.includes(sensorHouseFilter.value)) sensorHouseFilter.value = 'all' })
watch(sensorFloors, floors => { if (sensorFloorFilter.value !== 'all' && !floors.includes(Number(sensorFloorFilter.value))) sensorFloorFilter.value = 'all' })
onMounted(() => { if (!isResearcher.value) loadDorms().catch(error => { feedbackMessage.value = error.message; feedbackClass.value = 'text-red-500' }) })
</script>

<style scoped>
/* Keep every admin dialog usable on short and narrow viewports. */
main > .fixed {
  align-items: flex-start;
  overflow-y: auto;
  padding-top: max(0.75rem, env(safe-area-inset-top));
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
}

main > .fixed > div,
main > .fixed > form {
  max-height: calc(100dvh - 1.5rem - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  min-width: 0;
  margin-block: auto;
  overflow-y: auto;
}

@media (max-width: 639px) {
  main > .fixed > div,
  main > .fixed > form {
    padding: 1rem;
  }

  main > .fixed .grid-cols-2 {
    grid-template-columns: minmax(0, 1fr);
  }

  main > .fixed :is(input, select, textarea) {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  main > .fixed .justify-end {
    flex-wrap: wrap;
  }
}
</style>
