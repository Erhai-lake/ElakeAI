<script>
import Sidebar from "@/components/Sidebar.vue"
import DevTools from "@/components/DevTools.vue"
import Button from "@/components/input/Button.vue"
import EventBus from "@/services/EventBus"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Dexie from "@/services/Dexie"
import Logger, {setupLogCleanup} from "@/services/Logger"
import {unloadALlPlugins} from "@/services/plugin/UnloadALlPlugins"
import {initAllPlugins} from "@/services/plugin/RegisterPlugins"
import Loading from "@/components/Loading.vue"
import CustomTheme from "@/services/CustomTheme"
import {ThemeRegistry} from "@/services/plugin/api/ThemeClass"

export default {
	name: "App",
	components: {Loading, Button, DevTools, Sidebar},
	data() {
		return {
			name: "App",
			loading: {
				status: true,
				loadingMessage: "正在加载插件系统..."
			},
			backgroundImage: {
				enabled: false,
				url: "",
				blob: null,
				opacity: 100,
				mask: 100
			},
			isDevToolsSuspensionWindow: false,
			buttonPosition: {top: 10, left: window.innerWidth - 130},
			dragging: false,
			wasDragged: false,
			dragOffset: {x: 0, y: 0},
			isDevToolsView: false,
			devToolsHeight: 600,
			resizing: false,
			startY: 0,
			startHeight: 0
		}
	},
	computed: {
		backgroundStyle() {
			if (!this.backgroundImage || !this.backgroundImage.url) return {}
			const URL = this.backgroundImage.url.trim()
			// 判断是不是 base64
			const IS_BASE64 = URL.startsWith("data:image/")
			return {
				backgroundImage: IS_BASE64 ? `url(${URL})` : `url("${URL}")`,
				opacity: this.backgroundImage.opacity / 100
			}
		},
		maskStyle() {
			return {
				opacity: this.backgroundImage.mask / 100
			}
		}
	},
	beforeUnmount() {
		EventBus.off("[update] devToolsSuspensionWindowUpdate", this.devToolsSuspensionWindow)
		EventBus.off("[function] configInitialization", this.configInitialization)
		EventBus.off("[update] pluginReady")
	},
	async created() {
		document.addEventListener("contextmenu", event => event.preventDefault())
		EventBus.on("[update] devToolsSuspensionWindowUpdate", this.devToolsSuspensionWindow)
		EventBus.on("[function] configInitialization", this.configInitialization)
		EventBus.on("[update] pluginReady", () => {
			this.$.appContext.provides.$DB = Dexie
			this.$.appContext.provides.$log = Logger
		})
		// 加载界面初始化
		this.updateMessage()
		// 环境信息
		this.information()
		// 加载插件系统
		await this.loadPluginSystem()
		// 初始化配置
		await this.configInitialization()
		// 日志清理定时任务
		await setupLogCleanup()
		setInterval(setupLogCleanup, 24 * 60 * 60 * 1000)
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
			Logger.debug(`[${this.name}] 环境信息`, this.getEnvInfo())
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
				language: navigator.language,
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
			try {
				// 应用主题
				const THEME_DATA = await Dexie.configs.get("theme")
				const THEME = THEME_DATA ? THEME_DATA.value : "system"
				if (THEME === "system") {
					const SYSTEM_THEME = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
					ThemeRegistry.setTheme(SYSTEM_THEME)
				} else if (THEME === "custom") {
					await CustomTheme.applyCustomTheme()
				} else {
					ThemeRegistry.setTheme(THEME)
				}
				// 应用语言
				const LANGUAGE_DATA = await Dexie.configs.get("language")
				const LANGUAGE = LANGUAGE_DATA ? LANGUAGE_DATA.value : "system"
				if (LANGUAGE === "system") {
					const SYSTEM_LANG = window.navigator.language || "zh-CN"
					i18nRegistry.locale(SYSTEM_LANG)
				} else {
					i18nRegistry.locale(LANGUAGE)
				}
				// 应用背景图片
				const BACKGROUND_IMAGE_DATA = await Dexie.configs.get("backgroundImage")
				if (BACKGROUND_IMAGE_DATA?.value) {
					this.backgroundImage = {
						enabled:  BACKGROUND_IMAGE_DATA.value.enabled,
						url: BACKGROUND_IMAGE_DATA.value.url,
						blob: null,
						opacity: BACKGROUND_IMAGE_DATA.value.opacity,
						mask: BACKGROUND_IMAGE_DATA.value.mask
					}
					if (BACKGROUND_IMAGE_DATA.value.blob) {
						this.backgroundImage.blob = new Blob([BACKGROUND_IMAGE_DATA.value.blob])
						this.backgroundImage.url = URL.createObjectURL(this.backgroundImage.blob)
					}
				}
				// DevTools悬浮窗
				const DEV_TOOLS_SUSPENSION_WINDOW_DATA = await Dexie.configs.get("devToolsSuspensionWindow")
				this.isDevToolsSuspensionWindow = DEV_TOOLS_SUSPENSION_WINDOW_DATA ? DEV_TOOLS_SUSPENSION_WINDOW_DATA.value : false
				Logger.info(`[${this.name}] 初始化配置`)
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
				{time: 200, content: "额......等会, 这是有点久了..."},
				{time: 500, content: "再等等也许就好了?"},
				{time: 800, content: "zZZZ😓"},
				{time: 1000, content: "👊😡"}
			]
			if (!this._startTime) this._startTime = Date.now()
			const NOW = Date.now() - this._startTime
			const MATCHED = [...MESSAGE_MAP].reverse().find(msg => NOW >= msg.time)
			if (MATCHED) this.loading.loadingMessage = MATCHED.content
			requestAnimationFrame(this.updateMessage)
		},
		/**
		 * 加载插件系统
		 */
		async loadPluginSystem() {
			try {
				const APP = this.$.appContext.app
				await unloadALlPlugins()
				await initAllPlugins(APP)
				Logger.info("[App.vue] 插件加载完成")
				this.loading.status = false
			} catch (error) {
				Logger.error("[App.vue] 插件系统加载失败", error)
			}
		},
		/**
		 * DevTools悬浮窗
		 */
		devToolsSuspensionWindow() {
			this.isDevToolsSuspensionWindow = !this.isDevToolsSuspensionWindow
		},
		/**
		 * 拖动按钮(开始)
		 */
		startDrag(event) {
			this.dragging = true
			this.wasDragged = false
			this.dragOffset.x = event.clientX - this.buttonPosition.left
			this.dragOffset.y = event.clientY - this.buttonPosition.top
			document.addEventListener("mousemove", this.onDrag)
			document.addEventListener("mouseup", this.stopDrag)
		},
		/**
		 * 拖动按钮(正在)
		 */
		onDrag(event) {
			if (!this.dragging) return
			// 当鼠标有明显位移时, 标记 wasDragged
			if (Math.abs(event.movementX) > 2 || Math.abs(event.movementY) > 2) {
				this.wasDragged = true
			}
			const MIN_X = 0
			const MIN_Y = 0
			const MAX_X = window.innerWidth - 120
			const MAX_Y = window.innerHeight - 40
			this.buttonPosition.left = event.clientX - this.dragOffset.x
			this.buttonPosition.top = event.clientY - this.dragOffset.y
			let NEW_LEFT = event.clientX - this.dragOffset.x
			let NEW_TOP = event.clientY - this.dragOffset.y
			// 限制范围
			NEW_LEFT = Math.max(MIN_X, Math.min(MAX_X, NEW_LEFT))
			NEW_TOP = Math.max(MIN_Y, Math.min(MAX_Y, NEW_TOP))
			this.buttonPosition.left = NEW_LEFT
			this.buttonPosition.top = NEW_TOP
		},
		/**
		 * 拖动按钮(结束)
		 */
		stopDrag() {
			this.dragging = false
			document.removeEventListener("mousemove", this.onDrag)
			document.removeEventListener("mouseup", this.stopDrag)
		},
		/**
		 * 点击按钮
		 */
		handleClick() {
			if (!this.wasDragged) {
				this.isDevToolsView = !this.isDevToolsView
			}
		},
		/**
		 * 调整大小(开始)
		 */
		startResize(event) {
			this.resizing = true
			this.startY = event.clientY
			this.startHeight = this.devToolsHeight
			document.body.style.userSelect = "none"
			document.addEventListener("mousemove", this.onResize)
			document.addEventListener("mouseup", this.stopResize)
		},
		/**
		 * 调整大小(正在)
		 */
		onResize(event) {
			if (!this.resizing) return
			const DELTA = this.startY - event.clientY
			this.devToolsHeight = Math.min(window.innerHeight, Math.max(200, this.startHeight + DELTA))
		},
		/**
		 * 调整大小(结束)
		 */
		stopResize() {
			this.resizing = false
			document.body.style.userSelect = "auto"
			document.removeEventListener("mousemove", this.onResize)
			document.removeEventListener("mouseup", this.stopResize)
		}
	}
}
</script>

