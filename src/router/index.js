import {createRouter, createWebHashHistory} from "vue-router"

const routes = [
	{
		path: "/",
		name: "home",
		component: () => import("@/views/HomeView.vue")
	},
	{
		path: "/chat/:key",
		name: "ChatKey",
		component: () => import("@/views/ChatView.vue")
	},
	{
		path: "/options",
		children: [
			{
				path: "",
				name: "Options",
				component: () => import("@/views/OptionsView.vue")
			},
			{
				path: "debug",
				name: "DeBUG",
				component: () => import("@/views/DeBUGView.vue")
			},
			{
				path: "log",
				name: "Log",
				component: () => import("@/views/LogView.vue")
			}
		]
	},
	{
		path: "/:pathMatch(.*)*",
		name: "NotFound",
		component: () => import("@/views/NotFoundView.vue")
	}
]

const router = createRouter({
	history: createWebHashHistory(),
	routes
})

export default router
