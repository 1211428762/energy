import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import ModelManagement from '@/pages/commissioning/ModelManagement.vue'
import DeviceInstantiation from '@/pages/commissioning/DeviceInstantiation.vue'
import PointMapping from '@/pages/commissioning/PointMapping.vue'
import StationCreate from '@/pages/commissioning/StationCreate.vue'
import StationLaunch from '@/pages/commissioning/StationLaunch.vue'
import DeviceTopology from '@/pages/commissioning/DeviceTopology.vue'
import OperationOverview from '@/pages/operation/Overview.vue'
import RevenueDetail from '@/pages/operation/RevenueDetail.vue'
import ChargeDischargeStats from '@/pages/operation/ChargeDischargeStats.vue'
import TariffManagement from '@/pages/operation/TariffManagement.vue'
import DemandManagement from '@/pages/operation/DemandManagement.vue'
import RealtimeAlarms from '@/pages/maintenance/RealtimeAlarms.vue'
import HistoryAlarms from '@/pages/maintenance/HistoryAlarms.vue'
import AlarmRules from '@/pages/maintenance/AlarmRules.vue'
import AlarmReport from '@/pages/maintenance/AlarmReport.vue'
import WorkOrders from '@/pages/maintenance/WorkOrders.vue'
import WorkOrderFlowDetail from '@/pages/maintenance/WorkOrderFlowDetail.vue'
import MaintenanceReport from '@/pages/maintenance/MaintenanceReport.vue'
import StrategyManagement from '@/pages/dispatch/StrategyManagement.vue'
import StrategyTypes from '@/pages/dispatch/StrategyTypes.vue'
import StrategyIssue from '@/pages/dispatch/StrategyIssue.vue'
import StrategySchedule from '@/pages/dispatch/StrategySchedule.vue'
import StrategyLogs from '@/pages/dispatch/StrategyLogs.vue'
import RealtimeCommands from '@/pages/dispatch/RealtimeCommands.vue'
import StationOverview from '@/pages/monitoring/StationOverview.vue'
import DeviceMonitoring from '@/pages/monitoring/DeviceMonitoring.vue'
import CellMonitoring from '@/pages/monitoring/CellMonitoring.vue'
import EnvironmentMonitoring from '@/pages/monitoring/EnvironmentMonitoring.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage, meta: { title: '首页' } },
  { path: '/commissioning', redirect: '/commissioning/models' },
  { path: '/commissioning/models', name: 'commissioning-models', component: ModelManagement, meta: { title: '物模型管理' } },
  { path: '/commissioning/devices', name: 'commissioning-devices', component: DeviceInstantiation, meta: { title: '设备实例化' } },
  { path: '/commissioning/points', name: 'commissioning-points', component: PointMapping, meta: { title: '点表配置' } },
  { path: '/commissioning/station', name: 'commissioning-station', component: StationCreate, meta: { title: '电站管理' } },
  // { path: '/commissioning/launch', name: 'commissioning-launch', component: StationLaunch, meta: { title: '电站投运' } },
  { path: '/commissioning/topology', name: 'commissioning-topology', component: DeviceTopology, meta: { title: '设备拓扑展示' } },
  { path: '/operation', redirect: '/operation/overview' },
  { path: '/operation/overview', name: 'operation-overview', component: OperationOverview, meta: { title: '运营总览' } },
  { path: '/operation/revenue', name: 'operation-revenue', component: RevenueDetail, meta: { title: '收益明细' } },
  { path: '/operation/energy', name: 'operation-energy', component: ChargeDischargeStats, meta: { title: '充放电统计' } },
  { path: '/operation/tariff', name: 'operation-tariff', component: TariffManagement, meta: { title: '电价管理' } },
  { path: '/operation/demand', name: 'operation-demand', component: DemandManagement, meta: { title: '需量管理' } },
  { path: '/maintenance', redirect: '/maintenance/realtime-alarms' },
  { path: '/maintenance/realtime-alarms', name: 'maintenance-realtime-alarms', component: RealtimeAlarms, meta: { title: '实时告警' } },
  { path: '/maintenance/history-alarms', name: 'maintenance-history-alarms', component: HistoryAlarms, meta: { title: '历史告警' } },
  { path: '/maintenance/alarm-rules', name: 'maintenance-alarm-rules', component: AlarmRules, meta: { title: '告警规则配置' } },
  { path: '/maintenance/alarm-report', name: 'maintenance-alarm-report', component: AlarmReport, meta: { title: '告警上报' } },
  { path: '/maintenance/work-orders', name: 'maintenance-work-orders', component: WorkOrders, meta: { title: '工单管理' } },
  { path: '/maintenance/workflow', redirect: '/maintenance/work-orders' },
  { path: '/maintenance/workflow/:id', name: 'maintenance-workflow-detail', component: WorkOrderFlowDetail, meta: { title: '工单流转详情' } },
  { path: '/maintenance/report', name: 'maintenance-report', component: MaintenanceReport, meta: { title: '运维报表' } },
  { path: '/dispatch', redirect: '/dispatch/strategies' },
  { path: '/dispatch/strategies', name: 'dispatch-strategies', component: StrategyManagement, meta: { title: '策略管理' } },
  { path: '/dispatch/types', name: 'dispatch-types', component: StrategyTypes, meta: { title: '策略类型' } },
  { path: '/dispatch/issue', name: 'dispatch-issue', component: StrategyIssue, meta: { title: '策略下发' } },
  { path: '/dispatch/schedule', name: 'dispatch-schedule', component: StrategySchedule, meta: { title: '策略调度计划' } },
  { path: '/dispatch/logs', name: 'dispatch-logs', component: StrategyLogs, meta: { title: '策略执行日志' } },
  { path: '/dispatch/commands', name: 'dispatch-commands', component: RealtimeCommands, meta: { title: '实时调度指令' } },
  { path: '/monitoring', redirect: '/monitoring/station' },
  { path: '/monitoring/station', name: 'monitoring-station', component: StationOverview, meta: { title: '电站总览' } },
  { path: '/monitoring/devices', name: 'monitoring-devices', component: DeviceMonitoring, meta: { title: '设备监控' } },
  { path: '/monitoring/pcs', redirect: '/monitoring/devices' },
  { path: '/monitoring/bms', redirect: '/monitoring/devices' },
  { path: '/monitoring/cells', name: 'monitoring-cells', component: CellMonitoring, meta: { title: '电芯级监控' } },
  { path: '/monitoring/meter', redirect: '/monitoring/devices' },
  { path: '/monitoring/environment', name: 'monitoring-environment', component: EnvironmentMonitoring, meta: { title: '环境监控' } },
  { path: '/monitoring/communication', redirect: '/monitoring/devices' },
]
const router = createRouter({ history: createWebHistory(), routes })

export default router
