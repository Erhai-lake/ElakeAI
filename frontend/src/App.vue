<script setup>
import {ref, reactive, computed, onMounted, onUnmounted} from "vue"
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

const name = "App"

/**
 * 加载状态
 * @property {boolean} status - 是否加载完成
 * @property {string} loadingMessage - 加载中的提示信息
 */
const loading = reactive({
	status: true,
	loadingMessage: "正在加载插件系统..."
})

/**
 * 背景图片配置
 * @property {boolean} enabled - 是否启用背景图片
 * @property {string} url - 背景图片的 URL 或 base64 编码
 * @property {Blob} blob - 背景图片的 Blob 对象
 * @property {number} opacity - 背景图片的透明度（0-100）
 * @property {number} mask - 背景图片的遮罩透明度（0-100）
 */
const backgroundImage = reactive({
	enabled: false,
	url: "",
	blob: null,
	opacity: 100,
	mask: 100
})

/**
 * 是否启用 DevTools 悬浮窗口
 * @property {boolean} isDevToolsSuspensionWindow - 是否启用 DevTools 悬浮窗口
 */
const isDevToolsSuspensionWindow = ref(false)

/**
 * 按钮位置配置
 * @property {number} top - 按钮距离顶部的像素值
 * @property {number} left - 按钮距离左侧的像素值
 */
const buttonPosition = reactive({top: 10, left: window.innerWidth - 130})

/**
 * 是否正在拖动按钮
 * @property {boolean} dragging - 是否正在拖动按钮
 */
const dragging = ref(false)

/**
 * 是否曾经拖动按钮
 * @property {boolean} wasDragged - 是否曾经拖动按钮
 */
const wasDragged = ref(false)

/**
 * 拖动偏移量配置
 * @property {number} x - 拖动时的水平偏移量
 * @property {number} y - 拖动时的垂直偏移量
 */
const dragOffset = reactive({x: 0, y: 0})

/**
 * 是否显示 DevTools 视图
 * @property {boolean} isDevToolsView - 是否显示 DevTools 视图
 */
const isDevToolsView = ref(false)

/**
 * DevTools 视图高度
 * @property {number} devToolsHeight - DevTools 视图高度
 */
const devToolsHeight = ref(600)

/**
 * 是否正在调整 DevTools 视图高度
 * @property {boolean} resizing - 是否正在调整 DevTools 视图高度
 */
const resizing = ref(false)

/**
 * 调整 DevTools 视图高度时的起始 Y 坐标
 * @property {number} startY - 调整 DevTools 视图高度时的起始 Y 坐标
 */
const startY = ref(0)

/**
 * 调整 DevTools 视图高度时的起始高度
 * @property {number} startHeight - 调整 DevTools 视图高度时的起始高度
 */
const startHeight = ref(0)

/**
 * 背景图片样式计算属性
 * @property {Object} backgroundStyle - 背景图片样式
 */
const backgroundStyle = computed(() => {
	if (!backgroundImage.url) return {}
	const URL = backgroundImage.url.trim()
	const IS_BASE64 = URL.startsWith("data:image/")
	return {
		backgroundImage: IS_BASE64 ? `url(${URL})` : `url("${URL}")`,
		opacity: backgroundImage.opacity / 100
	}
})

/**
 * 背景图片遮罩样式计算属性
 * @property {Object} maskStyle - 背景图片遮罩样式
 */
const maskStyle = computed(() => ({
	opacity: backgroundImage.mask / 100
}))

/**
 * 翻译函数
 * @function t
 * @param {string} key - 翻译键值
 * @param {Object} params - 翻译参数
 * @returns {string} - 翻译后的字符串
 */
const t = (key, params = {}) => {
	return i18nRegistry.translate(key, params)
}

/**
 * 获取环境信息
 * @function getEnvInfo
 * @returns {{browser: string, os: string, deviceType: string, screen: string, viewport: string, language: string, online: boolean, cookieEnabled: boolean}}
 */
const getEnvInfo = () => {
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
}

/**
 * 获取IE版本号
 * @function getIEVersion
 * @returns {number|boolean}
 */
const getIEVersion = () => {
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
}

/**
 * 初始化配置
 * @function configInitialization
 */
