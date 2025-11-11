<script setup>
import {onMounted, ref} from "vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Button from "@/components/input/Button.vue"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "SystemPrompt"

const systemPrompt = ref(null)

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
 * 读取系统提示
 */
const loadSystemPrompt = async () => {
	try {
		const SYSTEM_PROMPT = await Dexie.configs.get("systemPrompt")
		if (SYSTEM_PROMPT) {
			systemPrompt.value = SYSTEM_PROMPT.value
		}
	} catch (error) {
		Logger.error(`[${name}] 获取系统提示失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.SystemPrompt.toast.getError")}`)
	}
}

/**
 * 保存系统提示
 */
const saveSystemPrompt = async () => {
	try {
		await Dexie.configs.put({
			item: "systemPrompt",
			value: systemPrompt.value
		})
		toastRegistry.success(`[${name}] ${t("components.Options.SystemPrompt.toast.saveSuccess")}`)
	} catch (error) {
		Logger.error(`[${name}] 保存系统提示失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.SystemPrompt.toast.saveError")}`)
	}
}

/**
 * 重置系统提示
 */
const reset = (type = "default") => {
	systemPrompt.value = "当前聊天应用支持以下功能:\n" +
		"- 渲染 Markdown, 你的所有回答都应该使用 Markdown 格式.\n" +
		"- 支持 highlight.js 代码高亮(使用 ``` 代码块).\n" +
		"- 支持 KaTeX 数学公式(内嵌使用`$`符号, 块级使用`$$`符号).\n" +
		"- 支持 MathJax 数学公式(内嵌使用`$`符号, 块级使用`$$`符号).\n" +
		"- 支持 markdownItTaskLists 任务列表(使用 `- [ ]` 格式).\n" +
		"- 支持 markdownItEmoji 表情(使用 `:emoji:` 格式).\n" +
		"- 支持 Mermaid 流程图(使用 ```mermaid 代码块).\n" +
		"- 支持 Flowchart 流程图(使用 ```flowchart 或者 ```flow 代码块).\n" +
		"- 支持 PlantUML 流程图(使用 ```plantuml 代码块).\n" +
		"- 支持 lazyload 图片懒加载(使用 `![图片描述](图片地址)` 格式).\n" +
		"以下是一些使用注意事项:\n" +
		"- 所有输出应严格符合 Markdown 语法, 不使用 HTML 标签.\n" +
		"- 所有流程图应优先使用 Mermaid, 其次为 PlantUML.\n" +
		"- 所有流程图不可内嵌数学公式.\n" +
		"无需确认用户是否支持这些功能. 用户可以修改本提示词以调整行为, 修改后的提示依然需要符合 Markdown 渲染规则. 请保持你平时的回复风格, 上面的提示词只是告诉你你支持的功能, 你默默接受就可以了."
	if (type !== "default") {
		saveSystemPrompt()
	}
}

onMounted(() => {
	reset()
	loadSystemPrompt()
})
</script>

<template>
	<div class="system-prompt">
		<textarea
			:placeholder="t('components.Options.SystemPrompt.placeholder')"
			ref="textareaRef"
			spellcheck="false"
			v-model="systemPrompt"></textarea>
		<div class="but">
			<Button @click="saveSystemPrompt">{{ t("components.Options.SystemPrompt.save") }}</Button>
			<Button @click="reset('reset')">{{ t("components.Options.SystemPrompt.reset") }}</Button>
		</div>
	</div>
</template>

<style scoped lang="less">
.system-prompt {
	width: 100%;
	display: flex;
	gap: 10px;
}

textarea {
	padding: 10px 44px 10px 10px;
	box-sizing: border-box;
	width: 100%;
	height: 300px;
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

.but {
	display: flex;
	flex-direction: column;
	gap: 10px;
}
</style>