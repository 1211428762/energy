<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ModalDialog from '@/components/ModalDialog.vue'
import PanelCard from '@/components/PanelCard.vue'
import PowerFlow from '@/components/PowerFlow.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useEmsStore, type Device, type DeviceType, type Station, type ThingModel } from '@/stores/ems'

const route = useRoute()
const store = useEmsStore()
const section = computed(() => String(route.params.section || 'models'))
const modal = ref<'model' | 'device' | 'point' | 'station' | ''>('')
const editingId = ref('')
const modelForm = reactive({ name: '', type: 'PCS' as DeviceType, version: 'V1.0' })
const deviceForm = reactive({ name: '', modelId: '', ip: '', port: 502, interval: '1s' })
const pointForm = reactive({ id: '', device: '', address: '', type: 'Float32', unit: 'kW', scale: '0.1', desc: '' })
const stationForm = reactive({ name: '', location: '', capacity: '', powerRating: '', gridVoltage: '', transformerRatio: '', gridPoint: '' })
const steps = ['创建物模型', '实例化设备', '配置点表', '创建电站', '电站投运']
const sectionTitle = computed(() => ({ models: '物模型管理', devices: '设备实例化', points: '点表配置', station: '电站管理', launch: '电站投运', topology: '设备拓扑展示' }[section.value] || '投运管理'))

watch(section, () => { modal.value = ''; editingId.value = '' })

const openModel = (model?: ThingModel) => {
  editingId.value = model?.id || ''
  Object.assign(modelForm, { name: model?.name || '', type: model?.type || 'PCS', version: model?.version || 'V1.0' })
  modal.value = 'model'
}
const saveModel = () => {
  if (editingId.value) store.updateThingModel(editingId.value, { name: modelForm.name, version: modelForm.version })
  else store.createThingModel(modelForm.type, modelForm.name)
  modal.value = ''
}
const openDevice = (device?: Device) => {
  editingId.value = device?.id || ''
  Object.assign(deviceForm, { name: device?.name || '', modelId: device?.modelId || store.thingModels[0]?.id || '', ip: device?.ip || '10.20.1.50', port: device?.port || 502, interval: device?.interval || '1s' })
  modal.value = 'device'
}
const saveDevice = () => {
  if (editingId.value) store.updateDevice(editingId.value, deviceForm)
  else store.instantiateDevice(deviceForm.modelId, deviceForm.name)
  modal.value = ''
}
const openPoint = (point?: typeof store.pointMappings[number]) => {
  editingId.value = point?.id || ''
  Object.assign(pointForm, point || { id: '', device: store.station.devices[0]?.name || '', address: '42600', type: 'Float32', unit: 'kW', scale: '0.1', desc: '有功功率' })
  modal.value = 'point'
}
const savePoint = () => {
  if (editingId.value) store.updatePointMapping(editingId.value, pointForm)
  else store.createPointMapping(pointForm.device)
  modal.value = ''
}
const openStation = () => { editingId.value = store.station.id; Object.assign(stationForm, store.station); modal.value = 'station' }
const saveStation = () => { store.updateStation(stationForm as Partial<Station>); modal.value = '' }
</script>

