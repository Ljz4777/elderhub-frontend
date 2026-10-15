import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

import Layout from '@/layout/index.vue'

/**
 * 静态路由表（不做动态 addRoute）。
 * meta.roles: 允许访问的角色数组；缺省 = 登录即可访问。
 */
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', roles: ['ADMIN', 'USER'] },
      },
      // ---- 床位管理（ADMIN）----
      {
        path: 'bed/map',
        name: 'BedMap',
        component: () => import('@/views/bed/MapView.vue'),
        meta: { title: '床位图', roles: ['ADMIN'] },
      },
      {
        path: 'bed/details',
        name: 'BedDetails',
        component: () => import('@/views/bed/Details.vue'),
        meta: { title: '床位使用详情', roles: ['ADMIN'] },
      },
      // ---- 客户管理（ADMIN）----
      {
        path: 'customer',
        name: 'Customer',
        component: () => import('@/views/customer/index.vue'),
        meta: { title: '客户管理', roles: ['ADMIN'] },
      },
      // ---- 护理管理（ADMIN）----
      {
        path: 'nurse/level',
        name: 'NurseLevel',
        component: () => import('@/views/nurse/Level.vue'),
        meta: { title: '护理级别', roles: ['ADMIN'] },
      },
      {
        path: 'nurse/content',
        name: 'NurseContent',
        component: () => import('@/views/nurse/Content.vue'),
        meta: { title: '护理项目', roles: ['ADMIN'] },
      },
      {
        path: 'nurse/customer-items',
        name: 'NurseCustomerItems',
        component: () => import('@/views/nurse/CustomerItems.vue'),
        meta: { title: '客户护理项目', roles: ['ADMIN'] },
      },
      // ---- 业务审批（ADMIN）----
      {
        path: 'outward',
        name: 'OutwardAdmin',
        component: () => import('@/views/business/OutwardAdmin.vue'),
        meta: { title: '外出审批', roles: ['ADMIN'] },
      },
      {
        path: 'backdown',
        name: 'BackdownAdmin',
        component: () => import('@/views/business/BackdownAdmin.vue'),
        meta: { title: '退住审批', roles: ['ADMIN'] },
      },
      {
        path: 'records',
        name: 'RecordAdmin',
        component: () => import('@/views/business/RecordAdmin.vue'),
        meta: { title: '护理记录', roles: ['ADMIN'] },
      },
      // ---- 管家工作台（USER）----
      {
        path: 'my/customers',
        name: 'MyCustomers',
        component: () => import('@/views/nursework/Customers.vue'),
        meta: { title: '我的客户', roles: ['USER'] },
      },
      {
        path: 'my/records',
        name: 'MyRecords',
        component: () => import('@/views/nursework/Records.vue'),
        meta: { title: '我的护理记录', roles: ['USER'] },
      },
      {
        path: 'my/outward',
        name: 'MyOutward',
        component: () => import('@/views/nursework/Outward.vue'),
        meta: { title: '外出登记', roles: ['USER'] },
      },
      {
        path: 'my/backdown',
        name: 'MyBackdown',
        component: () => import('@/views/nursework/Backdown.vue'),
        meta: { title: '退住申请', roles: ['USER'] },
      },
      // ---- 餐饮管理 ----
      {
        path: 'food',
        name: 'Food',
        component: () => import('@/views/food/index.vue'),
        meta: { title: '餐饮管理', roles: ['ADMIN'] },
      },
      {
        path: 'preference',
        name: 'Preference',
        component: () => import('@/views/preference/index.vue'),
        meta: { title: '客户偏好', roles: ['ADMIN'] },
      },
      // ---- 系统管理（ADMIN）----
      {
        path: 'system/user',
        name: 'SystemUser',
        component: () => import('@/views/system/User.vue'),
        meta: { title: '用户管理', roles: ['ADMIN'] },
      },
      {
        path: 'system/role',
        name: 'SystemRole',
        component: () => import('@/views/system/Role.vue'),
        meta: { title: '角色管理', roles: ['ADMIN'] },
      },
      {
        path: 'system/menu',
        name: 'SystemMenu',
        component: () => import('@/views/system/Menu.vue'),
        meta: { title: '菜单管理', roles: ['ADMIN'] },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { public: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const userStore = useUserStore()

  // 1. 未登录：只能去公开页（login / 404）
  if (!to.meta.public && !userStore.isLogin) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  // 2. 已登录访问 /login → 仪表盘
  if (to.path === '/login' && userStore.isLogin) {
    return { path: '/dashboard' }
  }
  // 3. 角色不匹配（管理员挡在 /my/* 之外，管家挡在管理页之外）
  if (to.meta.roles && !to.meta.roles.includes(userStore.isAdmin ? 'ADMIN' : 'USER')) {
    ElMessage.warning('无权限访问该页面')
    return { path: '/dashboard' }
  }
  return true
})

export default router
