<script>
import Button from "@/components/input/Button.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import EventBus from "@/services/EventBus"

export default {
	name: "ImportView",
	inject: ["$DB", "$log"],
	components: {Button},
	data() {
		return {
			name: "ImportView",
			singleSelection: {
				optional: [],
				selected: []
			},
			chats: {
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
			},
			importFileData: null
		}
	},
	watch: {
		"chats.selected"(newVal) {
			this.chats.selectAll = this.chats.options.length > 0 && newVal.length === this.chats.options.length
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
		 * 判断是否有数据可导入
		 * @returns {boolean}
		 */
		hasDataToImport() {
			return this.singleSelection.optional.length > 0 || this.chats.options.length > 0 || this.configs.options.length > 0 || this.apiKeys.options.length > 0
		}
	},
	created() {
		this.initialization()
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
		 * 初始化
		 */
		initialization() {
			this.singleSelection = {
				optional: [],
				selected: []
			}
			this.chats = {
				options: [],
				selected: [],
				selectAll: false
			}
			this.configs = {
				options: [],
				selected: [],
				selectAll: false
			}
			this.apiKeys = {
				options: [],
				selected: [],
				selectAll: false
			}
			this.importFileData = null
		},
		/**
		 * 处理导入
		 */
		handleImport() {
			this.$refs.fileInput.click()
		},
		/**
		 * 处理文件导入回调
		 * @param event
		 */
		async handleFileChange(event) {
			const FILE = event.target.files[0]
			if (!FILE) return
			try {
				this.initialization()
				this.importFileData = await this.readJsonFile(FILE)
				this.$log.info(`[${this.name}] 开始解析数据`, this.importFileData)
				if (this.importFileData.chats && this.importFileData.chats.length > 0) {
					this.chats.options = this.importFileData.chats
				}
				if (this.importFileData.configs && this.importFileData.configs.length > 0) {
					this.configs.options = this.importFileData.configs
				}
				if (this.importFileData.apiKeys && this.importFileData.apiKeys.length > 0) {
					this.apiKeys.options = this.importFileData.apiKeys
				}
				this.$log.info(`[${this.name}] 解析完成`)
			} catch (error) {
				this.$log.error(`[${this.name}] 解析失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ImportView.toast.parsingFailed")}`)
			} finally {
				event.target.value = ""
			}
		},
		/**
		 * 读取json文件
		 * @param file - 文件
		 * @returns {Promise<*>}
		 */
		readJsonFile(file) {
			return new Promise((resolve, reject) => {
				const reader = new FileReader()
				reader.onload = (returnData) => {
					try {
						resolve(JSON.parse(returnData.target.result))
					} catch (error) {
						this.$log.error(`[${this.name}] 无效的JSON格式`, error)
						toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ImportView.toast.invalidJsonFormat")}`)
						reject(new Error(this.t("views.OptionsView.ImportView.toast.invalidJsonFormat")))
					}
				}
				reader.onerror = () => {
					this.$log.error(`[${this.name}] 读取文件失败`, reader.error)
					toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ImportView.toast.fileReadError")}`)
					reject(new Error(this.t("views.OptionsView.ImportView.toast.fileReadError")))
				}
				reader.readAsText(file)
			})
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
		 * 确认导入
		 */
		async confirmImport() {
			try {
				const IMPORT_TASKS = []
				// if (this.singleSelection.selected.includes("chats") && this.importFileData.chats) {
				// 	IMPORT_TASKS.push(this.importChats(this.importFileData.chats))
				// }
				if (this.chats.selected.length > 0 && this.importFileData.chats) {
					const SELECTED_CHATS = this.importFileData.chats.filter(chat =>
						this.chats.selected.includes(chat.key)
					)
					if (SELECTED_CHATS.length > 0) {
						IMPORT_TASKS.push(this.importChats(SELECTED_CHATS))
					}
				}
				if (this.configs.selected.length > 0 && this.importFileData.configs) {
					const SELECTED_CONFIGS = this.importFileData.configs.filter(config =>
						this.configs.selected.includes(config.item)
					)
					if (SELECTED_CONFIGS.length > 0) {
						IMPORT_TASKS.push(this.importConfigs(SELECTED_CONFIGS))
					}
				}
				if (this.apiKeys.selected.length > 0 && this.importFileData.apiKeys) {
					const SELECTED_API_KEYS = this.importFileData.apiKeys.filter(apiKey =>
						this.apiKeys.selected.includes(apiKey.key)
					)
					if (SELECTED_API_KEYS.length > 0) {
						IMPORT_TASKS.push(this.importApiKeys(SELECTED_API_KEYS))
					}
				}
				if (IMPORT_TASKS.length === 0) {
					this.$log.warn(`[${this.name}] 没有数据可导入`, IMPORT_TASKS)
					toastRegistry.warning(`[${this.name}] ${this.t("views.OptionsView.ImportView.toast.noDataToImport")}`)
					return
				}
				if (!confirm(this.t("views.OptionsView.ImportView.toast.confirmImportTip"))) return
				await Promise.all(IMPORT_TASKS)
				this.$log.info(`[${this.name}] 导入完成`)
			} catch (error) {
				this.$log.error(`[${this.name}] 导入失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ImportView.toast.importFailed")}`)
			}
		},
		/**
		 * 导入chats
		 * @param chats - chats
		 */
		async importChats(chats) {
			try {
				await this.$DB.transaction("rw", this.$DB.chats, async () => {
					for (const chat of chats) {
						// 生成新的key避免冲突
						const NEW_KEY = crypto.randomUUID()
						const CHAT = JSON.parse(JSON.stringify(chat))
						const NEW_CHAT = {...CHAT, key: NEW_KEY}
						// 添加新聊天记录
						await this.$DB.chats.add(NEW_CHAT)
					}
				})
				this.$log.info(`[${this.name}] 成功导入 ${chats.length} 个chat`)
				EventBus.emit("[update] chatListUpdate")
			} catch (error) {
				this.$log.error(`[${this.name}] 导入chat数据失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ImportView.toast.importFailedSkipped")}`)
			}
		},
		/**
		 * 导入configs
		 * @param configs - 配置项
		 */
		async importConfigs(configs) {
			try {
				await this.$DB.transaction("rw", this.$DB.configs, async () => {
					for (const config of configs) {
						// 检查是否已存在相同item的配置
						const EXISTING = await this.$DB.configs.get({item: config.item})
						const CLEAN_CONFIG = JSON.parse(JSON.stringify(config))
						if (EXISTING) {
							// 更新现有配置
							await this.$DB.configs.update(EXISTING.item, CLEAN_CONFIG)
						} else {
							// 添加新配置
							await this.$DB.configs.add(CLEAN_CONFIG)
						}
					}
				})
				this.$log.info(`[${this.name}] 成功导入 ${configs.length} 个config`)
				EventBus.emit("[function] configInitialization")
			} catch (error) {
				this.$log.error(`[${this.name}] 导入configs数据失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ImportView.toast.importFailedSkipped")}`)
			}
		},
		/**
		 * 导入apiKeys
		 * @param apiKeys - apiKeys
		 */
		async importApiKeys(apiKeys) {
			try {
				await this.$DB.transaction("rw", this.$DB.apiKeys, async () => {
					for (const apiKey of apiKeys) {
						// 生成新的key避免冲突
						const NEW_KEY = crypto.randomUUID()
						const NEW_API_KEY = {...apiKey, key: NEW_KEY}
						// 添加新apiKey
						await this.$DB.apiKeys.add(NEW_API_KEY)
					}
				})
				this.$log.info(`[${this.name}] 成功导入 ${apiKeys.length} 个apiKey`)
				EventBus.emit("[update] keyPoolUpdate")
			} catch (error) {
				this.$log.error(`[${this.name}] 导入apiKey数据失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.OptionsView.ImportView.toast.importFailedSkipped")}`)
			}
		}
	}
}
</script>

<template>
	<div class="import-view">
		<div class="item">
			{{ t("views.OptionsView.ImportView.selectImportedConfiguration") }}
			<Button @click="handleImport">{{ t("views.OptionsView.ImportView.import") }}</Button>
			<input type="file" ref="fileInput" @change="handleFileChange" style="display: none;" accept=".json"/>
		</div>
		<div class="import" v-if="hasDataToImport">
			<!--单项例子-->
			<!--<div class="option-group" v-if="singleSelection.optional.length > 0">-->
			<!--	<label class="option-item" v-if="singleSelection.optional.includes('chats')">-->
			<!--		<input type="checkbox" v-model="singleSelection.selected" value="chats"/>-->
			<!--		<span class="custom-checkbox"></span>-->
			<!--		<span>{{ t("views.OptionsView.ImportView.chats") }}</span>-->
			<!--	</label>-->
			<!--</div>-->
			<div class="option-group" v-if="chats.options.length > 0">
				<label class="option-item">
					<input type="checkbox" v-model="chats.selectAll" @change="toggleAll('chats')"/>
					<span class="custom-checkbox"></span>
					<span>{{
							t("views.OptionsView.ImportView.selectAll", {item: t("views.OptionsView.ImportView.chats")})
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
			<div class="option-group" v-if="configs.options.length > 0">
				<label class="option-item">
					<input type="checkbox" v-model="configs.selectAll" @change="toggleAll('configs')"/>
					<span class="custom-checkbox"></span>
					<span>{{
							t("views.OptionsView.ImportView.selectAll", {item: t("views.OptionsView.ImportView.configs")})
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
							t("views.OptionsView.ImportView.selectAll", {item: t("views.OptionsView.ImportView.apiKeys")})
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
		</div>
		<div class="item" v-if="hasDataToImport">
			{{ t("views.OptionsView.ImportView.importTip") }}
			<Button @click="confirmImport">{{ t("views.OptionsView.ImportView.confirmImport") }}</Button>
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

.import-view {
	height: 100%;
	display: grid;
	grid-template-rows: auto 1fr auto;
	overflow: hidden;
}

.import {
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