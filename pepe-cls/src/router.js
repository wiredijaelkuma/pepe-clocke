import { createRouter, createWebHistory } from 'vue-router'
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
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

  let user = null;
  try {
    user = await account.get();
  } catch {
    // Not logged in
  }

  if (requiresAuth && !user) {
    next('/');
  } else if (requiresAdmin && !authorizedUserEmails.includes(user?.email)) {
    next('/');
  } else {
    next();
  }
});

export default router;
