<script setup lang="ts">
import { computed, ref } from 'vue'
import { CircleCheck, Flame, Thermometer, ThermometerSnowflake, TrendingDown, TrendingUp, Video, Zap } from 'lucide-vue-next'
import KpiCard from '@/components/KpiCard.vue'
import PowerFlow from '@/components/PowerFlow.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useEmsStore } from '@/stores/ems'
const props = defineProps<{ section: 'station' | 'devices' | 'pcs' | 'bms' | 'cells' | 'meter' | 'environment' | 'communication' }>()
const store = useEmsStore()
const keyword = ref('')
const pageSize = ref(8)
const currentPage = ref(1)
const selectedDeviceId = ref('')
const selectedStationId = ref(store.station.id)
const selectedMonitorType = ref('PCS/BMS')
const title = computed(() => ({ station: '电站总览', devices: '设备监控', pcs: '设备监控', bms: '设备监控', cells: '电芯级监控', meter: '设备监控', environment: '环境监控', communication: '设备监控' }[props.section]))
const subtitle = computed(() => ({ station: '电站级运行状态与一次系统图', devices: 'PCS、BMS、电表与通讯状态统一监控', pcs: 'PCS三相电参量与运行模式', bms: 'BMS电池状态与安全参数', cells: '电芯电压温度分布与极值定位', meter: '并网点电表功率与电能计量', environment: '储能舱辅助系统拓扑与环控状态', communication: '设备通讯在线率、延迟与丢包率' }[props.section]))
const filterText = (value: string) => value.toLowerCase().includes(keyword.value.trim().toLowerCase())
const monitorDeviceOptions = computed(() => store.station.devices.filter((item) => selectedMonitorType.value === 'PCS/BMS' ? (item.type === 'PCS' || item.type === 'BMS') : selectedMonitorType.value === '电表' ? item.type === '电表' : true))
const devices = computed(() => monitorDeviceOptions.value.filter((item) => !selectedDeviceId.value || item.id === selectedDeviceId.value).filter((item) => !keyword.value || filterText(`${item.name}${item.type}${item.protocol}${item.address}${item.status}`)))
const deviceRows = computed(() => devices.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const cellRows = computed(() => store.cells.map((cell, index) => {
  const voltage = index === 5 ? 3.742 : index === 12 ? 3.106 : cell.voltage
  const temperature = index === 7 ? 52.8 : index === 19 ? 12.6 : cell.temperature
  const status = voltage > 3.65 ? '高压' : voltage < 3.18 ? '低压' : temperature > 48 ? '高温' : temperature < 15 ? '低温' : '正常'
  const icon = status === '高压' ? TrendingUp : status === '低压' ? TrendingDown : status === '高温' ? Flame : status === '低温' ? ThermometerSnowflake : CircleCheck
  return { ...cell, voltage, temperature, status, icon }
}))
const repeatedDevices = computed(() => [...store.station.devices, ...store.station.devices])
const repeatedAlarms = computed(() => [...store.alarms, ...store.alarms])
const envSystems = [
  { title: '热管理系统', sub: '液冷/风冷 · 空调/散热器', status: '制冷运行', value: '26.8 ℃ / 48%', icon: Thermometer },
  { title: '消防系统', sub: '七氟丙烷/全氟己酮', status: '正常待命', value: '气瓶压力 4.2MPa', icon: Flame },
  { title: '电源系统', sub: 'UPS/站用电 · 双路供电', status: '双路正常', value: 'UPS 96%', icon: Zap },
  { title: '视频/安防系统', sub: '摄像头/门禁 · 环境监测', status: '门禁闭合', value: '视频在线', icon: Video },
]
</script>
<template>
  <div class="page-grid tob-page">
    <template v-if="section === 'station'"><KpiCard label="电站SOC" :value="store.format.pct(store.snapshot.soc)" hint="储能可用容量" tone="blue" /><KpiCard label="并网点功率" :value="store.format.kw(store.snapshot.gridPower)" hint="正向取电功率" tone="green" /><KpiCard label="光伏功率" :value="store.format.kw(store.snapshot.pvPower)" hint="夜间自动为0" tone="orange" /><KpiCard label="设备在线率" :value="`${store.onlineDevices}/${store.station.devices.length}`" hint="通讯状态" tone="green" /><section class="data-section span-12"><PowerFlow /></section><section class="data-section span-6"><h3>设备运行信息</h3><div class="scroll-list"><div class="scroll-list-inner"><article v-for="device in repeatedDevices" :key="device.id + device.name" class="device-card"><strong>{{ device.name }}</strong><span>{{ device.protocol }} · {{ device.address }}</span><StatusBadge :text="device.status" /></article></div></div></section><section class="data-section span-6"><h3>告警信息</h3><div class="scroll-list"><div class="scroll-list-inner"><article v-for="alarm in repeatedAlarms" :key="alarm.id + alarm.occurredAt" class="feed-item"><div><strong>{{ alarm.name }}</strong><span>{{ alarm.deviceName }} · {{ alarm.occurredAt }}</span></div><StatusBadge :text="alarm.status" /></article></div></div></section></template>
    <section v-else-if="section === 'devices' || section === 'pcs' || section === 'bms' || section === 'meter' || section === 'communication'" class="data-section span-12"><div class="query-bar"><el-select v-model="selectedMonitorType" @change="selectedDeviceId = ''"><el-option label="PCS/BMS设备" value="PCS/BMS" /><el-option label="电表点位" value="电表" /><el-option label="通讯状态" value="通讯" /></el-select><el-select v-model="selectedDeviceId" clearable placeholder="选择设备"><el-option v-for="device in monitorDeviceOptions" :key="device.id" :label="device.name" :value="device.id" /></el-select><el-input v-model="keyword" clearable placeholder="设备 / 协议 / 地址 / 状态" /><el-button type="primary">查询</el-button><el-button @click="keyword = ''; selectedDeviceId = ''">重置</el-button></div><el-table :data="deviceRows" stripe height="520"><el-table-column prop="name" label="设备" min-width="170"/><el-table-column prop="type" label="类型" width="90"/><el-table-column label="状态" width="120"><template #default="{ row }"><StatusBadge :text="row.status" /></template></el-table-column><el-table-column label="电压 / 计量"><template #default="{ row }">{{ row.type === '电表' ? '10.2 kV / 38620 kWh' : row.type === 'BMS' ? (row.telemetry.总电压 || '1498.6 V') : (row.telemetry.A相电压 || '230.6 V') }}</template></el-table-column><el-table-column label="电流 / 功率"><template #default="{ row }">{{ row.type === '电表' ? store.format.kw(store.snapshot.gridPower) : row.type === 'BMS' ? '526.8 A' : (row.telemetry.B相电流 || '812.4 A') }}</template></el-table-column><el-table-column label="SOC / 模式"><template #default="{ row }">{{ row.type === 'BMS' ? store.format.pct(store.snapshot.soc) : row.type === '电表' ? 'PF 0.98' : (row.telemetry.运行模式 || store.snapshot.mode) }}</template></el-table-column><el-table-column label="温度 / 延迟"><template #default="{ row }">{{ selectedMonitorType === '通讯' ? (row.type === '电表' ? '42ms / 0.04%' : '28ms / 0.02%') : row.type === 'BMS' ? `${store.avgCellTemp.toFixed(1)} ℃` : (row.telemetry.温度 || `${store.snapshot.pcsTemperature.toFixed(1)} ℃`) }}</template></el-table-column><el-table-column label="协议与采集"><template #default="{ row }">{{ row.protocol }} · {{ row.address }} · {{ row.interval }}</template></el-table-column></el-table><div class="pager-row"><el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="devices.length" layout="total, sizes, prev, pager, next, jumper" /></div></section>
    <section v-else-if="section === 'cells'" class="data-section span-12"><div class="query-bar"><el-select v-model="selectedStationId"><el-option v-for="station in store.stations" :key="station.id" :label="station.name" :value="station.id" /></el-select><el-input v-model="keyword" clearable placeholder="电芯编号 / 状态" /><el-button type="primary">查询</el-button><el-button @click="keyword = ''">重置</el-button></div><div class="cell-summary"><span>高压 {{ cellRows.filter((c) => c.status === '高压').length }}</span><span>低压 {{ cellRows.filter((c) => c.status === '低压').length }}</span><span>高温 {{ cellRows.filter((c) => c.status === '高温').length }}</span><span>低温 {{ cellRows.filter((c) => c.status === '低温').length }}</span></div><div class="cell-grid"><article v-for="cell in cellRows.filter((c) => !keyword || `${c.id}${c.status}`.includes(keyword))" :key="cell.id" :class="cell.status" :style="{ '--heat': `${(cell.temperature - 22) / 20}` }"><component :is="cell.icon" :size="18" /><strong>{{ cell.id }}</strong><span>{{ cell.voltage.toFixed(3) }} V</span><em>{{ cell.temperature.toFixed(1) }} ℃</em><small>{{ cell.status }}</small></article></div></section>
    <section v-else class="data-section span-12 env-topology-layout"><div class="env-topology-card"><div class="section-head"><h2>辅助系统集群</h2><p>热管理、消防、电源、视频/安防运行拓扑</p></div><div class="env-grid"><article v-for="system in envSystems" :key="system.title" class="env-system-card"><span class="comm-dot"></span><component :is="system.icon" :size="30" /><strong>{{ system.title }}</strong><em>{{ system.sub }}</em><small>{{ system.status }}</small></article></div></div><aside class="env-status"><article v-for="system in envSystems" :key="system.title"><label><span class="comm-dot"></span>{{ system.title }}</label><strong>{{ system.status }}</strong><span>{{ system.value }}</span></article></aside></section>
  </div>
</template>
