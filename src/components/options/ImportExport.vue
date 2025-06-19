<script>
import Button from "@/components/Button.vue"

export default {
	name: "ImportExport",
	components: {Button},
	inject: ["$DB"],
	data() {
		return {
			name: "ImportExport",
			// 选中的一级选项
			selectedOptions: [],
			configs: {
				// 所有选项
				options: [],
				// 选中的configs子选项
				selected: [],
				// 是否全选configs
				selectAll: false
			},
			apiKeys: {
				// 所有选项
				options: [],
				// 选中的configs子选项
				selected: [],
				// 是否全选configs
				selectAll: false
			},
			// 导入的文件
			importFile: null
		};
	},
	watch: {
		"configs.selected"(newVal) {
			this.configs.selectAll = newVal.length === this.configs.options.length
		},
		"apiKeys.selected"(newVal) {
			this.apiKeys.selectAll = newVal.length === this.apiKeys.options.length
		}
	},
	async created() {
		try {
			this.configs.options = await this.$DB.configs.toArray()
			this.apiKeys.options = await this.$DB.apiKeys.toArray()
		} catch (error) {
			this.$log.error(`[${this.name}] 加载子选项失败`, error)
			this.$toast.error(`[${this.name}] ${this.$t("components.ImportExport.toast.failedToLoadSubOptions")}`)
		}
	},
	methods: {
		/**
		 * 全选/取消全选configs
		 */
		toggleAllConfigs() {
			if (this.configs.selectAll) {
				this.configs.selected = this.configs.options.map(item => item.item)
			} else {
				this.configs.selected = []
			}
		},
		/**
		 * 全选/取消全选apiKeys
		 */
		toggleAllApiKeys() {
			if (this.apiKeys.selectAll) {
				this.apiKeys.selected = this.apiKeys.options.map(item => item.key)
			} else {
				this.apiKeys.selected = []
			}
		},
		/**
		 * 处理导出configs
		 * @returns {Promise<*>}
		 */
		async handleExportConfigs() {
			if (this.configs.selected.length > 0) {
				try {
					const CONFIGS_DATA = await this.$DB.configs.toArray()
					const CONFIGS = CONFIGS_DATA.filter(item => this.configs.selected.includes(item.item))
					if (CONFIGS.length === 0) {
						return null
					}
					return CONFIGS
				} catch (error) {
					this.$log.error(`[${this.name}] 获取configs数据失败`, error)
					this.$toast.error(`[${this.name}] ${this.$t("components.ImportExport.toast.failedToGetData")}`)
					return null
				}
			}
			return null
		},
		/**
		 * 处理导出apiKeys
		 * @returns {Promise<*>}
		 */
		async handleExportApiKey() {
			if (this.apiKeys.selected.length > 0) {
				try {
					const API_KEYS_DATA = await this.$DB.apiKeys.toArray()
					const API_KEYS = API_KEYS_DATA.filter(item => this.apiKeys.selected.includes(item.key))
					if (API_KEYS.length === 0) {
						return null
					}
					return API_KEYS
				} catch (error) {
					this.$log.error(`[${this.name}] 获取apiKeys数据失败`, error)
					this.$toast.error(`[${this.name}] ${this.$t("components.ImportExport.toast.failedToGetData")}`)
					return null
				}
			}
			return null
		},
		/**
		 * 处理导出chats
		 * @returns {Promise<*>}
		 */
		async handleExportChats() {
			if (this.selectedOptions.includes("chats")) {
				try {
					const CHATS_DATA = await this.$DB.chats.toArray()
					if (CHATS_DATA.length === 0) {
						return null
					}
					return CHATS_DATA
				} catch (error) {
					this.$log.error(`[${this.name}] 获取chats数据失败`, error)
					this.$toast.error(`[${this.name}] ${this.t("components.ImportExport.toast.failedToGetData")}`)
					return null
				}
			}
			return null
		},
		/**
		 * 处理导出
		 */
		async handleExport() {
			const EXPORT_DATA = {}
			const CONFIGS = await this.handleExportConfigs()
			const API_KEYS = await this.handleExportApiKey()
			const CHATS = await this.handleExportChats()
			if (CONFIGS) EXPORT_DATA.configs = CONFIGS
			if (API_KEYS) EXPORT_DATA.apiKeys = API_KEYS
			if (CHATS) EXPORT_DATA.chats = CHATS
			if (Object.keys(EXPORT_DATA).length === 0) {
				this.$log.warn(`[${this.name}] 没有数据可导出`, EXPORT_DATA)
				this.$toast.warning(`[${this.name}] ${this.$t("components.ImportExport.toast.noDataToExport")}`)
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
				this.$log.info(`[${this.name}] 导出成功`, EXPORT_DATA)
				this.$toast.success(`[${this.name}] ${this.$t("components.ImportExport.toast.exportSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 导出失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.ImportExport.toast.exportFailed")}`)
			}
		},
		/**
		 * 处理导入
		 */
		handleImport() {
			if (window.confirm(this.$t("components.ImportExport.confirmImport"))) {
				this.$refs.fileInput.click()
			}
		},
		/**
		 * 处理文件导入回调
		 * @param event
		 */ async handleFileChange(event) {
			const FILE = event.target.files[0]
			if (!FILE) return
			this.$toast.success(`[${this.name}] ${this.$t("components.ImportExport.toast.importInProgress")}`)
			try {
				const DATA = await this.readJsonFile(FILE)
				this.$log.info(`[${this.name}] 开始导入数据`, DATA)
				await Promise.all([
					DATA.configs && this.importConfigs(DATA.configs),
					DATA.apiKeys && this.importApiKeys(DATA.apiKeys),
					DATA.chats && this.importChats(DATA.chats)
				])
				this.$log.info(`[${this.name}] 导入完成`)
				this.$toast.success(`[${this.name}] ${this.$t("components.ImportExport.toast.importSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 导入失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.ImportExport.toast.importFailed")}`)
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
						this.$toast.error(`[${this.name}] ${this.$t("components.ImportExport.toast.invalidJsonFormat")}`)
						reject(new Error(this.$t("components.ImportExport.toast.invalidJsonFormat")))
					}
				}
				reader.onerror = () => {
					this.$log.error(`[${this.name}] 读取文件失败`, reader.error)
					this.$toast.error(`[${this.name}] ${this.$t("components.ImportExport.toast.fileReadError")}`)
					reject(new Error(this.$t("components.ImportExport.toast.fileReadError")))
				}
				reader.readAsText(file)
			})
		},
		/**
		 * 导入配置项
		 * @param configs - 配置项
		 */
		async importConfigs(configs) {
			try {
				await this.$DB.transaction("rw", this.$DB.configs, async () => {
					for (const config of configs) {
						// 检查是否已存在相同item的配置
						const EXISTING = await this.$DB.configs.get({item: config.item})
						if (EXISTING) {
							console.log(EXISTING, config)
							// 更新现有配置
							await this.$DB.configs.update(EXISTING.item, config)
							this.$log.info(`[${this.name}] 更新config`, config.item)
						} else {
							// 添加新配置
							await this.$DB.configs.add(config)
							this.$log.info(`[${this.name}] 添加新config`, config.item)
						}
					}
				})
				this.$log.info(`[${this.name}] 成功导入 ${configs.length} 个config`)
			} catch (error) {
				this.$log.error(`[${this.name}] 导入configs数据失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.ImportExport.toast.importFailedSkipped")}`)
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
						// 检查是否已存在相同value的API Key
						const EXISTING = await this.$DB.apiKeys.get({value: apiKey.value})
						if (EXISTING) {
							// 更新现有API Key
							await this.$DB.apiKeys.update(EXISTING.id, NEW_API_KEY)
							this.$log.info(`[${this.name}] 更新apiKey`, apiKey.remark)
						} else {
							// 添加新API Key
							await this.$DB.apiKeys.add(NEW_API_KEY)
							this.$log.info(`[${this.name}] 添加新apiKey`, apiKey.remark)
						}
					}
				})
				this.$log.info(`[${this.name}] 成功导入 ${apiKeys.length} 个apiKey`)
			} catch (error) {
				this.$log.error(`[${this.name}] 导入apiKey数据失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.ImportExport.toast.importFailedSkipped")}`)
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
						const NEW_CHAT = {...chat, key: NEW_KEY}
						// 添加新聊天记录
						await this.$DB.chats.add(NEW_CHAT)
						this.$log.info(`[${this.name}] 添加新chat`, chat.title)
					}
				})
				this.$log.info(`[${this.name}] 成功导入 ${chats.length} 个chat`)
			} catch (error) {
				this.$log.error(`[${this.name}] 导入chat数据失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.ImportExport.toast.importFailedSkipped")}`)
			}
		}
	}
}
</script>

