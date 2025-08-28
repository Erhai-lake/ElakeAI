<script>
import {defineComponent} from "vue"
import Selector from "@/components/input/Selector.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import CustomTheme from "@/services/CustomTheme"
import Button from "@/components/input/Button.vue"

export default defineComponent({
	name: "ThemeSelect",
	components: {Button, Selector},
	inject: ["$DB", "$log"],
	data() {
		return {
			theme: [
				{
					code: "System",
					title: "i18n:components.Options.ThemeSwitch.system",
					images: "https://openmoji.org/data/color/svg/2699.svg"
				},
				{
					code: "Light",
					title: "i18n:components.Options.ThemeSwitch.light",
					images: "https://openmoji.org/data/color/svg/1F31E.svg"
				},
				{
					code: "Dark",
					title: "i18n:components.Options.ThemeSwitch.dark",
					images: "https://openmoji.org/data/color/svg/1F319.svg"
				},
				{
					code: "Custom",
					title: "i18n:components.Options.ThemeSwitch.custom",
					images: "https://openmoji.org/data/color/svg/1F31F.svg"
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
			toastRegistry.error(`[${this.name}] ${this.t("components.Options.ThemeSwitch.toast.getThemeError")}`)
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
				document.documentElement.setAttribute("data-theme", theme.code)
				if (theme.code === "System") {
					const SYSTEM_THEME = window.matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light"
					document.documentElement.setAttribute("data-theme", SYSTEM_THEME)
				} else if (theme.code === "Custom") {
					await CustomTheme.applyCustomTheme()
				}
				// 保存设置
				await this.$DB.configs.put({
					item: "theme",
					value: theme.code
				})
			} catch (error) {
				this.$log.error(`[${this.name}] 主题应用失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.Options.ThemeSwitch.toast.applicationThemeError")}`)
			}
		}
	}
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
			<router-link to="/options/customTheme" v-if="(selectedTheme ? selectedTheme.code : '') === 'Custom'">
				<Button>{{t("components.Options.ThemeSwitch.custom")}}</Button>
			</router-link>
		</div>
	</div>

</template>

<style scoped lang="less">
.theme-select {
	width: 240px;

	.container{
		display: flex;
		gap: 10px;
	}
}
</style>