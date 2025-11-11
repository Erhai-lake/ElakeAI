<script setup>
import {onMounted, ref, watch} from "vue"
import Selector from "@/components/input/Selector.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "LanguageSelect"

/**
 * 语言列表
 */
const languages = ref([])

/**
 * 选中的语言
 */
const selectedLang = ref(null)

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
 * 更新选中的语言
 * @param newVal {Object} - 选中语言
 */
const updateSelectedLang = (newVal) => {
	selectedLang.value = newVal
}

/**
 * 加载语言列表
 */
const loadLanguages = async () => {
	const langList = [
		{
			code: "system",
			title: "i18n:components.Options.LanguageSelect.system",
			images: "https://openmoji.org/data/color/svg/2699.svg"
		}
	]
	const I18N = i18nRegistry.getAll()
	languages.value = [...langList, ...I18N.map(item => ({
		code: item.info.code,
		title: item.info.title,
		images: item.info.image
	}))]

	// 初始化选中语言
	try {
		const LANGUAGE_DATA = await Dexie.configs.get("language")
		const LANGUAGE = LANGUAGE_DATA ? LANGUAGE_DATA.value : "system"
		const foundLang = languages.value.find(lang => lang.code === LANGUAGE)
		if (foundLang) {
			selectedLang.value = {
				code: foundLang.code,
				title: foundLang.title,
				images: foundLang.images
			}
		} else if (languages.value.length > 0) {
			selectedLang.value = languages.value[0]
		}
	} catch (error) {
		Logger.error(`[${name}] 语言获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.LanguageSelect.toast.getLanguageError")}`)
		// 设置默认值
		if (languages.value.length > 0) {
			selectedLang.value = languages.value[0]
		}
	}
}

/**
 * 选择语言
 * @param selectLang {Object} - 选中的语言
 */
const selectLanguage = async (selectLang) => {
	try {
		if (!selectLang) return
		if (selectLang.code === "system") {
			i18nRegistry.locale(navigator.language || "zh-CN")
		} else {
			i18nRegistry.locale(selectLang.code)
		}
		await Dexie.configs.put({
			item: "language",
			value: selectLang.code
		})
	} catch (error) {
		Logger.error(`[${name}] 语言应用失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.LanguageSelect.toast.applicationLanguageError")}`)
	}
}

/**
 * 监听主题变化
 */
watch(selectedLang, (newVal) => {
	if (newVal) {
		selectLanguage(newVal)
	}
})

onMounted(() => {
	loadLanguages()
})
</script>

<template>
	<div class="language-select">
		<Selector
			:selectorSelected="selectedLang || {}"
			:selectorList="languages"
			uniqueKey="code"
			@update:selectorSelected="updateSelectedLang"/>
	</div>
</template>

<style scoped lang="less">
.language-select {
	width: 240px;
}
</style>