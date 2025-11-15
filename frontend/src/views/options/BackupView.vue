<script setup>
import {reactive, ref} from "vue"
import Button from "@/components/input/Button.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"
import Loading from "@/components/Loading.vue"
import EventBus from "@/services/EventBus"

const name = "BackupView"

/**
 * 备份模式
 */
const mode = ref("")

/**
 * 加载状态
 */
const loading = ref(false)

/**
 * 文件输入元素引用
 */
const fileInput = ref(null)

/**
 * 数据表元数据
 */
const METADATA = ref([
	{
		name: "apiKeys",
		displayName: "apiKeys",
		primaryKey: "key",
		displayField: "title",
		subDisplayField: "model",
		eventBus: null,
		importStrategy: "regenerateId",
		data: null
	},
	{
		name: "chats",
		displayName: "chats",
		primaryKey: "key",
		displayField: "title",
		subDisplayField: null,
		eventBus: "[update] chatListUpdate",
		importStrategy: "regenerateId",
		data: null
	},
	{
		name: "masks",
		displayName: "masks",
		primaryKey: "key",
		displayField: "title",
		subDisplayField: null,
		eventBus: "null",
		importStrategy: "regenerateId",
		data: null
	},
	{
		name: "archives",
		displayName: "archives",
		primaryKey: "key",
		displayField: "value.title",
		subDisplayField: null,
		eventBus: "null",
		importStrategy: "regenerateId",
		data: null
	},
	{
		name: "configs",
		displayName: "configs",
		primaryKey: "item",
		displayField: "item",
		subDisplayField: null,
		eventBus: "[function] configInitialization",
		importStrategy: "merge",
		data: null
	}
])

/**
 * 选择状态管理
 */
const selectionState = reactive({})

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
 * 全选/取消全选
 */
const toggleAll = (tableName) => {
	const STATE = selectionState[tableName]
	const TABLE_ITEM = METADATA.value.find(item => item.name === tableName)
	if (!TABLE_ITEM || !TABLE_ITEM.data) return
	// 切换全选状态
	STATE.selectAll = !STATE.selectAll
	if (STATE.selectAll) {
		// 全选：选择所有项的primaryKey
		STATE.selected = TABLE_ITEM.data.map(item =>
			getNestedValue(item, TABLE_ITEM.primaryKey)
		)
	} else {
		// 取消全选
		STATE.selected = []
	}
}

/**
 * 处理单个选项的选择变化
 */
const handleItemSelection = (tableName, optionValue, isChecked) => {
	const STATE = selectionState[tableName]
	if (!STATE) return
	if (isChecked) {
		// 添加选中项
		if (!STATE.selected.includes(optionValue)) {
			STATE.selected.push(optionValue)
		}
	} else {
		// 移除选中项
		const INDEX = STATE.selected.indexOf(optionValue)
		if (INDEX > -1) {
			STATE.selected.splice(INDEX, 1)
		}
	}
	// 更新全选状态
	const tableItem = METADATA.value.find(item => item.name === tableName)
	if (tableItem && tableItem.data) {
		STATE.selectAll = STATE.selected.length === tableItem.data.length
	}
}

/**
 * 初始化元数据
 */
const initData = () => {
	mode.value = ""
	for (const item of METADATA.value) {
		selectionState[item.name] = {
			selectAll: false,
			selected: []
		}
	}
	for (const item of METADATA.value) {
		item.data = null
	}
}

/**
 * 获取嵌套对象属性值
 * @param obj {Object} - 对象
 * @param path {String} - 点分隔的路径，如 "value.title"
 * @returns {*} - 属性值
 */
const getNestedValue = (obj, path) => {
	if (!path) return ""
	return path.split(".").reduce((current, key) => {
		return current && current[key] !== undefined ? current[key] : ""
	}, obj)
}

/**
 * 解析显示字段
 * @param item {Object} - 数据表元数据
 * @param option {Object} - 数据项
 * @returns {{text: String, size: Number, isLarge: Boolean, sizeText: String}} - 解析后的显示字段
 */
const parseDisplayField = (item, option) => {
	// 解析主显示字段(支持嵌套路径)
	let display = getNestedValue(option, item.displayField)
	// 解析副显示字段
	if (item.subDisplayField) {
		const SUB_DISPLAY = getNestedValue(option, item.subDisplayField)
		if (SUB_DISPLAY) {
			display += ` [${SUB_DISPLAY}]`
		}
	}
	// 添加主键信息
	const PRIMARY_KEY_VALUE = getNestedValue(option, item.primaryKey)
	if (PRIMARY_KEY_VALUE && PRIMARY_KEY_VALUE !== display) {
		display += ` (${PRIMARY_KEY_VALUE})`
	}
	// 计算数据大小(大于10KB视为大文件)
	const DATA_SIZE = new Blob([JSON.stringify(option)]).size
	const IS_LARGE = DATA_SIZE > 1024 * 10
	return {
		text: display || "无标题",
		size: DATA_SIZE,
		isLarge: IS_LARGE,
		sizeText: formatFileSize(DATA_SIZE)
	}
}

