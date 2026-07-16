<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Activity, BarChart3, Bell, Blocks, ChevronDown, ChevronRight, Cpu, Gauge, Grid2X2, LogOut, Moon, RadioTower, Settings2, ShieldAlert, Sun, UserRound } from 'lucide-vue-next'
import LoginPage from '@/pages/LoginPage.vue'
import { useEmsStore } from './stores/ems'

const store = useEmsStore()
store.initialize()
const route = useRoute()
const router = useRouter()
const tabbarRef = ref<HTMLDivElement>()
const openedMenu = ref('投运管理')
let timer: number | undefined

const menus = [
  { path: '/', label: '首页', icon: Activity },
  { label: '投运管理', icon: Blocks, children: [
    { path: '/commissioning/models', label: '物模型管理' },
    { path: '/commissioning/devices', label: '设备实例化' },
    { path: '/commissioning/points', label: '点表配置' },
    { path: '/commissioning/station', label: '电站管理' },
    { path: '/commissioning/launch', label: '电站投运' },
    { path: '/commissioning/topology', label: '设备拓扑展示' },
  ] },
  { label: '运营管理', icon: Gauge, children: [
    { path: '/operation/overview', label: '运营总览' },
    { path: '/operation/revenue', label: '收益明细' },
    { path: '/operation/energy', label: '充放电统计' },
    { path: '/operation/tariff', label: '电价管理' },
    { path: '/operation/demand', label: '需量管理' },
  ] },
  { label: '运维管理', icon: ShieldAlert, children: [
    { path: '/maintenance/realtime-alarms', label: '实时告警' },
    { path: '/maintenance/history-alarms', label: '历史告警' },
    { path: '/maintenance/alarm-rules', label: '告警规则配置' },
    { path: '/maintenance/alarm-report', label: '告警上报' },
    { path: '/maintenance/work-orders', label: '工单管理' },
    { path: '/maintenance/report', label: '运维报表' },
  ] },
  { label: '调度管理', icon: Settings2, children: [
    { path: '/dispatch/strategies', label: '策略管理' },
    { path: '/dispatch/types', label: '策略类型' },
    { path: '/dispatch/issue', label: '策略下发' },
    { path: '/dispatch/schedule', label: '策略调度计划' },
    { path: '/dispatch/logs', label: '策略执行日志' },
    { path: '/dispatch/commands', label: '实时调度指令' },
  ] },
  { label: '监控管理', icon: Cpu, children: [
    { path: '/monitoring/station', label: '电站总览' },
    { path: '/monitoring/devices', label: '设备监控' },
    { path: '/monitoring/cells', label: '电芯级监控' },
    { path: '/monitoring/environment', label: '环境监控' },
  ] },
]

const flatMenus = computed(() => menus.flatMap((item) => 'children' in item && item.children ? item.children : [{ path: item.path!, label: item.label }]))
const activeAlarms = computed(() => store.alarms.filter((item) => item.status === '激活').length)
const activeLabel = computed(() => String(route.meta.title || flatMenus.value.find((item) => item.path === route.path)?.label || '首页'))

watch(() => route.path, (path) => store.openRouteTab(path, activeLabel.value), { immediate: true })

onMounted(() => {
  timer = window.setInterval(() => store.tick(), 1000)
})

onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})

const closeTab = (path: string) => {
  store.closeRouteTab(path)
  if (route.path === path) router.push(store.openedTabs[store.openedTabs.length - 1]?.path || '/')
}

const onTabWheel = (event: WheelEvent) => {
  if (!tabbarRef.value) return
  tabbarRef.value.scrollLeft += event.deltaY || event.deltaX
}

const toggleMenu = (label: string) => {
  openedMenu.value = openedMenu.value === label ? '' : label
}

const goRealtimeAlarms = () => router.push('/maintenance/realtime-alarms')
</script>

<template>
  <LoginPage v-if="!store.authenticated" />
  <div v-else class="app-shell tob-shell">
    <header class="topbar tob-topbar">
      <div class="brand tob-brand">
        <div class="logo-cube"><RadioTower :size="22" /><span></span></div>
        <div><strong>工商业储能EMS</strong><span>{{ store.station.name }}</span></div>
      </div>
      <!-- <div class="search-box"><Search :size="16" /> 请输入设备、告警、策略名称</div> -->
      <div class="top-meta">
        <span>{{ store.currentTime }}</span>
        <button class="top-btn" @click="store.toggleTheme"><Sun v-if="store.theme === 'dark'" :size="15" /><Moon v-else :size="15" /> {{ store.theme === 'dark' ? '亮色' : '暗色' }}</button>
        <button class="alarm-pill" @click="goRealtimeAlarms"><Bell :size="15" /> {{ activeAlarms }}</button>
        <span class="user"><UserRound :size="16" /> {{ store.user.role }}</span>
        <button class="top-btn" @click="store.logout"><LogOut :size="15" /> 登出</button>
      </div>
    </header>

    <aside class="sidebar tob-sidebar">
      <div v-for="menu in menus" :key="menu.label" class="nav-group">
        <RouterLink v-if="!('children' in menu)" :to="menu.path" class="nav-item"><component :is="menu.icon" :size="18" /><span>{{ menu.label }}</span></RouterLink>
        <template v-else>
          <button class="nav-title" @click="toggleMenu(menu.label)">
            <component :is="menu.icon" :size="18" /><span>{{ menu.label }}</span>
            <ChevronRight v-if="openedMenu !== menu.label" class="nav-arrow" :size="15" />
            <ChevronDown v-else class="nav-arrow" :size="15" />
          </button>
          <Transition name="subnav">
            <div v-show="openedMenu === menu.label" class="subnav tob-subnav">
              <RouterLink v-for="child in menu.children" :key="child.path" :to="child.path">{{ child.label }}</RouterLink>
            </div>
          </Transition>
        </template>
      </div>
    </aside>

    <section class="tabbar" @wheel.passive="onTabWheel">
      <div ref="tabbarRef" class="tabbar-track">
        <RouterLink v-for="tab in store.openedTabs" :key="tab.path" :to="tab.path" class="route-tab">
          <Grid2X2 :size="12" />{{ tab.title }}<button v-if="tab.path !== '/'" @click.prevent="closeTab(tab.path)">×</button>
        </RouterLink>
      </div>
    </section>

    <main class="workspace tob-workspace"><RouterView /></main>

    <footer class="statusbar">
      <span>系统运行状态：{{ store.station.status }}</span><span>更新时间：{{ store.snapshot.timestamp }}</span><span>通讯：{{ store.onlineDevices }}/{{ store.station.devices.length }}</span><span>策略：{{ store.snapshot.mode }}</span><span><BarChart3 :size="13" /> {{ store.user.role }}</span>
    </footer>
  </div>
</template>
