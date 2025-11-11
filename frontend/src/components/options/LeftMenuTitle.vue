<script setup>
import {ref, watch, onMounted} from "vue"
import InputText from "@/components/input/InputText.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {publicRegistry} from "@/services/plugin/api/PublicClass"
import EventBus from "@/services/EventBus"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "LeftMenuTitle"

/**
 * 左侧菜单标题配置
 */
const leftMenuTitle = ref({
	enabled: false,
	title: "ElakeAI"
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
 * 读取配置
 */
const read = async () => {
	try {
		const LEFT_MENU_TITLE_DATA = await Dexie.configs.get("leftMenuTitle")
		leftMenuTitle.value = LEFT_MENU_TITLE_DATA ? LEFT_MENU_TITLE_DATA.value : leftMenuTitle.value
	} catch (error) {
		Logger.error(`[${name}] 左侧菜单标题配置获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.LeftMenuTitle.toast.getLeftMenuTitleError")}`)
	}
}

/**
 * 应用配置
 */
const apply = publicRegistry.debounce(async () => {
	try {
		await Dexie.configs.put({
			item: "leftMenuTitle",
			value: JSON.parse(JSON.stringify(leftMenuTitle.value))
		})
		EventBus.emit("[update] leftMenuTitleApply")
	} catch (error) {
		Logger.error(`[${name}] 左侧菜单标题配置应用失败`, {
			leftMenuTitle: leftMenuTitle.value,
			error
		})
		toastRegistry.error(`[${name}] ${t("components.Options.LeftMenuTitle.toast.applyLeftMenuTitleError")}`)
	}
}, 500)

/**
 * 处理复选框变化
 */
const handleCheckboxChange = () => {
	apply()
}

/**
 * 监听标题变化
 */
watch(() => leftMenuTitle.value.title, () => {
	apply()
})

onMounted(() => {
	read()
})
</script>

<template>
	<div class="left-menu-title">
		<label class="switch">
			<input type="checkbox" v-model="leftMenuTitle.enabled" @change="handleCheckboxChange"/>
			<span class="custom-checkbox"></span>
		</label>
		<InputText class="text" v-model="leftMenuTitle.title" :disabled="!leftMenuTitle.enabled"/>
	</div>
</template>

<style scoped lang="less">
.left-menu-title {
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