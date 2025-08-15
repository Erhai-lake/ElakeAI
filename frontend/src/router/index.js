import {createRouter, createWebHashHistory} from "vue-router"

const routes = [
	{
		path: "/",
		name: "Home",
		component: () => import("@/views/HomeView.vue")
	},
	{
		path: "/chat/:key",
		name: "ChatKey",
		component: () => import("@/views/ChatView.vue")
	},
	{
		path: "/options",
		name: "Options",
		redirect: "/options/personalization",
		component: () => import("@/views/OptionsView.vue"),
		children: [
			{
				path: "personalization",
				name: "OptionsPersonalization",
				component: () => import("@/views/options/PersonalizationView.vue")
			},
			{
				path: "chats",
				name: "OptionsChats",
				component: () => import("@/views/options/ChatsView.vue")
			},
			{
				path: "import",
				name: "OptionsImport",
				component: () => import("@/views/options/ImportView.vue")
			},
			{
				path: "export",
				name: "OptionsExport",
				component: () => import("@/views/options/ExportView.vue")
			},
			{
				path: "plugins",
				name: "OptionsPlugins",
				component: () => import("@/views/options/PluginsView.vue")
			},
			{
				path: "advancedTools",
				name: "OptionsAdvancedTools",
				component: () => import("@/views/options/AdvancedToolsView.vue")
			},
			{
				path: "log",
				name: "Log",
				component: () => import("@/views/options/LogView.vue")
			},
			{
				path: "about",
				name: "OptionsAbout",
				component: () => import("@/views/options/AboutView.vue")
			},
			{
				path: ":pathMatch(.*)*",
				name: "OptionsNotFound",
				component: () => import("@/views/options/OptionsNotFoundView.vue")
			}
		]
	},
	{
		path: "/:pathMatch(.*)*",
		name: "NotFound",
		component: () => import("@/views/NotFoundView.vue")
	},
	{
		path: "/test",
		name: "Test",
		component: () => import("@/views/test.vue")
	}
]

const router = createRouter({
	history: createWebHashHistory(),
	routes
})

export default router
