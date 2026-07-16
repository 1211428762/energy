<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StatusBadge from '@/components/StatusBadge.vue'
import { useEmsStore } from '@/stores/ems'

const route = useRoute()
const router = useRouter()
const store = useEmsStore()
const handler = ref(store.user.displayName || '王启航')
const problem = ref('现场确认设备运行存在参数偏离，需要完成检查、处理和复核后再推进状态。')
const order = computed(() => store.workOrders.find((item) => item.id === route.params.id))
const relatedAlarm = computed(() => order.value?.alarmId ? store.alarms.find((item) => item.id === order.value?.alarmId) : undefined)
const nextAction = computed(() => order.value?.status === '待接单' ? '确认接单' : order.value?.status === '处理中' ? '处理完成' : order.value?.status === '已完成' ? '关闭工单' : '返回列表')
const submit = () => {
  if (!order.value) return router.push('/maintenance/workflow')
  store.updateWorkOrder(order.value.id, { remarks: [...order.value.remarks, `${handler.value}：${problem.value}`] })
  store.advanceWorkOrder(order.value.id)
  router.push('/maintenance/workflow')
}
</script>

<template>
  <div class="page-grid tob-page">
    <section v-if="order" class="data-section span-8 workflow-detail">
      <div class="detail-grid"><article><label>工单编号</label><strong>{{ order.id }}</strong></article><article><label>当前状态</label><strong><StatusBadge :text="order.status" /></strong></article><article><label>优先级</label><strong>{{ order.priority }}</strong></article><article><label>来源</label><strong>{{ order.source }}</strong></article><article><label>指派人</label><strong>{{ order.assignee }}</strong></article><article><label>创建时间</label><strong>{{ order.createdAt }}</strong></article></div>
      <div class="problem-box"><h3>{{ order.title }}</h3><p v-if="relatedAlarm">关联告警：{{ relatedAlarm.name }}，{{ relatedAlarm.description }}</p><p v-else>人工创建工单，需完成现场巡检与运行复核。</p></div>
      <el-form label-width="90px"><el-form-item label="推进人"><el-input v-model="handler" /></el-form-item><el-form-item label="存在问题"><el-input v-model="problem" type="textarea" :rows="5" /></el-form-item></el-form>
      <div><el-button type="primary" @click="submit">{{ nextAction }}</el-button><el-button @click="router.push('/maintenance/workflow')">取消</el-button></div>
    </section>
    <section v-if="order" class="data-section span-4">
      <h3>流转记录</h3>
      <div class="timeline"><article v-for="(remark, index) in order.remarks" :key="remark + index"><strong>记录 {{ index + 1 }}</strong><span>{{ remark }}</span></article></div>
    </section>
    <section v-else class="data-section span-12"><el-empty description="未找到工单" /></section>
  </div>
</template>
