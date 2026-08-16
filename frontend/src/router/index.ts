import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import { apiUrl } from '../composables/api';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue'),
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: () => import('../views/ChangePasswordView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },

    {
      path: '/survey',
      name: 'survey',
      component: () => import('../views/SurveyView.vue')
    },

    {
      path: '/answerSurvey/:id',
      name: 'answerSurvey',
      component: () => import('../views/AnswerSurveyView.vue'),
      meta: { requiresAuth: true }
    },

    {
      path: '/createSurvey/:id?',
      name: 'createSurvey',
      component: () => import('../views/CreateSurveyView.vue'),
      meta: { requiresAuth: true },
    },

    {
      path: '/stats',
      name: 'stats',
      component: () => import('../views/StatsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('../views/AccountView.vue'),
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
      path: '/cleaning',
      name: 'cleaning',
      component: () => import('../views/CleaningView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/water-analytics',
      name: 'admin-water-analytics',
      component: () => import('../views/AdminWaterStatsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/app-usage',
      name: 'admin-app-usage',
      component: () => import('../views/AdminUsageView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../views/ChatView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/chatRoom/:id',
      name: 'chatRoom',
      component: () => import('../views/ChatRoomView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.afterEach((to) => {
  const token = sessionStorage.getItem('authToken');
  const page = typeof to.name === 'string' ? to.name : '';
  if (!token || !page || page === 'admin-app-usage') return;
  void fetch(apiUrl('/api/usage/visit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ page }),
    keepalive: true,
  }).catch(() => undefined);
});

// Add a global navigation guard
router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('authToken'); // Retrieve the token from sessionStorage
  const userRole = sessionStorage.getItem('userRole'); // Retrieve the user's role
  const mustChangePassword = sessionStorage.getItem('mustChangePassword') === 'true';

  if (to.meta.requiresAuth && !token) {
    // If the route requires authentication and no token is found, redirect to login
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.name === 'login' && token) {
    next({ name: mustChangePassword ? 'change-password' : 'home' });
  } else if (mustChangePassword && to.name !== 'change-password') {
    next({ name: 'change-password' });
  } else if (to.meta.requiresAdmin && userRole?.toLowerCase() !== 'admin') {
    // If the user tries to access the AdminView but is not an admin, redirect to login
    next({ name: 'login' });
  } else {
    next(); // Allow navigation
  }
});

export default router;
