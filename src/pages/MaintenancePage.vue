<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import ModalDialog from '@/components/ModalDialog.vue'
import PanelCard from '@/components/PanelCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useEmsStore, type Alarm, type WorkOrder } from '@/stores/ems'

const route = useRoute()
const store = useEmsStore()
const section = computed(() => String(route.params.section || 'realtime-alarms'))
const title = computed(() => ({ 'realtime-alarms': '实时告警', 'history-alarms': '历史告警', 'alarm-rules': '告警规则配置', 'alarm-report': '告警上报', 'work-orders': '工单管理', workflow: '工单流转', report: '运维报表' }[section.value] || '运维管理'))
const modal = ref<'alarm' | 'rule' | 'order' | ''>('')
const editingRuleId = ref('')
const editingOrderId = ref('')
const alarmForm = reactive({ deviceId: 'PCS-01', name: '人工上报设备异常', level: '一般' as Alarm['level'], description: '现场巡检发现设备运行参数偏离正常区间' })
const ruleForm = reactive({ name: '', deviceType: 'PCS', condition: '', level: '一般', action: '', enabled: true })
const orderForm = reactive({ title: '', assignee: '王启航', priority: '中' as WorkOrder['priority'] })
const toOrder = (alarm: Alarm) => { store.confirmAlarm(alarm.id); store.createWorkOrder(alarm) }
const openRule = (rule?: typeof store.alarmRules[number]) => { editingRuleId.value = rule?.id || ''; Object.assign(ruleForm, rule || { name: '新增越限告警规则', deviceType: 'PCS', condition: '温度 > 68℃', level: '一般', action: '生成告警并通知运维', enabled: true }); modal.value = 'rule' }
const saveRule = () => { editingRuleId.value ? store.updateAlarmRule(editingRuleId.value, ruleForm) : store.createAlarmRule(); modal.value = '' }
const openOrder = (order?: WorkOrder) => { editingOrderId.value = order?.id || ''; Object.assign(orderForm, { title: order?.title || '储能舱例行巡检任务', assignee: order?.assignee || '王启航', priority: order?.priority || '中' }); modal.value = 'order' }
const saveOrder = () => { editingOrderId.value ? store.updateWorkOrder(editingOrderId.value, orderForm) : store.createManualWorkOrder(orderForm.title); modal.value = '' }
const submitAlarm = () => { store.manualAlarm(alarmForm.deviceId, alarmForm.name, alarmForm.level, alarmForm.description); modal.value = '' }
</script>

