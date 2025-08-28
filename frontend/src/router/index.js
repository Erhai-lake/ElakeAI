import {createRouter, createWebHashHistory} from "vue-router"

// 路由配置
const routes = [
	{
		// 首页
		path: "/",
		name: "Home",
		component: () => import("@/views/HomeView.vue")
	},
	{
		// 聊天
		path: "/chat/:key",
		name: "ChatKey",
		component: () => import("@/views/ChatView.vue")
	},
	{
		// 选项
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
				path: "customTheme",
				name: "CustomTheme",
				component: () => import("@/views/options/CustomThemeView.vue")
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
				path: "aboutElakeAI",
				name: "OptionsAboutElakeAI",
				component: () => import("@/views/options/AboutElakeAIView.vue")
			},
			{
				path: "openSourceDeclaration",
				name: "OptionsOpenSourceDeclaration",
				component: () => import("@/views/options/OpenSourceDeclarationView.vue")
			},
			{
				path: ":pathMatch(.*)*",
				name: "OptionsNotFound",
				component: () => import("@/views/NotFoundView.vue")
			}
		]
	},
	{
		// 面具
		path: "/mask",
		name: "Mask",
		component: () => import("@/views/MaskView.vue")
	},
	{
		// 404
		path: "/:pathMatch(.*)*",
		name: "NotFound",
		component: () => import("@/views/NotFoundView.vue")
	}
]

// 路由实例
const router = createRouter({
	history: createWebHashHistory(),
	routes
})

/**
 * 路由实例
 */
export default router
