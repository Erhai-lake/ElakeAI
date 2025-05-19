import {createRouter, createWebHashHistory} from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/HomeView.vue')
    },
    {
        path: '/setup',
        name: 'Setup',
        component: () => import('@/views/Setup.vue')
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router
