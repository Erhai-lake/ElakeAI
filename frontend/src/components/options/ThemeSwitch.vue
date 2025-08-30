<script>
import {defineComponent} from "vue"
import Selector from "@/components/input/Selector.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import CustomTheme from "@/services/CustomTheme"
import Button from "@/components/input/Button.vue"
import {ThemeRegistry} from "@/services/plugin/api/ThemeClass"

export default defineComponent({
	name: "ThemeSelect",
	components: {Button, Selector},
	inject: ["$DB", "$log"],
	data() {
		return {
			theme: [],
			selectedTheme: null,
		}
	},
	watch: {
		// 监听主题变化
		selectedTheme(newVal) {
			this.selectTheme(newVal)
		}
	},
	created() {
		// 初始化主题列表
		this.loadTheme()
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
		 * 获取全部主题
		 */
		async loadTheme() {
			this.theme = [
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
			this.theme = [...this.theme, ...THEMES.map(item => ({
				code: item.code,
				title: `i18n:${item.name}`,
				images: item.icon
			}))]
			// 初始化选中模型
			try {
				const THEME_DATA = await this.$DB.configs.get("theme")
				const THEME = THEME_DATA ? THEME_DATA.value : "system"
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
		/**
		 * 选择主题
		 * @param theme 主题名称
		 */
		async selectTheme(theme) {
			try {
				if (!theme) return
				if (theme.code === "system") {
					const SYSTEM_THEME = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
					ThemeRegistry.setTheme(SYSTEM_THEME)
				} else if (theme.code === "custom") {
					await CustomTheme.applyCustomTheme()
				} else {
					ThemeRegistry.setTheme(theme.code)
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