const configInitialization = async () => {
	try {
		// 应用主题
		const THEME_DATA = await Dexie.configs.get("theme");
		const THEME = THEME_DATA ? THEME_DATA.value : "system";
		if (THEME === "system") {
			const SYSTEM_THEME = window.matchMedia("(prefers-color-scheme: dark)")
				.matches
				? "dark"
				: "light";
			ThemeRegistry.setTheme(SYSTEM_THEME);
		} else if (THEME === "custom") {
			await CustomTheme.applyCustomTheme();
		} else {
			ThemeRegistry.setTheme(THEME);
		}
		// 应用语言
		const LANGUAGE_DATA = await Dexie.configs.get("language");
		const LANGUAGE = LANGUAGE_DATA ? LANGUAGE_DATA.value : "system";
		if (LANGUAGE === "system") {
			const SYSTEM_LANG = window.navigator.language || "zh-CN";
			i18nRegistry.locale(SYSTEM_LANG);
		} else {
			i18nRegistry.locale(LANGUAGE);
		}
		// 应用背景图片
		const BACKGROUND_IMAGE_DATA = await Dexie.configs.get("backgroundImage");
		if (BACKGROUND_IMAGE_DATA?.value) {
			Object.assign(backgroundImage, {
				enabled: BACKGROUND_IMAGE_DATA.value.enabled,
				url: BACKGROUND_IMAGE_DATA.value.url,
				blob: null,
				opacity: BACKGROUND_IMAGE_DATA.value.opacity,
				mask: BACKGROUND_IMAGE_DATA.value.mask,
			});
			if (BACKGROUND_IMAGE_DATA.value.blob) {
				backgroundImage.blob = new Blob([BACKGROUND_IMAGE_DATA.value.blob]);
				backgroundImage.url = URL.createObjectURL(backgroundImage.blob);
			}
		}
		// DevTools悬浮窗
		const DEV_TOOLS_SUSPENSION_WINDOW_DATA = await Dexie.configs.get(
			"devToolsSuspensionWindow"
		);
		isDevToolsSuspensionWindow.value = DEV_TOOLS_SUSPENSION_WINDOW_DATA
			? DEV_TOOLS_SUSPENSION_WINDOW_DATA.value
			: false;
		Logger.info(`[${name}] 初始化配置`);
	} catch (error) {
		Logger.error(`[${name}] 配置初始化失败`, error);
		toastRegistry.error(
			`[${name}] ${t("app.configInitializationError")}`
		)
	}
}

/**
 * 更新加载消息
 * @function updateMessage
 */
const updateMessage = () => {
	const MESSAGE_MAP = [
		{time: 0, content: "正在加载插件系统..."},
		{time: 200, content: "额......等会, 这是有点久了..."},
		{time: 500, content: "再等等也许就好了?"},
		{time: 800, content: "zZZZ😓"},
		{time: 1000, content: "👊😡"}
	]
	if (!window._startTime) window._startTime = Date.now()
	const NOW = Date.now() - window._startTime
	const MATCHED = [...MESSAGE_MAP].reverse().find(msg => NOW >= msg.time)
	if (MATCHED) loading.loadingMessage = MATCHED.content
	requestAnimationFrame(updateMessage)
}

/**
 * 加载插件系统
 * @function loadPluginSystem
 */
const loadPluginSystem = async () => {
	try {
		await unloadALlPlugins()
		await initAllPlugins()
		Logger.info("[App.vue] 插件加载完成")
		loading.status = false
	} catch (error) {
		Logger.error("[App.vue] 插件系统加载失败", error)
	}
}

/**
 * 切换DevTools悬浮窗
 * @function devToolsSuspensionWindow
 */
const devToolsSuspensionWindow = () => {
	isDevToolsSuspensionWindow.value = !isDevToolsSuspensionWindow.value
}

/**
 * 拖动DevTools悬浮窗
 * @function startDrag
 * @param {MouseEvent} event - 鼠标事件对象
 */
const startDrag = (event) => {
	dragging.value = true
	wasDragged.value = false
	dragOffset.x = event.clientX - buttonPosition.left
	dragOffset.y = event.clientY - buttonPosition.top
	document.addEventListener("mousemove", onDrag)
	document.addEventListener("mouseup", stopDrag)
}

