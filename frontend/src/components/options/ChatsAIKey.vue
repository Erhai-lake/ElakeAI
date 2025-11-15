<script setup>
import {computed, onMounted, onUnmounted, ref, watch} from "vue"
import EventBus from "@/services/EventBus"
import FoldingPanel from "@/components/FoldingPanel.vue"
import Button from "@/components/input/Button.vue"
import Selector from "@/components/input/Selector.vue"
import {platformRegistry} from "@/services/plugin/api/PlatformClass"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import InputText from "@/components/input/InputText.vue"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "ChatAIKey"

/**
 * 表单状态 0: 关闭 1: 新增 2: 编辑
 */
const formStatus = ref(0)

/**
 * 平台列表
 */
const platformList = ref([])

/**
 * 选中的平台
 */
const selectedPlatform = ref({})

/**
 * Key池
 */
const keyPools = ref([])

/**
 * 操作选择
 */
const operationSelection = ref([])

/**
 * 表单数据
 */
const formData = ref({
	key: "",
	value: "",
	title: "",
	url: "",
	enabled: true
})

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
 * 更新选中模型
 * @param newVal {Object} - 选中的模型
 */
const updateSelectedModel = (newVal) => {
	selectedPlatform.value = newVal
}

/**
 * 选择模型
 * @param selectModel {Object} - 选中的模型
 */
const selectModel = (selectModel) => {
	if (!selectModel) return
	if (selectModel === selectedPlatform.value.title) return
	selectedPlatform.value = selectModel
	operationSelection.value = []
	loadKeyPools()
}

/**
 * 加载平台
 */
const loadPlatform = async () => {
	const PLATFORMS = platformRegistry.getAllPlatforms()
	platformList.value = PLATFORMS.reduce((acc, item) => {
		try {
			acc.push({
				title: item.api.info.name,
				images: item.api.info.image,
				url: item.api.info.url
			})
		} catch (error) {
			Logger.error(`[${name}] 加载平台 ${item.api.info.name} 失败`, error)
		}
		return acc
	}, [])
	// 初始化选中模型
	if (platformList.value.length > 0) {
		selectedPlatform.value = platformList.value[0]
	}
}

/**
 * 加载Key池
 */
const loadKeyPools = async () => {
	if (!selectedPlatform.value.title) {
		Logger.warn(`[${name}] 加载Key池时模型为空`)
		return
	}
	try {
		keyPools.value = await Dexie.apiKeys.where("model").equals(selectedPlatform.value.title).toArray()
		for (const item of keyPools.value) {
			if (!item.enabled) {
				item.balance = "NULL"
				continue
			}
			item.balance = await getKeyBalance(item.key)
		}
	} catch (error) {
		Logger.error(`[${name}] 加载Key池失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.ChatAIKey.toast.loadKeyPoolError")}`)
	}
}

/**
 * 获取Key余额
 * @param key {String} - Key
 * @returns {Promise<null|boolean>} - Key余额
 */
const getKeyBalance = async (key) => {
	try {
		const INSTANCE = platformRegistry.getPlatform(selectedPlatform.value.title)
		const RESPONSE = await INSTANCE.api.balance({apiKey: key})
		if (RESPONSE.error) {
			Logger.error(`[${name}] 获取Key余额失败`, RESPONSE)
			toastRegistry.error(`[${name}] ${t(RESPONSE.error)}`)
			return RESPONSE.data
		}
		return RESPONSE.data
	} catch (error) {
		Logger.error(`[${name}] 获取Key余额失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.ChatAIKey.toast.errorObtainingKeyBalance")}`)
	}
}

/**
 * Key脱敏显示
 * @param key {String} - Key
 * @returns {*|string} - 脱敏后的Key
 */
const maskKey = (key) => {
	if (!key) return ""
	if (key.length < 8) return key
	return key.slice(0, 4) + '****' + key.slice(-4)
}

/**
 * 切换新增/编辑表单状态
 */
