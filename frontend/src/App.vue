<script>
import Sidebar from "@/components/Sidebar.vue"
import Log from "@/components/options/Log.vue"
import Button from "@/components/Button.vue"
import EventBus from "@/services/EventBus"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import LoadingPage from "@/components/LoadingPage.vue"
import Dexie from "@/services/Dexie"
import Logger, {setupLogCleanup} from "@/services/Logger"
import {unloadPlugins} from "@/services/plugin/UnloadPlugins"
import {initEnabledPlugins} from "@/services/plugin/RegisterPlugins"
// import eruda from "eruda"

export default {
	name: "App",
	components: {LoadingPage, Button, Log, Sidebar},
	data() {
		return {
			name: "App",
			loading: {
				status: true,
				loadingMessage: "正在加载插件系统...",
				currentPluginName: "",
				loadedCount: 0,
				totalCount: 0
			},
			isLogSuspensionWindow: false,
			isLogView: false
		}
	},
	async mounted() {
		if (window.go) {
			document.addEventListener("contextmenu", event => event.preventDefault())
		}
		EventBus.on("[update] pluginProgress", (data) => {
			const DETAIL = data.detail || {}
			this.loading.loadedCount = DETAIL.loaded || 0
			this.loading.totalCount = DETAIL.total || 0
			this.loading.currentPluginName = DETAIL.name || ""
		})
		EventBus.on("[update] pluginReady", () => {
			this.$.appContext.provides.$DB = Dexie
			this.$.appContext.provides.$log = Logger
		})
		EventBus.on("[update] logSuspensionWindowUpdate", this.logSuspensionWindow)
		EventBus.on("[function] configInitialization", this.configInitialization)
	},
	beforeUnmount() {
		EventBus.off("[update] pluginProgress")
		EventBus.off("[update] logSuspensionWindowUpdate", this.logSuspensionWindow)
		EventBus.off("[function] configInitialization", this.configInitialization)
	},
	async created() {
		// 加载界面初始化
		this.updateMessage()
		// 环境信息
		this.information()
		// 移动端调试工具eruda
		// if (process.env.NODE_ENV === "development") {
		//     eruda.init()
		// }
		// 初始化配置
		await this.$nextTick(() => {
			requestIdleCallback(() => this.configInitialization())
		})
		// 空闲时间加载执行
		requestIdleCallback(async () => {
			// 日志清理定时任务
			await setupLogCleanup()
			setInterval(setupLogCleanup, 24 * 60 * 60 * 1000)
			await this.loadPluginSystem()
		})
	},
	methods: {
		/**
		 * 翻译
		 * @param key {String} - 键
		 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
		 * @returns {String} - 翻译后的文本
		 */
		t(key, params = {}) {
			return i18nRegistry.translate(key, params)
		},
		/**
		 * 保存运行环境
		 */
		information() {
			Logger.info(`[${this.name}] 环境信息`, this.getEnvInfo())
			const VERSION = this.getIEVersion()
			if (VERSION) {
				Logger.error(`[${this.name}] 检测到IE浏览器`, VERSION)
				toastRegistry.error(`[${this.name}] ${this.t("app.IEDetected", {version: VERSION})}`)
			}
			// 检查浏览器是否支持 IndexedDB
			if (!"indexedDB" in window) {
				Logger.error(`[${this.name}] 浏览器不支持'IndexedDB'`)
				toastRegistry.error(`[${this.name}] ${this.t("app.indexedDBNotSupported")}`)
			}
			// 检查浏览器是否支持 IDBTransaction
			if (!"IDBTransaction" in window) {
				Logger.error(`[${this.name}] 浏览器不支持'IDBTransaction'`)
				toastRegistry.error(`[${this.name}] ${this.t("app.iDBTransactionNotSupported")}`)
			}
		},
		/**
		 * 获取运行环境信息
		 */
		getEnvInfo() {
			const UA = navigator.userAgent
			// 浏览器检测
			let browser = "Unknown"
			let version = "Unknown"
			if (UA.indexOf("Firefox") > -1) {
				browser = "Firefox"
				version = UA.match(/Firefox\/(\d+)/)?.[1] || version;
			} else if (UA.indexOf("Edg") > -1) {
				browser = "Microsoft Edge"
				version = UA.match(/Edg\/(\d+)/)?.[1] || version;
			} else if (UA.indexOf("Chrome") > -1) {
				browser = "Google Chrome"
				version = UA.match(/Chrome\/(\d+)/)?.[1] || version;
			} else if (UA.indexOf("Safari") > -1) {
				browser = "Safari"
				version = UA.match(/Version\/(\d+)/)?.[1] || version;
			}
			// 操作系统检测
			let os = "Unknown"
			if (UA.indexOf("Windows") > -1) os = "Windows"
			else if (UA.indexOf("Mac") > -1) os = "MacOS"
			else if (UA.indexOf("Linux") > -1) os = "Linux"
			else if (UA.indexOf("Android") > -1) os = "Android"
			else if (UA.indexOf("iPhone") > -1 || UA.indexOf("iPad") > -1) os = "iOS"

			// 设备类型
			const IS_MOBILE = /Mobi|Android|iPhone|iPad|iPod/i.test(UA)
			const DEVICE_TYPE = IS_MOBILE ? "Mobile" : "Desktop"
			return {
				browser: `${browser} v${version}`,
				os: os,
				deviceType: DEVICE_TYPE,
				screen: `${window.screen.width}x${window.screen.height}`,
				viewport: `${window.innerWidth}x${window.innerHeight}`,
				language: navigator.language || navigator.userLanguage,
				online: navigator.onLine,
				cookieEnabled: navigator.cookieEnabled
			}
		},
		/**
		 * 获取IE版本号
		 */
		getIEVersion() {
			// 检查浏览器是否为IE
			const UA = window.navigator.userAgent
			const MSIE = UA.indexOf("MSIE ")
			const TRIDENT = UA.indexOf("Trident/")
			if (MSIE > 0) {
				// IE10 及以下: 直接解析版本号
				return parseInt(UA.substring(MSIE + 5, UA.indexOf(".", MSIE)), 10)
			} else if (TRIDENT > 0) {
				// IE11: Trident/7.0 表示 IE11
				const rv = UA.indexOf("rv:")
				return parseInt(UA.substring(rv + 3, UA.indexOf(".", rv)), 10)
			}
			// 不是 IE
			return false
		},
		/**
		 * 配置初始化
		 */
		async configInitialization() {
			let info = {}
			try {
				// 应用主题
				const THEME_DATA = await Dexie.configs.get("theme")
				const THEME = THEME_DATA ? THEME_DATA.value : "System"
				if (THEME === "System") {
					const SYSTEM_THEME = window.matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light"
					document.documentElement.setAttribute("data-theme", SYSTEM_THEME)
					info.Theme = SYSTEM_THEME
				} else {
					document.documentElement.setAttribute("data-theme", THEME)
					info.Theme = THEME
				}

				// 应用语言
				const LANGUAGE_DATA = await Dexie.configs.get("language")
				const LANGUAGE = LANGUAGE_DATA ? LANGUAGE_DATA.value : "System"
				if (LANGUAGE === "System") {
					const SYSTEM_LANG = window.navigator.language || "zh-CN"
					i18nRegistry.locale = SYSTEM_LANG
					info.Language = SYSTEM_LANG
				} else {
					i18nRegistry.locale = LANGUAGE
					info.Language = LANGUAGE
				}
				// Log悬浮窗
				const LOG_SUSPENSION_WINDOW_DATA = await Dexie.configs.get("logSuspensionWindow")
				this.isLogSuspensionWindow = LOG_SUSPENSION_WINDOW_DATA ? LOG_SUSPENSION_WINDOW_DATA.value : false
				info.LogSuspensionWindow = this.isLogSuspensionWindow
				Logger.info(`[${this.name}] 初始化配置`, info)
			} catch (error) {
				Logger.error(`[${this.name}] 配置初始化失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("app.configInitializationError")}`)
			}
		},
		/**
		 * 更新加载进度
		 */
		updateMessage() {
			const MESSAGE_MAP = [
				{time: 0, content: "正在加载插件系统..."},
				{time: 2000, content: "额^^是有点久了..."},
				{time: 4000, content: "再等等也许就好了?"},
				{time: 6000, content: "你确定插件都放对了吗😓"},
				{time: 8000, content: "👊😡"}
			]
			if (!this._startTime) this._startTime = Date.now()
			const NOW = Date.now() - this._startTime
			const MATCHED = [...MESSAGE_MAP].reverse().find(msg => NOW >= msg.time)
			if (MATCHED) this.loading.loadingMessage = MATCHED.content
			requestAnimationFrame(this.updateMessage)
		},
		/**
		 * 日志悬浮窗
		 */
		logSuspensionWindow() {
			this.isLogSuspensionWindow = !this.isLogSuspensionWindow
		},
		/**
		 * 加载插件系统
		 */
		async loadPluginSystem() {
			try {
				// 延迟一点, 避免阻塞渲染
				setTimeout(async () => {
					const APP = this.$.appContext.app
					await unloadPlugins()
					await initEnabledPlugins(APP)
					Logger.info("[App.vue] 插件加载完成")
					this.loading.status = false
				}, 300)
			} catch (error) {
				Logger.error("[App.vue] 插件系统加载失败", error)
			}
		}
	}
}
</script>

