import Dexie from "@/services/Dexie"

export async function InitConfigs() {
	try {
		async function ensureConfig(item, value) {
			const EXIST = await Dexie.configs.get(item)
			if (!EXIST) {
				await Dexie.configs.add({ item, value })
			}
		}
		// 主题
		await ensureConfig("theme", "system")
		// 语言
		await ensureConfig("language", "system")
		// 聊天配置
		await ensureConfig("chatConfigs", {
			temperature: 1,
			frequency_penalty: 0,
			top_p: 1,
			max_tokens: 2048,
			presence_penalty: 0
		})
		// 系统提示词
		await ensureConfig("systemPrompt",
			"当前聊天应用支持以下功能:\n" +
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
		)
		// 聊天批大小
		await ensureConfig("chatBatchSize", 20)
	} catch (error) {
		console.error("初始化配置错误:", error)
	}
}
