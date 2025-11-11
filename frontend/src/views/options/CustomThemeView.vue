<script setup>
import {ref, watch, onMounted} from "vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import CustomTheme from "@/services/CustomTheme"
import {ColorPicker} from "vue3-colorpicker"
import "vue3-colorpicker/style.css"
import Button from "@/components/input/Button.vue"
import Selector from "@/components/input/Selector.vue"
import {ThemeRegistry} from "@/services/plugin/api/ThemeClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "CustomThemeView"

/**
 * 自定义主题列表
 */
const themeList = ref([])

/**
 * 选中的主题
 */
const selectedTheme = ref(null)

/**
 * 自定义主题
 */
const theme = ref({})

/**
 * 自定义主题 JSON 字符串
 */
const themeJson = ref("")

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
 * 更新选中的主题
 * @param newVal {Object} - 选中主题
 */
const updateSelectedTheme = (newVal) => {
	selectedTheme.value = newVal
}

/**
 * 获取全部主题
 */
const loadTheme = () => {
	const THEMES = ThemeRegistry.getAllThemes()
	themeList.value = [...THEMES.map(item => ({
		code: item.code,
		title: `i18n:${item.name}`,
		images: item.icon
	}))]
	// 初始化选中模型
	if (themeList.value.length > 0) {
		selectedTheme.value = themeList.value[0]
	}
}

/**
 * 重置自定义主题
 */
const resetTheme = () => {
	if (!selectedTheme.value) return
	const THEMES = ThemeRegistry.getTheme(selectedTheme.value.code)
	if (THEMES && THEMES.info && THEMES.info.theme) {
		theme.value = JSON.parse(JSON.stringify(THEMES.info.theme))
	}
}

/**
 * 导出
 */
const exportTheme = () => {
	const JSON_STRING = JSON.stringify(theme.value, null, 2)
	const BLOB = new Blob([JSON_STRING], {type: "application/json"})
	const DOWNLOAD_URL = URL.createObjectURL(BLOB)
	const DOWNLOAD_A = document.createElement("a")
	DOWNLOAD_A.href = DOWNLOAD_URL
	DOWNLOAD_A.download = "custom-theme.json"
	DOWNLOAD_A.click()
	DOWNLOAD_A.remove()
	URL.revokeObjectURL(DOWNLOAD_URL)
}

/**
 * 导入
 */
const importTheme = () => {
	fileInput.value?.click()
}

/**
 * 处理文件选择
 */
const handleFileChange = (event) => {
	const FILE = event.target.files[0]
	if (!FILE) return
	const READER = new FileReader()
	READER.onload = (readerEvent) => {
		try {
			theme.value = JSON.parse(readerEvent.target.result)
			if (parsedTheme && typeof parsedTheme === "object") {
				theme.value = parsedTheme
			}
		} catch (error) {
			Logger.error(`[${name}] JSON 解析失败`, error)
			toastRegistry.error(`[${name}] ${t("views.OptionsView.CustomThemeView.toast.uploadError")}`)
		}
	}
	READER.onerror = (readerEvent) => {
		Logger.error(`[${name}] 自定义主题上传失败`, readerEvent)
		toastRegistry.error(`[${name}] ${t("views.OptionsView.CustomThemeView.toast.uploadError")}`)
	}
	READER.readAsText(FILE)
	event.target.value = ""
}

/**
 * 初始化自定义主题
 */
const initCustomTheme = async () => {
	try {
		// 加载自定义主题
		const CUSTOM_THEME = await Dexie.configs.get("customTheme")
		if (CUSTOM_THEME && CUSTOM_THEME.value) {
			theme.value = CUSTOM_THEME.value
		} else {
			resetTheme()
		}
	} catch (error) {
		Logger.error(`[${name}] 自定义主题初始化失败`, error)
		resetTheme()
	}
}

/**
 * 应用自定义主题
 */
const applyCustomTheme = async () => {
	// 保存设置
	try {
		await Dexie.configs.put({
			item: "customTheme",
			value: JSON.parse(JSON.stringify(theme.value))
		})
		// 判断是否是自定义主题
		const THEME = await Dexie.configs.get("theme")
		if (THEME && THEME.value === "custom") {
			// 应用自定义主题
			await CustomTheme.applyCustomTheme(theme.value)
		}
	} catch (error) {
		Logger.error(`[${name}] 自定义主题应用失败`, error)
	}
}

/**
 * 监听自定义主题变化
 */
watch(theme, (newVal) => {
	if (!newVal) return
	themeJson.value = JSON.stringify(newVal, null, 2)
	applyCustomTheme()
}, {deep: true})

/**
 * 监听自定义主题 JSON 变化
 */
watch(themeJson, (newVal) => {
	if (!newVal) return
	try {
		theme.value = JSON.parse(newVal)
	} catch (error) {
		Logger.error(`[${name}] JSON 解析失败`, error)
	}
})

onMounted(() => {
	// 初始化主题列表
	loadTheme()
	resetTheme()
	initCustomTheme()
})
</script>

<template>
	<div class="custom-theme">
		<h1>{{ t("views.OptionsView.CustomThemeView.customTheme") }}</h1>
		<div class="container">
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.template") }}
				<div class="template">
					<Selector
						class="selector"
						:selectorSelected="selectedTheme || {}"
						:selectorList="themeList"
						uniqueKey="code"
						:num="4"
						@update:selectorSelected="updateSelectedTheme"/>
					<Button @click="resetTheme">{{ t("views.OptionsView.CustomThemeView.reset") }}</Button>
					<Button @click="exportTheme">{{ t("views.OptionsView.CustomThemeView.export") }}</Button>
					<input type="file" ref="fileInput" style="display: none;" accept=".json" @change="handleFileChange">
					<Button @click="importTheme">{{ t("views.OptionsView.CustomThemeView.import") }}</Button>
				</div>
			</div>
		</div>
		<div class="container">
			<textarea v-model="themeJson"></textarea>
		</div>
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
			<div class="item">
				{{ t("views.OptionsView.CustomThemeView.textSecondaryColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--text-secondary-color']"
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
				{{ t("views.OptionsView.CustomThemeView.chatInputAttachmentButtonBackgroundColor") }}
				<ColorPicker
					class="color-picker"
					v-model:pureColor="theme['--chat-input-attachment-button-background-color']"
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

	.template {
		display: grid;
		grid-template-columns: 200px auto auto auto;
		gap: 10px;
	}

	textarea {
		padding: 10px;
		box-sizing: border-box;
		width: 100%;
		height: 600px;
		background-color: var(--box-shadow-color-anti);
		border: 1px solid var(--border-color);
		color: var(--text-color);
		font-size: 16px;
		letter-spacing: 3px;
		border-radius: 10px;
		resize: none;

		&:focus {
			outline: none;
		}
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
