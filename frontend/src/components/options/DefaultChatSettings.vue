<script setup>
import {ref, watch, onMounted, onUnmounted} from "vue"
import Selector from "@/components/input/Selector.vue"
import Button from "@/components/input/Button.vue"
import EventBus from "@/services/EventBus"
import {platformRegistry} from "@/services/plugin/api/PlatformClass"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

/**
 * 默认聊天设置组件属性定义
 */
const props = defineProps({
	save: {
		type: Boolean,
		default: true
	}
})

/**
 * 默认聊天设置组件事件定义
 */
const emit = defineEmits(["update:selectedPlatformList", "update:selectedKey", "update:selectedModel"])

const name = "DefaultChatSettings"

/**
 * 保存状态
 */
const saved = ref(false)

/**
 * 平台选择器
 */
const platform = ref({
	list: [],
	selected: null,
})

/**
 * Key池选择器
 */
const keyPools = ref({
	list: [],
	selected: null,
})

/**
 * 模型选择器
 */
const model = ref({
	list: [],
	selected: null,
})

/**
 * 当前模型请求ID
 */
const currentModelRequest = ref(null)

/**
 * 当前Key池请求ID
 */
const currentKeyPoolRequest = ref(null)

/**
 * 加载状态
 */
const loading = ref({
	keys: false,
	models: false
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
 * 加载平台
 */
const loadPlatform = async () => {
	const PLATFORMS = platformRegistry.getAllPlatforms()
	platform.value.list = PLATFORMS.reduce((acc, item) => {
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
	if (platform.value.list && platform.value.list.length > 0) {
		platform.value.selected = platform.value.list[0]
	}
}

/**
 * 加载Key
 */
const loadKeyPools = async (skipSelection = false) => {
	const currentRequestId = Symbol()
	currentKeyPoolRequest.value = currentRequestId
	if (!saved.value) {
		keyPools.value.selected = null
	}
	try {
		const KEYS_DATA = await Dexie.apiKeys
			.where("model")
			.equals(platform.value.selected.title)
			.and(key => key.enabled)
			.toArray()
		// 检查是否还是当前有效的请求
		if (currentKeyPoolRequest.value !== currentRequestId) return
		keyPools.value.list = [
			...KEYS_DATA.map(key => ({key: key.key, title: key.remark})) || []
		]
		if (keyPools.value.list.length === 0) return
		// 如果 skipSelection 为 true 且已有选中项，则不覆盖
		if (!skipSelection || !keyPools.value.selected) {
			keyPools.value.selected = keyPools.value.list[0]
		}
	} catch (error) {
		keyPools.value.list = []
		Logger.error(`[${name}] 加载Key池失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.DefaultChatSettings.toast.loadKeyPoolError")}`)
	}
}

/**
 * 取消所有请求
 */
const cancelAllRequests = () => {
	if (currentModelRequest.value?.cancel) {
		currentModelRequest.value.cancel()
	}
	if (currentKeyPoolRequest.value?.cancel) {
		currentKeyPoolRequest.value.cancel()
	}
}

/**
 * 更新平台所选项
 * @param newVal {Object} - 新的平台选项
 */
const updateSelectedPlatformList = (newVal) => {
	platform.value.selected = newVal
	saved.value = false
	emit("update:selectedPlatformList", newVal)
}

/**
 * 更新Key所选项
 * @param newVal {Object} - 新的Key选项
 */
const updateSelectedKey = (newVal) => {
	keyPools.value.selected = newVal
	emit("update:selectedKey", newVal)
}

/**
 * 更新模型所选项
 * @param newVal {Object} - 新的模型选项
 */
const updateSelectedModel = (newVal) => {
	model.value.selected = newVal
	emit("update:selectedModel", newVal)
}

/**
 * 触发所选项更新事件
 */
const emitSelected = () => {
	emit("update:selectedPlatformList", platform.value.selected)
	emit("update:selectedKey", keyPools.value.selected)
	emit("update:selectedModel", model.value.selected)
}

/**
 * 选择平台
 * @param newModel {Object} - 新的平台选项
 */
const selectPlatform = async (newModel) => {
	cancelAllRequests()
	const requestContext = {cancelled: false}
	currentKeyPoolRequest.value = {
		cancel: () => {
			requestContext.cancelled = true
		}
	}
	try {
		loading.value.keys = true
		const KEYS = await fetchKeysForModel(newModel.title)
		if (requestContext.cancelled) return
		keyPools.value.list = KEYS
		keyPools.value.selected = KEYS[0] || null
		loading.value.keys = false
	} catch (error) {
		if (!requestContext.cancelled) {
			Logger.error(`[${name}] 加载Key池失败`, error)
			toastRegistry.error(`[${name}] ${t("components.Options.DefaultChatSettings.toast.loadKeyPoolError")}`)
		}
	} finally {
		loading.value.keys = false
		emitSelected()
	}
}

/**
 * 选择Key
 * @param newKey {Object} - 新的Key选项
 */
const selectKey = async (newKey) => {
	if (!newKey?.key) return
	cancelAllRequests()
	const requestContext = {cancelled: false}
	currentModelRequest.value = {
		cancel: () => {
			requestContext.cancelled = true
		}
	}
	try {
		loading.value.models = true
		const MODELS = await fetchModelsForKey(newKey.key)
		if (requestContext.cancelled) return
		model.value.list = MODELS
		if (!saved.value) {
			model.value.selected = MODELS[0] || null
		}
	} catch (error) {
		if (!requestContext.cancelled) {
			Logger.error(`[${name}] 加载模型失败`, error)
			toastRegistry.error(`[${name}] ${t("components.Options.DefaultChatSettings.toast.loadModelError")}`)
		}
	} finally {
		loading.value.models = false
		emitSelected()
	}
}

/**
 * 获取模型的Key
 * @param modelName {String} - 模型名称
 * @returns {Promise<{title, key: *}[]>} - 模型的Key列表
 */
const fetchKeysForModel = async (modelName) => {
	const KEYS = await Dexie.apiKeys
		.where("model")
		.equals(modelName)
		.and(key => key.enabled)
		.toArray()

	return KEYS.map(key => ({
		key: key.key,
		title: key.remark || key.key
	}))
}

/**
 * 获取Key的模型
 * @param key {String} - Key
 * @returns {Promise<{title: *}[]>} - Key的模型列表
 */
const fetchModelsForKey = async (key) => {
	const KEY_DATA = await Dexie.apiKeys.get(key)
	const INSTANCE = platformRegistry.getPlatform(KEY_DATA.model)
	const RESPONSE = await INSTANCE.api.models({apiKey: key})
	if (RESPONSE.error) {
		Logger.error(`[${name}] 获取Key的模型失败`, RESPONSE)
		toastRegistry.error(`[${name}] ${t(RESPONSE.error)}`)
	}
	const UNIQUE_MODELS = [...new Set(RESPONSE.data)]
	return UNIQUE_MODELS.map(model => ({title: model}))
}

/**
 * 获取设置
 */
const restoreSettings = async () => {
	try {
		const DEFAULT_CHAT_SETTINGS_DATA = await Dexie.configs.get("DefaultChatSettings")
		if (DEFAULT_CHAT_SETTINGS_DATA) {
			// 查找对应的平台选项
			const PLATFORM_ITEM = platform.value.list.find(model => model.title === DEFAULT_CHAT_SETTINGS_DATA.value.platform)
			if (PLATFORM_ITEM) {
				platform.value.selected = PLATFORM_ITEM
			} else {
				// 如果未找到平台选项, 使用默认值
				platform.value.selected = platform.value.list[0]
				Logger.warn(`[${name}] 未找到对应的平台选项: ${DEFAULT_CHAT_SETTINGS_DATA.value.platform}`)
			}
			// 获取 Key 数据
			const KEY_DATA = await Dexie.apiKeys.get(DEFAULT_CHAT_SETTINGS_DATA.value.key)
			if (KEY_DATA) {
				keyPools.value.selected = {key: KEY_DATA.key, title: KEY_DATA.remark || KEY_DATA.key}
			} else {
				keyPools.value.selected = null
				Logger.warn(`[${name}] 未找到对应的 Key 数据: ${DEFAULT_CHAT_SETTINGS_DATA.value.key}`)
			}
			// 设置模型选项
			if (keyPools.value.selected && DEFAULT_CHAT_SETTINGS_DATA.value.model) {
				model.value.selected = {title: DEFAULT_CHAT_SETTINGS_DATA.value.model}
			} else {
				model.value.selected = null
			}
			saved.value = true
		} else {
			platform.value.selected = platform.value.list[0]
			keyPools.value.selected = null
			model.value.selected = null
			saved.value = false
		}
	} catch (error) {
		Logger.error(`[${name}] 默认设置获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.DefaultChatSettings.toast.getDefaultSettingsError")}`)
	}
}

/**
 * 保存设置
 */
const saveDefaultChatSettings = async () => {
	try {
		if (!platform.value.selected?.title) return
		if (!keyPools.value.selected?.key) return
		if (!model.value.selected?.title) return
		await Dexie.configs.put({
			item: "DefaultChatSettings",
			value: {
				platform: platform.value.selected.title,
				key: keyPools.value.selected.key,
				model: model.value.selected.title
			}
		})
		toastRegistry.success(`[${name}] ${t("components.Options.DefaultChatSettings.toast.saveSettingsSuccess")}`)
	} catch (error) {
		Logger.error(`[${name}] 保存设置失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.DefaultChatSettings.toast.saveSettingsError")}`)
	}
}

/**
 * 监听平台选择变化
 */
watch(() => platform.value.selected, (newVal) => {
	if (!newVal) return
	selectPlatform(newVal)
})

/**
 * 监听Key选择变化
 */
watch(() => keyPools.value.selected, (newVal) => {
	if (!newVal) return
	selectKey(newVal)
})

onMounted(async () => {
	EventBus.on("[update] keyPoolUpdate", loadKeyPools)
	// 初始化平台列表
	await loadPlatform()
	// 获取设置
	await restoreSettings()
	// 初始化Key池
	await loadKeyPools(true)
})

onUnmounted(() => {
	EventBus.off("[update] keyPoolUpdate", loadKeyPools)
	cancelAllRequests()
})
</script>

<template>
	<div class="default-chat-settings">
		<!-- 平台选择 -->
		<Selector
			:selectorList="platform.list"
			:selectorSelected="platform.selected || {}"
			uniqueKey="title"
			@update:selectorSelected="updateSelectedPlatformList"/>
		<!-- Key选择 -->
		<Selector
			:selectorList="keyPools.list"
			:selectorSelected="keyPools.selected || {}"
			:loading="loading.keys"
			uniqueKey="key"
			@update:selectorSelected="updateSelectedKey"/>
		<!-- 模型选择 -->
		<Selector
			:selectorList="model.list"
			:selectorSelected="model.selected || {}"
			:loading="loading.models"
			uniqueKey="title"
			@update:selectorSelected="updateSelectedModel"/>
		<!-- 保存按钮 -->
		<Button v-if="save" @click="saveDefaultChatSettings">
			{{ t("components.Options.DefaultChatSettings.saveSettings") }}
		</Button>
	</div>
</template>

<style scoped lang="less">
.default-chat-settings {
	width: 100%;
	display: flex;
	align-items: center;
	gap: 10px;
}
</style>