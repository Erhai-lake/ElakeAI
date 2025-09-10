<script>
import Button from "@/components/input/Button.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"

export default {
	name: "ExportView",
	inject: ["$DB", "$log"],
	components: {Button},
	data() {
		return {
			singleSelection: {
				optional: [],
				selected: []
			},
			chats: {
				options: [],
				selected: [],
				selectAll: false
			},
			masks: {
				options: [],
				selected: [],
				selectAll: false
			},
			configs: {
				options: [],
				selected: [],
				selectAll: false
			},
			apiKeys: {
				options: [],
				selected: [],
				selectAll: false
			}
		}
	},
	watch: {
		"chats.selected"(newVal) {
			this.chats.selectAll = this.chats.options.length > 0 && newVal.length === this.chats.options.length
		},
		"masks.selected"(newVal) {
			this.masks.selectAll = this.masks.options.length > 0 && newVal.length === this.masks.options.length
		},
		"configs.selected"(newVal) {
			this.configs.selectAll = this.configs.options.length > 0 && newVal.length === this.configs.options.length
		},
		"apiKeys.selected"(newVal) {
			this.apiKeys.selectAll = this.apiKeys.options.length > 0 && newVal.length === this.apiKeys.options.length
		}
	},
	computed: {
		/**
		 * 是否有数据可导出
		 * @returns {Boolean}
		 */
		hasDataToExport() {
			return this.singleSelection.optional.length > 0
				|| this.chats.options.length > 0
				|| this.masks.options.length > 0
				|| this.configs.options.length > 0
				|| this.apiKeys.options.length > 0
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
		 * 全选/取消全选
		 * @param type {String} - 类型
		 */
		toggleAll(type) {
			if (this[type].selectAll) {
				this[type].selected = this[type].options.map(item => item.item || item.key)
			} else {
				this[type].selected = []
			}
		},
		/**
		 * 加载导出数据
		 */
		async loadExportData() {
			// 加载子选项数据
			try {
				this.chats = {
					options: await this.$DB.chats.toArray(),
					selected: [],
					selectAll: false
				}
				this.masks = {
					options: await this.$DB.masks.toArray(),
					selected: [],
					selectAll: false
				}
				this.configs = {
					options: await this.$DB.configs.toArray(),
					selected: [],
					selectAll: false
				}
				this.apiKeys = {
					options: await this.$DB.apiKeys.toArray(),
					selected: [],
					selectAll: false
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 加载子选项失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ExportView.toast.failedToLoadSubOptions")}`)
			}
			// 加载单选项数据
			try {
				this.singleSelection = {
					optional: [],
					selected: []
				}
				if (await this.$DB.logs.count() > 0) this.singleSelection.optional.push("logs")
			} catch (error) {
				this.$log.error(`[${this.name}] 获取数据失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ExportView.toast.failedToGetData")}`)
				return null
			}
			this.$log.info(`[${this.name}] 初始化导出完成`)
		},
		/**
		 * 处理导出
		 */
		async handleExport() {
			const EXPORT_DATA = {}
			const CHATS = await this.handleExportChats()
			const MASKS = await this.handleExportMasks()
			const CONFIGS = await this.handleExportConfigs()
			const API_KEYS = await this.handleExportApiKey()
			const LOGS = await this.handleExportLogs()
			if (CHATS) EXPORT_DATA.chats = CHATS
			if (MASKS) EXPORT_DATA.masks = MASKS
			if (CONFIGS) EXPORT_DATA.configs = CONFIGS
			if (API_KEYS) EXPORT_DATA.apiKeys = API_KEYS
			if (LOGS) EXPORT_DATA.logs = LOGS
			if (Object.keys(EXPORT_DATA).length === 0) {
				this.$log.warn(`[${this.name}] 没有数据可导出`, EXPORT_DATA)
				toastRegistry.warning(`[${this.name}] ${this.t("views.OptionsView.ExportView.toast.noDataToExport")}`)
				return
			}
			// 开始导出
			try {
				const JSON_STRING = JSON.stringify(EXPORT_DATA, null, 2)
				// 创建Blob对象
				const BLOB = new Blob([JSON_STRING], {type: "application/json"})
				// 创建下载链接
				const DOWNLOAD_URL = URL.createObjectURL(BLOB)
				const DOWNLOAD_LINK = document.createElement("a")
				DOWNLOAD_LINK.href = DOWNLOAD_URL
				const NOW = new Date()
				DOWNLOAD_LINK.download = `elakeai-${NOW.getFullYear()}${String(NOW.getMonth() + 1).padStart(2, "0")}${String(NOW.getDate()).padStart(2, "0")}-${String(NOW.getHours()).padStart(2, "0")}${String(NOW.getMinutes()).padStart(2, "0")}${String(NOW.getSeconds()).padStart(2, "0")}.json`
				// 触发下载
				document.body.appendChild(DOWNLOAD_LINK)
				DOWNLOAD_LINK.click()
				// 清理
				setTimeout(() => {
					document.body.removeChild(DOWNLOAD_LINK)
					URL.revokeObjectURL(DOWNLOAD_URL)
				}, 100)
				this.$log.info(`[${this.name}] 导出成功`)
				toastRegistry.success(`[${this.name}] ${this.t("views.OptionsView.ExportView.toast.exportSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 导出失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ExportView.toast.exportFailed")}`)
			}
		},
		/**
		 * 处理导出chats
		 */
		async handleExportChats() {
			if (this.chats.selected.length === 0) {
				return null
			}
			try {
				const CHATS_DATA = await this.$DB.chats.toArray()
				const CHATS = CHATS_DATA.filter(item => this.chats.selected.includes(item.key))
				if (CHATS.length === 0) {
					return null
				}
				return CHATS
			} catch (error) {
				this.$log.error(`[${this.name}] 获取chats数据失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ExportView.toast.failedToGetData")}`)
				return null
			}
		},
		/**
		 * 处理导出masks
		 */
		async handleExportMasks() {
			if (this.masks.selected.length === 0) {
				return null
			}
			try {
				const MASKS_DATA = await this.$DB.masks.toArray()
				const MASKS = MASKS_DATA.filter(item => this.masks.selected.includes(item.key))
				if (MASKS.length === 0) {
					return null
				}
				return MASKS
			} catch (error) {
				this.$log.error(`[${this.name}] 获取masks数据失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ExportView.toast.failedToGetData")}`)
				return null
			}
		},
		/**
		 * 处理导出configs
		 */
		async handleExportConfigs() {
			if (this.configs.selected.length === 0) {
				return null
			}
			try {
				const CONFIGS_DATA = await this.$DB.configs.toArray()
				const CONFIGS = CONFIGS_DATA.filter(item => this.configs.selected.includes(item.item))
				if (CONFIGS.length === 0) {
					return null
				}
				return CONFIGS
			} catch (error) {
				this.$log.error(`[${this.name}] 获取configs数据失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ExportView.toast.failedToGetData")}`)
				return null
			}
		},
		/**
		 * 处理导出apiKeys
		 */
		async handleExportApiKey() {
			if (this.apiKeys.selected.length === 0) {
				return null
			}
			try {
				const API_KEYS_DATA = await this.$DB.apiKeys.toArray()
				const API_KEYS = API_KEYS_DATA.filter(item => this.apiKeys.selected.includes(item.key))
				if (API_KEYS.length === 0) {
					return null
				}
				return API_KEYS
			} catch (error) {
				this.$log.error(`[${this.name}] 获取apiKeys数据失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ExportView.toast.failedToGetData")}`)
				return null
			}
		},
		/**
		 * 处理导出logs
		 */
		async handleExportLogs() {
			if (!this.singleSelection.selected.includes("logs")) {
				return null
			}
			try {
				const LOGS_DATA = await this.$DB.logs.toArray()
				if (LOGS_DATA.length === 0) {
					return null
				}
				return LOGS_DATA
			} catch (error) {
				this.$log.error(`[${this.name}] 获取logs数据失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ExportView.toast.failedToGetData")}`)
				return null
			}
		}
	}
}
</script>

<template>
	<div class="export-view">
		<div class="item">
			{{ t("views.OptionsView.ExportView.loadExportData") }}
			<Button @click="loadExportData">{{ t("views.OptionsView.ExportView.loading") }}</Button>
		</div>
		<div class="export" v-if="hasDataToExport">
			<div class="option-group" v-if="chats.options.length > 0">
				<label class="option-item">
					<input type="checkbox" v-model="chats.selectAll" @change="toggleAll('chats')"/>
					<span class="custom-checkbox"></span>
					<span>{{
							t("views.OptionsView.ExportView.selectAll", {item: t("views.OptionsView.ExportView.chats")})
						}}</span>
				</label>
				<div class="sub-options" v-if="chats.options.length">
					<label
						class="option-item sub-option"
						v-for="(option, index) in chats.options"
						:key="'chats-'+index">
						<input type="checkbox" v-model="chats.selected" :value="option.key"/>
						<span class="custom-checkbox"></span>
						<span>[{{ option.key }}] {{ option.title }}</span>
					</label>
				</div>
			</div>
			<div class="option-group" v-if="masks.options.length > 0">
				<label class="option-item">
					<input type="checkbox" v-model="masks.selectAll" @change="toggleAll('masks')"/>
					<span class="custom-checkbox"></span>
					<span>{{
							t("views.OptionsView.ExportView.selectAll", {item: t("views.OptionsView.ExportView.masks")})
						}}</span>
				</label>
				<div class="sub-options" v-if="masks.options.length">
					<label
						class="option-item sub-option"
						v-for="(option, index) in masks.options"
						:key="'chats-'+index">
						<input type="checkbox" v-model="masks.selected" :value="option.key"/>
						<span class="custom-checkbox"></span>
						<span>[{{ option.key }}] {{ option.title }}</span>
					</label>
				</div>
			</div>
			<div class="option-group" v-if="configs.options.length > 0">
				<label class="option-item">
					<input type="checkbox" v-model="configs.selectAll" @change="toggleAll('configs')"/>
					<span class="custom-checkbox"></span>
					<span>{{
							t("views.OptionsView.ExportView.selectAll", {item: t("views.OptionsView.ExportView.configs")})
						}}</span>
				</label>
				<div class="sub-options" v-if="configs.options.length">
					<label
						class="option-item sub-option"
						v-for="(option, index) in configs.options"
						:key="'configs-'+index">
						<input type="checkbox" v-model="configs.selected" :value="option.item"/>
						<span class="custom-checkbox"></span>
						<span>{{ option.item }}</span>
					</label>
				</div>
			</div>
			<div class="option-group" v-if="apiKeys.options.length > 0">
				<label class="option-item">
					<input type="checkbox" v-model="apiKeys.selectAll" @change="toggleAll('apiKeys')"/>
					<span class="custom-checkbox"></span>
					<span>{{
							t("views.OptionsView.ExportView.selectAll", {item: t("views.OptionsView.ExportView.apiKeys")})
						}}</span>
				</label>
				<div class="sub-options" v-if="apiKeys.options.length">
					<label
						class="option-item sub-option"
						v-for="(option, index) in apiKeys.options"
						:key="'apiKeys-'+index">
						<input type="checkbox" v-model="apiKeys.selected" :value="option.key"/>
						<span class="custom-checkbox"></span>
						<span>[{{ option.model }}] {{ option.remark }}</span>
					</label>
				</div>
			</div>
			<div class="option-group" v-if="singleSelection.optional.includes('logs')">
				<label class="option-item" v-if="singleSelection.optional.includes('logs')">
					<input type="checkbox" v-model="singleSelection.selected" value="logs"/>
					<span class="custom-checkbox"></span>
					<span>{{ t("views.OptionsView.ExportView.logs") }}</span>
				</label>
			</div>
		</div>
		<div class="item" v-if="hasDataToExport">
			{{ t("views.OptionsView.ExportView.exportTip") }}
			<Button @click="handleExport">{{ t("views.OptionsView.ExportView.export") }}</Button>
		</div>
	</div>
</template>

<style scoped lang="less">
.item {
	padding: 10px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	border-bottom: 1px solid var(--border-color);
	border-top: 1px solid var(--border-color);
	white-space: nowrap;
}

.export-view {
	height: 100%;
	display: grid;
	grid-template-rows: auto 1fr auto;
	overflow: hidden;
}

.export {
	padding: 20px;
	margin: 20px 0;
	border: 1px solid var(--border-color);
	border-radius: 8px;
	overflow: auto;
}

.option-group {
	margin-bottom: 15px;
	padding: 10px;
	border-radius: 5px;
	border: 1px solid var(--border-color);

	.option-item {
		display: flex;
		align-items: center;
		padding: 8px 0;
		cursor: pointer;

		input[type="checkbox"] {
			display: none;

			&:checked + .custom-checkbox::after {
				opacity: 1;
			}
		}

		.custom-checkbox {
			margin-right: 10px;
			display: inline-block;
			width: 20px;
			height: 20px;
			box-sizing: border-box;
			vertical-align: middle;
			border: 2px solid var(--border-color);
			border-radius: 4px;
			position: relative;
			cursor: pointer;

			&::after {
				content: "";
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				width: 10px;
				height: 10px;
				background-color: var(--background-color-anti);
				border-radius: 2px;
				opacity: 0;
			}
		}
	}

	.sub-options {
		margin-left: 20px;
		padding-left: 10px;
		border-left: 2px solid var(--border-color);
	}
}
</style>