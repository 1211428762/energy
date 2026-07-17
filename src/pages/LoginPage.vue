<script setup lang="ts">
import { ref } from 'vue'
import { useEmsStore, type RoleName } from '@/stores/ems'

const store = useEmsStore()
const username = ref('admin')
const password = ref('admin')
const remember = ref(true)
const role = ref<RoleName>('系统管理员')
const message = ref('')
const roles: RoleName[] = ['系统管理员', '电站运营人员', '运维人员', '调度管理人员']
const visualUrl = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=large%20minimalist%20industrial%20energy%20storage%20cabinet%20array%2C%20clean%20white%20engineering%20blueprint%20background%2C%20battery%20containers%20with%20green%20indicator%20lights%2C%20isometric%203D%20product%20render%2C%20enterprise%20software%20login%20hero%2C%20no%20text%2C%20no%20people%2C%20high%20detail%2C%20soft%20lighting&image_size=landscape_16_9'

const submit = () => {
  if (!store.login(username.value, role.value)) message.value = '请输入默认账号 admin'
}
</script>

<template>
  <main class="login-page blueprint-login">
    <section class="blueprint-hero">
      <!-- <img :src="visualUrl" alt="简约储能柜" /> -->
    </section>
    <form class="blueprint-login-card" @submit.prevent="submit">
      <h1>储能管理系统</h1>
      <p>Energy Storage EMS</p>
      <el-input v-model="username" size="large" placeholder="账号" autocomplete="username" />
      <el-input v-model="password" size="large" placeholder="密码" show-password autocomplete="current-password" />
      <el-select v-model="role" size="large">
        <el-option v-for="item in roles" :key="item" :label="item" :value="item" />
      </el-select>
      <label class="remember-line"><input v-model="remember" type="checkbox" /> 记住我</label>
      <el-button class="login-submit" type="primary" size="large" native-type="submit">登录</el-button>
      <p v-if="message" class="form-error">{{ message }}</p>
    </form>
  </main>
</template>
<style>
.blueprint-login{
  background: url(/public/img/emsbg.jpg) no-repeat;
  background-position: center;
  background-size: 100% 100%;
}
</style>