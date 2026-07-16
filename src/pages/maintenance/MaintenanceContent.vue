<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { EChartsOption } from 'echarts'
import ChartBox from '@/components/ChartBox.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useEmsStore, type Alarm, type WorkOrder } from '@/stores/ems'
const props = defineProps<{ section: 'realtime-alarms' | 'history-alarms' | 'alarm-rules' | 'alarm-report' | 'work-orders' | 'workflow' | 'report' }>()
const store = useEmsStore()
const router = useRouter()
const modal = ref<'alarm' | 'rule' | 'order' | ''>('')
const dialogVisible = computed({ get: () => modal.value !== '', set: (value) => { if (!value) modal.value = '' } })
const editingRuleId = ref('')
const editingOrderId = ref('')
const keyword = ref('')
const pageSize = ref(8)
const currentPage = ref(1)
const alarmForm = reactive({ deviceId: 'PCS-01', name: '人工上报设备异常', level: '一般' as Alarm['level'], description: '现场巡检发现设备运行参数偏离正常区间' })
const ruleForm = reactive({ name: '', deviceType: 'PCS', condition: '', level: '一般', action: '', enabled: true })
const orderForm = reactive({ title: '', assignee: '王启航', priority: '中' as WorkOrder['priority'] })
const title = computed(() => ({ 'realtime-alarms': '实时告警', 'history-alarms': '历史告警', 'alarm-rules': '告警规则配置', 'alarm-report': '告警上报', 'work-orders': '工单管理', workflow: '工单流转', report: '运维报表' })[props.section])
const subtitle = computed(() => ({ 'realtime-alarms': '当前激活与待处理告警', 'history-alarms': '历史告警查询与统计', 'alarm-rules': '告警触发条件与联动动作维护', 'alarm-report': '自动告警与人工补充上报', 'work-orders': '工单创建、编辑与删除', workflow: '工单状态闭环流转', report: '告警与工单运维指标' })[props.section])
const filterText = (value: string) => value.toLowerCase().includes(keyword.value.trim().toLowerCase())
const alarmSource = computed(() => props.section === 'history-alarms' ? store.alarms.filter((a) => a.status !== '激活') : store.alarms)
const filteredAlarms = computed(() => alarmSource.value.filter((item) => !keyword.value || filterText(`${item.name}${item.deviceName}${item.level}${item.status}`)))
const alarmRows = computed(() => filteredAlarms.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const filteredRules = computed(() => store.alarmRules.filter((item) => !keyword.value || filterText(`${item.name}${item.deviceType}${item.condition}${item.level}`)))
const ruleRows = computed(() => filteredRules.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const filteredOrders = computed(() => store.workOrders.filter((item) => !keyword.value || filterText(`${item.title}${item.source}${item.priority}${item.status}${item.assignee}`)))
const orderRows = computed(() => filteredOrders.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
watch(() => props.section, () => { modal.value = ''; keyword.value = ''; currentPage.value = 1 })
const toOrder = (alarm: Alarm) => { store.confirmAlarm(alarm.id); store.createWorkOrder(alarm) }
const openRule = (rule?: typeof store.alarmRules[number]) => { editingRuleId.value = rule?.id || ''; Object.assign(ruleForm, rule || { name: '新增越限告警规则', deviceType: 'PCS', condition: '温度 > 68℃', level: '一般', action: '生成告警并通知运维', enabled: true }); modal.value = 'rule' }
const saveRule = () => { editingRuleId.value ? store.updateAlarmRule(editingRuleId.value, ruleForm) : store.createAlarmRule(); modal.value = '' }
const openOrder = (order?: WorkOrder) => { editingOrderId.value = order?.id || ''; Object.assign(orderForm, { title: order?.title || '储能舱例行巡检任务', assignee: order?.assignee || '王启航', priority: order?.priority || '中' }); modal.value = 'order' }
const saveOrder = () => { editingOrderId.value ? store.updateWorkOrder(editingOrderId.value, orderForm) : store.createManualWorkOrder(orderForm.title); modal.value = '' }
const submitAlarm = () => { store.manualAlarm(alarmForm.deviceId, alarmForm.name, alarmForm.level, alarmForm.description); modal.value = '' }
const reportOption = computed<EChartsOption>(() => {
  const active = store.alarms.filter((a) => a.status === '激活').length
  const confirmed = store.alarms.filter((a) => a.status === '已确认').length
  const openOrders = store.workOrders.filter((w) => w.status !== '已关闭').length
  const closedOrders = store.workOrders.filter((w) => w.status === '已关闭').length
  return { tooltip: { trigger: 'axis' }, legend: { top: 8 }, grid: { left: 58, right: 24, top: 66, bottom: 46 }, xAxis: { type: 'category', name: '时间', data: ['近7日', '近5日', '近3日', '昨日', '今日'] }, yAxis: { type: 'value', name: '数量' }, series: [{ name: '激活告警', type: 'bar', data: [2, 3, 2, 1, active] }, { name: '确认告警', type: 'bar', data: [1, 2, 2, 2, confirmed] }, { name: '未关闭工单', type: 'line', smooth: true, data: [3, 3, 2, 2, openOrders] }, { name: '已关闭工单', type: 'line', smooth: true, data: [0, 1, 1, 2, closedOrders] }] }
})
const openWorkflowDetail = (id: string) => router.push(`/maintenance/workflow/${id}`)
</script>

<template>
  <div class="page-grid tob-page">
    <section v-if="section === 'realtime-alarms' || section === 'history-alarms'" class="data-section span-12">
      <div class="query-bar"><el-input v-model="keyword" clearable placeholder="告警 / 设备 / 等级 / 状态" /><el-button type="primary">查询</el-button><el-button @click="keyword = ''">重置</el-button></div>
      <el-table :data="alarmRows" stripe height="520"><el-table-column label="告警" min-width="210"><template #default="{ row }"><strong>{{ row.name }}</strong><small>{{ row.description }}</small></template></el-table-column><el-table-column prop="deviceName" label="设备" min-width="160"/><el-table-column prop="level" label="等级" width="90"/><el-table-column label="状态" width="110"><template #default="{ row }"><StatusBadge :text="row.status" /></template></el-table-column><el-table-column prop="occurredAt" label="发生时间" width="170"/><el-table-column label="操作" width="170"><template #default="{ row }"><el-button v-if="row.status === '激活'" link type="primary" @click="store.confirmAlarm(row.id)">确认</el-button><el-button link type="warning" @click="toOrder(row)">转工单</el-button></template></el-table-column></el-table>
      <div class="pager-row"><el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredAlarms.length" layout="total, sizes, prev, pager, next, jumper" /></div>
    </section>

    <section v-else-if="section === 'alarm-rules'" class="data-section span-12"><div class="query-bar"><el-input v-model="keyword" clearable placeholder="规则 / 设备类型 / 条件" /><el-button type="primary">查询</el-button><el-button @click="keyword = ''">重置</el-button><el-button type="primary" plain @click="openRule()">新增规则</el-button></div><el-table :data="ruleRows" stripe height="520"><el-table-column prop="name" label="规则"/><el-table-column prop="deviceType" label="设备类型"/><el-table-column prop="condition" label="条件"/><el-table-column prop="level" label="等级"/><el-table-column prop="action" label="动作"/><el-table-column label="状态"><template #default="{ row }"><StatusBadge :text="row.enabled ? '已激活' : '暂停'" /></template></el-table-column><el-table-column label="操作" width="180"><template #default="{ row }"><el-button link type="primary" @click="openRule(row)">编辑</el-button><el-button link @click="store.updateAlarmRule(row.id, { enabled: !row.enabled })">启停</el-button><el-button link type="danger" @click="store.deleteAlarmRule(row.id)">删除</el-button></template></el-table-column></el-table><div class="pager-row"><el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredRules.length" layout="total, sizes, prev, pager, next, jumper" /></div></section>

    <section v-else-if="section === 'alarm-report'" class="data-section span-12"><div class="query-bar"><el-input v-model="keyword" clearable placeholder="上报告警 / 设备 / 等级 / 状态" /><el-button type="primary">查询</el-button><el-button @click="keyword = ''">重置</el-button><el-button type="primary" plain @click="modal = 'alarm'">手动上报</el-button></div><div class="detail-grid"><article><label>自动触发</label><strong>PCS温度、BMS压差、通讯延迟越限</strong></article><article><label>上报结果</label><strong>生成实时告警并进入运维闭环</strong></article><article><label>当前激活</label><strong>{{ store.alarms.filter((a) => a.status === '激活').length }} 条</strong></article></div><el-table :data="alarmRows" stripe height="360"><el-table-column prop="name" label="上报名称" /><el-table-column prop="deviceName" label="设备" /><el-table-column prop="level" label="等级" width="90" /><el-table-column label="状态" width="110"><template #default="{ row }"><StatusBadge :text="row.status" /></template></el-table-column><el-table-column prop="occurredAt" label="上报时间" width="170" /><el-table-column prop="description" label="描述" /></el-table><div class="pager-row"><el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredAlarms.length" layout="total, sizes, prev, pager, next, jumper" /></div></section>

    <section v-else-if="section === 'work-orders' || section === 'workflow'" class="data-section span-12"><div class="query-bar"><el-input v-model="keyword" clearable placeholder="工单 / 来源 / 优先级 / 状态 / 指派人" /><el-button type="primary">查询</el-button><el-button @click="keyword = ''">重置</el-button><el-button type="primary" plain @click="openOrder()">新增工单</el-button></div><el-table :data="orderRows" stripe height="520"><el-table-column prop="title" label="工单" min-width="220"/><el-table-column prop="source" label="来源"/><el-table-column prop="priority" label="优先级"/><el-table-column label="状态"><template #default="{ row }"><StatusBadge :text="row.status" /></template></el-table-column><el-table-column prop="assignee" label="指派人"/><el-table-column prop="createdAt" label="创建时间"/><el-table-column label="操作" width="210"><template #default="{ row }"><el-button link type="primary" @click="openOrder(row)">编辑</el-button><el-button link type="danger" @click="store.deleteWorkOrder(row.id)">删除</el-button><el-button v-if="row.status !== '已关闭'" link type="primary" @click="openWorkflowDetail(row.id)">推进流程</el-button></template></el-table-column></el-table><div class="pager-row"><el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredOrders.length" layout="total, sizes, prev, pager, next, jumper" /></div></section>

    <section v-else class="data-section span-12 report-full"><ChartBox :option="reportOption" :updated-at="store.snapshot.timestamp" /></section>

    <el-dialog v-model="dialogVisible" destroy-on-close class="ems-dialog" :title="modal === 'alarm' ? '告警上报' : modal === 'rule' ? '告警规则维护' : '工单维护'" width="620px"><el-form v-if="modal === 'alarm'" :model="alarmForm" label-width="90px"><el-form-item label="设备"><el-select v-model="alarmForm.deviceId"><el-option v-for="device in store.station.devices" :key="device.id" :label="device.name" :value="device.id" /></el-select></el-form-item><el-form-item label="等级"><el-select v-model="alarmForm.level"><el-option label="提示" value="提示" /><el-option label="一般" value="一般" /><el-option label="严重" value="严重" /><el-option label="紧急" value="紧急" /></el-select></el-form-item><el-form-item label="告警名称"><el-input v-model="alarmForm.name" /></el-form-item><el-form-item label="描述"><el-input v-model="alarmForm.description" /></el-form-item></el-form><el-form v-else-if="modal === 'rule'" :model="ruleForm" label-width="90px"><el-form-item label="规则名称"><el-input v-model="ruleForm.name" /></el-form-item><el-form-item label="设备类型"><el-input v-model="ruleForm.deviceType" /></el-form-item><el-form-item label="触发条件"><el-input v-model="ruleForm.condition" /></el-form-item><el-form-item label="等级"><el-input v-model="ruleForm.level" /></el-form-item><el-form-item label="动作"><el-input v-model="ruleForm.action" /></el-form-item></el-form><el-form v-else :model="orderForm" label-width="90px"><el-form-item label="标题"><el-input v-model="orderForm.title" /></el-form-item><el-form-item label="指派人"><el-input v-model="orderForm.assignee" /></el-form-item><el-form-item label="优先级"><el-select v-model="orderForm.priority"><el-option label="低" value="低" /><el-option label="中" value="中" /><el-option label="高" value="高" /><el-option label="紧急" value="紧急" /></el-select></el-form-item></el-form><template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="modal === 'alarm' ? submitAlarm() : modal === 'rule' ? saveRule() : saveOrder()">保存</el-button></template></el-dialog>
  </div>
</template>
