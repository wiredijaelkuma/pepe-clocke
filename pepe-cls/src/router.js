import { createRouter, createWebHashHistory } from 'vue-router'
import UserLogin from './UserLogin.vue';
import AgentLayout from './AgentLayout.vue';
import AdminInterface from './AdminInterface.vue';
import { account } from './lib/appwrite';
import { authorizedUserEmails } from './authorizedUsers';

const routes = [
  { path: '/', component: UserLogin },
  { path: '/agent', component: AgentLayout, meta: { requiresAuth: true } },
  {
    path: '/admin',
    component: AdminInterface,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        component: () => import('./components/admin/Overview.vue'),
      },
      {
        path: 'requests',
        component: () => import('./components/admin/AdminRequests.vue'),
      },
      {
        path: 'agent-management',
        component: () => import('./components/admin/AgentManagement.vue'),
      },
      {
        path: 'time-log',
        component: () => import('./components/admin/TimeLog.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  console.log('Navigating to:', to.path);
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

  // Skip auth check for login page
  if (to.path === '/') {
    return next();
  }

  let user = null;
  try {
    user = await account.get();
    console.log('User authenticated:', user);
  } catch (error) {
    console.log('Authentication error:', error.message);
    // Not logged in
  }

  if (requiresAuth && !user) {
    console.log('Auth required but no user, redirecting to login');
    next('/');
  } else if (requiresAdmin && !authorizedUserEmails.includes(user?.email)) {
    console.log('Admin required but user not authorized');
    next('/');
  } else {
    console.log('Navigation allowed to:', to.path);
    next();
  }
});

export default router;