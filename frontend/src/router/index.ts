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
      component: () => import('../views/SurveyView.vue'),
      meta: { requiresAuth: true, requiresResearchAccess: true },
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
      path: '/community',
      name: 'community',
      component: () => import('../views/CommunityView.vue'),
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
      meta: { requiresAuth: true, requiresResearchAccess: true },
    },
    {
      path: '/admin/water-analytics',
      name: 'admin-water-analytics',
      component: () => import('../views/AdminWaterStatsView.vue'),
      meta: { requiresAuth: true, requiresResearchAccess: true },
    },
    {
      path: '/admin/app-usage',
      name: 'admin-app-usage',
      component: () => import('../views/AdminUsageView.vue'),
      meta: { requiresAuth: true, requiresResearchAccess: true },
    },
    {
      path: '/admin/events',
      name: 'admin-events',
      component: () => import('../views/AdminEventsView.vue'),
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
      redirect: to => ({ name: 'chat', query: { room: String(to.params.id) } }),
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
  const normalizedRole = userRole?.toLowerCase();
  const researcherRoutes = new Set(['admin', 'admin-water-analytics', 'admin-app-usage', 'survey', 'account', 'change-password']);

  if (to.meta.requiresAuth && !token) {
    // If the route requires authentication and no token is found, redirect to login
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.name === 'login' && token) {
    next({ name: mustChangePassword ? 'change-password' : normalizedRole === 'researcher' || normalizedRole === 'admin' ? 'admin' : 'home' });
  } else if (mustChangePassword && to.name !== 'change-password') {
    next({ name: 'change-password' });
  } else if (to.meta.requiresAdmin && userRole?.toLowerCase() !== 'admin') {
    // If the user tries to access the AdminView but is not an admin, redirect to login
    next({ name: 'login' });
  } else if (to.meta.requiresResearchAccess && !['admin', 'researcher'].includes(userRole?.toLowerCase() || '')) {
    next({ name: 'login' });
  } else if (normalizedRole === 'researcher' && !researcherRoutes.has(String(to.name))) {
    next({ name: 'admin' });
  } else {
    next(); // Allow navigation
  }
});

export default router;
