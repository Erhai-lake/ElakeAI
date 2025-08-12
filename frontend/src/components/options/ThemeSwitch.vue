<script>
import {defineComponent} from "vue"
import Selector from "@/components/Selector.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"

export default defineComponent({
	name: "ThemeSelect",
	components: {Selector},
	inject: ["$DB", "$log"],
	data() {
		return {
			theme: [
				{
					code: "System",
					title: "i18n:components.ThemeSwitch.system",
					images: ""
				},
				{
					code: "Light",
					title: "i18n:components.ThemeSwitch.light",
					images: ""
				},
				{
					code: "Dark",
					title: "i18n:components.ThemeSwitch.dark",
					images: ""
				}
			],
			selectedTheme: null,
		}
	},
	watch: {
		// 监听主题变化
		selectedTheme(newVal) {
			this.selectTheme(newVal)
		}
	},
	async created() {
		// 获取主题
		try {
			const THEME_DATA = await this.$DB.configs.get("theme")
			const THEME = THEME_DATA ? THEME_DATA.value : "System"
			this.selectedTheme = {
				code: THEME,
				title: this.theme.find(lang => lang.code === THEME).title,
				images: this.theme.find(lang => lang.code === THEME).images
			}
		} catch (error) {
			this.$log.error(`[${this.name}] 主题获取失败`, error)
			toastRegistry.error(`[${this.name}] ${this.t("components.ThemeSwitch.toast.getThemeError")}`)
		}
	},
	methods: {
		/**
		 * 翻译
		 * @param key {String} - 键
		 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
		 * @returns {String} - 翻译后的文本
		 */
		t(key, params = {}) {
			return i18nRegistry.translate(key, params)
		},
		/**
		 * 更新选中的主题
		 * @param newVal {Object} - 选中主题
		 */
		updateSelectedTheme(newVal) {
			this.selectedTheme = newVal
		},
		/**
		 * 选择主题
		 * @param theme 主题名称
		 */
		async selectTheme(theme) {
			try {
				if (!theme) return
				const THEME_CODE = theme.code === "System"
					? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light")
					: theme.code
				document.documentElement.setAttribute("data-theme", THEME_CODE)
				void document.body.offsetWidth
				// 保存设置
				await this.$DB.configs.put({
					item: "theme",
					value: theme.code
				})
			} catch (error) {
				this.$log.error(`[${this.name}] 主题应用失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.ThemeSwitch.toast.applicationThemeError")}`)
			}
		}
	}
})
</script>

<template>
	<div class="theme-select" ref="themeSelector">
		<Selector
			:selectorSelected="selectedTheme || {}"
			:selectorList="theme"
			uniqueKey="code"
			@update:selectorSelected="updateSelectedTheme"/>
	</div>

</template>

<style lang="less">
.theme-transition-effect {
	position: fixed;
	width: 1px;
	height: 1px;
	background: var(--background-color-anti);
	border-radius: 50%;
	transform: translate(-50%, -50%) scale(0);
	z-index: 9999;
	pointer-events: none;
	opacity: 1;
	transition: transform 0.6s ease-out, opacity 0.3s ease-out;
}

.theme-transition-effect.expand {
	opacity: 0;
}
</style>

<style scoped lang="less">
.theme-select {
	width: 240px;
}
</style>