<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { EChartsOption } from 'echarts'
import ChartBox from '@/components/ChartBox.vue'
import KpiCard from '@/components/KpiCard.vue'
import ModalDialog from '@/components/ModalDialog.vue'
import PanelCard from '@/components/PanelCard.vue'
import PowerFlow from '@/components/PowerFlow.vue'
import { useEmsStore } from '@/stores/ems'

const route = useRoute()
const store = useEmsStore()
const section = computed(() => String(route.params.section || 'overview'))
const tariffModal = ref(false)
const tariffForm = reactive({ period: '', price: 0 })
const title = computed(() => ({ overview: '运营总览', revenue: '收益明细', energy: '充放电统计', tariff: '电价管理', demand: '需量管理' }[section.value] || '运营管理'))
const openTariff = (item: typeof store.tariffs[number]) => { Object.assign(tariffForm, item); tariffModal.value = true }
const saveTariff = () => { store.updateTariff(tariffForm.period, Number(tariffForm.price)); tariffModal.value = false }
const powerOption = computed<EChartsOption>(() => ({ tooltip: { trigger: 'axis' }, grid: { left: 42, right: 24, top: 36, bottom: 32 }, xAxis: { type: 'category', data: ['00', '04', '08', '12', '16', '20', '24'] }, yAxis: { type: 'value' }, series: [{ name: '负荷', type: 'line', smooth: true, data: [820, 760, 1680, store.snapshot.loadPower, 1860, 2280, 920] }, { name: '光伏', type: 'line', smooth: true, data: [0, 0, 180, store.snapshot.pvPower, 360, 0, 0] }, { name: '储能', type: 'bar', data: [-520, -480, 0, store.snapshot.storagePower, 0, 680, -430] }] }))
const revenueOption = computed<EChartsOption>(() => ({ tooltip: { trigger: 'axis' }, grid: { left: 42, right: 24, top: 36, bottom: 32 }, xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] }, yAxis: { type: 'value' }, series: [{ name: '削峰填谷', type: 'bar', stack: '收益', data: [3260, 3480, 3860, 4120, 3980, 2760, 2880] }, { name: '需量管理', type: 'bar', stack: '收益', data: [820, 760, 910, 960, 880, 520, 560] }, { name: '调频收益', type: 'line', data: [260, 320, 300, 360, 340, 280, 310] }] }))
const energyOption = computed<EChartsOption>(() => ({ tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: ['45%', '70%'], data: [{ name: '谷时充电', value: store.snapshot.chargeEnergy }, { name: '峰时放电', value: store.snapshot.dischargeEnergy }, { name: '平时待机', value: 420 }] }] }))
</script>

<template>
  <div class="page-grid tob-page">
    <PanelCard class="span-12" :title="title" subtitle="电站收益、能量与需量运营分析" />

    <template v-if="section === 'overview'">
      <KpiCard label="今日净收益" :value="store.format.yuan(store.snapshot.todayRevenue)" hint="实时累计" tone="green" />
      <KpiCard label="SOC" :value="store.format.pct(store.snapshot.soc)" hint="安全运行区间" tone="blue" />
      <KpiCard label="充电电量" :value="store.format.kwh(store.snapshot.chargeEnergy)" hint="当日累计" tone="green" />
      <KpiCard label="综合效率" value="91.72%" hint="循环效率" tone="orange" />
      <PanelCard class="span-8" title="实时功率流向" subtitle="负荷、光伏、储能、并网点功率"><PowerFlow /></PanelCard>
      <PanelCard class="span-4" title="收益构成" subtitle="运营关键指标"><div class="report-grid"><article><strong>3,260.18</strong><span>削峰填谷收益 元</span></article><article><strong>820.45</strong><span>需量收益 元</span></article><article><strong>310.20</strong><span>调频收益 元</span></article><article><strong>486.32</strong><span>CO₂减排 kg</span></article></div></PanelCard>
    </template>

    <PanelCard v-else-if="section === 'revenue'" class="span-12" title="收益明细" subtitle="削峰填谷、需量管理、调频收益分项展示与趋势"><ChartBox :option="revenueOption" /><table><thead><tr><th>收益项</th><th>今日</th><th>本月</th><th>本年</th><th>说明</th></tr></thead><tbody><tr><td>削峰填谷</td><td>3,260.18 元</td><td>62,186.34 元</td><td>468,320.88 元</td><td>峰放谷充价差</td></tr><tr><td>需量管理</td><td>820.45 元</td><td>18,216.00 元</td><td>132,480.00 元</td><td>削减最大需量</td></tr><tr><td>调频收益</td><td>310.20 元</td><td>6,018.04 元</td><td>42,117.84 元</td><td>响应调度指令</td></tr></tbody></table></PanelCard>

    <PanelCard v-else-if="section === 'energy'" class="span-12" title="充放电统计" subtitle="日/月/年充放电量统计与峰谷时段分布"><div class="split"><ChartBox :option="energyOption" /><ChartBox :option="powerOption" /></div></PanelCard>

    <PanelCard v-else-if="section === 'tariff'" class="span-12" title="电价管理" subtitle="分时电价策略，支持弹窗编辑峰、平、谷价格"><table><thead><tr><th>时段</th><th>类型</th><th>电价</th><th>适用日期</th><th>操作</th></tr></thead><tbody><tr v-for="item in store.tariffs" :key="item.period"><td>{{ item.period }}</td><td>{{ item.type }}</td><td>{{ item.price.toFixed(2) }} 元/kWh</td><td>工作日、节假日独立配置</td><td class="actions"><button @click="openTariff(item)">编辑</button></td></tr></tbody></table></PanelCard>

    <PanelCard v-else class="span-12" title="需量管理" subtitle="显示15分钟平均功率曲线，展示削峰效果与节省电费"><ChartBox :option="powerOption" /><div class="demand-row"><div><strong>2,486.0 kW</strong><span>无储能最大需量</span></div><div><strong>1,934.0 kW</strong><span>储能削峰后需量</span></div><div><strong>18,216.00 元</strong><span>需量电费节省</span></div></div></PanelCard>

    <ModalDialog :open="tariffModal" title="电价维护" @close="tariffModal = false"><div class="form-grid two"><label>时段<input v-model="tariffForm.period" disabled /></label><label>电价<input v-model.number="tariffForm.price" type="number" step="0.01" /></label></div><template #footer><button class="ghost-btn" @click="tariffModal = false">取消</button><button class="primary-btn" @click="saveTariff">保存</button></template></ModalDialog>
  </div>
</template>
