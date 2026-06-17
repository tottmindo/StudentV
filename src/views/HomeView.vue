<template>
  <div class="h-screen w-full p-[1rem]">
    <div class="grid gap-4 grid-cols-[80%_18%] grid-rows-[8%_90%] h-full">

      <!-- Background Image Section -->
      <div class="row-start-2 col-start-1 relative w-full h-full border-2 bg-cover bg-center bg-background dark:bg-background-dark">

      <!-- Sidebar Section -->
      <div class="row-start-2 col-start-2 grid grid-rows-3 gap-4 h-full"> 
        </div>
        <!-- News and Updates -->
        <div class="bg-secondary dark:bg-secondary-dark text-center rounded-md p-4">
          <button @click="showNewsModal=true" class="text-text-headline hover:text-primary text-xl">News and Updates</button>
          <ul class="font-semibold text-l text-text dark:text-text-dark">
            <li> - Fire alarm maintenance between 12:00-16:30</li>
            <li> - Available dormrooms in corridor 5</li>
          </ul>
        </div>

        <!-- Challenges Section -->
        <div class="bg-secondary dark:bg-secondary-dark text-center rounded-md p-4">
          <div class="swiper challenges-swiper">
            <div class="swiper-wrapper">
              <div class="swiper-slide flex flex-col items-center justify-center">
                <h3 class="text-xl text-text-headline">Keep It Short & Sweet</h3>
                <p class="font-semibold  text-text dark:text-text-dark">Try a shorter shower today, every minute counts!</p>
              </div>import aboutSeascape from '@/assets/about-seascape.json';
              <div class="swiper-slide">
                <h3 class="text-xl text-text-headline">Pause While You Soap</h3>
                <p class="font-semibold  text-text dark:text-text-dark">Turn off the water while you lather, it’s a small action with a big impact.</p>
              </div>
              <div class="swiper-slide">
                <h3 class="text-xl text-text-headline">Brush Smart</h3>
                <p class="font-semibold  text-text dark:text-text-dark">Don't let the tap run while brushing your teeth, turn it off and save!</p>
              </div>
              <div class="swiper-slide">
                <h3 class="text-xl text-text-headline">Shower Together</h3>
                <p class="font-semibold  text-text dark:text-text-dark">Shower with a friend, it’s fun and saves water!</p>
              </div>
              <div class="swiper-slide">
                <h3 class="text-xl text-text-headline">Cool Water, Smarter Way</h3>
                <p class="font-semibold  text-text dark:text-text-dark">Keep a jug of water in the fridge instead of running the tap for cold water.</p>
              </div>
            </div>

            <div class="">
              <div class="swiper-button-prev"></div>
              <div class="swiper-button-next"></div>
            </div>
          </div>
        </div>

        <!-- Stats Section -->
        <div class="bg-secondary dark:bg-secondary-dark text-center rounded-md p-4">
          <div class="swiper stats-swiper">
            <div class="swiper-wrapper">
              <div class="swiper-slide flex flex-col items-center justify-center">
                <router-link to="/stats" class="text-text-headline hover:text-primary text-xl">Average shower time</router-link>
                <p class="font-semibold text-5xl text-text dark:text-text-dark">8m 12s</p>
              </div>
              <div class="swiper-slide">
                <router-link to="/stats" class="text-text-headline hover:text-primary text-xl">Yesterday's water consumption</router-link>
                <p class="font-semibold text-5xl text-text dark:text-text-dark">1230 litres</p>
              </div>
              <div class="swiper-slide">
                <router-link to="/stats" class="text-text-headline hover:text-primary text-xl">Average water temperature</router-link>
                <p class="font-semibold text-5xl text-text dark:text-text-dark">25,7°C</p>
              </div>
            </div>
            <div class="swiper-pagination"></div>
            <div class="">
              <div class="swiper-button-prev"></div>
              <div class="swiper-button-next"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- About Section -->
      <div class="col-span-2 row-start-1 bg-secondary dark:bg-secondary-dark rounded-md pt-2 h-full flex relative">
          <button @click="showAboutModal=true" class="absolute hover:opacity-50 pt-1 left-3">
            <img src="https://cdn-icons-png.flaticon.com/512/1/1176.png" alt="Info" width="40" height="40">
          </button>
          <NavComponent :key="navKey" :socket="socket" :menu="menuType" class="absolute pt-2 right-4"/>
      </div>
    </div>
  </div>
  
  <!-- Modal Component for News -->
  <ModalComponent v-model="showNewsModal">
    NEWS AND UPDATES
  </ModalComponent>

</template>


<script setup lang="ts">
import NavComponent from '@/components/NavComponent.vue';
import {  onMounted, ref } from 'vue';

import { getSocket } from '@/composables/socket';
const socket = getSocket(); // Import the socket instance from socket.ts

import Swiper from 'swiper/bundle';
//import 'swiper/css/bundle';
import '@/assets/custom-swiper.css'
import ModalComponent from '@/components/ModalComponent.vue';



const menuType = ref('home');
socket.on('connect', () => {
  console.log('Connected to the server');
});

const showNewsModal = ref(false);
const showAboutModal = ref(false);

type MenuItem = {
  name: string;
  link: string;
};
const navKey = ref(0); // Reactive key for NavComponent

const refreshNav = () => {
  
  navKey.value++; // Increment the key to force re-render
};
//Göra dessa reaktiva?
onMounted(() => {
  socket.emit("getMenuData", "en"); // Fetch menu items from server, switch between "sv" and "en" for desired language
  socket.on("menuData", (labels: Record<string, MenuItem[]>) => {
    localStorage.setItem("menuData", JSON.stringify(labels));
    refreshNav(); // Refresh NavComponent when new menu data is received
  });

  // Handle errors
  socket.on("error", (error: { message: string }) => {
    console.error("Error from server:", error.message);
  });

  new Swiper('.challenges-swiper', {
    loop: true,
    autoplay: {
      delay: 15000,
      disableOnInteraction: false,
    },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  // If we need pagination
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  }) 

  new Swiper('.stats-swiper', {
    loop: true,
    autoplay: {
      delay: 15000,
      disableOnInteraction: false,
    },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  // If we need pagination
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  })

});

</script>
