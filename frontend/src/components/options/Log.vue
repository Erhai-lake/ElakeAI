<script>
import Button from "@/components/Button.vue"
import EventBus from "@/services/EventBus"
import {nextTick} from "vue"
import Selector from "@/components/Selector.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"

export default {
	name: "Log",
	inject: ["$DB", "$log"],
	components: {Selector, Button},
	data() {
		return {
			name: "Log",
			levelList: [
				{
					label: "all",
					title: "all"
				},
				{
					label: "debug",
					title: "debug"
				},
				{
					label: "info",
					title: "info"
				},
				{
					label: "warn",
					title: "warn"
				},
				{
					label: "error",
					title: "error"
				},
			],
			levelSelector: {
				label: "all",
				title: "all"
			},
			logs: [],
			isKeepScrollToBottom: true,
			isLogSuspensionWindow: false,
		}
	},
	beforeUnmount() {
		EventBus.off("[update] logUpdate", this.loadLogs)
	},
	async created() {
		EventBus.on("[update] logUpdate", this.loadLogs)
		// 加载日志
		await this.loadLogs()
		// 获取悬浮窗设置
		try {
			const LOG_SUSPENSION_WINDOW_DATA = await this.$DB.configs.get("logSuspensionWindow")
			this.isLogSuspensionWindow = LOG_SUSPENSION_WINDOW_DATA ? LOG_SUSPENSION_WINDOW_DATA.value : false
		} catch (error) {
			this.$log.error(`[${this.name}] 日志悬浮窗设置获取失败`, error)
			toastRegistry.error(`[${this.name}] ${this.t("components.Log.toast.getLogSuspensionWindowError")}`)
		}
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
		 * 加载日志
		 */
		async loadLogs() {
			try {
				const LOGS_DATA = await this.$DB.logs.toArray()
				this.logs = LOGS_DATA.filter(log => {
					if (this.levelSelector.label === "all") return true
					return log.level === this.levelSelector.label
				})
			} catch (error) {
				this.$log.error(`[${this.name}] 加载日志失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.Log.toast.loadError")}`)
			}
			if (this.keepScrollToBottom) this.scrollToBottom()
		},
		/**
		 * 更新选择器
		 * @param {Object} value - 选择器值
		 */
		updateSelectedLevel(value) {
			this.levelSelector = value
			this.loadLogs()
		},
		/**
		 * 清空日志
		 */
		async clearLogs() {
			try {
				await this.$DB.logs.clear()
				EventBus.emit("[update] logUpdate")
			} catch (error) {
				this.$log.error(`[${this.name}] 清空日志失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.Log.toast.clearError")}`)
			}
			if (this.keepScrollToBottom) this.scrollToBottom()
		},
		/**
		 * 格式化时间戳
		 * @param {number} timestamp 时间戳
		 * @returns {string} 格式化后的时间字符串
		 */
		formatTimestamp(timestamp) {
			const DATE = new Date(timestamp)
			const YEAR = DATE.getFullYear()
			const MONTH = String(DATE.getMonth() + 1).padStart(2, "0")
			const DAY = String(DATE.getDate()).padStart(2, "0")
			const HOURS = String(DATE.getHours()).padStart(2, "0")
			const MINUTES = String(DATE.getMinutes()).padStart(2, "0")
			const SECONDS = String(DATE.getSeconds()).padStart(2, "0")
			const MILLISECONDS = String(DATE.getMilliseconds()).padStart(3, "0");
			return `${YEAR}-${MONTH}-${DAY} ${HOURS}:${MINUTES}:${SECONDS}.${MILLISECONDS}`
		},
		/**
		 * 滚动到最底部
		 */
		scrollToBottom() {
			nextTick(() => {
				const CONTAINER = this.$refs.logList
				if (CONTAINER) {
					CONTAINER.scrollTop = CONTAINER.scrollHeight
				}
			})
		},
		/**
		 * 保持滚动到底部
		 */
		keepScrollToBottom() {
			this.isKeepScrollToBottom = !this.isKeepScrollToBottom
			if (this.isKeepScrollToBottom) {
				this.scrollToBottom()
			}
		},
		/**
		 * 悬浮窗口
		 */
		async suspensionWindow() {
			// 保存设置
			try {
				await this.$DB.configs.put({
					item: "logSuspensionWindow",
					value: !this.isLogSuspensionWindow
				})
				EventBus.emit("[update] logSuspensionWindowUpdate")
				this.isLogSuspensionWindow = !this.isLogSuspensionWindow
			} catch (error) {
				this.$log.error(`[${this.name}] 悬浮窗设置保存失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.Log.toast.saveLogSuspensionWindowError")}`)
			}
		},
		/**
		 * 导出日志
		 */
		exportLogs() {
			try {
				// 构造日志内容
				const LOG_CONTENT = this.logs.map(log => {
					return `[${this.formatTimestamp(log.timestamp)}] [${log.level.toUpperCase()}] [${log.component || "Global"}] ${log.message}`
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
				toastRegistry.success(`[${this.name}] ${this.t("components.Log.toast.exportSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 导出日志失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.Log.toast.exportError")}`)
			}
		}
	}
}
</script>

<template>
	<div class="log">
		<div class="header">
			<Selector
				class="level-selector"
				uniqueKey="label"
				:num="5"
				:selectorList="levelList"
				:selectorSelected="levelSelector || {}"
				@update:selectorSelected="updateSelectedLevel"/>
			<Button @click="loadLogs">🔄 {{ t("components.Log.function.load") }}</Button>
			<Button @click="clearLogs">🗑️ {{ t("components.Log.function.clear") }}</Button>
			<Button @click="exportLogs">📤 {{ t("components.Log.function.export") }}</Button>
			<Button @click="keepScrollToBottom">
				{{ t("components.Log.function.keepScrollToBottom", {is: isKeepScrollToBottom}) }}
			</Button>
			<Button @click="suspensionWindow">
				{{ t("components.Log.function.suspensionWindow", {is: isLogSuspensionWindow}) }}
			</Button>
			<span class="log-count">{{
					t("components.Log.count", {count: logs.length, level: levelSelector.label})
				}}</span>
		</div>
		<div ref="logList" class="log-list">
			<div v-for="(log, index) in logs" :key="index" :class="['log-item', log.level]">
				<span class="log-time">{{ formatTimestamp(log.timestamp) }}</span>
				<span class="log-level">[{{ log.level.toUpperCase() || "NULL" }}]</span>
				<span class="log-component">[{{ log.component || "Global" }}]</span>
				<span class="log-message">{{ log.message || "NULL" }}</span>
			</div>
			<div v-if="logs.length === 0" class="empty-tip">{{ t("components.Log.empty") }}</div>
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
	background-color: var(--background-color);
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
	background-color: var(--background-color);

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
		color: #80ceff;
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