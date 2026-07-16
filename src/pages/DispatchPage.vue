<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import ModalDialog from '@/components/ModalDialog.vue'
import PanelCard from '@/components/PanelCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useEmsStore } from '@/stores/ems'

const route = useRoute()
const store = useEmsStore()
const section = computed(() => String(route.params.section || 'strategies'))
const title = computed(() => ({ strategies: '策略管理', types: '策略类型', issue: '策略下发', schedule: '策略调度计划', logs: '策略执行日志', commands: '实时调度指令' }[section.value] || '调度管理'))
const modal = ref(false)
const editingId = ref('')
const form = reactive({ name: '', type: '削峰填谷', priority: 1, power: '500.0 kW', targetSoc: '75.00%', schedule: '', trigger: '' })
const openStrategy = (strategy?: typeof store.strategies[number]) => { editingId.value = strategy?.id || ''; Object.assign(form, strategy || { name: '新增削峰填谷策略', type: '削峰填谷', priority: 1, power: '500.0 kW', targetSoc: '75.00%', schedule: '每日10:00-15:00、18:00-22:00', trigger: '电价≥0.9元且负荷>2000kW' }); modal.value = true }
const saveStrategy = () => { editingId.value ? store.updateStrategy(editingId.value, form) : store.createStrategy(form.name); modal.value = false }
const strategyTypes = [
  { name: '削峰填谷', desc: '按峰平谷电价执行谷充峰放，计算价差收益', fields: '时段、动作、功率、SOC目标' },
  { name: '需量管理', desc: '根据15分钟平均功率预测，提前释放储能削峰', fields: '需量阈值、预测窗口、削峰功率' },
  { name: '调频', desc: '跟随频率偏差或调度指令进行快速功率响应', fields: '响应倍率、死区、爬坡率' },
  { name: '防逆流', desc: '光伏出力大于负荷时提升充电功率，控制并网点功率', fields: '反向功率阈值、吸收功率、SOC上限' },
  { name: '离网备电', desc: '并网点异常时切换离网供电，保障重要负荷', fields: '备电SOC、负荷优先级、切换时间' },
]
</script>

<template>
  <div class="page-grid tob-page">
    <PanelCard class="span-12" :title="title" subtitle="储能策略配置、下发与执行跟踪" />

    <PanelCard v-if="section === 'strategies'" class="span-12" title="策略管理列表" subtitle="创建、编辑、删除、版本管理储能运行策略">
      <template #action><button class="primary-btn" @click="openStrategy()">新增策略</button></template>
      <table><thead><tr><th>策略名称</th><th>类型</th><th>优先级</th><th>目标SOC</th><th>功率</th><th>版本</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="strategy in store.strategies" :key="strategy.id"><td><strong>{{ strategy.name }}</strong><small>{{ strategy.trigger }}</small></td><td>{{ strategy.type }}</td><td>{{ strategy.priority }}</td><td>{{ strategy.targetSoc }}</td><td>{{ strategy.power }}</td><td>{{ strategy.version }}</td><td><StatusBadge :text="strategy.status" /></td><td class="actions"><button @click="openStrategy(strategy)">编辑</button><button @click="store.deleteStrategy(strategy.id)">删除</button></td></tr></tbody></table>
    </PanelCard>

    <PanelCard v-else-if="section === 'types'" class="span-12" title="策略类型" subtitle="支持削峰填谷、需量管理、调频、防逆流、离网备电五种策略类型"><div class="rule-grid"><article v-for="item in strategyTypes" :key="item.name"><strong>{{ item.name }}</strong><span>{{ item.desc }}</span><em>{{ item.fields }}</em></article></div></PanelCard>

    <PanelCard v-else-if="section === 'issue'" class="span-12" title="策略下发" subtitle="选定策略一键下发至EMS执行，支持策略激活、暂停、停止"><table><thead><tr><th>策略</th><th>状态</th><th>计划</th><th>触发条件</th><th>操作</th></tr></thead><tbody><tr v-for="strategy in store.strategies" :key="strategy.id"><td>{{ strategy.name }}</td><td><StatusBadge :text="strategy.status" /></td><td>{{ strategy.schedule }}</td><td>{{ strategy.trigger }}</td><td class="actions"><button @click="store.issueStrategy(strategy.id)">下发执行</button><button @click="store.updateStrategy(strategy.id, { status: '暂停' })">暂停</button><button @click="store.updateStrategy(strategy.id, { status: '停止' })">停止</button></td></tr></tbody></table></PanelCard>

    <PanelCard v-else-if="section === 'schedule'" class="span-12" title="策略调度计划" subtitle="配置策略日、周、月调度计划"><div class="timeline"><article v-for="strategy in store.strategies" :key="strategy.id"><strong>{{ strategy.name }}</strong><span>{{ strategy.schedule }} · {{ strategy.trigger }}</span></article></div><div class="calendar-grid"><span v-for="day in ['周一','周二','周三','周四','周五','周六','周日']" :key="day">{{ day }}<em>峰段放电 / 谷段充电</em></span></div></PanelCard>

    <PanelCard v-else-if="section === 'logs'" class="span-12" title="策略执行日志" subtitle="查看策略执行记录、执行结果、异常信息"><table><thead><tr><th>时间</th><th>事件</th><th>执行结果</th></tr></thead><tbody><tr v-for="log in store.logs" :key="log.time + log.event"><td>{{ log.time }}</td><td>{{ log.event }}</td><td>{{ log.result }}</td></tr></tbody></table></PanelCard>

    <PanelCard v-else class="span-12" title="实时调度指令" subtitle="查看当前下发的实时调度指令及PCS响应状态"><div class="detail-grid"><article><label>当前指令</label><strong>{{ store.snapshot.mode }}指令</strong></article><article><label>目标功率</label><strong>{{ store.format.kw(Math.abs(store.snapshot.storagePower)) }}</strong></article><article><label>当前SOC</label><strong>{{ store.format.pct(store.snapshot.soc) }}</strong></article><article><label>PCS响应</label><strong>闭环跟随正常，通讯延迟28ms</strong></article></div></PanelCard>

    <ModalDialog :open="modal" title="策略维护" @close="modal = false"><div class="form-grid two"><label>策略名称<input v-model="form.name" /></label><label>策略类型<select v-model="form.type"><option v-for="item in strategyTypes" :key="item.name">{{ item.name }}</option></select></label><label>优先级<input v-model.number="form.priority" type="number" /></label><label>目标功率<input v-model="form.power" /></label><label>SOC目标<input v-model="form.targetSoc" /></label><label>调度计划<input v-model="form.schedule" /></label><label>触发条件<input v-model="form.trigger" /></label></div><template #footer><button class="ghost-btn" @click="modal = false">取消</button><button class="primary-btn" @click="saveStrategy">保存</button></template></ModalDialog>
  </div>
</template>
