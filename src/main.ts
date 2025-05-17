import {createApp} from 'vue'
import App from '@/App.vue'
import Router from '@/router'
import Store from '@/store'
import '@/assets/styles/theme.less'

const APP = createApp(App)

APP.use(Store).use(Router)

APP.mount('#app')
