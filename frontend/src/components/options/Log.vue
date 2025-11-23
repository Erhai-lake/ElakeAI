<script setup>
import {nextTick, onMounted, onUnmounted, ref} from "vue"
import Button from "@/components/input/Button.vue"
import EventBus from "@/services/EventBus"
import Selector from "@/components/input/Selector.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"
import LogLevel from "@/components/options/LogLevel.vue"

const name = "Log"

/**
 * 日志级别列表
 */
const levelList = ref([
	{
		title: "all"
	},
	{
		title: "debug"
	},
	{
		title: "info"
	},
	{
		title: "warn"
	},
	{
		title: "error"
	}
])

/**
 * 日志级别选择器
 */
const levelSelector = ref("warn")

/**
 * 日志列表
 */
const logs = ref([])

/**
 * 是否保持滚动到底部
 */
const isKeepScrollToBottom = ref(true)

/**
 * 日志列表容器
 */
const logList = ref(null)

/**
 * 翻译
 * @param key {String} - 键
 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
 * @returns {String} - 翻译后的文本
 */
const t = (key, params = {}) => {
	return i18nRegistry.translate(key, params)
}

/**
 * 获取日志级别选择器
 */
const getLevelSelector = async () => {
	try {
		const LOG_LEVEL = await Dexie.configs.get("logLevel")
		levelSelector.value = LOG_LEVEL ? LOG_LEVEL.value : "warn"
	} catch (error) {
		Logger.error(`[${name}] 日志级别获取失败`, error)
	}
}

/**
 * 加载日志
 */
const loadLogs = async () => {
	try {
		const LOGS_DATA = await Dexie.logs.toArray()
		logs.value = LOGS_DATA.filter(log => {
			if (levelSelector.value === "all") return true
			return log.level === levelSelector.value
		})
	} catch (error) {
		Logger.error(`[${name}] 加载日志失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.Log.toast.loadError")}`)
	}
	if (isKeepScrollToBottom.value) scrollToBottom()
}

/**
 * 更新选择器
 * @param {Object} value - 选择器值
 */
const updateSelectedLevel = (value) => {
	levelSelector.value = value.title
	loadLogs()
}

/**
 * 清空日志
 */
const clearLogs = async () => {
	try {
		await Dexie.logs.clear()
		EventBus.emit("[update] logUpdate")
	} catch (error) {
		Logger.error(`[${name}] 清空日志失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.Log.toast.clearError")}`)
	}
	if (isKeepScrollToBottom.value) scrollToBottom()
}

/**
 * 格式化时间戳
 * @param timestamp - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
const formatTimestamp = (timestamp) => {
	const DATE = new Date(timestamp)
	const YEAR = DATE.getFullYear()
	const MONTH = String(DATE.getMonth() + 1).padStart(2, "0")
	const DAY = String(DATE.getDate()).padStart(2, "0")
	const HOURS = String(DATE.getHours()).padStart(2, "0")
	const MINUTES = String(DATE.getMinutes()).padStart(2, "0")
	const SECONDS = String(DATE.getSeconds()).padStart(2, "0")
	const MILLISECONDS = String(DATE.getMilliseconds()).padStart(3, "0")
	return `${YEAR}-${MONTH}-${DAY} ${HOURS}:${MINUTES}:${SECONDS}.${MILLISECONDS}`
}

/**
 * 滚动到最底部
 */
const scrollToBottom = () => {
	nextTick(() => {
		const CONTAINER = logList.value
		if (CONTAINER) {
			CONTAINER.scrollTop = CONTAINER.scrollHeight
		}
	})
}

/**
 * 保持滚动到底部
 */
const keepScrollToBottom = () => {
	isKeepScrollToBottom.value = !isKeepScrollToBottom.value
	if (isKeepScrollToBottom.value) {
		scrollToBottom()
	}
}

/**
 * 导出日志
 */
