import { defineStore } from 'pinia'

export type ThemeMode = 'dark' | 'light'
export type RoleName = '系统管理员' | '电站运营人员' | '运维人员' | '调度管理人员'
export type DeviceStatus = '运行（充电）' | '运行（放电）' | '待机' | '故障' | '通讯中断'
export type DeviceType = 'PCS' | 'BMS' | '电表' | '变压器'
type Mode = '充电' | '放电' | '待机' | '离网'

export interface ThingModel {
  id: string
  name: string
  type: DeviceType
  properties: string[]
  telemetry: string[]
  signals: string[]
  commands: string[]
  events: string[]
  version: string
}

export interface Device {
  id: string
  name: string
  type: DeviceType
  modelId: string
  model: string
  status: DeviceStatus
  protocol: 'Modbus TCP' | 'Modbus RTU' | 'IEC104'
  ip: string
  port: number
  interval: string
  address: string
  telemetry: Record<string, string>
}

export interface Station {
  id: string
  name: string
  location: string
  capacity: string
  powerRating: string
  gridVoltage: string
  transformerRatio: string
  gridPoint: string
  commissionDate: string
  status: string
  devices: Device[]
}

export interface Tariff {
  period: string
  type: string
  price: number
}

export interface Alarm {
  id: string
  deviceId: string
  deviceName: string
  name: string
  level: '提示' | '一般' | '严重' | '紧急'
  description: string
  status: '激活' | '已确认' | '已恢复'
  occurredAt: string
  confirmedAt?: string
  recoveredAt?: string
}

export interface WorkOrder {
  id: string
  title: string
  source: '告警' | '人工'
  alarmId?: string
  priority: '低' | '中' | '高' | '紧急'
  status: '待接单' | '处理中' | '已完成' | '已关闭'
  assignee: string
  createdAt: string
  acceptedAt?: string
  completedAt?: string
  solution?: string
  remarks: string[]
}

interface Snapshot {
  timestamp: string
  loadPower: number
  pvPower: number
  storagePower: number
  gridPower: number
  soc: number
  pcsTemperature: number
  mode: Mode
  todayRevenue: number
  chargeEnergy: number
  dischargeEnergy: number
}

const pad = (value: number) => String(value).padStart(2, '0')
const formatTime = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const kw = (value: number) => `${value.toFixed(1)} kW`
const kwh = (value: number) => `${value.toFixed(2)} kWh`
const pct = (value: number) => `${value.toFixed(2)}%`
const yuan = (value: number) => `${value.toFixed(2)} 元`

const buildModels = (): ThingModel[] => [
  { id: 'TM-PCS-1000', name: 'PCS储能变流器物模型', type: 'PCS', version: 'V2.6', properties: ['额定功率1000kW', '额定电压400V', '转换效率98.6%', '过载能力110%'], telemetry: ['三相电压', '三相电流', '有功功率', '无功功率', '频率', '温度', '运行模式'], signals: ['运行', '待机', '故障', '并网'], commands: ['启动', '停止', '功率设定', '模式切换'], events: ['过温', '过载', '孤岛保护'] },
  { id: 'TM-BMS-1500', name: 'BMS电池管理物模型', type: 'BMS', version: 'V3.1', properties: ['磷酸铁锂', '额定容量2.00MWh', '额定电压1500V', '簇数8', '电芯串数416'], telemetry: ['总电压', '总电流', 'SOC', 'SOH', 'SOP', '单体电压极值', '单体温度极值', '绝缘阻抗'], signals: ['运行', '均衡', '保护'], commands: ['均衡启动', '保护复位', '限功率'], events: ['过压', '欠压', '过温', '过流', '绝缘故障'] },
  { id: 'TM-MTR-02S', name: '并网点电表物模型', type: '电表', version: 'V1.9', properties: ['0.2S精度', '双向有功计量', 'IEC104规约'], telemetry: ['三相电压', '三相电流', '有功功率', '无功功率', '功率因数', '正向电能', '反向电能'], signals: ['在线', '时钟同步', '计量有效'], commands: ['冻结电量', '校时'], events: ['通讯延迟', '计量异常'] },
  { id: 'TM-TR-1250', name: '箱式变压器物模型', type: '变压器', version: 'V1.5', properties: ['额定容量1250kVA', '变比10/0.4kV', '联结组别Dyn11', '短路阻抗6%', '干式变压器'], telemetry: ['三相电压', '三相电流', '有功功率', '绕组温度'], signals: ['运行', '温控投入', '跳闸'], commands: ['风机启动', '温控复归'], events: ['超温', '跳闸'] },
]

