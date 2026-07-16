<script setup lang="ts">
import { computed } from 'vue'
import { BatteryCharging, Building2, Factory, Gauge, Grid3X3, RadioTower, SunMedium, Zap } from 'lucide-vue-next'
import { useEmsStore } from '@/stores/ems'

const store = useEmsStore()
const flowColor = computed(() => store.snapshot.mode === '充电' ? 'var(--el-color-success)' : store.snapshot.mode === '放电' ? 'var(--el-color-warning)' : 'var(--el-color-info)')
const storageActive = computed(() => Math.abs(store.snapshot.storagePower) > 5)
const hasPv = computed(() => store.snapshot.pvPower > 5)
const discharge = computed(() => store.snapshot.mode === '放电' && storageActive.value)
const charge = computed(() => store.snapshot.mode === '充电' && storageActive.value)
const gridImport = computed(() => store.snapshot.gridPower >= 0)
const nodes = computed(() => [
  { key: 'grid', label: '电网', value: store.format.kw(store.snapshot.gridPower), x: 34, y: 164, w: 124, icon: Grid3X3, cls: 'grid' },
  { key: 'tr', label: '箱式变压器', value: '10/0.4kV', x: 194, y: 164, w: 132, icon: RadioTower, cls: 'tr' },
  { key: 'meter', label: '并网电表', value: 'PF 0.98', x: 362, y: 164, w: 132, icon: Gauge, cls: 'meter' },
  { key: 'pcs', label: 'PCS变流器', value: store.format.kw(store.snapshot.storagePower), x: 540, y: 164, w: 132, icon: Zap, cls: 'storage' },
  { key: 'bms', label: '电池簇', value: store.format.pct(store.snapshot.soc), x: 540, y: 292, w: 132, icon: BatteryCharging, cls: 'battery' },
  { key: 'pv', label: '屋顶光伏', value: store.format.kw(store.snapshot.pvPower), x: 704, y: 20, w: 124, icon: SunMedium, cls: 'pv' },
  { key: 'load', label: '园区负荷', value: store.format.kw(store.snapshot.loadPower), x: 704, y: 158, w: 124, icon: Factory, cls: 'load' },
])
</script>

<template>
  <div class="topology-canvas">
    <svg class="power-flow" viewBox="0 0 860 420" role="img" aria-label="储能电站一次系统图">
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>

      </defs>
      <g class="grid-lines">
        <path d="M158 204 H194"/>
        <path d="M326 204 H362"/>
        <path d="M494 204 H540"/>
        <path d="M606 250 V292"/>
        <path d="M672 204 H704"/>
        <path d="M766 98 V204 H704"/>
        <path d="M766 106 V158"/>
        <path d="M672 204 H690 V334 H704"/>
      </g>
      <g v-if="gridImport" class="flow-lines energy-flow"><path d="M158 204 H540"/></g>
      <g v-else class="flow-lines energy-flow"><path d="M540 204 H158"/></g>
      <g class="flow-lines energy-flow load-flow"><path d="M672 204 H704"/></g>
      <g class="flow-lines energy-flow building-flow"><path d="M672 204 H690 V334 H704"/></g>
      <g  class="flow-lines energy-flow pv-flow"><path d="M766 98 V204 H704"/></g>
      <g class="flow-lines energy-flow pv-load-flow"><path d="M766 106 V158"/></g>
      <g v-if="charge" class="flow-lines energy-flow storage-charge" :style="{ color: flowColor }"><path d="M606 250 V292"/></g>
      <g v-else-if="discharge" class="flow-lines energy-flow storage-discharge" :style="{ color: flowColor }"><path d="M606 292 V250"/></g>
      <foreignObject v-for="node in nodes" :key="node.key" :x="node.x" :y="node.y" :width="node.w" height="86">
        <div class="topology-node" :class="node.cls">
          <component :is="node.icon" :size="22" />
          <strong>{{ node.label }}</strong>
          <span>{{ node.value }}</span>
        </div>
      </foreignObject>
      <foreignObject x="704" y="294" width="124" height="86"><div class="topology-node building"><Building2 :size="22" /><strong>厂房配电</strong><span>0.4kV母线</span></div></foreignObject>
    </svg>
  </div>
</template>