const exportLogs = () => {
	try {
		// 构造日志内容
		const LOG_CONTENT = logs.value.map(log => {
			return `[${formatTimestamp(log.timestamp)}] [${log.level.toUpperCase()}] [${log.component || "Global"}] ${log.message}`
		}).join("\n")
		// 创建Blob对象
		const BLOB = new Blob([LOG_CONTENT], {type: "text/plain"})
		// 创建下载链接
		const DOWNLOAD_URL = URL.createObjectURL(BLOB)
		const DOWNLOAD_LINK = document.createElement("a")
		DOWNLOAD_LINK.href = DOWNLOAD_URL
		// 设置文件名(包含当前时间)
		const NOW = new Date()
		DOWNLOAD_LINK.download = `elakeai-logs-${NOW.getFullYear()}${String(NOW.getMonth() + 1).padStart(2, "0")}${String(NOW.getDate()).padStart(2, "0")}-${String(NOW.getHours()).padStart(2, "0")}${String(NOW.getMinutes()).padStart(2, "0")}${String(NOW.getSeconds()).padStart(2, "0")}.log`
		// 触发下载
		document.body.appendChild(DOWNLOAD_LINK)
		DOWNLOAD_LINK.click()
		// 清理
		setTimeout(() => {
			document.body.removeChild(DOWNLOAD_LINK)
			URL.revokeObjectURL(DOWNLOAD_URL)
		}, 100)
		toastRegistry.success(`[${name}] ${t("components.Options.Log.toast.exportSuccess")}`)
	} catch (error) {
		Logger.error(`[${name}] 导出日志失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.Log.toast.exportError")}`)
	}
}

onMounted(() => {
	EventBus.on("[update] logUpdate", loadLogs)
	// 获取日志级别选择器
	getLevelSelector()
	// 加载日志
	loadLogs()
})

onUnmounted(() => {
	EventBus.off("[update] logUpdate", loadLogs)
})
</script>

<template>
	<div class="log">
		<div class="header">
			<Selector
				class="level-selector"
				uniqueKey="title"
				:num="5"
				:selectorList="levelList"
				:selectorSelected="{title: levelSelector}"
				@update:selectorSelected="updateSelectedLevel"/>
			<Button @click="loadLogs">🔄 {{ t("components.Options.Log.function.load") }}</Button>
			<Button @click="clearLogs">🗑️ {{ t("components.Options.Log.function.clear") }}</Button>
			<Button @click="exportLogs">📤 {{ t("components.Options.Log.function.export") }}</Button>
			<Button @click="keepScrollToBottom">
				{{ t("components.Options.Log.function.keepScrollToBottom", {is: isKeepScrollToBottom}) }}
			</Button>
			<LogLevel :prefix="true"/>
			<span class="log-count">
				{{ t("components.Options.Log.count", {count: logs.length, level: levelSelector}) }}
			</span>
		</div>
		<div ref="logList" class="log-list">
			<div v-for="(log, index) in logs" :key="index" :class="['log-item', log.level]">
				<span class="log-time">{{ formatTimestamp(log.timestamp) }}</span>
				<span class="log-level">[{{ log.level.toUpperCase() || "NULL" }}]</span>
				<span class="log-component">[{{ log.component || "Global" }}]</span>
				<span class="log-message">{{ log.message || "NULL" }}</span>
			</div>
			<div v-if="logs.length === 0" class="empty-tip">{{ t("components.Options.Log.empty") }}</div>
		</div>
	</div>
</template>

<style scoped lang="less">
.log {
	padding: 10px;
	box-sizing: border-box;
	height: 100%;
	border-radius: 4px;
	border: 1px solid var(--border-color);
	display: flex;
	flex-direction: column;
}

.header {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	margin-bottom: 10px;
	gap: 10px;

	.level-selector {
		width: 200px;
		min-width: 200px;
	}
}

.log-list {
	flex: 1;
	overflow-y: auto;
	padding: 5px;
	border-top: 1px solid var(--border-color);
	user-select: text;

	.log-item {
		margin-bottom: 5px;
		padding: 3px 5px;
		border-bottom: 1px solid var(--border-color);
		word-break: break-word;
	}

	.log-time {
		margin-right: 10px;
		min-width: 80px;
		display: inline-block;
	}

	.log-level, .log-component {
		font-weight: bold;
		margin-right: 10px;
		display: inline-block;
	}

	.log-message {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
		font-size: 0.95em;
		line-height: 1.5;
	}

	.debug {
		color: #666;
	}

	.info {
		color: var(--theme-color);
	}

	.warn {
		color: #FF9800;
	}

	.error {
		color: #F44336;
	}

	.empty-tip {
		padding: 20px;
		text-align: center;
		border: 1px solid var(--border-color);
	}
}
</style>