const makeDevice = (model: ThingModel, index: number): Device => {
  const prefix = model.type === '电表' ? 'MTR' : model.type === '变压器' ? 'TR' : model.type
  const ipEnd = model.type === 'PCS' ? 11 : model.type === 'BMS' ? 21 : model.type === '电表' ? 31 : 41
  return { id: `${prefix}-${pad(index)}`, name: `${prefix}#${index} ${model.type === 'PCS' ? '储能变流器' : model.type === 'BMS' ? '电池管理系统' : model.type === '电表' ? '并网点电表' : '箱式变压器'}`, type: model.type, modelId: model.id, model: model.name, status: '待机', protocol: model.type === '电表' ? 'IEC104' : model.type === '变压器' ? 'Modbus RTU' : 'Modbus TCP', ip: `10.20.1.${ipEnd}`, port: model.type === '电表' ? 2404 : 502, interval: '1s', address: model.type === '变压器' ? 'COM3 / 9600' : `10.20.1.${ipEnd}:${model.type === '电表' ? 2404 : 502}`, telemetry: {} }
}

const defaultTariffs: Tariff[] = [
  { period: '00:00-07:00', type: '谷', price: 0.32 }, { period: '07:00-10:00', type: '平', price: 0.68 }, { period: '10:00-15:00', type: '峰', price: 1.12 },
  { period: '15:00-18:00', type: '平', price: 0.68 }, { period: '18:00-22:00', type: '峰', price: 1.18 }, { period: '22:00-24:00', type: '谷', price: 0.35 },
]

const cloneTariffs = (base: Tariff[] = defaultTariffs, offset = 0) => base.map((item) => ({ ...item, price: Number((item.price + offset).toFixed(2)) }))