<template>
	<div class="ImportExport">
		<h3>{{ $t("components.ImportExport.selectConfigurationItemPrompt") }}</h3>
		<div class="ConfigSelection">
			<div class="OptionGroup">
				<label class="OptionItem">
					<input type="checkbox" v-model="configs.selectAll" @change="toggleAllConfigs"/>
					<span class="CustomCheckbox"></span>
					<span>{{
							$t("components.ImportExport.selectAll", {item: $t("components.ImportExport.configs")})
						}}</span>
				</label>
				<div class="SubOptions" v-if="configs.options.length">
					<label
						class="OptionItem SubOption"
						v-for="(option, index) in configs.options"
						:key="'configs-'+index">
						<input type="checkbox" v-model="configs.selected" :value="option.item"/>
						<span class="CustomCheckbox"></span>
						<span>{{ option.item }}</span>
					</label>
				</div>
			</div>

			<div class="OptionGroup">
				<label class="OptionItem">
					<input type="checkbox" v-model="apiKeys.selectAll" @change="toggleAllApiKeys"/>
					<span class="CustomCheckbox"></span>
					<span>{{
							$t("components.ImportExport.selectAll", {item: $t("components.ImportExport.apiKeys")})
						}}</span>
				</label>
				<div class="SubOptions" v-if="apiKeys.options.length">
					<label
						class="OptionItem SubOption"
						v-for="(option, index) in apiKeys.options"
						:key="'apiKeys-'+index">
						<input type="checkbox" v-model="apiKeys.selected" :value="option.key"/>
						<span class="CustomCheckbox"></span>
						<span>[{{ option.model }}] {{ option.remark }}</span>
					</label>
				</div>
			</div>

			<div class="OptionGroup">
				<h4>Chats</h4>
				<label class="OptionItem">
					<input type="checkbox" v-model="selectedOptions" value="chats"/>
					<span class="CustomCheckbox"></span>
					<span>{{ $t("components.ImportExport.chats") }}</span>
				</label>
			</div>
		</div>
		<div class="ActionButtons">
			<Button @click="handleExport">{{ $t("components.ImportExport.export") }}</Button>
			<Button @click="handleImport">{{ $t("components.ImportExport.import") }}</Button>
		</div>
		<input type="file" ref="fileInput" @change="handleFileChange" style="display: none;" accept=".json"/>
	</div>
</template>


<style scoped lang="less">
.ImportExport {
	padding: 20px;
	margin: 0 auto;
	box-sizing: border-box;
	max-width: 600px;
	height: 100%;
	border: 1px solid var(--border-color);
	background-color: var(--background-color);
	border-radius: 8px;
	display: grid;
	grid-template-rows: 1fr auto;
	overflow: hidden;

	.ConfigSelection {
		padding-right: 10px;
		margin-bottom: 20px;
		overflow: auto;
	}
}

.OptionGroup {
	margin-bottom: 15px;
	padding: 10px;
	border-radius: 5px;
	border: 1px solid var(--border-color);

	.OptionItem {
		display: flex;
		align-items: center;
		padding: 8px 0;
		cursor: pointer;

		input[type="checkbox"] {
			display: none;

			&:checked + .CustomCheckbox::after {
				opacity: 1;

			}
		}

		.CustomCheckbox {
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
				background-color: var(--background-color-Anti);
				border-radius: 2px;
				opacity: 0;
			}
		}
	}

	.SubOptions {
		margin-left: 20px;
		padding-left: 10px;
		border-left: 2px solid var(--border-color);
	}
}

.ActionButtons {
	display: flex;
	justify-content: space-between;
}
</style>