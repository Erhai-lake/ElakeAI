<script>
import Selector from "@/components/Selector.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"

export default {
	name: "LanguageSelect",
	components: {Selector},
	inject: ["$DB"],
	data() {
		return {
			name: "LanguageSelect",
			languages: null,
			selectedLang: null
		}
	},
	watch: {
		// 监听语言变化
		selectedLang(newVal) {
			this.selectLanguage(newVal)
		}
	},
	async created() {
		// 初始化语言列表
		this.loadLanguages()
		// 获取语言
		try {
			const LANGUAGE_DATA = await this.$DB.configs.get("language")
			const LANGUAGE = LANGUAGE_DATA ? LANGUAGE_DATA.value : "System"
			this.selectedLang = {
				code: LANGUAGE,
				title: this.languages.find(lang => lang.code === LANGUAGE).title,
				images: this.languages.find(lang => lang.code === LANGUAGE).images
			}
		} catch (error) {
			this.$log.error(`[${this.name}] 语言获取失败`, error)
			this.$toast.error(`[${this.name}] ${this.$t("components.LanguageSelect.toast.getLanguageError")}`)
		}
	},
	methods: {
		/**
		 * 更新选中的语言
		 * @param newVal {Object} - 新的选中语言
		 */
		updateSelectedLang(newVal) {
			this.selectedLang = newVal
		},
		/**
		 * 加载语言列表
		 */
		loadLanguages() {
			const I18N = i18nRegistry.getAll()
			this.languages = I18N.reduce((acc, item) => {
				try {
					acc.push({
						code: item.info.name,
						title: item.info.name,
						images: item.info.logo
					})
				} catch (error) {
					this.$log.error(`[${this.name}] 加载语言 ${item.info.name} 失败`, error)
				}
				return acc
			}, [])
			// 初始化选中模型
			if (this.languages.length > 0) {
				this.selectedLang = this.languages[0]
			}
		},
		/**
		 * 选择语言
		 * @param selectLang {Object} - 选中的语言
		 */
		async selectLanguage(selectLang) {
			try {
				if (!selectLang) return
				if (selectLang.code === "System") {
					this.$i18n.locale = navigator.language || "zh-CN"
				} else {
					this.$i18n.locale = selectLang.code
				}
				if (await this.$DB.configs.get("language")) {
					await this.$DB.configs.put({
						item: "language",
						value: selectLang.code
					})
				} else {
					await this.$DB.configs.add({
						item: "language",
						value: selectLang.code
					})
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 语言应用失败`, error)
				this.$toast.error(`[${this.name}] ${this.$t("components.LanguageSelect.toast.applicationLanguageError")}`)
			}
		}
	}
}
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