const toggleFormStatus = async (type = 0) => {
	if (type === 1) {
		formData.value = {
			key: "",
			value: "",
			title: "",
			url: "",
			enabled: true
		}
		formStatus.value = 1
	} else if (type === 2) {
		// 禁止空编辑
		if (!operationSelection.value || operationSelection.value.length === 0) {
			Logger.warn(`[${name}] 编辑Key时未选中任何Key`)
			toastRegistry.warning(`[${name}] ${t("components.Options.ChatAIKey.toast.selectKeysOperate")}`)
			return
		}
		// 禁止多选编辑
		if (operationSelection.value.length > 1) {
			Logger.warn(`[${name}] 编辑Key时选中了过多的key`)
			toastRegistry.warning(`[${name}] ${t("components.Options.ChatAIKey.toast.selectAKey")}`)
			return
		}
		try {
			// 加载编辑数据
			formData.value = await Dexie.apiKeys.get(operationSelection.value[0])
			formStatus.value = 2
		} catch (error) {
			Logger.error(`[${name}] 获取Key失败`, error)
			toastRegistry.error(`[${name}] ${t("components.Options.ChatAIKey.toast.getKeyError")}`)
		}
	} else {
		formData.value = {
			key: "",
			value: "",
			title: "",
			url: "",
			enabled: true
		}
		formStatus.value = 0
	}
}

/**
 * 新增Key
 */
const addNewKey = async () => {
	// 校验表单数据
	if (!verificationForm(1)) {
		return
	}
	try {
		const NEW_KEY_ID = crypto.randomUUID()
		// 写入数据库
		await Dexie.apiKeys.add({
			key: NEW_KEY_ID,
			model: selectedPlatform.value.title,
			value: formData.value.value,
			title: formData.value.title,
			url: formData.value.url,
			enabled: true
		})
		await toggleFormStatus()
		toastRegistry.success(t("components.Options.ChatAIKey.toast.addKeySuccess"))
		EventBus.emit("[update] keyPoolUpdate")
	} catch (error) {
		Logger.error(`[${name}] 添加Key失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.ChatAIKey.toast.addKeyError")}`)
	}
}

/**
 * 删除Key(批量)
 */
const removeSelectedKeys = async () => {
	// 禁止空删除
	if (!operationSelection.value || operationSelection.value.length === 0) {
		Logger.warn(`[${name}] 删除Key时未选中任何Key`)
		toastRegistry.warning(`[${name}] ${t("components.Options.ChatAIKey.toast.selectKeysOperate")}`)
		return
	}
	try {
		await Dexie.apiKeys.bulkDelete(operationSelection.value)
		if (formStatus.value === 2) {
			await toggleFormStatus()
		}
		operationSelection.value = []
		toastRegistry.success(`[${name}] ${t("components.Options.ChatAIKey.toast.removeKeySuccess")}`)
		EventBus.emit("[update] keyPoolUpdate")
	} catch (error) {
		Logger.error(`[${name}] 移除Keys失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.ChatAIKey.toast.removeKeysError")}`)
	}
}

/**
 * 更新Key
 */
const updateKey = async () => {
	// 校验表单数据
	if (!verificationForm(2)) {
		return
	}
	try {
		// 写入数据库
		await Dexie.apiKeys.update(formData.value.key, {
			value: formData.value.value,
			title: formData.value.title,
			url: formData.value.url
		})
		await toggleFormStatus()
		toastRegistry.success(`[${name}] ${t("components.Options.ChatAIKey.toast.editKeySuccess")}`)
		EventBus.emit("[update] keyPoolUpdate")
	} catch (error) {
		Logger.error(`[${name}] 编辑Key失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.ChatAIKey.toast.editKeyError")}`)
	}
}

/**
 * 校验表单数据
 * @param type {Number} - 校验类型 1:新建 2:编辑
 * @returns {boolean} - 是否校验通过
 */
const verificationForm = (type = 0) => {
	// 禁止空编辑
	if (!formData.value.value) {
		Logger.warn(`[${name}] ${type === 1 ? "新建" : "编辑"}Key时选Key为空`)
		toastRegistry.warning(`[${name}] ${t("components.Options.ChatAIKey.toast.keyNull")}`)
		return false
	}
	// 禁止名称为空
	if (!formData.value.title) {
		Logger.warn(`[${name}] ${type === 1 ? "新建" : "编辑"}Key时名称为空`)
		toastRegistry.warning(`[${name}] ${t("components.Options.ChatAIKey.toast.titleNull")}`)
		return false
	}
	// url空则使用默认url
	if (!formData.value.url) {
		formData.value.url = selectedPlatform.value.url
	}
	// 删除Url末尾的/
	if (formData.value.url.endsWith("/")) {
		formData.value.url = formData.value.url.slice(0, -1)
	}
	// 校验url
	if (!isValidUrl(formData.value.url)) {
		Logger.warn(`[${name}] ${type === 1 ? "新建" : "编辑"}Key时URL校验失败`)
		toastRegistry.warning(`[${name}] ${t("components.Options.ChatAIKey.toast.invalidUrl")}`)
		return false
	}
	return true
}