<template>
	<Loading
		class="app"
		:loading="loading.status"
		:text="loading.status ? `${loading.loadingMessage}` : '!!!准备就绪!!!'">
		<template v-if="!loading.status">
			<Sidebar/>
			<div class="RouterView">
				<router-view/>
			</div>
			<Button
				class="IsDevTools"
				v-if="isDevToolsSuspensionWindow"
				:style="{ top: buttonPosition.top + 'px', left: buttonPosition.left + 'px' }"
				@mousedown="startDrag"
				@click="handleClick">
				DevTools
			</Button>
			<div
				class="IsDevToolsSuspensionWindow"
				v-if="isDevToolsView && isDevToolsSuspensionWindow"
				:style="{ height: devToolsHeight + 'px' }">
				<div class="ResizeHandle" @mousedown="startResize"></div>
				<DevTools/>
			</div>
		</template>
	</Loading>
	<div class="images" v-if="backgroundImage?.enabled" :style="backgroundStyle">
		<div class="images-mask" :style="maskStyle"></div>
	</div>
</template>

<style scoped lang="less">
.app {
	display: grid;
	grid-template-columns: auto 1fr;
	grid-template-rows: 100vh;
	overflow: hidden;
	z-index: 3;
}

.RouterView {
	overflow-y: auto;
	scrollbar-width: thin;
	scrollbar-color: var(--scrollbar-thumb-color) var(--scrollbar-track-color);
}

.IsDevTools {
	position: fixed;
	cursor: move;
	opacity: 0.7;
	transition: 0s;
	z-index: 12;
}

.IsDevToolsSuspensionWindow {
	position: fixed;
	bottom: 0;
	width: 100%;
	border: 1px solid var(--border-color);
	background-color: var(--background-color);
	display: flex;
	flex-direction: column;
	transition: 0s;
	z-index: 11;
}

.ResizeHandle {
	border: 2px solid var(--border-color);
	cursor: ns-resize;
	background: var(--border-color);
}

.images {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100vh;
	overflow: hidden;
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
	z-index: 1;

	.images-mask {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: #000;
		pointer-events: none;
	}
}
</style>