<template>
	<div v-if="loading.status" class="loading-container">
		<LoadingPage/>
		<div class="loading-text">{{ loading.loadingMessage }}</div>
		<div class="progress-text">
			<div v-if="loading.loadedCount !== loading.totalCount">
				正在加载 {{ loading.currentPluginName }} 插件({{ loading.loadedCount }}/{{ loading.totalCount }})
			</div>
			<div v-else>!!!插件全部加载完成!!!</div>
		</div>
	</div>
	<template v-if="!loading.status">
		<Sidebar/>
		<div class="RouterView">
			<router-view/>
		</div>
		<Button class="IsLog" v-if="isLogSuspensionWindow" @click="isLogView = !isLogView">Log</Button>
		<div class="IsLogSuspensionWindow" v-if="isLogView && isLogSuspensionWindow">
			<Log/>
		</div>
	</template>
</template>

<style>
#app {
	display: grid;
	grid-template-columns: auto 1fr;
	grid-template-rows: 100vh;
	overflow: hidden;
}
</style>

<style scoped lang="less">
.loading-container {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100vh;
	color: var(--text-color);
	background-color: var(--background-color);
	font-size: 18px;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	z-index: 9999;

	.loading-text {
		margin-bottom: 10px;
		font-size: 20px;
		font-weight: bold;
	}

	.progress-text {
		font-size: 14px;
		color: #888;
	}
}

.RouterView {
	overflow-y: auto;
	scrollbar-width: thin;
	scrollbar-color: var(--scrollbar-thumb-color) var(--scrollbar-track-color);
}

.IsLog {
	position: absolute;
	top: 10px;
	right: 10px;
	cursor: pointer;
	z-index: 3;
}

.IsLogSuspensionWindow {
	position: absolute;
	bottom: 0;
	width: 100%;
	height: 600px;
	z-index: 3;
}
</style>
