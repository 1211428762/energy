<script setup lang="ts">
import { computed } from 'vue'
import KpiCard from '@/components/KpiCard.vue'
import PowerFlow from '@/components/PowerFlow.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useEmsStore } from '@/stores/ems'

const store = useEmsStore()
const alarmFeed = computed(() => [...store.alarms, ...store.alarms, ...store.alarms])
const deviceFeed = computed(() => [...store.station.devices, ...store.station.devices, ...store.station.devices])
</script>

<template>
  <div class="page-grid home-grid">
    <KpiCard label="今日净收益" :value="store.format.yuan(store.snapshot.todayRevenue)" hint="削峰填谷收益实时累计" tone="green" />
    <KpiCard label="储能SOC" :value="store.format.pct(store.snapshot.soc)" hint="安全运行区间 10% - 95%" tone="blue" />
    <KpiCard label="放电电量" :value="store.format.kwh(store.snapshot.dischargeEnergy)" hint="当日累计输出" tone="orange" />
    <KpiCard label="CO₂减排" value="486.32 kg" hint="按区域排放因子折算" tone="green" />

    <section class="data-section span-8">
      <div class="section-head"><h2>一次系统图</h2><p>电网、变压器、并网点、储能、光伏与负荷实时功率流</p></div>
      <PowerFlow />
    </section>

    <div class="home-side-stack span-4">
      <section class="data-section">
        <div class="section-head"><h2>设备状态总览</h2><p>核心设备通讯与运行模式</p></div>
        <div class="scroll-list home-device-list"><div class="scroll-list-inner">
          <article v-for="(device, index) in deviceFeed" :key="device.id + index" class="device-card">
            <div><strong>{{ device.name }}</strong><span>{{ device.model }} · {{ device.protocol }}</span></div>
            <StatusBadge :text="device.status" />
          </article>
        </div></div>
      </section>
      <section class="data-section">
        <div class="section-head"><h2>实时告警滚动</h2><p>激活与确认告警持续刷新</p></div>
        <div class="alarm-feed scroll-list home-alarm-list"><div class="scroll-list-inner">
          <article v-for="(alarm, index) in alarmFeed" :key="alarm.id + index" class="feed-item">
            <div><strong>{{ alarm.name }}</strong><span>{{ alarm.deviceName }}</span></div>
            <StatusBadge :text="alarm.status" />
          </article>
        </div></div>
      </section>
    </div>
  </div>
</template>