/**
 * 校验url
 * @param url {String} - url
 * @returns {boolean} - 是否为url
 */
const isValidUrl = (url) => {
	try {
		new URL(url)
		return true
	} catch (error) {
		return false
	}
}

/**
 * 切换Key启用状态
 * @param keyItem {Object} - Key
 */
const toggleKeyEnable = async (keyItem) => {
	try {
		const NEW_STATUS = !keyItem.enabled
		await Dexie.apiKeys.update(keyItem.key, {enabled: NEW_STATUS})
		if (keyItem.enabled) {
			keyItem.balance = await getKeyBalance(keyItem.key)
		} else {
			keyItem.balance = "NULL"
		}
		toastRegistry.success(`[${name}] ${t(`components.Options.ChatAIKey.toast.${NEW_STATUS ? "enable" : "disable"}Success`)}`)
		EventBus.emit("[update] keyPoolUpdate")
	} catch (error) {
		Logger.error(`[${name}] 状态更新失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.ChatAIKey.toast.statusUpdateError")}`)
	}
}

/**
 * 切换Key启用状态(批量)
 * @param status {Boolean} - 启用状态
 */
const batchToggleEnable = async (status) => {
	if (!operationSelection.value || operationSelection.value.length === 0) {
		Logger.warn(`[${name}] 切换Key启用状态时未选中任何key`)
		toastRegistry.warning(`[${name}] ${t("components.Options.ChatAIKey.toast.selectKeysOperate")}`)
		return
	}
	try {
		const UPDATES = operationSelection.value.map(key => ({
			key: key,
			changes: {enabled: status}
		}))
		await Dexie.apiKeys.bulkUpdate(UPDATES)
		toastRegistry.success(`[${name}] ${t(`components.Options.ChatAIKey.toast.batch${status ? "Enable" : "Disable"}Success`)}`)
		EventBus.emit("[update] keyPoolUpdate")
	} catch (error) {
		Logger.error(`[${name}] 状态更新失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.ChatAIKey.toast.statusUpdateError")}`)
	}
}

/**
 * 查看Key
 */
const viewKeys = () => {
	const PLATFORM = platformRegistry.getAllPlatforms().find(item => item.name === selectedPlatform.value.title)
	window.open(PLATFORM.api.info.keyViewUrl)
}

/**
 * 切换全选状态
 */
const toggleAllSelection = () => {
	if (isAllSelected.value) {
		operationSelection.value = []
	} else {
		operationSelection.value = keyPools.value.map(item => item.key)
	}
}

/**
 * 切换行选择状态
 * @param key {String} - Key
 */
const toggleRowSelection = (key) => {
	const INDEX = operationSelection.value.indexOf(key)
	if (INDEX === -1) {
		operationSelection.value.push(key)
	} else {
		operationSelection.value.splice(INDEX, 1)
	}
}

/**
 * 是否全选
 */
const isAllSelected = computed(() => {
	return keyPools.value.length > 0 &&
		keyPools.value.every(item =>
			operationSelection.value.includes(item.key)
		)
})

/**
 * 选择模型
 * @param newVal {Object} - 选中的模型
 */
watch(selectedPlatform, (newVal) => {
	selectModel(newVal)
})

onMounted(() => {
	EventBus.on("[update] keyPoolUpdate", loadKeyPools)
	// 初始化平台
	loadPlatform()
	// 初始化Key池
	loadKeyPools()
})

onUnmounted(() => {
	EventBus.off("[update] keyPoolUpdate", loadKeyPools)
})
</script>

