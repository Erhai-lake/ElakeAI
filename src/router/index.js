import {createRouter, createWebHashHistory} from "vue-router"

const routes = [
    {
        path: "/",
        name: "home",
        component: () => import("@/views/HomeView.vue")
    },
    {
        path: "/options",
        name: "Options",
        component: () => import("@/views/Options.vue")
    },
    {
        path: "/debug",
        name: "DeBUG",
        component: () => import("@/views/DeBUG.vue")
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router
