import {createApp} from 'vue'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store'
import '@/assets/styles/theme.less'

const app = createApp(App)

app.use(store).use(router)

app.mount('#app')
