<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { BatteryCharging, Cloud, Cpu, Flame, Gauge, HardDrive, Radio, Router, ShieldCheck, Zap } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import { useEmsStore, type Device, type DeviceType, type Station, type ThingModel } from '@/stores/ems'

const props = defineProps<{ section: 'models' | 'devices' | 'points' | 'station' | 'launch' | 'topology' }>()
const store = useEmsStore()
const modal = ref<'model' | 'device' | 'point' | 'station' | ''>('')
const dialogVisible = computed({ get: () => modal.value !== '', set: (value) => { if (!value) modal.value = '' } })
const editingId = ref('')
const keyword = ref('')
const pageSize = ref(8)
const currentPage = ref(1)
const stationEditing = ref(false)
const modelForm = reactive({ name: '', type: 'PCS' as DeviceType, version: 'V1.0' })
const deviceForm = reactive({ name: '', modelId: '', ip: '', port: 502, interval: '1s' })
const pointForm = reactive({ id: '', device: '', address: '', type: 'Float32', unit: 'kW', scale: '0.1', desc: '' })
const stationForm = reactive({ id: '', name: '', location: '', capacity: '', powerRating: '', gridVoltage: '', transformerRatio: '', gridPoint: '', status: '待投运' })
const steps = ['创建物模型', '实例化设备', '配置点表', '创建电站', '电站投运']
const title = computed(() => ({ models: '物模型管理', devices: '设备实例化', points: '点表配置', station: '电站管理', launch: '电站投运', topology: '设备拓扑展示' }[props.section]))
const stationImage = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20energy%20storage%20power%20station%2C%20battery%20containers%2C%20transformer%2C%20solar%20roof%2C%20clean%20enterprise%20management%20system%20visual%2C%20realistic%20wide%20angle%2C%20no%20text%2C%20no%20people&image_size=landscape_16_9'
const repeatedDevices = computed(() => [...store.station.devices, ...store.station.devices])
const repeatedAlarms = computed(() => [...store.alarms, ...store.alarms])
const subtitle = computed(() => ({ models: '设备标准属性、遥测、遥信与控制命令维护', devices: '设备通讯参数、协议与采集间隔配置', points: '设备寄存器地址与业务字段映射维护', station: '电站基础信息、容量参数与并网参数配置', launch: '设备通讯初始化、点表解析与采集状态启动', topology: '电站内设备电气连接与通讯拓扑' }[props.section]))
const stationTopology = [
  { title: '调度中心 / 云端平台', sub: 'IEC 104 / 调度数据网', icon: Cloud },
  { title: '站控层', sub: 'EMS主机 / SCADA / AGC / AVC', icon: Cpu },
  { title: '历史服务器', sub: '数据归档', icon: HardDrive },
  { title: '远动装置', sub: '调度转发', icon: Radio },
  { title: '对时系统', sub: 'GPS / 北斗', icon: Gauge },
]
const intervalNodes = [
  { title: '线路保护测控', sub: '并网保护', icon: ShieldCheck },
  { title: '公用测控装置', sub: '公共遥测', icon: Gauge },
  { title: 'PCS控制器', sub: '功率闭环', icon: Zap },
  { title: 'BMS总控(BAMS)', sub: '簇级安全', icon: BatteryCharging },
  { title: '防孤岛保护', sub: '并网解列', icon: ShieldCheck },
  { title: '站用变保护', sub: '站用电源', icon: Router },
]
const unitNodes = [
  { title: 'PCS本控', sub: 'Modbus', icon: Zap },
  { title: 'BMS主控', sub: 'CAN', icon: BatteryCharging },
  { title: '温控/消防控制器', sub: '辅助联动', icon: Flame },
]
const filterText = (value: string) => value.toLowerCase().includes(keyword.value.trim().toLowerCase())
const page = <T>(rows: T[]) => rows.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
const filteredModels = computed(() => store.thingModels.filter((item) => !keyword.value || filterText(`${item.name}${item.type}${item.version}`)))
const modelRows = computed(() => page(filteredModels.value))
const filteredDevices = computed(() => store.station.devices.filter((item) => !keyword.value || filterText(`${item.name}${item.type}${item.ip}${item.protocol}`)))
const deviceRows = computed(() => page(filteredDevices.value))
const filteredPoints = computed(() => store.pointMappings.filter((item) => !keyword.value || filterText(`${item.id}${item.device}${item.address}${item.desc}`)))
const pointRows = computed(() => page(filteredPoints.value))
const filteredStations = computed(() => store.stations.filter((item) => !keyword.value || filterText(`${item.name}${item.location}${item.status}`)))
const stationRows = computed(() => page(filteredStations.value))