const buildInitial = () => {
  const now = new Date()
  const time = formatTime(now)
  const thingModels = buildModels()
  const devices = thingModels.map((model, index) => makeDevice(model, index + 1))
  const station: Station = { id: 'ST-2026-HZ-01', name: '杭州滨江智造园储能电站', location: '浙江省杭州市滨江区智造园区', capacity: '2.00 MWh', powerRating: '1.00 MW', gridVoltage: '10 kV', transformerRatio: '10/0.4 kV', gridPoint: '10kV滨智线#16环网柜', commissionDate: '2026-06-18', status: '待投运', devices }
  const stations: Station[] = [
    station,
    { ...station, id: 'ST-2026-SZ-02', name: '苏州高新区储能电站', location: '江苏省苏州市高新区', capacity: '3.20 MWh', powerRating: '1.50 MW', gridVoltage: '10 kV', gridPoint: '10kV高新线#08开关站', commissionDate: '2026-05-26', status: '稳定运行', devices: [] },
    { ...station, id: 'ST-2026-NB-03', name: '宁波港区微网储能站', location: '浙江省宁波市北仑港区', capacity: '1.60 MWh', powerRating: '800 kW', gridVoltage: '6 kV', gridPoint: '6kV港储线#03环网柜', commissionDate: '2026-04-12', status: '调试中', devices: [] },
  ]
  return {
    initializedVersion: 4,
    openedTabs: [{ path: '/', title: '首页' }],
    authenticated: false,
    user: { username: 'admin', displayName: '系统管理员', role: '系统管理员' as RoleName },
    theme: 'dark' as ThemeMode,
    currentTime: time,
    station,
    stations,
    thingModels,
    commissioningStep: 1,
    snapshot: { timestamp: time, loadPower: 1880, pvPower: 0, storagePower: 0, gridPower: 1880, soc: 63.5, pcsTemperature: 42, mode: '待机' as Mode, todayRevenue: 3860, chargeEnergy: 820, dischargeEnergy: 790 } as Snapshot,
    tariffs: cloneTariffs(),
    tariffConfigs: {
      [station.id]: cloneTariffs(),
      'ST-2026-SZ-02': cloneTariffs(defaultTariffs, 0.06),
      'ST-2026-NB-03': cloneTariffs(defaultTariffs, -0.03),
    } as Record<string, Tariff[]>,
    strategies: [
      { id: 'STR-260701', name: '迎峰稳荷削峰填谷策略', type: '削峰填谷', status: '已激活', priority: 1, version: 'V3.2', power: '800.0 kW', targetSoc: '80.00%', schedule: '每日10:00-15:00、18:00-22:00放电，00:00-07:00充电', trigger: '电价≥0.9元且负荷>2000kW' },
      { id: 'STR-260702', name: '十五分钟需量抑制策略', type: '需量管理', status: '待下发', priority: 2, version: 'V1.8', power: '500.0 kW', targetSoc: '55.00%', schedule: '工作日08:00-22:00', trigger: '15分钟平均功率>1900kW' },
      { id: 'STR-260703', name: '光伏防逆流跟随策略', type: '防逆流', status: '暂停', priority: 3, version: 'V2.1', power: '420.0 kW', targetSoc: '70.00%', schedule: '每日09:00-16:30', trigger: '并网点反向功率>30kW' },
      { id: 'STR-260704', name: '园区离网备电策略', type: '离网备电', status: '待下发', priority: 4, version: 'V1.2', power: '600.0 kW', targetSoc: '85.00%', schedule: '电网异常时自动执行', trigger: '并网点失压或频率越限' },
    ],
    alarms: [
      { id: 'ALM-260715-001', deviceId: 'PCS-01', deviceName: 'PCS#1 储能变流器', name: '散热风道温升偏高', level: '一般' as const, description: '柜内温度达到68.4℃，建议检查风机与滤网状态', status: '激活' as const, occurredAt: time },
      { id: 'ALM-260715-002', deviceId: 'BMS-02', deviceName: 'BMS#2 电池管理系统', name: '电芯压差接近阈值', level: '提示' as const, description: '簇内单体压差达到42mV，均衡回路已启动', status: '已确认' as const, occurredAt: '2026-07-15 09:12:00', confirmedAt: '2026-07-15 09:18:00' },
      { id: 'ALM-260714-009', deviceId: 'MTR-03', deviceName: 'MTR#3 并网点电表', name: '通讯延迟升高', level: '一般' as const, description: 'IEC104链路延迟持续超过180ms，网络质量已恢复', status: '已恢复' as const, occurredAt: '2026-07-14 18:36:00', recoveredAt: '2026-07-14 18:48:00' },
    ] as Alarm[],
    alarmRules: [
      { id: 'AR-01', name: 'PCS温度高限', deviceType: 'PCS', condition: '温度 > 70℃', level: '严重', action: '降功率并生成告警', enabled: true },
      { id: 'AR-02', name: 'BMS单体压差', deviceType: 'BMS', condition: '压差 > 45mV', level: '一般', action: '启动均衡并通知运维', enabled: true },
      { id: 'AR-03', name: '通讯链路延迟', deviceType: '电表', condition: '延迟 > 180ms', level: '一般', action: '记录链路质量并提示巡检', enabled: true },
    ],
    workOrders: [{ id: 'WO-260715-001', title: '处理PCS散热风道温升偏高', source: '告警' as const, alarmId: 'ALM-260715-001', priority: '中' as const, status: '待接单' as const, assignee: '陈志远', createdAt: time, remarks: [] }] as WorkOrder[],
    cells: Array.from({ length: 32 }, (_, index) => ({ id: `C${pad(index + 1)}`, voltage: 3.28 + Math.sin(index / 3) * 0.025, temperature: 27.5 + Math.cos(index / 4) * 3.2, status: index === 7 ? '均衡' : '正常' })),
    pointMappings: [
      { id: 'PT-001', device: devices[0].name, address: '41000', type: 'Float32', unit: 'kW', scale: '0.1', desc: 'PCS有功功率' },
      { id: 'PT-002', device: devices[0].name, address: '41004', type: 'Float32', unit: 'kvar', scale: '0.1', desc: 'PCS无功功率' },
      { id: 'PT-003', device: devices[0].name, address: '41008', type: 'Float32', unit: 'V', scale: '0.1', desc: 'PCS A相电压' },
      { id: 'PT-004', device: devices[0].name, address: '41012', type: 'Float32', unit: 'A', scale: '0.1', desc: 'PCS B相电流' },
      { id: 'PT-005', device: devices[0].name, address: '41016', type: 'UInt16', unit: 'Hz', scale: '0.01', desc: 'PCS电网频率' },
      { id: 'PT-006', device: devices[0].name, address: '41020', type: 'UInt16', unit: '℃', scale: '0.1', desc: 'PCS模块温度' },
      { id: 'PT-007', device: devices[0].name, address: '41024', type: 'UInt16', unit: '状态', scale: '1', desc: 'PCS运行状态' },
      { id: 'PT-008', device: devices[1].name, address: '42000', type: 'Float32', unit: '%', scale: '0.01', desc: 'BMS SOC' },
      { id: 'PT-009', device: devices[1].name, address: '42004', type: 'Float32', unit: '%', scale: '0.01', desc: 'BMS SOH' },
      { id: 'PT-010', device: devices[1].name, address: '42008', type: 'Float32', unit: 'V', scale: '0.1', desc: '电池总电压' },
      { id: 'PT-011', device: devices[1].name, address: '42012', type: 'Float32', unit: 'A', scale: '0.1', desc: '电池总电流' },
      { id: 'PT-012', device: devices[1].name, address: '42016', type: 'Float32', unit: '℃', scale: '0.1', desc: '最高单体温度' },
      { id: 'PT-013', device: devices[1].name, address: '42020', type: 'Float32', unit: 'V', scale: '0.001', desc: '最高单体电压' },
      { id: 'PT-014', device: devices[1].name, address: '42024', type: 'Float32', unit: 'MΩ', scale: '0.1', desc: '绝缘阻抗' },
      { id: 'PT-015', device: devices[2].name, address: '43000', type: 'Float32', unit: 'kW', scale: '0.1', desc: '并网点有功功率' },
      { id: 'PT-016', device: devices[2].name, address: '43004', type: 'Float32', unit: 'kWh', scale: '0.01', desc: '正向有功电能' },
    ],
    logs: [{ time, event: '迎峰稳荷削峰填谷策略完成激活', result: 'PCS响应正常' }, { time: '2026-07-15 08:00:00', event: '并网点功率采样窗口启动', result: '需量计算正常' }],
  }
}