/**
 * 格式化文件大小
 * @param bytes {Number} - 字节数
 * @returns {String} - 格式化后的大小
 */
const formatFileSize = (bytes) => {
	if (bytes === 0) return "0 B"
	const k = 1024
	const sizes = ["B", "KB", "MB", "GB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * 获取选项的主键值
 */
const getItemKey = (item, option) => {
	return getNestedValue(option, item.primaryKey)
}

/**
 * 处理文件导入回调
 * @param event - 文件选择事件
 */
const handleFileChange = async (event) => {
	const FILE = event.target.files[0]
	if (!FILE) return
	loading.value = true
	try {
		// 读取文件内容并解析JSON
		const JSON_DATA = await new Promise((resolve, reject) => {
			const READER = new FileReader()
			READER.onload = (returnData) => {
				try {
					resolve(JSON.parse(returnData.target.result))
				} catch (error) {
					Logger.error(`[${name}] 无效的JSON格式`, error)
					toastRegistry.error(`[${name}] ${t("views.OptionsView.BackupView.toast.invalidJsonFormat")}`)
					reject(new Error(t("views.OptionsView.BackupView.toast.invalidJsonFormat")))
				}
			}
			READER.onerror = () => {
				Logger.error(`[${name}] 读取文件失败`, READER.error)
				toastRegistry.error(`[${name}] ${t("views.OptionsView.BackupView.toast.errorReadFile")}`)
				reject(new Error(t("views.OptionsView.BackupView.toast.errorReadFile")))
			}
			READER.readAsText(FILE)
		})
		// 填充元数据
		for (const item of METADATA.value) {
			if (!JSON_DATA[item.name]) continue
			item.data = JSON_DATA[item.name]
			toggleAll(item.name)
		}
		mode.value = "Import"
	} catch (error) {
		Logger.error(`[${name}] 读取文件失败`, error)
		toastRegistry.error(`[${name}] ${t("views.OptionsView.BackupView.toast.errorReadFile")}`)
	} finally {
		// 重置文件输入, 允许再次选择同一个文件
		event.target.value = ""
		loading.value = false
	}
}

/**
 * 加载数据
 * @param type - 备份类型
 */
const loadData = async (type) => {
	initData()
	mode.value = type
	if (type === "Import") {
		fileInput.value.click()
	} else if (type === "Export") {
		loading.value = true
		for (const item of METADATA.value) {
			try {
				item.data = await Dexie[item.name].toArray()
			} catch (error) {
				Logger.error(`[${name}] 读取数据表[${item.name}]失败`, error)
				toastRegistry.error(`[${name}] ${t("views.OptionsView.BackupView.toast.errorReadTable", {table: item.name})}`)
			}
			toggleAll(item.name)
		}
		loading.value = false
	}
}

/**
 * 确认导出/导入
 */
const confirmOperation = () => {
	if (mode.value === "Import") {
		importData()
	} else if (mode.value === "Export") {
		exportData()
	}
}

/**
 * 确认导入备份数据
 */
const importData = async () => {
	if (!confirm(t("views.OptionsView.BackupView.confirmImportTip"))) return
	loading.value = true
	// 收集选中项
	const IMPORT_RESULT = {}
	try {
		for (const item of METADATA.value) {
			const STATE = selectionState[item.name]
			if (STATE?.selected?.length && item.data) {
				IMPORT_RESULT[item.name] = item.data.filter(option =>
					STATE.selected.includes(getNestedValue(option, item.primaryKey))
				)
			}
		}
	} catch (error) {
		Logger.error(`[${name}] 收集选中项失败`, error)
		toastRegistry.error(`[${name}] ${t("views.OptionsView.BackupView.toast.errorExport")}`)
		return
	}
	// 检查是否有选中项
	if (Object.keys(IMPORT_RESULT).length === 0) return
	// 开始导入
	for (const item of METADATA.value) {
		if (!IMPORT_RESULT[item.name]) continue
		if (item.importStrategy === "regenerateId") {
			for (const option of IMPORT_RESULT[item.name]) {
				option[item.primaryKey] = crypto.randomUUID()
				try {
					await Dexie[item.name].add(JSON.parse(JSON.stringify(option)))
				} catch (error) {
					Logger.error(`[${name}] 模式[${item.importStrategy}]写入数据表[${item.name}]失败`, error)
					toastRegistry.error(`[${name}] ${t("views.OptionsView.BackupView.toast.errorWriteTable", {table: item.name})}`)
				}
			}
		} else if (item.importStrategy === "merge") {
			for (const option of IMPORT_RESULT[item.name]) {
				try {
					await Dexie[item.name].put(JSON.parse(JSON.stringify(option)))
				} catch (error) {
					Logger.error(`[${name}] 模式[${item.importStrategy}]写入数据表[${item.name}]失败`, error)
					toastRegistry.error(`[${name}] ${t("views.OptionsView.BackupView.toast.errorWriteTable", {table: item.name})}`)
				}
			}
		}
		if (item.eventBus) EventBus.emit(item.eventBus)
		toastRegistry.success(`[${name}] ${t("views.OptionsView.BackupView.toast.importSuccess")}`)
	}
	initData()
	loading.value = false
}

/**
 * 导出选中项
 */
const exportData = () => {
	if (!confirm(t("views.OptionsView.BackupView.confirmExportTip"))) return
	loading.value = true
	// 收集选中项
	const EXPORT_RESULT = {}
	try {
		for (const item of METADATA.value) {
			const STATE = selectionState[item.name]
			if (STATE?.selected?.length && item.data) {
				EXPORT_RESULT[item.name] = item.data.filter(option =>
					STATE.selected.includes(getNestedValue(option, item.primaryKey))
				)
			}
		}
	} catch (error) {
		Logger.error(`[${name}] 收集选中项失败`, error)
		toastRegistry.error(`[${name}] ${t("views.OptionsView.BackupView.toast.errorExport")}`)
		return
	}
	// 检查是否有选中项
	if (Object.keys(EXPORT_RESULT).length === 0) return
	// 开始导出
	try {
		// 创建Blob对象
		const BLOB = new Blob([JSON.stringify(EXPORT_RESULT)], {type: "application/json"})
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
		Logger.info(`[${name}] 导出成功`)
	} catch (error) {
		Logger.error(`[${name}] 导出失败`, error)
		toastRegistry.error(`[${name}] ${t("views.OptionsView.BackupView.toast.errorExport")}`)
	}
	toastRegistry.success(`[${name}] ${t("views.OptionsView.BackupView.toast.exportSuccess")}`)
	initData()
	loading.value = false
}
</script>

<template>
	<div class="backup-view">
		<div class="head">
			<div class="left">
				<div class="item">
					{{ t(`views.OptionsView.BackupView.importBackup`) }}
					<Button @click="loadData('Import')">{{ t(`views.OptionsView.BackupView.import`) }}</Button>
					<input
						type="file"
						ref="fileInput"
						@change="handleFileChange"
						style="display: none;"
						accept=".json"/>
				</div>
				<div class="item">
					{{ t(`views.OptionsView.BackupView.exportBackup`) }}
					<Button @click="loadData('Export')">{{ t(`views.OptionsView.BackupView.export`) }}</Button>
				</div>
			</div>
			<Button @click="initData" class="init-btn">初始化数据</Button>
		</div>
		<div class="select-container">
			<Loading :loading="loading" :text="t('views.OptionsView.BackupView.loading')">
				<div class="option-group" v-for="item in METADATA" :key="item.name" v-show="item.data?.length">
					<label class="option-item">
						<input
							type="checkbox"
							:checked="selectionState[item.name]?.selectAll || false"
							@change="toggleAll(item.name)"/>
						<span class="custom-checkbox"></span>
						<span>
						<span>{{ item.displayName }}</span>
						<span>&nbsp;</span>
						<span>({{ selectionState[item.name]?.selected?.length || 0 }} / {{
								item.data?.length || 0
							}})</span>
					</span>
					</label>
					<div class="sub-options">
						<label class="option-item sub-option" v-for="option in item.data" :key="option">
							<input
								type="checkbox"
								:value="getItemKey(item, option)"
								:checked="selectionState[item.name]?.selected.includes(getItemKey(item, option)) || false"
								@change="handleItemSelection(item.name, getItemKey(item, option), $event.target.checked)"/>
							<span class="custom-checkbox"></span>
							<span>
							{{ parseDisplayField(item, option).text }}
							<span class="size-indicator" :class="{ 'large': parseDisplayField(item, option).isLarge }">
							({{ parseDisplayField(item, option).sizeText }})
						</span>
						</span>
						</label>
					</div>
				</div>
			</Loading>
		</div>
		<div class="item" v-show="mode !== ''">
			{{ t(`views.OptionsView.BackupView.confirm${mode}Tip`) }}
			<Button @click="confirmOperation">{{ t("views.OptionsView.BackupView.confirm") }}</Button>
		</div>
	</div>
</template>

<style scoped lang="less">
.backup-view {
	height: 100%;
	display: grid;
	grid-template-rows: auto 1fr auto;
	overflow: hidden;
}

.head {
	width: 100%;
	display: grid;
	grid-template-columns: 1fr 50px;
	gap: 10px;

	.left {
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	.init-btn {
		padding: 0;
		width: 100%;
		writing-mode: vertical-rl;
		text-orientation: mixed;
		letter-spacing: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}

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

.select-container {
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

	.sub-option {
		.size-indicator {
			font-size: 0.8em;
			opacity: 0.7;
			margin-left: 8px;

			&.large {
				color: #F44336;
				font-weight: bold;
				animation: pulse 2s infinite;
			}
		}
	}
}

@keyframes pulse {
	0% {
		opacity: 0.3;
	}
	50% {
		opacity: 1;
	}
	100% {
		opacity: 0.3;
	}
}
</style>