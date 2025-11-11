<script setup>
import {onMounted, ref, watch} from "vue"
import Selector from "@/components/input/Selector.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import CustomTheme from "@/services/CustomTheme"
import Button from "@/components/input/Button.vue"
import {ThemeRegistry} from "@/services/plugin/api/ThemeClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "ThemeSwitch"

/**
 * 主题列表
 */
const theme = ref([])

/**
 * 选中的主题
 */
const selectedTheme = ref(null)

/**
 * 翻译函数
 * @function t
 * @param {string} key - 翻译键值
 * @param {Object} params - 翻译参数
 * @returns {string} - 翻译后的字符串
 */
const t = (key, params = {}) => {
	return i18nRegistry.translate(key, params)
}

/**
 * 更新选中的主题
 * @param newVal {Object} - 选中主题
 */
const updateSelectedTheme = (newVal) => {
	selectedTheme.value = newVal
}

/**
 * 获取全部主题
 */
const loadTheme = async () => {
	theme.value = [
		{
			code: "system",
			title: "i18n:components.Options.ThemeSwitch.system",
			images: "https://openmoji.org/data/color/svg/2699.svg"
		},
		{
			code: "custom",
			title: "i18n:components.Options.ThemeSwitch.custom",
			images: "https://openmoji.org/data/color/svg/1F31F.svg"
		}
	]
	const THEMES = ThemeRegistry.getAllThemes()
	theme.value = [...theme.value, ...THEMES.map(item => ({
		code: item.code,
		title: `i18n:${item.name}`,
		images: item.icon
	}))]

	// 初始化选中主题
	try {
		const THEME_DATA = await Dexie.configs.get("theme")
		const THEME = THEME_DATA ? THEME_DATA.value : "system"
		const foundTheme = theme.value.find(lang => lang.code === THEME)
		if (foundTheme) {
			selectedTheme.value = {
				code: foundTheme.code,
				title: foundTheme.title,
				images: foundTheme.images
			}
		}
	} catch (error) {
		Logger.error(`[${name}] 主题获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.ThemeSwitch.toast.getThemeError")}`)
	}
}

/**
 * 选择主题
 * @param themeObj 主题对象
 */
const selectTheme = async (themeObj) => {
	try {
		if (!themeObj) return
		if (themeObj.code === "system") {
			const SYSTEM_THEME = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
			ThemeRegistry.setTheme(SYSTEM_THEME)
		} else if (themeObj.code === "custom") {
			await CustomTheme.applyCustomTheme()
		} else {
			ThemeRegistry.setTheme(themeObj.code)
		}
		// 保存设置
		await Dexie.configs.put({
			item: "theme",
			value: themeObj.code
		})
	} catch (error) {
		Logger.error(`[${name}] 主题应用失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.ThemeSwitch.toast.applicationThemeError")}`)
	}
}

/**
 * 监听主题变化
 */
watch(selectedTheme, (newVal) => {
	if (newVal) {
		selectTheme(newVal)
	}
})

onMounted(() => {
	loadTheme()
})
</script>

<template>
	<div class="theme-select" ref="themeSelector">
		<div class="container">
			<Selector
				:selectorSelected="selectedTheme || {}"
				:selectorList="theme"
				uniqueKey="code"
				:num="4"
				@update:selectorSelected="updateSelectedTheme"/>
			<router-link to="/options/customTheme" v-if="(selectedTheme ? selectedTheme.code : '') === 'custom'">
				<Button>{{ t("components.Options.ThemeSwitch.custom") }}</Button>
			</router-link>
		</div>
	</div>

</template>

<style scoped lang="less">
.theme-select {
	width: 240px;

	.container {
		display: flex;
		gap: 10px;
	}
}
</style>