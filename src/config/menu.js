/**
 * 前端静态菜单元数据（后端 menu 表当前无初始数据，此配置兜底）
 * roles 为空数组表示所有登录角色可见
 */
export const menuConfig = [
  {
    title: '仪表盘',
    icon: 'Odometer',
    path: '/dashboard',
    roles: ['ADMIN', 'USER'],
  },
  {
    title: '床位管理',
    icon: 'Grid',
    roles: ['ADMIN'],
    children: [
      { title: '床位图', path: '/bed/map' },
      { title: '使用详情', path: '/bed/details' },
    ],
  },
  {
    title: '客户管理',
    icon: 'UserFilled',
    path: '/customer',
    roles: ['ADMIN'],
  },
  {
    title: '护理管理',
    icon: 'FirstAidKit',
    roles: ['ADMIN'],
    children: [
      { title: '护理级别', path: '/nurse/level' },
      { title: '护理项目', path: '/nurse/content' },
      { title: '客户护理项目', path: '/nurse/customer-items' },
    ],
  },
  {
    title: '业务审批',
    icon: 'Stamp',
    roles: ['ADMIN'],
    children: [
      { title: '外出审批', path: '/outward' },
      { title: '退住审批', path: '/backdown' },
      { title: '护理记录', path: '/records' },
    ],
  },
  {
    title: '管家工作台',
    icon: 'Suitcase',
    roles: ['USER'],
    children: [
      { title: '我的客户', path: '/my/customers' },
      { title: '我的护理记录', path: '/my/records' },
      { title: '外出登记', path: '/my/outward' },
      { title: '退住申请', path: '/my/backdown' },
    ],
  },
  {
    title: '餐饮管理',
    icon: 'Food',
    roles: ['ADMIN'],
    children: [
      { title: '餐饮管理', path: '/food' },
      { title: '客户偏好', path: '/preference' },
    ],
  },
  {
    title: '系统管理',
    icon: 'Setting',
    roles: ['ADMIN'],
    children: [
      { title: '用户管理', path: '/system/user' },
      { title: '角色管理', path: '/system/role' },
      { title: '菜单管理', path: '/system/menu' },
    ],
  },
]

/** 按角色过滤菜单（role: 'ADMIN' | 其他均视为管家 'USER'） */
export function menusForRole(role) {
  const r = role === 'ADMIN' ? 'ADMIN' : 'USER'
  return menuConfig
    .filter((m) => !m.roles || m.roles.includes(r))
    .map((m) => ({
      ...m,
      children: m.children ? m.children.filter((c) => !c.roles || c.roles.includes(r)) : undefined,
    }))
}