watch(() => props.section, () => { modal.value = ''; editingId.value = ''; keyword.value = ''; currentPage.value = 1 })
const openModel = (model?: ThingModel) => { editingId.value = model?.id || ''; Object.assign(modelForm, { name: model?.name || '', type: model?.type || 'PCS', version: model?.version || 'V1.0' }); modal.value = 'model' }
const saveModel = () => { editingId.value ? store.updateThingModel(editingId.value, { name: modelForm.name, version: modelForm.version }) : store.createThingModel(modelForm.type, modelForm.name); modal.value = '' }
const openDevice = (device?: Device) => { editingId.value = device?.id || ''; Object.assign(deviceForm, { name: device?.name || '', modelId: device?.modelId || store.thingModels[0]?.id || '', ip: device?.ip || '10.20.1.50', port: device?.port || 502, interval: device?.interval || '1s' }); modal.value = 'device' }
const saveDevice = () => { editingId.value ? store.updateDevice(editingId.value, deviceForm) : store.instantiateDevice(deviceForm.modelId, deviceForm.name); modal.value = '' }
const openPoint = (point?: typeof store.pointMappings[number]) => { editingId.value = point?.id || ''; Object.assign(pointForm, point || { id: '', device: store.station.devices[0]?.name || '', address: '42600', type: 'Float32', unit: 'kW', scale: '0.1', desc: '有功功率' }); modal.value = 'point' }
const savePoint = () => { editingId.value ? store.updatePointMapping(editingId.value, pointForm) : store.createPointMapping(pointForm.device); modal.value = '' }
const openStation = (station?: Station) => {
  editingId.value = station?.id || ''
  Object.assign(stationForm, station || { id: '', name: '', location: '', capacity: '', powerRating: '', gridVoltage: '', transformerRatio: '', gridPoint: '', status: '待投运' })
  stationEditing.value = true
}
const saveStation = () => {
  editingId.value ? store.updateStation(stationForm as Partial<Station>) : store.createStation(stationForm as Partial<Station>)
  stationEditing.value = false
}
</script>

