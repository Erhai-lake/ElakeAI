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
				path: "import_export",
				name: "OptionsImportExport",
				component: () => import("@/views/options/ImportExportView.vue")
			},
			{
				path: "plugins",
				name: "OptionsPlugins",
				component: () => import("@/views/options/PluginsView.vue")
			},
			{
				path: "advanced_tools",
				name: "OptionsAdvancedTools",
				component: () => import("@/views/options/AdvancedToolsView.vue")
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
			// {
			// 	path: "debug",
			// 	name: "DeBUG",
			// 	component: () => import("@/views/DeBUGView.vue")
			// },
			// {
			// 	path: "log",
			// 	name: "Log",
			// 	component: () => import("@/views/LogView.vue")
			// }
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