<template>
  <div class="page-grid tob-page">
    <PanelCard class="span-12" :title="sectionTitle" subtitle="设备与电站投运配置管理">
      <template #action><span class="page-tag">{{ store.user.role }}</span></template>
      <div class="stepper"><article v-for="(step, index) in steps" :key="step" :class="{ done: store.commissioningStep > index, active: store.commissioningStep === index + 1 }"><strong>{{ index + 1 }}</strong><span>{{ step }}</span></article></div>
    </PanelCard>

    <PanelCard v-if="section === 'models'" class="span-12" title="物模型列表" subtitle="展示PCS、BMS、电表、变压器物模型属性、遥测、遥信与控制命令">
      <template #action><button class="primary-btn" @click="openModel()">新增物模型</button></template>
      <table><thead><tr><th>名称</th><th>类型</th><th>属性</th><th>遥测</th><th>遥信</th><th>控制命令</th><th>版本</th><th>操作</th></tr></thead><tbody><tr v-for="item in store.thingModels" :key="item.id"><td>{{ item.name }}</td><td>{{ item.type }}</td><td>{{ item.properties.join('，') }}</td><td>{{ item.telemetry.join('，') }}</td><td>{{ item.signals.join('，') }}</td><td>{{ item.commands.join('，') }}</td><td>{{ item.version }}</td><td class="actions"><button @click="openModel(item)">编辑</button><button @click="store.deleteThingModel(item.id)">删除</button></td></tr></tbody></table>
    </PanelCard>

    <PanelCard v-else-if="section === 'devices'" class="span-12" title="设备实例列表" subtitle="基于物模型创建设备，配置通讯参数、IP、端口、协议、采集间隔">
      <template #action><button class="primary-btn" @click="openDevice()">新增设备</button></template>
      <table><thead><tr><th>设备名称</th><th>类型</th><th>物模型</th><th>协议</th><th>IP</th><th>端口</th><th>采集间隔</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="item in store.station.devices" :key="item.id"><td>{{ item.name }}</td><td>{{ item.type }}</td><td>{{ item.model }}</td><td>{{ item.protocol }}</td><td>{{ item.ip }}</td><td>{{ item.port }}</td><td>{{ item.interval }}</td><td><StatusBadge :text="item.status" /></td><td class="actions"><button @click="openDevice(item)">编辑</button><button @click="store.deleteDevice(item.id)">删除</button></td></tr></tbody></table>
    </PanelCard>

    <PanelCard v-else-if="section === 'points'" class="span-12" title="点表配置列表" subtitle="查看和维护测点映射、寄存器地址、单位与缩放系数">
      <template #action><button class="primary-btn" @click="openPoint()">新增测点</button></template>
      <table><thead><tr><th>测点ID</th><th>设备</th><th>寄存器地址</th><th>数据类型</th><th>单位</th><th>缩放系数</th><th>描述</th><th>操作</th></tr></thead><tbody><tr v-for="item in store.pointMappings" :key="item.id"><td>{{ item.id }}</td><td>{{ item.device }}</td><td>{{ item.address }}</td><td>{{ item.type }}</td><td>{{ item.unit }}</td><td>{{ item.scale }}</td><td>{{ item.desc }}</td><td class="actions"><button @click="openPoint(item)">编辑</button><button @click="store.deletePointMapping(item.id)">删除</button></td></tr></tbody></table>
    </PanelCard>

    <PanelCard v-else-if="section === 'station'" class="span-12" title="电站信息" subtitle="创建电站并配置电站属性、并网参数与容量参数">
      <template #action><button class="primary-btn" @click="openStation">编辑电站</button></template>
      <div class="detail-grid"><article><label>电站名称</label><strong>{{ store.station.name }}</strong></article><article><label>位置</label><strong>{{ store.station.location }}</strong></article><article><label>储能容量</label><strong>{{ store.station.capacity }}</strong></article><article><label>额定功率</label><strong>{{ store.station.powerRating }}</strong></article><article><label>并网电压</label><strong>{{ store.station.gridVoltage }}</strong></article><article><label>并网点</label><strong>{{ store.station.gridPoint }}</strong></article></div>
    </PanelCard>

    <PanelCard v-else-if="section === 'launch'" class="span-12" title="电站投运" subtitle="一键投运，初始化设备通讯、点表解析与模拟采集状态">
      <div class="launch-checks"><p>物模型：{{ store.thingModels.length }} 套</p><p>设备实例：{{ store.station.devices.length }} 台</p><p>点表映射：{{ store.pointMappings.length }} 个</p><p>电站状态：{{ store.station.status }}</p><button class="primary-btn" @click="store.commissionStation">一键投运</button></div>
      <div class="timeline"><article v-for="log in store.logs.slice(0, 8)" :key="log.time + log.event"><strong>{{ log.time }}</strong><span>{{ log.event }} · {{ log.result }}</span></article></div>
    </PanelCard>

    <PanelCard v-else class="span-12" title="设备拓扑展示" subtitle="展示电站内设备电气连接与通讯拓扑，元素使用业务图标呈现">
      <PowerFlow />
    </PanelCard>

    <ModalDialog :open="modal === 'model'" title="物模型维护" @close="modal = ''"><div class="form-grid two"><label>模型名称<input v-model="modelForm.name" /></label><label>设备类型<select v-model="modelForm.type"><option>PCS</option><option>BMS</option><option>电表</option><option>变压器</option></select></label><label>版本<input v-model="modelForm.version" /></label></div><template #footer><button class="ghost-btn" @click="modal = ''">取消</button><button class="primary-btn" @click="saveModel">保存</button></template></ModalDialog>
    <ModalDialog :open="modal === 'device'" title="设备实例维护" @close="modal = ''"><div class="form-grid two"><label>设备名称<input v-model="deviceForm.name" /></label><label>物模型<select v-model="deviceForm.modelId"><option v-for="model in store.thingModels" :key="model.id" :value="model.id">{{ model.name }}</option></select></label><label>IP地址<input v-model="deviceForm.ip" /></label><label>端口<input v-model.number="deviceForm.port" /></label><label>采集间隔<input v-model="deviceForm.interval" /></label></div><template #footer><button class="ghost-btn" @click="modal = ''">取消</button><button class="primary-btn" @click="saveDevice">保存</button></template></ModalDialog>
    <ModalDialog :open="modal === 'point'" title="点表维护" @close="modal = ''"><div class="form-grid two"><label>设备<select v-model="pointForm.device"><option v-for="device in store.station.devices" :key="device.id">{{ device.name }}</option></select></label><label>寄存器地址<input v-model="pointForm.address" /></label><label>数据类型<input v-model="pointForm.type" /></label><label>单位<input v-model="pointForm.unit" /></label><label>缩放系数<input v-model="pointForm.scale" /></label><label>描述<input v-model="pointForm.desc" /></label></div><template #footer><button class="ghost-btn" @click="modal = ''">取消</button><button class="primary-btn" @click="savePoint">保存</button></template></ModalDialog>
    <ModalDialog :open="modal === 'station'" title="电站属性维护" @close="modal = ''"><div class="form-grid two"><label>电站名称<input v-model="stationForm.name" /></label><label>位置<input v-model="stationForm.location" /></label><label>储能容量<input v-model="stationForm.capacity" /></label><label>额定功率<input v-model="stationForm.powerRating" /></label><label>并网电压<input v-model="stationForm.gridVoltage" /></label><label>变压器变比<input v-model="stationForm.transformerRatio" /></label><label>并网点<input v-model="stationForm.gridPoint" /></label></div><template #footer><button class="ghost-btn" @click="modal = ''">取消</button><button class="primary-btn" @click="saveStation">保存</button></template></ModalDialog>
  </div>
</template>