export const useEmsStore = defineStore('ems', {
  state: () => buildInitial(),
  getters: {
    onlineDevices: (state) => state.station.devices.filter((device) => device.status !== '通讯中断').length,
    format: () => ({ kw, kwh, pct, yuan }),
    maxCellVoltage: (state) => Math.max(...state.cells.map((cell) => cell.voltage)),
    minCellVoltage: (state) => Math.min(...state.cells.map((cell) => cell.voltage)),
    avgCellTemp: (state) => state.cells.reduce((sum, cell) => sum + cell.temperature, 0) / state.cells.length,
  },
  actions: {
    initialize() {
      const cached = localStorage.getItem('ess-ems-state')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.initializedVersion === 4) this.$patch(parsed)
        else this.persist()
      } else this.persist()
      document.documentElement.dataset.theme = this.theme
    },
    persist() { localStorage.setItem('ess-ems-state', JSON.stringify(this.$state)) },
    login(username: string, role: RoleName) {
      this.authenticated = username.trim() === 'admin'
      this.user = { username: 'admin', displayName: role, role }
      this.persist()
      return this.authenticated
    },
    logout() { this.authenticated = false; this.persist() },
    toggleTheme() { this.theme = this.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = this.theme; this.persist() },
    openRouteTab(path: string, title: string) {
      if (!this.openedTabs.some((tab) => tab.path === path)) this.openedTabs.push({ path, title })
      this.persist()
    },
    closeRouteTab(path: string) {
      this.openedTabs = this.openedTabs.filter((tab) => tab.path !== path || tab.path === '/')
      this.persist()
    },
    createThingModel(type: DeviceType, name?: string) {
      const model = buildModels().find((item) => item.type === type)!
      const id = `TM-${type}-${Date.now().toString().slice(-5)}`
      this.thingModels.unshift({ ...model, id, name: name || `${type}运行物模型`, version: 'V1.0' })
      this.commissioningStep = Math.max(this.commissioningStep, 2)
      this.persist()
    },
    updateThingModel(id: string, payload: Partial<ThingModel>) {
      this.thingModels = this.thingModels.map((item) => item.id === id ? { ...item, ...payload } : item)
      this.persist()
    },
    deleteThingModel(id: string) {
      if (this.station.devices.some((device) => device.modelId === id)) return
      this.thingModels = this.thingModels.filter((item) => item.id !== id)
      this.persist()
    },
    instantiateDevice(modelId: string, name?: string) {
      const model = this.thingModels.find((item) => item.id === modelId)
      if (!model) return
      const count = this.station.devices.filter((item) => item.type === model.type).length + 1
      const device = { ...makeDevice(model, count), name: name || makeDevice(model, count).name }
      this.station.devices.push(device)
      this.pointMappings.push(...model.telemetry.slice(0, 4).map((desc, index) => ({ id: `PT-${Date.now().toString().slice(-4)}-${index}`, device: device.name, address: `4${2200 + index * 4}`, type: 'Float32', unit: index === 0 ? 'kW' : 'V', scale: '0.1', desc })))
      this.commissioningStep = Math.max(this.commissioningStep, 3)
      this.persist()
    },
    updateDevice(id: string, payload: Partial<Device>) {
      this.station.devices = this.station.devices.map((item) => item.id === id ? { ...item, ...payload, address: payload.ip || payload.port ? `${payload.ip || item.ip}:${payload.port || item.port}` : item.address } : item)
      this.persist()
    },
    deleteDevice(id: string) {
      const device = this.station.devices.find((item) => item.id === id)
      this.station.devices = this.station.devices.filter((item) => item.id !== id)
      if (device) this.pointMappings = this.pointMappings.filter((point) => point.device !== device.name)
      this.persist()
    },
    createPointMapping(deviceName?: string) {
      const device = this.station.devices.find((item) => item.name === deviceName) || this.station.devices[0]
      this.pointMappings.unshift({ id: `PT-${Date.now().toString().slice(-6)}`, device: device.name, address: `4${2600 + this.pointMappings.length * 4}`, type: 'Float32', unit: 'kW', scale: '0.1', desc: '有功功率' })
      this.persist()
    },
    updatePointMapping(id: string, payload: Record<string, string>) {
      this.pointMappings = this.pointMappings.map((item) => item.id === id ? { ...item, ...payload } : item)
      this.persist()
    },
    deletePointMapping(id: string) {
      this.pointMappings = this.pointMappings.filter((item) => item.id !== id)
      this.persist()
    },
    createStation(payload: Partial<Station>) {
      const station = { ...this.station, ...payload, id: `ST-${Date.now()}`, status: payload.status || '待投运', commissionDate: payload.commissionDate || this.station.commissionDate, devices: [] }
      this.stations.unshift(station)
      this.tariffConfigs[station.id] = cloneTariffs()
      this.commissioningStep = Math.max(this.commissioningStep, 4)
      this.persist()
    },
    updateStation(payload: Partial<Station>) {
      const id = payload.id || this.station.id
      this.stations = this.stations.map((item) => item.id === id ? { ...item, ...payload, devices: item.devices } : item)
      if (id === this.station.id) this.station = { ...this.station, ...payload, devices: this.station.devices }
      this.commissioningStep = Math.max(this.commissioningStep, 4)
      this.persist()
    },
    commissionStation() {
      this.station.status = '稳定运行'
      this.commissioningStep = 5
      this.logs.unshift({ time: this.snapshot.timestamp, event: '电站投运完成，设备通讯、点表解析、模拟采集任务已启动', result: '全部设备在线' })
      this.persist()
    },
    tick() {
      if (this.station.status !== '稳定运行') { this.currentTime = formatTime(new Date()); return }
      const date = new Date(this.snapshot.timestamp.replace(/-/g, '/'))
      date.setMinutes(date.getMinutes() + 1)
      const hour = date.getHours()
      const wave = Math.sin(date.getMinutes() / 60 * Math.PI * 2) * 0.04
      const baseLoad = hour >= 8 && hour <= 21 ? 1850 + Math.sin(hour / 3) * 260 : 820 + Math.cos(hour) * 120
      const pv = hour >= 6 && hour <= 18 ? Math.max(0, Math.sin((hour - 6) / 12 * Math.PI) * 620 * (1 + wave)) : 0
      const tariff = hour < 7 || hour >= 22 ? 0.34 : hour >= 10 && hour < 15 || hour >= 18 && hour < 22 ? 1.15 : 0.68
      let storagePower = 0
      let mode: Mode = '待机'
      if (tariff >= 0.9 && baseLoad > 1600 && this.snapshot.soc > 20) { storagePower = 650 + Math.sin(hour) * 80; mode = '放电' }
      else if (tariff <= 0.4 && this.snapshot.soc < 90) { storagePower = -560; mode = '充电' }
      const socDelta = mode === '放电' ? -Math.abs(storagePower) / 2000 / 60 * 100 : mode === '充电' ? Math.abs(storagePower) / 2000 / 60 * 92 : 0
      const soc = clamp(this.snapshot.soc + socDelta, 10, 95)
      const loadPower = Math.max(0, baseLoad * (1 + wave))
      const gridPower = Math.max(0, loadPower - pv - storagePower)
      const pcsTemperature = clamp(41 + Math.abs(storagePower) / 45 + Math.sin(date.getMinutes() / 8) * 2, 28, 76)
      this.snapshot = { timestamp: formatTime(date), loadPower, pvPower: pv, storagePower, gridPower, soc, pcsTemperature, mode, todayRevenue: this.snapshot.todayRevenue + (mode === '放电' ? Math.abs(storagePower) / 60 * tariff : mode === '充电' ? -Math.abs(storagePower) / 60 * tariff : 0), chargeEnergy: this.snapshot.chargeEnergy + (mode === '充电' ? Math.abs(storagePower) / 60 : 0), dischargeEnergy: this.snapshot.dischargeEnergy + (mode === '放电' ? Math.abs(storagePower) / 60 : 0) }
      this.currentTime = formatTime(new Date())
      this.station.devices = this.station.devices.map((device) => ({ ...device, status: device.type === 'PCS' || device.type === 'BMS' ? (mode === '充电' ? '运行（充电）' : mode === '放电' ? '运行（放电）' : '待机') : '运行（放电）', telemetry: device.type === 'PCS' ? { 有功功率: kw(storagePower), A相电压: '230.6 V', B相电流: '812.4 A', 频率: '50.02 Hz', 温度: `${pcsTemperature.toFixed(1)} ℃`, 运行模式: mode } : device.type === 'BMS' ? { SOC: pct(soc), SOH: '96.80%', SOP: '860.0 kW', 总电压: '1498.6 V', 绝缘阻抗: '8.6 MΩ' } : { 有功功率: kw(gridPower), A相电压: '229.4 V', 功率因数: '0.98' } }))
      this.cells = this.cells.map((cell, index) => ({ ...cell, voltage: clamp(cell.voltage + Math.sin(date.getMinutes() / 5 + index) * 0.002, 3.18, 3.42), temperature: clamp(cell.temperature + Math.cos(date.getMinutes() / 6 + index) * 0.08, 22, 42) }))
      if (pcsTemperature > 70 && !this.alarms.some((alarm) => alarm.name === 'PCS过温保护预警' && alarm.status === '激活')) this.manualAlarm('PCS-01', 'PCS过温保护预警', '严重', `PCS柜内温度达到${pcsTemperature.toFixed(1)}℃，系统已降低功率指令`)
      this.persist()
    },
    createStrategy(payload: string | Record<string, string | number> = '新增削峰填谷策略') {
      const data = typeof payload === 'string' ? { name: payload } : payload
      this.strategies.unshift({ id: `STR-${Date.now()}`, name: String(data.name || '新增削峰填谷策略'), type: String(data.type || '削峰填谷'), status: '待下发', priority: Number(data.priority || this.strategies.length + 1), version: 'V1.0', power: String(data.power || '500.0 kW'), targetSoc: String(data.targetSoc || '75.00%'), schedule: String(data.schedule || '每日10:00-15:00、18:00-22:00'), trigger: String(data.trigger || '电价≥0.9元且负荷>2000kW') })
      this.persist()
    },
    updateStrategy(id: string, payload: Record<string, string | number>) {
      this.strategies = this.strategies.map((item) => item.id === id ? { ...item, ...payload } : item)
      this.persist()
    },
    deleteStrategy(id: string) {
      this.strategies = this.strategies.filter((item) => item.id !== id)
      this.persist()
    },
    issueStrategy(id: string) {
      this.strategies = this.strategies.map((strategy) => ({ ...strategy, status: strategy.id === id ? '已激活' : strategy.status === '已激活' ? '暂停' : strategy.status }))
      const strategy = this.strategies.find((item) => item.id === id)
      this.logs.unshift({ time: this.snapshot.timestamp, event: `${strategy?.name} 已下发至EMS执行`, result: 'PCS功率闭环响应正常，策略进入调度计划' })
      this.persist()
    },
    getStationTariffs(stationId = this.station.id) {
      if (!this.tariffConfigs[stationId]) this.tariffConfigs[stationId] = cloneTariffs()
      return this.tariffConfigs[stationId]
    },
    updateTariff(period: string, price: number, stationId = this.station.id) {
      this.tariffConfigs[stationId] = this.getStationTariffs(stationId).map((item) => item.period === period ? { ...item, price } : item)
      if (stationId === this.station.id) this.tariffs = this.tariffConfigs[stationId]
      this.persist()
    },
    updateAlarmRule(id: string, payload: Record<string, string | boolean>) {
      this.alarmRules = this.alarmRules.map((item) => item.id === id ? { ...item, ...payload } : item)
      this.persist()
    },
    createAlarmRule() {
      this.alarmRules.unshift({ id: `AR-${Date.now()}`, name: '新增越限告警规则', deviceType: 'PCS', condition: '温度 > 68℃', level: '一般', action: '生成告警并通知运维', enabled: true })
      this.persist()
    },
    deleteAlarmRule(id: string) {
      this.alarmRules = this.alarmRules.filter((item) => item.id !== id)
      this.persist()
    },
    manualAlarm(deviceId: string, name: string, level: Alarm['level'], description: string) {
      const device = this.station.devices.find((item) => item.id === deviceId) ?? this.station.devices[0]
      this.alarms.unshift({ id: `ALM-${Date.now()}`, deviceId: device.id, deviceName: device.name, name, level, description, status: '激活', occurredAt: this.snapshot.timestamp })
      this.persist()
    },
    confirmAlarm(id: string) { this.alarms = this.alarms.map((alarm) => alarm.id === id ? { ...alarm, status: '已确认', confirmedAt: this.snapshot.timestamp } : alarm); this.persist() },
    createWorkOrder(alarm: Alarm) { if (!this.workOrders.some((order) => order.alarmId === alarm.id)) this.workOrders.unshift({ id: `WO-${Date.now()}`, title: `处理${alarm.name}`, source: '告警', alarmId: alarm.id, priority: alarm.level === '严重' || alarm.level === '紧急' ? '高' : '中', status: '待接单', assignee: '李明轩', createdAt: this.snapshot.timestamp, remarks: ['由告警确认后自动生成'] }); this.persist() },
    createManualWorkOrder(title = '储能舱例行巡检任务') { this.workOrders.unshift({ id: `WO-${Date.now()}`, title, source: '人工', priority: '中', status: '待接单', assignee: '王启航', createdAt: this.snapshot.timestamp, remarks: ['检查空调、消防、门禁与通讯链路'] }); this.persist() },
    updateWorkOrder(id: string, payload: Partial<WorkOrder>) { this.workOrders = this.workOrders.map((item) => item.id === id ? { ...item, ...payload } : item); this.persist() },
    deleteWorkOrder(id: string) { this.workOrders = this.workOrders.filter((item) => item.id !== id); this.persist() },
    advanceWorkOrder(id: string) { this.workOrders = this.workOrders.map((order) => { if (order.id !== id) return order; if (order.status === '待接单') return { ...order, status: '处理中', acceptedAt: this.snapshot.timestamp, remarks: [...order.remarks, '运维人员已接单并到站核查'] }; if (order.status === '处理中') return { ...order, status: '已完成', completedAt: this.snapshot.timestamp, solution: '完成现场巡检、滤网清洁、告警复核与运行参数回归确认', remarks: [...order.remarks, '现场处理完成，设备恢复稳定'] }; if (order.status === '已完成') return { ...order, status: '已关闭', remarks: [...order.remarks, '值班长复核后关闭工单'] }; return order }); this.persist() },
  },
})
