<script>
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import CustomTheme from "@/services/CustomTheme"
import {ColorPicker} from "vue3-colorpicker"
import "vue3-colorpicker/style.css"

export default {
	name: "CustomThemeView",
	components: {ColorPicker},
	inject: ["$DB", "$log"],
	data() {
		return {
			theme: {
				"--theme-color": "#80ceff",
				"--scrollbar-track-color": "rgba(255, 255, 255, 0.5)",
				"--scrollbar-thumb-color": "rgba(193, 193, 193, 0.6)",
				"--scrollbar-thumb-hover-color": "rgba(168, 168, 168, 0.78)",
				"--background-color": "#ffffff",
				"--background-color-anti": "#292A2D",
				"--text-color": "#434344",
				"--text-color-anti": "#E4E4E7",
				"--border-color": "#6C787F",
				"--box-shadow-color": "rgba(0, 0, 0, 0.2)",
				"--box-shadow-color-anti": "rgba(255, 255, 255, 0.2)",
				"--disabled-background-color": "#dedede",
				"--disabled-text-color": "#000000",
				"--button-hover-background-color": "#dadada",
				"--button-active-background-color": "#c3c3c3",
				"--sidebar-expand-container-background-color": "rgba(249, 251, 255, 0.5)",
				"--sidebar-expand-container-info-text-color": "#5b5b5b",
				"--sidebar-expand-container-info-text-color-anti": "#a9abad",
				"--sidebar-item-hover-background-color": "#dadada",
				"--chat-input-button-border-color": "#d3d3d3",
				"--chat-input-attachment-button-text-color": "#d3d3d3",
				"--chat-system-background-color": "rgba(227, 205, 205, 0.7)",
				"--chat-system-text-color": "#464646",
				"--chat-user-background-color": "rgba(227, 242, 253, 0.7)",
				"--chat-user-text-color": "#464646",
				"--chat-assistant-background-color": "rgba(245, 245, 245, 0.7)",
				"--chat-assistant-text-color": "#464646",
				"--chat-dialogue-time-text-color": "#868788",
				"--chat-disclaimer-text-color": "#868788",
				"--blockquote-text-color": "#57606a",
				"--blockquote-border-color": "#d0d7de",
				"--blockquote-bg-color": "rgba(175, 184, 193, 0.1)",
				"--active-background-color": "rgba(189, 229, 255, 0.5)",
				"--active-background-color-anti": "rgba(107, 130, 145, 0.5)",
				"--loading-mask-background-color": "rgba(255, 255, 255, 0.6)",
				"--loading-spinner-border-color": "rgba(255, 255, 255, 0.1)",
				"--right-click-menu-background-color": "#F9FBFF",
				"--right-click-menu-background-color-anti": "#212327"
			}
		}
	},
	watch: {
		theme: {
			handler() {
				this.applyCustomTheme()
			},
			deep: true
		}
	},
	created() {
		this.initCustomTheme()
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
		 * 初始化自定义主题
		 */
		async initCustomTheme() {
			try {
				// 加载自定义主题
				const CUSTOM_THEME = await this.$DB.configs.get("customTheme")
				if (CUSTOM_THEME) {
					this.theme = CUSTOM_THEME.value
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 自定义主题初始化失败`, error)
			}
		},
		/**
		 * 应用自定义主题
		 */
		async applyCustomTheme() {
			// 保存设置
			try {
				await this.$DB.configs.put({
					item: "customTheme",
					value: JSON.parse(JSON.stringify(this.theme))
				})
			} catch (error) {
				this.$log.error(`[${this.name}] 自定义主题应用失败`, error)
			}
			// 应用自定义主题
			await CustomTheme.applyCustomTheme(this.theme)
		}
	}
}
</script>

<template>
	<div class="custom-theme">
		<h1>{{ t("views.OptionsView.CustomThemeView.customTheme") }}</h1>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.themeColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--theme-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.scrollbarTrackColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--scrollbar-track-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.scrollbarThumbColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--scrollbar-thumb-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.scrollbarThumbHoverColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--scrollbar-thumb-hover-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.backgroundColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--background-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.backgroundColorAnti") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--background-color-anti']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.textColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--text-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.textColorAnti") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--text-color-anti']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.borderColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--border-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.boxShadowColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--box-shadow-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.boxShadowColorAnti") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--box-shadow-color-anti']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.disabledBackgroundColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--disabled-background-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.disabledTextColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--disabled-text-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.buttonHoverBackgroundColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--button-hover-background-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.buttonActiveBackgroundColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--button-active-background-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.sidebarExpandContainerBackgroundColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--sidebar-expand-container-background-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.sidebarExpandContainerInfoTextColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--sidebar-expand-container-info-text-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.sidebarExpandContainerInfoTextColorAnti") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--sidebar-expand-container-info-text-color-anti']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.sidebarItemHoverBackgroundColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--sidebar-item-hover-background-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.chatInputButtonBorderColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--chat-input-button-border-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.chatInputAttachmentButtonTextColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--chat-input-attachment-button-text-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.chatSystemBackgroundColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--chat-system-background-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.chatSystemTextColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--chat-system-text-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.chatUserBackgroundColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--chat-user-background-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.chatUserTextColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--chat-user-text-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.chatAssistantBackgroundColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--chat-assistant-background-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.chatAssistantTextColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--chat-assistant-text-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.chatDialogueTimeTextColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--chat-dialogue-time-text-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.chatDisclaimerTextColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--chat-disclaimer-text-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.blockquoteTextColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--blockquote-text-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.blockquoteBorderColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--blockquote-border-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.blockquoteBgColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--blockquote-bg-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.activeBackgroundColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--active-background-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.activeBackgroundColorAnti") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--active-background-color-anti']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.loadingMaskBackgroundColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--loading-mask-background-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.loadingSpinnerBorderColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--loading-spinner-border-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.rightClickMenuBackgroundColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--right-click-menu-background-color']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.rightClickMenuBackgroundColorAnti") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--right-click-menu-background-color-anti']"
					format="rgb"
					shape="circle"
					pickerType="chrome"
					disableHistory
					blurClose/>
			</div>
		</div>
	</div>
</template>

<style scoped lang="less">
.custom-theme {
	h1 {
		margin-bottom: 20px;
	}
}

.container {
	padding: 20px;
	margin-bottom: 20px;
	border-radius: 10px;
	background-color: rgba(127, 127, 127, 0.5);
	border: 1px solid var(--border-color);
}

.item {
	padding: 10px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	border-bottom: 1px solid var(--border-color);
	border-top: 1px solid var(--border-color);
	white-space: nowrap;
}
</style>
