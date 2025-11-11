<script setup>
import {ref, computed, onMounted, watch} from "vue"
import InputText from "@/components/input/InputText.vue"
import Button from "@/components/input/Button.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import EventBus from "@/services/EventBus"
import {publicRegistry} from "@/services/plugin/api/PublicClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "LogoImage"

/**
 * logo图片配置
 */
const logoImage = ref({
	enabled: false,
	url: "",
	blob: null
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
		if (logoImage.value.blob) {
			return t("components.Options.LogoImage.localPlaceholder")
		}
		return logoImage.value.url || ""
	},
	set: (val) => {
		if (!val.startsWith(t("components.Options.LogoImage.localPlaceholder"))) {
			logoImage.value.url = val
			logoImage.value.blob = null
		}
	}
})

/**
 * 读取配置
 */
const read = async () => {
	try {
		const LOGO_IMAGE_DATA = await Dexie.configs.get("logoImage")
		if (LOGO_IMAGE_DATA?.value) {
			logoImage.value = {
				enabled: LOGO_IMAGE_DATA.value.enabled,
				url: LOGO_IMAGE_DATA.value.url,
				blob: null
			}
			if (LOGO_IMAGE_DATA.value.blob) {
				logoImage.value.blob = new Blob([LOGO_IMAGE_DATA.value.blob])
			}
		}
	} catch (error) {
		Logger.error(`[${name}] logo图片配置获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.LogoImage.toast.getLogoImageError")}`)
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
	logoImage.value.blob = FILE
	logoImage.value.url = ""
	event.target.value = ""
	apply()
}

/**
 * 应用配置
 */
const apply = publicRegistry.debounce(async () => {
	try {
		let value = {
			enabled: logoImage.value.enabled,
			url: logoImage.value.url,
			blob: null
		}
		if (logoImage.value.blob) {
			const BUFFER = await logoImage.value.blob.arrayBuffer()
			value.blob = new Uint8Array(BUFFER)
		}
		await Dexie.configs.put({item: "logoImage", value})
		EventBus.emit("[update] logoImageApply")
	} catch (error) {
		Logger.error(`[${name}] logo图片配置应用失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.LogoImage.toast.applyLogoImageError")}`)
	}
}, 500)

/**
 * 处理复选框变化
 */
const handleCheckboxChange = () => {
	apply()
}

/**
 * 监听显示URL变化
 */
watch(displayUrl, () => {
	apply()
})

onMounted(() => {
	read()
})
</script>

<template>
	<div class="logo-image">
		<label class="switch">
			<input type="checkbox" v-model="logoImage.enabled" @change="handleCheckboxChange"/>
			<span class="custom-checkbox"></span>
		</label>
		<input type="file" ref="fileInput" style="display: none;" accept="image/*" @change="handleFileChange">
		<Button @click="upload" :disabled="!logoImage.enabled">
			{{ t('components.Options.LogoImage.upload') }}
		</Button>
		<InputText
			class="text"
			:placeholder="t('components.Options.LogoImage.logoImageURL')"
			:title="t('components.Options.LogoImage.logoImageURL')"
			:disabled="!logoImage.enabled"
			v-model="displayUrl"
			@input="apply"/>
	</div>
</template>

<style scoped lang="less">
.logo-image {
	display: flex;
	gap: 10px;
}

.text {
	width: 250px;
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