<template>
  <div class="page-grid tob-page">
    <!-- <section class="process-strip span-12">
      <article v-for="(step, index) in steps" :key="step" :class="{ done: store.commissioningStep > index, active: store.commissioningStep === index + 1 }"><strong>{{ index + 1 }}</strong><span>{{ step }}</span></article>
    </section> -->

    <section v-if="section === 'models'" class="data-section span-12">
      <div class="query-bar"><el-input v-model="keyword" clearable placeholder="模型名称 / 类型 / 版本" /><el-button type="primary">查询</el-button><el-button @click="keyword = ''">重置</el-button><el-button type="primary" plain @click="openModel()">新增物模型</el-button></div>
      <el-table :data="modelRows" stripe height="520"><el-table-column prop="name" label="名称" min-width="170" /><el-table-column prop="type" label="类型" width="90" /><el-table-column label="属性" min-width="190"><template #default="{ row }">{{ row.properties.join('，') }}</template></el-table-column><el-table-column label="遥测" min-width="190"><template #default="{ row }">{{ row.telemetry.join('，') }}</template></el-table-column><el-table-column prop="version" label="版本" width="90" /><el-table-column label="操作" width="150" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openModel(row)">编辑</el-button><el-button link type="danger" @click="store.deleteThingModel(row.id)">删除</el-button></template></el-table-column></el-table>
      <div class="pager-row"><el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredModels.length" layout="total, sizes, prev, pager, next, jumper" /></div>
    </section>

    <section v-else-if="section === 'devices'" class="data-section span-12">
      <div class="query-bar"><el-input v-model="keyword" clearable placeholder="设备名称 / 类型 / IP / 协议" /><el-button type="primary">查询</el-button><el-button @click="keyword = ''">重置</el-button><el-button type="primary" plain @click="openDevice()">新增设备</el-button></div>
      <el-table :data="deviceRows" stripe height="520"><el-table-column prop="name" label="设备名称" min-width="170" /><el-table-column prop="type" label="类型" width="90" /><el-table-column prop="model" label="物模型" min-width="180" /><el-table-column prop="protocol" label="协议" width="120" /><el-table-column prop="ip" label="IP" width="120" /><el-table-column prop="port" label="端口" width="90" /><el-table-column label="状态" width="120"><template #default="{ row }"><StatusBadge :text="row.status" /></template></el-table-column><el-table-column label="操作" width="150"><template #default="{ row }"><el-button link type="primary" @click="openDevice(row)">编辑</el-button><el-button link type="danger" @click="store.deleteDevice(row.id)">删除</el-button></template></el-table-column></el-table>
      <div class="pager-row"><el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredDevices.length" layout="total, sizes, prev, pager, next, jumper" /></div>
    </section>

    <section v-else-if="section === 'points'" class="data-section span-12">
      <div class="query-bar"><el-input v-model="keyword" clearable placeholder="测点 / 设备 / 地址 / 描述" /><el-button type="primary">查询</el-button><el-button @click="keyword = ''">重置</el-button><el-button type="primary" plain @click="openPoint()">新增测点</el-button></div>
      <el-table :data="pointRows" stripe height="520"><el-table-column prop="id" label="测点ID" width="110" /><el-table-column prop="device" label="设备" min-width="170" /><el-table-column prop="address" label="寄存器地址" width="120" /><el-table-column prop="type" label="数据类型" width="110" /><el-table-column prop="unit" label="单位" width="80" /><el-table-column prop="scale" label="缩放系数" width="100" /><el-table-column prop="desc" label="描述" /><el-table-column label="操作" width="150"><template #default="{ row }"><el-button link type="primary" @click="openPoint(row)">编辑</el-button><el-button link type="danger" @click="store.deletePointMapping(row.id)">删除</el-button></template></el-table-column></el-table>
      <div class="pager-row"><el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredPoints.length" layout="total, sizes, prev, pager, next, jumper" /></div>
    </section>

    <section v-else-if="section === 'station'" class="data-section span-12">
      <template v-if="!stationEditing">
        <div class="query-bar"><el-input v-model="keyword" clearable placeholder="电站名称 / 位置 / 状态" /><el-button type="primary">查询</el-button><el-button @click="keyword = ''">重置</el-button><el-button type="primary" plain @click="openStation()">新增电站</el-button></div>
        <el-table :data="stationRows" stripe><el-table-column prop="name" label="电站名称" /><el-table-column prop="location" label="位置" /><el-table-column prop="capacity" label="储能容量" /><el-table-column prop="powerRating" label="额定功率" /><el-table-column prop="gridVoltage" label="并网电压" /><el-table-column prop="status" label="状态"><template #default="{ row }"><StatusBadge :text="row.status" /></template></el-table-column><el-table-column label="操作" width="120"><template #default="{ row }"><el-button link type="primary" @click="openStation(row)">编辑</el-button></template></el-table-column></el-table>
        <div class="pager-row"><el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredStations.length" layout="total, sizes, prev, pager, next, jumper" /></div>
      </template>
      <template v-else>
        <div class="station-manager-actions"><el-button @click="stationEditing = false">返回列表</el-button><el-button type="primary" @click="saveStation">保存电站</el-button></div>
        <div class="split">
          <div class="station-hero"><img src="/img/gui.png" alt="电站展示" /><div><strong>{{ stationForm.name || '新增储能电站' }}</strong><span>{{ stationForm.location || '请配置电站位置' }}</span></div></div>
          <el-form :model="stationForm" label-width="100px"><el-form-item label="电站名称"><el-input v-model="stationForm.name" /></el-form-item><el-form-item label="位置"><el-input v-model="stationForm.location" /></el-form-item><el-form-item label="储能容量"><el-input v-model="stationForm.capacity" /></el-form-item><el-form-item label="额定功率"><el-input v-model="stationForm.powerRating" /></el-form-item><el-form-item label="并网电压"><el-input v-model="stationForm.gridVoltage" /></el-form-item><el-form-item label="变压器变比"><el-input v-model="stationForm.transformerRatio" /></el-form-item><el-form-item label="并网点"><el-input v-model="stationForm.gridPoint" /></el-form-item><el-form-item label="状态"><el-select v-model="stationForm.status"><el-option label="待投运" value="待投运" /><el-option label="调试中" value="调试中" /><el-option label="稳定运行" value="稳定运行" /></el-select></el-form-item></el-form>
        </div>
      </template>
    </section>

    <section v-else-if="section === 'launch'" class="data-section span-12">
      <div class="launch-checks"><p>物模型：{{ store.thingModels.length }} 套</p><p>设备实例：{{ store.station.devices.length }} 台</p><p>点表映射：{{ store.pointMappings.length }} 个</p><p>电站状态：{{ store.station.status }}</p><el-button type="primary" @click="store.commissionStation">一键投运</el-button></div>
      <div class="timeline"><article v-for="log in store.logs.slice(0, 8)" :key="log.time + log.event"><strong>{{ log.time }}</strong><span>{{ log.event }} · {{ log.result }}</span></article></div>
    </section>

    <template v-else>
      <section class="data-section span-12"><div class="section-head"><h2>设备拓扑展示</h2><p>调度中心、站控层、间隔层与储能单元层通讯拓扑</p></div><div class="station-device-topology"><div class="topo-node wide cloud"><component :is="stationTopology[0].icon" :size="24" /><strong>{{ stationTopology[0].title }}</strong><span>{{ stationTopology[0].sub }}</span></div><div class="topo-link vertical">IEC 104</div><div class="topo-node station-control"><component :is="stationTopology[1].icon" :size="24" /><strong>{{ stationTopology[1].title }}</strong><span>{{ stationTopology[1].sub }}</span><em><i v-for="item in stationTopology.slice(2)" :key="item.title"><component :is="item.icon" :size="14" />{{ item.title }}</i></em></div><div class="topo-link vertical">IEC 61850 / 双网冗余</div><div class="switch-row"><article v-for="i in 3" :key="i" class="topo-node switch"><Router :size="22" /><strong>间隔层交换机</strong><span>双网接入 #{{ i }}</span></article></div><div class="interval-row"><article v-for="node in intervalNodes" :key="node.title" class="topo-node interval"><component :is="node.icon" :size="20" /><strong>{{ node.title }}</strong><span>{{ node.sub }}</span></article></div><div class="topo-link vertical">储能单元层</div><div class="topo-node emu"><Cpu :size="22" /><strong>就地监控装置 / EMU</strong><span>柜级采集与联动控制</span></div><div class="unit-row"><article v-for="node in unitNodes" :key="node.title" class="topo-node unit"><component :is="node.icon" :size="20" /><strong>{{ node.title }}</strong><span>{{ node.sub }}</span></article></div></div></section>
    </template>

    <el-dialog v-model="dialogVisible" destroy-on-close class="ems-dialog" :title="modal === 'model' ? '物模型维护' : modal === 'device' ? '设备实例维护' : modal === 'point' ? '点表维护' : '电站属性维护'" width="680px">
      <el-form v-if="modal === 'model'" :model="modelForm" label-width="90px"><el-form-item label="模型名称"><el-input v-model="modelForm.name" /></el-form-item><el-form-item label="设备类型"><el-select v-model="modelForm.type"><el-option label="PCS" value="PCS" /><el-option label="BMS" value="BMS" /><el-option label="电表" value="电表" /><el-option label="变压器" value="变压器" /></el-select></el-form-item><el-form-item label="版本"><el-input v-model="modelForm.version" /></el-form-item></el-form>
      <el-form v-else-if="modal === 'device'" :model="deviceForm" label-width="90px"><el-form-item label="设备名称"><el-input v-model="deviceForm.name" /></el-form-item><el-form-item label="物模型"><el-select v-model="deviceForm.modelId"><el-option v-for="model in store.thingModels" :key="model.id" :label="model.name" :value="model.id" /></el-select></el-form-item><el-form-item label="IP地址"><el-input v-model="deviceForm.ip" /></el-form-item><el-form-item label="端口"><el-input v-model.number="deviceForm.port" /></el-form-item><el-form-item label="采集间隔"><el-input v-model="deviceForm.interval" /></el-form-item></el-form>
      <el-form v-else-if="modal === 'point'" :model="pointForm" label-width="90px"><el-form-item label="设备"><el-select v-model="pointForm.device"><el-option v-for="device in store.station.devices" :key="device.id" :label="device.name" :value="device.name" /></el-select></el-form-item><el-form-item label="寄存器地址"><el-input v-model="pointForm.address" /></el-form-item><el-form-item label="数据类型"><el-input v-model="pointForm.type" /></el-form-item><el-form-item label="单位"><el-input v-model="pointForm.unit" /></el-form-item><el-form-item label="缩放系数"><el-input v-model="pointForm.scale" /></el-form-item><el-form-item label="描述"><el-input v-model="pointForm.desc" /></el-form-item></el-form>
      <el-form v-else :model="stationForm" label-width="100px"><el-form-item label="电站名称"><el-input v-model="stationForm.name" /></el-form-item><el-form-item label="位置"><el-input v-model="stationForm.location" /></el-form-item><el-form-item label="储能容量"><el-input v-model="stationForm.capacity" /></el-form-item><el-form-item label="额定功率"><el-input v-model="stationForm.powerRating" /></el-form-item><el-form-item label="并网电压"><el-input v-model="stationForm.gridVoltage" /></el-form-item><el-form-item label="变压器变比"><el-input v-model="stationForm.transformerRatio" /></el-form-item><el-form-item label="并网点"><el-input v-model="stationForm.gridPoint" /></el-form-item></el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="modal === 'model' ? saveModel() : modal === 'device' ? saveDevice() : modal === 'point' ? savePoint() : saveStation()">保存</el-button></template>
    </el-dialog>
  </div>
</template>
