import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },

    {
      path: '/stats',
      name: 'stats',
      component: () => import('../views/StatsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/events',
      name: 'events',
      component: () => import('../views/EventView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true },
    },
  ],
});

// Add a global navigation guard
router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('authToken'); // Retrieve the token from sessionStorage
  const userRole = sessionStorage.getItem('userRole'); // Retrieve the user's role

  if (to.meta.requiresAuth && !token) {
    // If the route requires authentication and no token is found, redirect to login
    next({ name: 'login' });
  } else if (to.name === 'admin' && userRole !== 'admin') {
    // If the user tries to access the AdminView but is not an admin, redirect to login
    next({ name: 'login' });
  } else {
    next(); // Allow navigation
  }
});

export default router;
