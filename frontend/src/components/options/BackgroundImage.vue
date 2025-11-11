<script setup>
import {ref, computed, onMounted, watch} from "vue"
import InputText from "@/components/input/InputText.vue"
import InputNumber from "@/components/input/InputNumber.vue"
import Button from "@/components/input/Button.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import EventBus from "@/services/EventBus"
import {publicRegistry} from "@/services/plugin/api/PublicClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "BackgroundImage"

/**
 * 背景图片配置
 */
const backgroundImage = ref({
	enabled: false,
	url: "https://www.loliapi.com/acg",
	blob: null,
	opacity: 50,
	mask: 50
})

/**
 * 文件输入框引用
 */
const fileInput = ref(null)

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
 * 显示URL的计算属性
 */
const displayUrl = computed({
	get: () => {
		if (backgroundImage.value.blob) {
			return t("components.Options.BackgroundImage.localPlaceholder")
		}
		return backgroundImage.value.url || ""
	},
	set: (val) => {
		if (!val.startsWith(t("components.Options.BackgroundImage.localPlaceholder"))) {
			backgroundImage.value.url = val
			backgroundImage.value.blob = null
		}
	}
})

/**
 * 读取配置
 */
const read = async () => {
	try {
		const BACKGROUND_IMAGE_DATA = await Dexie.configs.get("backgroundImage")
		if (BACKGROUND_IMAGE_DATA?.value) {
			backgroundImage.value = {
				enabled: BACKGROUND_IMAGE_DATA.value.enabled,
				url: BACKGROUND_IMAGE_DATA.value.url,
				blob: null,
				opacity: BACKGROUND_IMAGE_DATA.value.opacity,
				mask: BACKGROUND_IMAGE_DATA.value.mask
			}
			if (BACKGROUND_IMAGE_DATA.value.blob) {
				backgroundImage.value.blob = new Blob([BACKGROUND_IMAGE_DATA.value.blob])
			}
		}
	} catch (error) {
		Logger.error(`[${name}] 背景图片配置获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.BackgroundImage.toast.getBackgroundImageError")}`)
	}
}

/**
 * 上传文件
 */
const upload = () => {
	fileInput.value?.click()
}

/**
 * 处理文件选择
 */
const handleFileChange = (event) => {
	const FILE = event.target.files[0]
	if (!FILE) return
	backgroundImage.value.blob = FILE
	backgroundImage.value.url = ""
	event.target.value = ""
	apply()
}

/**
 * 应用配置
 */
const apply = publicRegistry.debounce(async () => {
	try {
		let value = {
			enabled: backgroundImage.value.enabled,
			url: backgroundImage.value.url,
			blob: null,
			opacity: backgroundImage.value.opacity,
			mask: backgroundImage.value.mask
		}
		if (backgroundImage.value.blob) {
			const BUFFER = await backgroundImage.value.blob.arrayBuffer()
			value.blob = new Uint8Array(BUFFER)
		}
		await Dexie.configs.put({item: "backgroundImage", value})
		EventBus.emit("[function] configInitialization")
	} catch (error) {
		Logger.error(`[${name}] 背景图片配置应用失败`, {
			backgroundImage: backgroundImage.value,
			error
		})
		toastRegistry.error(`[${name}] ${t("components.Options.BackgroundImage.toast.applyBackgroundImageError")}`)
	}
}, 500)

/**
 * 处理复选框变化
 */
const handleCheckboxChange = () => {
	apply()
}

/**
 * 处理数字输入变化
 */
const handleNumberChange = () => {
	apply()
}

/**
 * 监听显示URL变化
 */
watch(displayUrl, () => {
	apply()
})

/**
 * 监听不透明度和遮罩变化
 */
watch(
	() => [backgroundImage.value.opacity, backgroundImage.value.mask],
	() => {
		apply()
	}
)

onMounted(() => {
	read()
})
</script>

<template>
	<div class="background-image">
		<label class="switch">
			<input type="checkbox" v-model="backgroundImage.enabled" @change="handleCheckboxChange"/>
			<span class="custom-checkbox"></span>
		</label>
		<input type="file" ref="fileInput" style="display: none;" accept="image/*" @change="handleFileChange">
		<Button @click="upload" :disabled="!backgroundImage.enabled">
			{{ t('components.Options.BackgroundImage.upload') }}
		</Button>
		<InputText
			class="text"
			:placeholder="t('components.Options.BackgroundImage.backgroundImageURL')"
			:title="t('components.Options.BackgroundImage.backgroundImageURL')"
			:disabled="!backgroundImage.enabled"
			v-model="displayUrl"
			@input="apply"/>
		<InputNumber
			class="number"
			mode="slider"
			:min="0"
			:max="100"
			:title="t('components.Options.BackgroundImage.backgroundImageOpacity')"
			:disabled="!backgroundImage.enabled"
			v-model="backgroundImage.opacity"
			@input="handleNumberChange"/>
		<InputNumber
			class="number"
			mode="slider"
			:min="0"
			:max="100"
			:title="t('components.Options.BackgroundImage.backgroundImageMask')"
			:disabled="!backgroundImage.enabled"
			v-model="backgroundImage.mask"
			@input="handleNumberChange"/>
	</div>
</template>

<style scoped lang="less">
.background-image {
	display: flex;
	gap: 10px;
}

.text {
	width: 250px;
}

.number {
	width: 200px;
}

input[type="checkbox"] {
	display: none;

	&:checked + .custom-checkbox::after {
		opacity: 1;
	}
}

.switch {
	display: flex;
	align-items: center;
	padding: 8px 0;
	cursor: pointer;

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
}
</style>