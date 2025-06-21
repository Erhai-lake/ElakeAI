<script>
import FoldingPanel from "@/components/FoldingPanel.vue"
import ModelList from "@/assets/data/ModelList.json"
import Button from "@/components/Button.vue"
import Selector from "@/components/Selector.vue"
import APIManager from "@/services/api/APIManager"

export default {
	name: "ChatAIKey",
	components: {Selector, Button, FoldingPanel},
	inject: ["$DB"],
	data() {
		return {
			name: "ChatAIKey",
			status: {
				// 新增表单状态
				addFormStatus: false,
				// 编辑表单状态
				editFormStatus: false
			},
			// 模型列表
			modelList: ModelList,
			// 选中的模型
			selectedModel: ModelList[0],
			// Key池
			keyPools: [],
			// 操作选择
			operationSelection: [],
			// 新增表单数据
			newKey: {
				value: "",
				remark: "",
				url: "",
				enabled: true
			},
			// 编辑表单数据
			editKey: {
				key: "",
				value: "",
				remark: "",
				url: ""
			}
		}
	},
	watch: {
		// 监听模型变化
		selectedModel(newVal) {
			this.selectModel(newVal)
		}
	},
	created() {
		// 初始化Key池
		this.loadKeyPools()
	},
	computed: {
		// 是否全选
		isAllSelected() {
			return this.keyPools.length > 0 &&
				this.keyPools.every(item =>
					this.operationSelection.includes(item.key)
				)
		}
	},
	methods: {
		/**
		 * 更新选中模型
		 * @param newVal {Object} - 选中的模型
		 */
		updateSelectedModel(newVal) {
			this.selectedModel = newVal
		},
		/**
		 * 选择模型
		 * @param selectModel {Object} - 选中的模型
		 */
		selectModel(selectModel) {
			if (!selectModel) return
			if (selectModel === this.selectedModel.title) return
			this.selectedModel = selectModel
			this.operationSelection = []
			this.loadKeyPools()
		},
		/**
		 * 加载Key池
		 */
		async loadKeyPools() {
			try {
				this.keyPools = await this.$DB.apiKeys.where("model").equals(this.selectedModel.title).toArray()
				for (const item of this.keyPools) {
					if (!item.enabled) {
						item.balance = "NULL"
						continue
					}
					item.balance = await this.getKeyBalance(item.key)
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 加载Key池失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.ChatAIKey.toast.loadKeyPoolError")}`)
			}
		},
		/**
		 * 获取Key余额
		 * @param key {String} - Key
		 * @returns {Promise<null|boolean>} - Key余额
		 */
		async getKeyBalance(key) {
			try {
				const KEY_DATA = await this.$DB.apiKeys.get(key)
				const RESPONSE = await APIManager.execute(KEY_DATA.model, "balance", {apiKey: key})
				if (RESPONSE.error) {
					this.$log.error(`[${this.name}] 获取Key余额失败`, RESPONSE.error)
					this.$toast.error(this.$t(`api.${RESPONSE.error}`))
					return RESPONSE.data
				}
				return RESPONSE.data
			} catch (error) {
				this.$log.error(`[${this.name}] 获取Key余额失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.ChatAIKey.toast.errorObtainingKeyBalance")}`)
			}
		},
		/**
		 * 新增Key
		 */
		async addNewKey() {
			// 禁止key空
			if (!this.newKey.value) {
				this.$log.warn(`[${this.name}] 新建Key时Key为空`)
				this.$toast.warning(`[${this.name}] ${this.$t("components.ChatAIKey.toast.keyNull")}`)
				return
			}
			// 禁止备注为空
			if (!this.newKey.remark) {
				this.$log.warn(`[${this.name}] 新建Key时备注为空`)
				this.$toast.warning(`[${this.name}] ${this.$t("components.ChatAIKey.toast.remarkNull")}`)
				return
			}
			// url空则使用默认url
			if (!this.newKey.url) {
				this.newKey.url = this.selectedModel.url
			}
			// 校验url
			if (!this.isValidUrl(this.newKey.url)) {
				this.$log.warn(`[${this.name}] 新建Key时URL校验失败`)
				this.$toast.warning(`[${this.name}] ${this.$t("components.ChatAIKey.toast.invalidUrl")}`)
				return
			}
			// 删除Url末尾的/
			if (this.newKey.url.endsWith("/")) {
				this.newKey.url = this.newKey.url.slice(0, -1)
			}
			try {
				const NEW_KEY_ID = crypto.randomUUID()
				// 写入数据库
				await this.$DB.apiKeys.add({
					key: NEW_KEY_ID,
					model: this.selectedModel.title,
					value: this.newKey.value,
					remark: this.newKey.remark,
					url: this.newKey.url,
					enabled: this.newKey.enabled
				})
				// 写入Key池
				this.keyPools.push({
					key: NEW_KEY_ID,
					model: this.selectedModel.title,
					...this.newKey
				})
				// 重置表单
				this.newKey = {key: "", value: "", remark: "", url: "", enabled: true}
				this.status.addFormStatus = false
				this.$toast.success(this.$t("components.ChatAIKey.toast.addKeySuccess"))
			} catch (error) {
				this.$log.error(`[${this.name}] 添加Key失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.ChatAIKey.toast.addKeyError")}`)
			}
		},
		/**
		 * Key脱敏显示
		 * @param key {String} - Key
		 * @returns {*|string} - 脱敏后的Key
		 */
		maskKey(key) {
			if (!key) return ""
			if (key.length < 8) return key
			return key.slice(0, 4) + '****' + key.slice(-4)
		},
		/**
		 * 删除Key(批量)
		 * @returns {Promise<void>} - 删除Key
		 */
		async removeSelectedKeys() {
			// 禁止空删除
			if (!this.operationSelection || this.operationSelection.length === 0) {
				this.$log.warn(`[${this.name}] 删除Key时未选中任何Key`)
				this.$toast.warning(`[${this.name}] ${this.$t("components.ChatAIKey.toast.selectKeysOperate")}`)
				return
			}
			try {
				await this.$DB.apiKeys.bulkDelete(this.operationSelection)
				// 删除Key池
				this.keyPools = this.keyPools.filter(item =>
					!this.operationSelection.includes(item.key)
				)
				this.operationSelection = []
				this.$toast.success(`[${this.name}] ${this.$t("components.ChatAIKey.toast.removeKeySuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 移除Keys失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.ChatAIKey.toast.removeKeysError")}`)
			}
		},
		/**
		 * 编辑Key
		 * @returns {Promise<void>} - 编辑Key
		 */
		async toggleEditSelected() {
			// 禁止空编辑
			if (!this.operationSelection || this.operationSelection.length === 0) {
				this.$log.warn(`[${this.name}] 编辑Key时未选中任何Key`)
				this.$toast.warning(`[${this.name}] ${this.$t("components.ChatAIKey.toast.selectKeysOperate")}`)
				return
			}
			// 禁止多选编辑
			if (this.operationSelection.length > 1) {
				this.$log.warn(`[${this.name}] 编辑Key时选中了过多的key`)
				this.$toast.warning(`[${this.name}] ${this.$t("components.ChatAIKey.toast.selectAKey")}`)
				return
			}
			try {
				// 加载编辑数据
				const KEY_DATA = await this.$DB.apiKeys.get(this.operationSelection[0])
				this.editKey = {
					key: KEY_DATA.key,
					value: KEY_DATA.value,
					remark: KEY_DATA.remark,
					url: KEY_DATA.url
				}
				this.status.editFormStatus = !this.status.editFormStatus
			} catch (error) {
				this.$log.error(`[${this.name}] 获取Key失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.ChatAIKey.toast.getKeyError")}`)
			}
		},
		/**
		 * 编辑Key(写数据库)
		 * @returns {Promise<void>} - 编辑Key
		 */
		async editSelectedKeys() {
			// 禁止空编辑
			if (!this.editKey.value) {
				this.$log.warn(`[${this.name}] 编辑Key时选Key为空`)
				this.$toast.warning(`[${this.name}] ${this.$t("components.ChatAIKey.toast.keyNull")}`)
				return
			}
			// 禁止备注为空
			if (!this.editKey.remark) {
				this.$log.warn(`[${this.name}] 编辑Key时备注为空`)
				this.$toast.warning(`[${this.name}] ${this.$t("components.ChatAIKey.toast.remarkNull")}`)
				return
			}
			// url空则使用默认url
			if (!this.editKey.url) {
				this.editKey.url = this.selectedModel.url
			}
			// 校验url
			if (!this.isValidUrl(this.editKey.url)) {
				this.$log.warn(`[${this.name}] 删除Key时URL校验失败`)
				this.$toast.warning(`[${this.name}] ${this.$t("components.ChatAIKey.toast.invalidUrl")}`)
				return
			}
			// 删除Url末尾的/
			if (this.editKey.url.endsWith("/")) {
				this.editKey.url = this.editKey.url.slice(0, -1)
			}
			try {
				// 写入数据库
				await this.$DB.apiKeys.update(this.editKey.key, {
					value: this.editKey.value,
					remark: this.editKey.remark,
					url: this.editKey.url
				})
				// 更新Key池
				this.keyPools = this.keyPools.map(item => {
					if (item.key === this.editKey.key) {
						return {...item, ...this.editKey}
					}
					return item
				})
				// 重置表单
				this.editKey = {
					key: "",
					value: "",
					remark: "",
					url: "",
					enabled: true
				}
				this.status.editFormStatus = false
				this.$toast.success(`[${this.name}] ${this.$t("components.ChatAIKey.toast.editKeySuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 编辑Key失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.ChatAIKey.toast.editKeyError")}`)
			}
		},
		/**
		 * 校验url
		 * @param url {String} - url
		 * @returns {boolean} - 是否为url
		 */
		isValidUrl(url) {
			try {
				new URL(url)
				return true
			} catch (error) {
				return false
			}
		},
		/**
		 * 切换Key启用状态
		 * @param keyItem {Object} - Key
		 * @returns {Promise<void>} - 切换Key启用状态
		 */
		async toggleKeyEnable(keyItem) {
			try {
				const NEW_STATUS = !keyItem.enabled
				await this.$DB.apiKeys.update(keyItem.key, {enabled: NEW_STATUS})
				keyItem.enabled = NEW_STATUS
				if (keyItem.enabled) {
					keyItem.balance = await this.getKeyBalance(keyItem.key)
				} else {
					keyItem.balance = "NULL"
				}
				this.$toast.success(`[${this.name}] ${this.$t(`components.ChatAIKey.toast.${NEW_STATUS ? "enable" : "disable"}Success`)}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 状态更新失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.ChatAIKey.toast.statusUpdateError")}`)
			}
		},
		/**
		 * 切换Key启用状态(批量)
		 * @param status {Boolean} - 启用状态
		 * @returns {Promise<void>} - 切换Key启用状态
		 */
		async batchToggleEnable(status) {
			if (!this.operationSelection || this.operationSelection.length === 0) {
				this.$log.warn(`[${this.name}] 切换Key启用状态时未选中任何key`)
				this.$toast.warning(`[${this.name}] ${this.$t("components.ChatAIKey.toast.selectKeysOperate")}`)
				return
			}
			try {
				const UPDATES = this.operationSelection.map(key => ({
					key: key,
					changes: {enabled: status}
				}))
				await this.$DB.apiKeys.bulkUpdate(UPDATES)
				// 本地更新选中项状态
				const UPDATED_POOLS = []
				for (const item of this.keyPools) {
					if (this.operationSelection.includes(item.key)) {
						const updatedItem = {...item, enabled: status}
						if (status) {
							updatedItem.balance = await this.getKeyBalance(item.key)
						} else {
							updatedItem.balance = "NULL"
						}
						UPDATED_POOLS.push(updatedItem)
					} else {
						UPDATED_POOLS.push(item)
					}
				}
				this.keyPools = UPDATED_POOLS
				this.$toast.success(`[${this.name}] ${this.$t(`components.ChatAIKey.toast.batch${status ? "Enable" : "Disable"}Success`)}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 状态更新失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.ChatAIKey.toast.statusUpdateError")}`)
			}
		},
		/**
		 * 切换全选状态
		 */
		toggleAllSelection() {
			if (this.isAllSelected) {
				this.operationSelection = []
			} else {
				this.operationSelection = this.keyPools.map(item => item.key)
			}
		},
		/**
		 * 切换行选择状态
		 * @param key {String} - Key
		 */
		toggleRowSelection(key) {
			const INDEX = this.operationSelection.indexOf(key)
			if (INDEX === -1) {
				this.operationSelection.push(key)
			} else {
				this.operationSelection.splice(INDEX, 1)
			}
		}
	}
}
</script>

<template>
	<FoldingPanel :Height="500">
		<template #Title>
			{{ $t("components.ChatAIKey.title") }}
		</template>
		<template #Content>
			<div class="chat-ai-key">
				<div class="top">
					<!-- 模型选择 -->
					<Selector
						:selectorSelected="selectedModel"
						:selectorList="modelList"
						uniqueKey="title"
						@update:selectorSelected="updateSelectedModel"/>
					<!-- 新增按钮 -->
					<Button @click="status.addFormStatus = !status.addFormStatus">
						{{ $t("components.ChatAIKey.operationButton.add") }}
					</Button>
					<!-- 编辑选中 -->
					<Button @click="toggleEditSelected">
						{{ $t("components.ChatAIKey.operationButton.edit") }}
					</Button>
					<!-- 移除选中 -->
					<Button @click="removeSelectedKeys">
						{{ $t("components.ChatAIKey.operationButton.remove", operationSelection.length) }}
					</Button>
					<!-- 启用选中 -->
					<Button @click="batchToggleEnable(true)">
						{{ $t("components.ChatAIKey.operationButton.enable", operationSelection.length) }}
					</Button>
					<!-- 禁用选中 -->
					<Button @click="batchToggleEnable(false)">
						{{ $t("components.ChatAIKey.operationButton.disable", operationSelection.length) }}
					</Button>
					<div/>
				</div>
				<!-- 新增表单 -->
				<div v-if="status.addFormStatus" class="add-form">
					<h3>{{ $t("components.ChatAIKey.operationButton.add") }}</h3>
					<div class="form-group">
						<label>{{ $t("components.ChatAIKey.form.key") }}</label>
						<input type="text" v-model="newKey.value"
							   :placeholder="$t('components.ChatAIKey.form.pleaseEnterKey')">
					</div>
					<div class="form-group">
						<label>{{ $t("components.ChatAIKey.form.remarks") }}</label>
						<input type="text" v-model="newKey.remark"
							   :placeholder="$t('components.ChatAIKey.form.pleaseEnterKeyRemarks')">
					</div>
					<div class="form-group">
						<label>{{ $t("components.ChatAIKey.form.url") }}</label>
						<input type="text" v-model="newKey.url"
							   :placeholder="$t('components.ChatAIKey.form.pleaseEnterKeyUrl')">
					</div>
					<div class="form-actions">
						<Button @click="addNewKey">{{ $t("components.ChatAIKey.form.save") }}</Button>
						<Button @click="status.addFormStatus = false">
							{{ $t("components.ChatAIKey.form.cancel") }}
						</Button>
					</div>
				</div>
				<!-- 编辑表单 -->
				<div v-if="status.editFormStatus" class="add-form">
					<h3>{{ $t("components.ChatAIKey.operationButton.edit") }}</h3>
					<div class="form-group">
						<label>{{ $t("components.ChatAIKey.form.key") }}</label>
						<input type="text" v-model="editKey.value"
							   :placeholder="$t('components.ChatAIKey.form.pleaseEnterKey')">
					</div>
					<div class="form-group">
						<label>{{ $t("components.ChatAIKey.form.remarks") }}</label>
						<input type="text" v-model="editKey.remark"
							   :placeholder="$t('components.ChatAIKey.form.pleaseEnterKeyRemarks')">
					</div>
					<div class="form-group">
						<label>{{ $t("components.ChatAIKey.form.url") }}</label>
						<input type="text" v-model="editKey.url"
							   :placeholder="$t('components.ChatAIKey.form.pleaseEnterKeyUrl')">
					</div>
					<div class="form-actions">
						<Button @click="editSelectedKeys">{{ $t("components.ChatAIKey.form.save") }}</Button>
						<Button @click="status.editFormStatus = false">
							{{ $t("components.ChatAIKey.form.cancel") }}
						</Button>
					</div>
				</div>
				<div class="bottom">
					<!-- APIKey列表 -->
					<div class="key-pool">
						<table>
							<thead>
							<tr>
								<th>
									<label>
										<input type="checkbox"
											   :checked="isAllSelected"
											   @change="toggleAllSelection">
										<span class="custom-checkbox"></span>
									</label>
								</th>
								<th>{{ $t("components.ChatAIKey.form.enable") }}</th>
								<th>{{ $t("components.ChatAIKey.form.key") }}</th>
								<th>{{ $t("components.ChatAIKey.form.remarks") }}</th>
								<th>{{ $t("components.ChatAIKey.form.url") }}</th>
								<th>{{ $t("components.ChatAIKey.form.balance") }}</th>
							</tr>
							</thead>
							<tbody>
							<tr
								v-for="keyItem in keyPools || []"
								:key="keyItem.key"
								@click="toggleRowSelection(keyItem.key)"
								:class="{ 'selected-row': operationSelection.includes(keyItem.key) }">
								<td @click.stop>
									<label>
										<input type="checkbox"
											   :value="keyItem.key"
											   v-model="operationSelection"
											   @click.stop>
										<span class="custom-checkbox"></span>
									</label>
								</td>
								<td>
									<label>
										<input
											type="checkbox"
											:checked="keyItem.enabled"
											@change="toggleKeyEnable(keyItem)">
										<span class="custom-checkbox"></span>
									</label>
								</td>
								<td :title="keyItem.value">{{ maskKey(keyItem.value) }}</td>
								<td :title="keyItem.remark">{{ keyItem.remark }}</td>
								<td :title="keyItem.url">{{ keyItem.url }}</td>
								<td :title="keyItem.balance">{{ keyItem.balance }}</td>
							</tr>
							<tr v-if="(keyPools || []).length === 0">
								<td colspan="6" class="empty-tip">{{ $t("components.ChatAIKey.addTip") }}</td>
							</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</template>
	</FoldingPanel>
</template>

<style scoped lang="less">
.top {
	display: grid;
	grid-template-columns: repeat(auto-fill, 200px);
	gap: 10px;
}

.add-form {
	padding: 15px;
	margin: 20px 0;
	border: 1px solid var(--border-color);
	border-radius: 8px;

	.form-group {

		label {
			width: 80px;
			display: inline-block;
			margin: 8px 0;
		}

		input {
			padding: 8px;
			box-sizing: border-box;
			width: 100%;
		}
	}

	.form-actions {
		margin-top: 15px;

		Button {
			margin-right: 10px;
			padding: 8px 16px;
		}
	}
}

.bottom {
	margin: 20px 0;
	width: 100%;
	height: 400px;
	border: 1px solid var(--border-color);
	overflow-y: auto;

	.key-pool {
		table {
			min-width: 1000px;
			width: 100%;
			border-collapse: collapse;
			table-layout: fixed;

			th, td {
				padding: 10px;
				box-sizing: border-box;
				border: 1px solid var(--border-color);
				text-align: center;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			tbody tr {
				transition: background-color 0.2s;
				cursor: pointer;

				&:hover {
					color: var(--text-color-Anti);
					background-color: var(--background-color-Anti);

					.custom-checkbox {
						&::after {
							background-color: var(--background-color);
						}
					}
				}
			}

			th:nth-child(1), td:nth-child(1) {
				width: 10%;
			}

			th:nth-child(2), td:nth-child(2) {
				width: 10%;
				pointer-events: auto;
			}

			th:nth-child(3), td:nth-child(3) {
				width: 20%;
			}

			th:nth-child(4), td:nth-child(4) {
				width: 25%;
			}

			th:nth-child(5), td:nth-child(5) {
				width: 25%;
			}

			th:nth-child(6), td:nth-child(6) {
				width: 10%;
			}

			.selected-row {
				--Active-Background-Color: rgba(107, 130, 145, 0.5);
				color: var(--text-color);
				background-color: var(--Active-Background-Color);

				&:hover {
					color: var(--text-color);
					background-color: var(--Active-Background-Color);

					.custom-checkbox {
						&::after {
							background-color: var(--background-color-Anti);
						}
					}
				}
			}
		}
	}
}

input[type="checkbox"] {
	display: none;

	&:checked + .custom-checkbox::after {
		opacity: 1;

	}
}

.custom-checkbox {
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
</style>