<template>
  <div class="page-grid tob-page">
    <PanelCard class="span-12" :title="title" subtitle="告警处置、工单流转与运维统计" />

    <PanelCard v-if="section === 'realtime-alarms'" class="span-12" title="实时告警列表" subtitle="展示激活、已确认、已恢复告警，激活告警支持确认并转工单">
      <table><thead><tr><th>告警</th><th>设备</th><th>等级</th><th>状态</th><th>发生时间</th><th>操作</th></tr></thead><tbody><tr v-for="alarm in store.alarms" :key="alarm.id"><td><strong>{{ alarm.name }}</strong><small>{{ alarm.description }}</small></td><td>{{ alarm.deviceName }}</td><td>{{ alarm.level }}</td><td><StatusBadge :text="alarm.status" /></td><td>{{ alarm.occurredAt }}</td><td class="actions"><button v-if="alarm.status === '激活'" @click="store.confirmAlarm(alarm.id)">确认</button><button @click="toOrder(alarm)">转工单</button></td></tr></tbody></table>
    </PanelCard>

    <PanelCard v-else-if="section === 'history-alarms'" class="span-12" title="历史告警查询" subtitle="按设备、等级、时间筛选与统计"><div class="filter-bar"><input placeholder="告警名称" /><select><option>全部等级</option><option>提示</option><option>一般</option><option>严重</option></select><button class="ghost-btn">查询</button></div><table><thead><tr><th>告警</th><th>设备</th><th>等级</th><th>状态</th><th>确认时间</th><th>恢复时间</th></tr></thead><tbody><tr v-for="alarm in store.alarms.filter(a => a.status !== '激活')" :key="alarm.id"><td>{{ alarm.name }}</td><td>{{ alarm.deviceName }}</td><td>{{ alarm.level }}</td><td><StatusBadge :text="alarm.status" /></td><td>{{ alarm.confirmedAt || '-' }}</td><td>{{ alarm.recoveredAt || '-' }}</td></tr></tbody></table></PanelCard>

    <PanelCard v-else-if="section === 'alarm-rules'" class="span-12" title="告警规则配置" subtitle="创建、编辑、启用、禁用告警规则，定义触发条件与动作"><template #action><button class="primary-btn" @click="openRule()">新增规则</button></template><table><thead><tr><th>规则</th><th>设备类型</th><th>条件</th><th>等级</th><th>动作</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="rule in store.alarmRules" :key="rule.id"><td>{{ rule.name }}</td><td>{{ rule.deviceType }}</td><td>{{ rule.condition }}</td><td>{{ rule.level }}</td><td>{{ rule.action }}</td><td><StatusBadge :text="rule.enabled ? '已激活' : '暂停'" /></td><td class="actions"><button @click="openRule(rule)">编辑</button><button @click="store.updateAlarmRule(rule.id, { enabled: !rule.enabled })">启停</button><button @click="store.deleteAlarmRule(rule.id)">删除</button></td></tr></tbody></table></PanelCard>

    <PanelCard v-else-if="section === 'alarm-report'" class="span-12" title="告警上报" subtitle="告警自动生成，也可人工补充上报"><template #action><button class="primary-btn" @click="modal = 'alarm'">手动上报</button></template><div class="detail-grid"><article><label>自动触发</label><strong>PCS温度、BMS压差、通讯延迟越限</strong></article><article><label>上报结果</label><strong>生成实时告警并进入运维闭环</strong></article><article><label>当前激活</label><strong>{{ store.alarms.filter(a => a.status === '激活').length }} 条</strong></article></div></PanelCard>

    <PanelCard v-else-if="section === 'work-orders'" class="span-12" title="工单管理" subtitle="告警转工单、人工创建工单，列表展示所有工单"><template #action><button class="primary-btn" @click="openOrder()">新增工单</button></template><table><thead><tr><th>工单</th><th>来源</th><th>优先级</th><th>状态</th><th>指派人</th><th>创建时间</th><th>操作</th></tr></thead><tbody><tr v-for="order in store.workOrders" :key="order.id"><td>{{ order.title }}</td><td>{{ order.source }}</td><td>{{ order.priority }}</td><td><StatusBadge :text="order.status" /></td><td>{{ order.assignee }}</td><td>{{ order.createdAt }}</td><td class="actions"><button @click="openOrder(order)">编辑</button><button @click="store.deleteWorkOrder(order.id)">删除</button></td></tr></tbody></table></PanelCard>

    <PanelCard v-else-if="section === 'workflow'" class="span-12" title="工单流转" subtitle="待接单 → 处理中 → 已完成 → 已关闭，支持备注与关闭"><div class="workorder-list"><article v-for="order in store.workOrders" :key="order.id"><div><strong>{{ order.title }}</strong><span>{{ order.assignee }} · {{ order.createdAt }}</span></div><StatusBadge :text="order.status" /><button v-if="order.status !== '已关闭'" class="primary-btn" @click="store.advanceWorkOrder(order.id)">推进流程</button><p v-if="order.solution">{{ order.solution }}</p><ul><li v-for="remark in order.remarks" :key="remark">{{ remark }}</li></ul></article></div></PanelCard>

    <PanelCard v-else class="span-12" title="运维报表" subtitle="告警统计与工单统计"><div class="report-grid wide"><article><strong>{{ store.alarms.filter(a => a.status === '激活').length }}</strong><span>激活告警</span></article><article><strong>{{ store.alarms.filter(a => a.status === '已确认').length }}</strong><span>已确认告警</span></article><article><strong>{{ store.workOrders.filter(w => w.status !== '已关闭').length }}</strong><span>未关闭工单</span></article><article><strong>{{ store.workOrders.filter(w => w.status === '已关闭').length }}</strong><span>已关闭工单</span></article></div></PanelCard>

    <ModalDialog :open="modal === 'alarm'" title="告警上报" @close="modal = ''"><div class="form-grid two"><label>设备<select v-model="alarmForm.deviceId"><option v-for="device in store.station.devices" :key="device.id" :value="device.id">{{ device.name }}</option></select></label><label>等级<select v-model="alarmForm.level"><option>提示</option><option>一般</option><option>严重</option><option>紧急</option></select></label><label>告警名称<input v-model="alarmForm.name" /></label><label>描述<input v-model="alarmForm.description" /></label></div><template #footer><button class="ghost-btn" @click="modal = ''">取消</button><button class="primary-btn" @click="submitAlarm">保存</button></template></ModalDialog>
    <ModalDialog :open="modal === 'rule'" title="告警规则维护" @close="modal = ''"><div class="form-grid two"><label>规则名称<input v-model="ruleForm.name" /></label><label>设备类型<input v-model="ruleForm.deviceType" /></label><label>触发条件<input v-model="ruleForm.condition" /></label><label>等级<input v-model="ruleForm.level" /></label><label>动作<input v-model="ruleForm.action" /></label></div><template #footer><button class="ghost-btn" @click="modal = ''">取消</button><button class="primary-btn" @click="saveRule">保存</button></template></ModalDialog>
    <ModalDialog :open="modal === 'order'" title="工单维护" @close="modal = ''"><div class="form-grid two"><label>标题<input v-model="orderForm.title" /></label><label>指派人<input v-model="orderForm.assignee" /></label><label>优先级<select v-model="orderForm.priority"><option>低</option><option>中</option><option>高</option><option>紧急</option></select></label></div><template #footer><button class="ghost-btn" @click="modal = ''">取消</button><button class="primary-btn" @click="saveOrder">保存</button></template></ModalDialog>
  </div>
</template>
