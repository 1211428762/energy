<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ option: echarts.EChartsOption; updatedAt?: string }>()
const el = ref<HTMLDivElement>()
let chart: echarts.ECharts | undefined

const textColor = () => getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#d8eef8'
const mutedColor = () => getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#8fb7c8'
const namedAxis = (axis: unknown, name: string) => {
  if (!axis || Array.isArray(axis)) return axis
  const item = axis as Record<string, unknown>
  return { name, nameTextStyle: { color: mutedColor(), padding: [0, 0, 0, 4] }, axisLabel: { color: mutedColor() }, axisLine: { lineStyle: { color: mutedColor() } }, splitLine: { lineStyle: { color: 'rgba(143,183,200,.16)' } }, ...item }
}
const normalizedOption = computed<echarts.EChartsOption>(() => ({
  ...props.option,
  textStyle: { color: textColor(), ...(props.option.textStyle as object || {}) },
  legend: { ...(props.option.legend as object || {}), textStyle: { color: textColor() } },
  xAxis: namedAxis(props.option.xAxis, '维度'),
  yAxis: namedAxis(props.option.yAxis, '数值'),
}))

onMounted(() => {
  if (!el.value) return
  chart = echarts.init(el.value)
  chart.setOption(normalizedOption.value)
  window.addEventListener('resize', resize)
})

watch(normalizedOption, (option) => chart?.setOption(option, true), { deep: true })

const resize = () => chart?.resize()

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
})
</script>

<template>
  <div class="chart-wrap">
    <div class="chart-refresh"><span></span>实时刷新 <em v-if="updatedAt">{{ updatedAt }}</em></div>
    <div ref="el" class="chart-box"></div>
  </div>
</template>
