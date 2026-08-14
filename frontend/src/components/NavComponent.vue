<template>
  <div class="z-50">
    <!-- Hamburger Icon -->
    <button
      @click="toggleMenu()"
      class="z-50 flex flex-col justify-between w-8 h-6 cursor-pointer"
      aria-label="Toggle menu"
    >
      <span :class="barClass(1)"></span>
      <span :class="barClass(2)"></span>
      <span :class="barClass(3)"></span>
    </button>

    <!-- Slide-out Menu -->
    <div
      class="fixed top-0 right-0 h-full w-64 z-40 transform transition-transform duration-300 ease-in-out shadow-xl
             bg-surface dark:bg-surface-dark p-6"
      :class="{ 'translate-x-0': isOpen, 'translate-x-full': !isOpen }"
    >
      <ul class="space-y-4">
        <router-link to="/account" @click="closeMenu" class="block" active-class="menu-active">
          <div class="inline-flex w-full items-center gap-2 rounded-xl px-4 py-2 font-semibold hover:bg-accent-dark dark:hover:bg-accent">
            Account settings
          </div>
        </router-link>
        
        <!-- Logout Button -->
        
          <button
            @click="logout"
            class="w-full py-2 px-4 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600
                   transition-colors duration-300"
          >
            Logout
          </button>
        

        <!-- Menu Items -->
        <router-link
          v-for="item in menuItems"
          :key="item.name"
          :to="item.link"
          @click="closeMenu"
          class="block"
          active-class="menu-active"
        >
          <div
            class="inline-flex items-center gap-2 w-full cursor-pointer py-2 px-4 rounded-xl font-semibold
                  text-text dark:text-text-dark bg-surface dark:bg-surface-dark
                  hover:bg-accent-dark dark:hover:bg-accent transition-colors duration-300"
          >
            {{ item.name }}
          </div>
        </router-link>

        <!-- Admin Link -->
        <router-link
          to="/admin"
          v-if="role === 'admin'"
          @click="closeMenu"
          class="block"
          active-class="menu-active"
        >
          <div
            class="inline-flex items-center gap-2 w-full cursor-pointer py-2 px-4 rounded-xl font-semibold
                  text-text dark:text-text-dark bg-surface dark:bg-surface-dark
                  hover:bg-accent-dark dark:hover:bg-accent transition-colors duration-300"
          >
            Admin
          </div>
        </router-link>
        <router-link
          to="/admin/water-analytics"
          v-if="role?.toLowerCase() === 'admin'"
          @click="closeMenu"
          class="block"
          active-class="menu-active"
        >
          <div class="inline-flex w-full items-center gap-2 rounded-xl px-4 py-2 font-semibold text-text hover:bg-accent-dark dark:text-text-dark dark:hover:bg-accent">
            Water analytics
          </div>
        </router-link>
        <router-link
          to="/survey"
          v-if="role === 'admin'"
          @click="closeMenu"
          class="block"
          active-class="menu-active"
          >
          <div
            class="inline-flex items-center gap-2 w-full cursor-pointer py-2 px-4 rounded-xl font-semibold
                  text-text dark:text-text-dark bg-surface dark:bg-surface-dark
                  hover:bg-accent-dark dark:hover:bg-accent transition-colors duration-300"
          >
            Survey
          </div>
        </router-link>
      </ul>
    </div>

    <!-- Overlay -->
    <div
      v-if="isOpen"
      @click="closeMenu"
      class="fixed inset-0 z-30 bg-black bg-opacity-40 backdrop-blur-sm"
    />
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { MenuItem } from '@/types'

const props = defineProps<{
  menu: string
  socket: any
}>()

const isOpen = ref(false)
const toggleMenu = () => (isOpen.value = !isOpen.value)
const closeMenu = () => (isOpen.value = false)
const role = sessionStorage.getItem('userRole')
const router = useRouter()
const logout = () => {
  sessionStorage.clear()
  router.push({ name: 'login' })
}

const menuItems = ref<MenuItem[]>([])
const menuData = ref<Record<string, MenuItem[]>>({})

onMounted(() => {
  menuData.value = JSON.parse(localStorage.getItem('menuData') || '{}')
  menuItems.value = (menuData.value[props.menu] || []) as MenuItem[]
})

const barClass = (index: number) => {
  return [
    'block h-1 w-full rounded-sm transition-all duration-300 ease-in-out',
    // Color adjustments for light and dark modes
    'bg-accent dark:bg-accent-dark', // Use the red accent color for the hamburger icon
    isOpen.value
      ? index === 1
        ? 'transform translate-y-[9px] rotate-45' // First bar (rotates into X)
        : index === 2
          ? 'opacity-0' // Second bar (disappears)
          : 'transform -translate-y-[9px] -rotate-45' // Third bar (rotates into X)
      : ''
  ].join(' ')
}

</script>