/**
 * 拖动DevTools悬浮窗
 * @function onDrag
 * @param {MouseEvent} event - 鼠标事件对象
 */
const onDrag = (event) => {
	if (!dragging.value) return
	if (Math.abs(event.movementX) > 2 || Math.abs(event.movementY) > 2) {
		wasDragged.value = true
	}
	const MIN_X = 0
	const MIN_Y = 0
	const MAX_X = window.innerWidth - 120
	const MAX_Y = window.innerHeight - 40
	let NEW_LEFT = event.clientX - dragOffset.x
	let NEW_TOP = event.clientY - dragOffset.y
	NEW_LEFT = Math.max(MIN_X, Math.min(MAX_X, NEW_LEFT))
	NEW_TOP = Math.max(MIN_Y, Math.min(MAX_Y, NEW_TOP))
	buttonPosition.left = NEW_LEFT
	buttonPosition.top = NEW_TOP
}

/**
 * 停止拖动DevTools悬浮窗
 * @function stopDrag
 */
const stopDrag = () => {
	dragging.value = false
	document.removeEventListener("mousemove", onDrag)
	document.removeEventListener("mouseup", stopDrag)
}

/**
 * 点击DevTools悬浮窗按钮
 * @function handleClick
 */
const handleClick = () => {
	if (!wasDragged.value) {
		isDevToolsView.value = !isDevToolsView.value
	}
}

/**
 * 调整DevTools悬浮窗大小
 * @function startResize
 * @param {MouseEvent} event - 鼠标事件对象
 */
const startResize = (event) => {
	resizing.value = true
	startY.value = event.clientY
	startHeight.value = devToolsHeight.value
	document.body.style.userSelect = "none"
	document.addEventListener("mousemove", onResize)
	document.addEventListener("mouseup", stopResize)
}

/**
 * 调整DevTools悬浮窗大小
 * @function onResize
 * @param {MouseEvent} event - 鼠标事件对象
 */
const onResize = (event) => {
	if (!resizing.value) return
	const DELTA = startY.value - event.clientY
	devToolsHeight.value = Math.min(window.innerHeight, Math.max(200, startHeight.value + DELTA))
}

/**
 * 停止调整DevTools悬浮窗大小
 * @function stopResize
 */
const stopResize = () => {
	resizing.value = false
	document.body.style.userSelect = "auto"
	document.removeEventListener("mousemove", onResize)
	document.removeEventListener("mouseup", stopResize)
}

onMounted(async () => {
	document.addEventListener("contextmenu", event => event.preventDefault())

	// 事件监听
	EventBus.on("[update] devToolsSuspensionWindowUpdate", devToolsSuspensionWindow)
	EventBus.on("[function] configInitialization", configInitialization)
	EventBus.on("[update] pluginReady", () => {
		// 在 Vue3 中，全局属性的设置方式不同
		// 你可能需要在 main.js 中设置
	})

	// 初始化流程
	updateMessage()
	information()
	await loadPluginSystem()
	await configInitialization()
	await setupLogCleanup()
	setInterval(setupLogCleanup, 24 * 60 * 60 * 1000)
})

onUnmounted(() => {
	EventBus.off("[update] devToolsSuspensionWindowUpdate", devToolsSuspensionWindow)
	EventBus.off("[function] configInitialization", configInitialization)
	EventBus.off("[update] pluginReady")
})

/**
 * 检查环境信息
 */
const information = () => {
	Logger.debug(`[App] 环境信息`, getEnvInfo())
	const VERSION = getIEVersion()
	if (VERSION) {
		Logger.error(`[App] 检测到IE浏览器`, VERSION)
		toastRegistry.error(`[App] ${t("app.IEDetected", {version: VERSION})}`)
	}
	if (!"indexedDB" in window) {
		Logger.error(`[App] 浏览器不支持'IndexedDB'`)
		toastRegistry.error(`[App] ${t("app.indexedDBNotSupported")}`)
	}
	if (!"IDBTransaction" in window) {
		Logger.error(`[App] 浏览器不支持'IDBTransaction'`)
		toastRegistry.error(`[App] ${t("app.iDBTransactionNotSupported")}`)
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
