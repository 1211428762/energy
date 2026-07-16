<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import KpiCard from '@/components/KpiCard.vue'
import PanelCard from '@/components/PanelCard.vue'
import PowerFlow from '@/components/PowerFlow.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useEmsStore } from '@/stores/ems'

const route = useRoute()
const store = useEmsStore()
const section = computed(() => String(route.params.section || 'station'))
const title = computed(() => ({ station: '电站总览', pcs: '设备监控', bms: '设备监控', cells: '电芯级监控', meter: '设备监控', environment: '环境监控', communication: '设备监控' }[section.value] || '监控管理'))
const pcsDevices = computed(() => store.station.devices.filter((item) => item.type === 'PCS'))
const bmsDevices = computed(() => store.station.devices.filter((item) => item.type === 'BMS'))
const meterDevices = computed(() => store.station.devices.filter((item) => item.type === '电表'))
</script>

<template>
  <div class="page-grid tob-page">
    <PanelCard class="span-12" :title="title" subtitle="电站、设备、电芯与通讯实时监控" />

    <template v-if="section === 'station'">
      <KpiCard label="电站SOC" :value="store.format.pct(store.snapshot.soc)" hint="储能可用容量" tone="blue" />
      <KpiCard label="并网点功率" :value="store.format.kw(store.snapshot.gridPower)" hint="正向取电功率" tone="green" />
      <KpiCard label="光伏功率" :value="store.format.kw(store.snapshot.pvPower)" hint="夜间自动为0" tone="orange" />
      <KpiCard label="设备在线率" :value="`${store.onlineDevices}/${store.station.devices.length}`" hint="通讯状态" tone="green" />
      <PanelCard class="span-12" title="电站一次系统图" subtitle="SVG一次图动态展示功率流向与设备状态"><PowerFlow /></PanelCard>
    </template>

    <PanelCard v-else-if="section === 'pcs'" class="span-12" title="设备监控" subtitle="三相电压、电流、功率、频率、温度、运行模式">
      <table><thead><tr><th>设备</th><th>状态</th><th>A相电压</th><th>B相电流</th><th>有功功率</th><th>无功功率</th><th>频率</th><th>温度</th><th>模式</th></tr></thead><tbody><tr v-for="device in pcsDevices" :key="device.id"><td>{{ device.name }}</td><td><StatusBadge :text="device.status" /></td><td>{{ device.telemetry.A相电压 || '230.6 V' }}</td><td>{{ device.telemetry.B相电流 || '812.4 A' }}</td><td>{{ device.telemetry.有功功率 || store.format.kw(store.snapshot.storagePower) }}</td><td>32.8 kvar</td><td>{{ device.telemetry.频率 || '50.02 Hz' }}</td><td>{{ device.telemetry.温度 || `${store.snapshot.pcsTemperature.toFixed(1)} ℃` }}</td><td>{{ device.telemetry.运行模式 || store.snapshot.mode }}</td></tr></tbody></table>
    </PanelCard>

    <PanelCard v-else-if="section === 'bms'" class="span-12" title="设备监控" subtitle="SOC、SOH、SOP、总压、总流、单体极值、绝缘阻抗">
      <table><thead><tr><th>设备</th><th>状态</th><th>SOC</th><th>SOH</th><th>SOP</th><th>总电压</th><th>总电流</th><th>最高/最低单体</th><th>绝缘阻抗</th></tr></thead><tbody><tr v-for="device in bmsDevices" :key="device.id"><td>{{ device.name }}</td><td><StatusBadge :text="device.status" /></td><td>{{ store.format.pct(store.snapshot.soc) }}</td><td>96.80%</td><td>860.0 kW</td><td>1498.6 V</td><td>412.5 A</td><td>{{ store.maxCellVoltage.toFixed(3) }} / {{ store.minCellVoltage.toFixed(3) }} V</td><td>8.6 MΩ</td></tr></tbody></table>
    </PanelCard>

    <PanelCard v-else-if="section === 'cells'" class="span-12" title="电芯级监控" subtitle="矩阵热力图展示电压和温度分布，含极值定位">
      <div class="cell-summary"><span>最高电压 {{ store.maxCellVoltage.toFixed(3) }} V</span><span>最低电压 {{ store.minCellVoltage.toFixed(3) }} V</span><span>平均温度 {{ store.avgCellTemp.toFixed(1) }} ℃</span><span>极值电芯 C08</span></div>
      <div class="cell-grid"><article v-for="cell in store.cells" :key="cell.id" :style="{ '--heat': `${(cell.temperature - 22) / 20}` }"><strong>{{ cell.id }}</strong><span>{{ cell.voltage.toFixed(3) }} V</span><em>{{ cell.temperature.toFixed(1) }} ℃</em><small>{{ cell.status }}</small></article></div>
    </PanelCard>

    <PanelCard v-else-if="section === 'meter'" class="span-12" title="设备监控" subtitle="并网点三相电压、电流、功率、功率因数、电能累计">
      <table><thead><tr><th>设备</th><th>状态</th><th>A/B/C相电压</th><th>A/B/C相电流</th><th>有功功率</th><th>无功功率</th><th>功率因数</th><th>正向电能</th><th>反向电能</th></tr></thead><tbody><tr v-for="device in meterDevices" :key="device.id"><td>{{ device.name }}</td><td><StatusBadge :text="device.status" /></td><td>229.4 / 230.1 / 228.7 V</td><td>812.4 / 805.6 / 818.9 A</td><td>{{ store.format.kw(store.snapshot.gridPower) }}</td><td>58.6 kvar</td><td>0.98</td><td>158,462.35 kWh</td><td>12,386.42 kWh</td></tr></tbody></table>
    </PanelCard>

    <PanelCard v-else-if="section === 'environment'" class="span-12" title="环境监控" subtitle="环境温度、湿度、消防状态、安防状态">
      <div class="detail-grid"><article><label>舱内温度</label><strong>26.8 ℃</strong></article><article><label>环境湿度</label><strong>48.0%</strong></article><article><label>消防状态</label><strong>正常</strong></article><article><label>安防状态</label><strong>门禁闭合，视频在线</strong></article><article><label>空调状态</label><strong>制冷运行</strong></article><article><label>水浸状态</label><strong>未触发</strong></article></div>
    </PanelCard>

    <PanelCard v-else class="span-12" title="设备监控" subtitle="各设备在线/离线、丢包率、延迟、链路状态">
      <table><thead><tr><th>设备</th><th>协议</th><th>地址</th><th>在线状态</th><th>延迟</th><th>丢包率</th><th>采集间隔</th></tr></thead><tbody><tr v-for="device in store.station.devices" :key="device.id"><td>{{ device.name }}</td><td>{{ device.protocol }}</td><td>{{ device.address }}</td><td><StatusBadge :text="device.status === '通讯中断' ? '通讯中断' : '已激活'" /></td><td>{{ device.type === '电表' ? '42ms' : '28ms' }}</td><td>{{ device.type === '电表' ? '0.04%' : '0.02%' }}</td><td>{{ device.interval }}</td></tr></tbody></table>
    </PanelCard>
  </div>
</template>