<template>
	<FoldingPanel :Height="500">
		<template #Title>
			{{ t("components.Options.ChatAIKey.title") }}
		</template>
		<template #Content>
			<div class="chat-ai-key">
				<div class="top">
					<!-- 模型选择 -->
					<Selector
						:selectorSelected="selectedPlatform"
						:selectorList="platformList"
						uniqueKey="title"
						@update:selectorSelected="updateSelectedModel"/>
					<!-- 新增按钮 -->
					<Button @click="toggleFormStatus(1)">
						{{ t("components.Options.ChatAIKey.operationButton.add") }}
					</Button>
					<!-- 编辑选中 -->
					<Button @click="toggleFormStatus(2)">
						{{ t("components.Options.ChatAIKey.operationButton.edit") }}
					</Button>
					<!-- 移除选中 -->
					<Button @click="removeSelectedKeys">
						{{ t("components.Options.ChatAIKey.operationButton.remove", operationSelection.length) }}
					</Button>
					<!-- 启用选中 -->
					<Button @click="batchToggleEnable(true)">
						{{ t("components.Options.ChatAIKey.operationButton.enable", operationSelection.length) }}
					</Button>
					<!-- 禁用选中 -->
					<Button @click="batchToggleEnable(false)">
						{{ t("components.Options.ChatAIKey.operationButton.disable", operationSelection.length) }}
					</Button>
					<!-- 查看Key -->
					<Button @click="viewKeys">
						{{ t("components.Options.ChatAIKey.operationButton.viewKeys") }}
					</Button>
					<div/>
				</div>
				<!-- 新增/编辑表单 -->
				<div v-if="formStatus !== 0" class="add-form">
					<h3>{{
							t(`components.Options.ChatAIKey.operationButton.${formStatus === 1 ? "add" : "edit"}`)
						}}</h3>
					<div class="form-group">
						<label>{{ t("components.Options.ChatAIKey.form.key") }}</label>
						<InputText
							v-model="formData.value"
							:placeholder="t('components.Options.ChatAIKey.form.pleaseEnterKey')"/>
					</div>
					<div class="form-group">
						<label>{{ t("components.Options.ChatAIKey.form.title") }}</label>
						<InputText
							v-model="formData.title"
							:placeholder="t('components.Options.ChatAIKey.form.pleaseEnterKeyTitle')"/>
					</div>
					<div class="form-group">
						<label>{{ t("components.Options.ChatAIKey.form.url") }}</label>
						<InputText
							v-model="formData.url"
							:placeholder="t('components.Options.ChatAIKey.form.pleaseEnterKeyUrl')"/>
					</div>
					<div class="form-actions">
						<Button v-if="formStatus === 1" @click="addNewKey">
							{{ t("components.Options.ChatAIKey.form.save") }}
						</Button>
						<Button v-else @click="updateKey">
							{{ t("components.Options.ChatAIKey.form.save") }}
						</Button>
						<Button @click="toggleFormStatus">
							{{ t("components.Options.ChatAIKey.form.cancel") }}
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
								<th>{{ t("components.Options.ChatAIKey.form.enable") }}</th>
								<th>{{ t("components.Options.ChatAIKey.form.key") }}</th>
								<th>{{ t("components.Options.ChatAIKey.form.title") }}</th>
								<th>{{ t("components.Options.ChatAIKey.form.url") }}</th>
								<th>{{ t("components.Options.ChatAIKey.form.balance") }}</th>
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
								<td :title="keyItem.title">{{ keyItem.title }}</td>
								<td :title="keyItem.url">{{ keyItem.url }}</td>
								<td :title="keyItem.balance">{{ keyItem.balance }}</td>
							</tr>
							<tr v-if="(keyPools || []).length === 0">
								<td colspan="6" class="empty-tip">{{ t("components.Options.ChatAIKey.addTip") }}</td>
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
	grid-template-columns: repeat(auto-fill, 150px);
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
				transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
				cursor: pointer;

				&:hover {
					color: var(--text-color-anti);
					background-color: var(--background-color-anti);

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
				color: var(--text-color);
				background-color: var(--active-background-color);

				&:hover {
					color: var(--text-color);
					background-color: var(--active-background-color);

					.custom-checkbox {
						&::after {
							background-color: var(--background-color-anti);
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
		background-color: var(--background-color-anti);
		border-radius: 2px;
		opacity: 0;
	}
}
</style>