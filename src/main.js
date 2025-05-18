import {createApp} from 'vue'
import app from '@/App.vue'
import router from '@/router'
import store from '@/store'
// 全局样式
import '@/assets/styles/theme.less'
// Toast 通知
// import toastPlugin from 'vue-toast-notification'
// import 'vue-toast-notification/dist/theme-bootstrap.css'

const APP = createApp(app)

// APP.use(store).use(router).use(toastPlugin)
APP.use(store).use(router)

APP.mount('#app')
