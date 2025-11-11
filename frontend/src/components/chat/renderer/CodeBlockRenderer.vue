<script setup>
import {onMounted, ref, watch} from "vue"
import highlight from "highlight.js"
import "@/assets/styles/highlight.css"
import "@/services/highlight/highlight-mermaid"
import "@/services/highlight/highlight-flowchart"
import "@/services/highlight/highlight-plantuml"
import Button from "@/components/input/Button.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import Logger from "@/services/Logger"

const name = "CodeBlockRenderer"

const props = defineProps({
	/**
	 * 代码块内容
	 */
	code: {
		type: String,
		required: true
	},
	/**
	 * 代码块语言
	 */
	language: {
		type: String,
		default: "plaintext"
	},
	/**
	 * 是否显示复制按钮
	 */
	copy: {
		type: Boolean,
		default: true
	}
})

/**
 * 高亮后的代码
 */
const highlightedCode = ref("")

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
 * 复制按钮文本
 */
const copyButtonText = ref(t("components.CodeBlockRenderer.copy"))

/**
 * 高亮代码
 */
const highlightCode = () => {
	try {
		const {value} = highlight.highlight(props.code, {language: props.language})
		highlightedCode.value = value
	} catch (error) {
		highlightedCode.value = highlight.highlightAuto(props.code).value
		Logger.warn(`[${name}] 语言 ${props.language} 不受支持, 已自动高亮`, error)
	}
}

/**
 * 复制代码
 */
const copyCode = () => {
	navigator.clipboard.writeText(props.code).then(() => {
		copyButtonText.value = t("components.CodeBlockRenderer.copied")
		setTimeout(() => {
			copyButtonText.value = t("components.CodeBlockRenderer.copy")
		}, 1500)
	}).catch((error) => {
		copyButtonText.value = t("components.CodeBlockRenderer.failed")
		Logger.error(`[${name}] 复制失败`, error)
		setTimeout(() => {
			copyButtonText.value = t("components.CodeBlockRenderer.copy")
		}, 1500)
	})
}

/**
 * 语言标题
 * @param language
 * @returns {`${*} ${string|string}`}
 */
const languageTitle = (language) => {
	const LANGUAGE_MAP = {
		html: "HTML",
		htm: "HTML",
		xml: "XML",
		css: "CSS",
		less: "LESS",
		scss: "SCSS",
		sass: "SASS",
		javascript: "JavaScript",
		js: "JavaScript",
		typescript: "TypeScript",
		ts: "TypeScript",
		json: "JSON",
		c: "C",
		cpp: "C++",
		csharp: "C#",
		cs: "C#",
		java: "Java",
		python: "Python",
		py: "Python",
		gyp: "Python",
		ipython: "Python",
		php: "PHP",
		ruby: "Ruby",
		rb: "Ruby",
		gamspec: "Ruby",
		podspec: "Ruby",
		thor: "Ruby",
		irdl: "Ruby",
		golang: "Go",
		go: "Go",
		asp: "ASP",
		actionscript: "ActionScript",
		flash: "Flash",
		flex: "Flex",
		bash: "Bash",
		d: "D",
		r: "R",
		lua: "Lua",
		md: "Markdown",
		markdown: "Markdown",
		mkdown: "Markdown",
		mkd: "Markdown",
		mm: "Objective-C",
		objc: "Objective-C",
		"obj-c": "Objective-C",
		objectivec: "Objective-C",
		"objective-c": "Objective-C",
		perl: "Perl",
		pl: "Perl",
		pm: "Perl",
		swift: "Swift",
		kotlin: "Kotlin",
		kt: "Kotlin",
		ktm: "Kotlin",
		ktx: "Kotlin",
		sql: "SQL",
		psql: "SQL",
		plsql: "SQL",
		ora: "SQL",
		oraql: "SQL",
		plsq: "SQL",
		pls: "SQL",
		sh: "Shell",
		shell: "Shell",
		session: "Shell",
		shellsession: "Shell",
		console: "Shell",
		vb: "VBScript",
		vbs: "VBScript",
		yaml: "YAML",
		yml: "YAML",
		ini: "INI"
	}
	const LOWER_LANG = language.toLowerCase()
	const FRIENDLY_NAME = LANGUAGE_MAP[LOWER_LANG] || language
	const IS_SUPPORTED = highlight.listLanguages().includes(FRIENDLY_NAME.toLowerCase())
	return `${FRIENDLY_NAME} ${IS_SUPPORTED ? "" : `[${t("components.CodeBlockRenderer.notSupported")}]`}`
}

/**
 * 监听代码变化, 高亮代码
 */
watch(() => props.code, () => {
	highlightCode()
})

onMounted(() => {
	highlightCode()
})
</script>

<template>
	<div class="code-block-wrapper">
		<div class="controls" v-if="copy">
			<div class="ball">
				<div class="red"></div>
				<div class="yellow"></div>
				<div class="green"></div>
			</div>
			<span>{{ languageTitle(language) }}</span>
			<div></div>
			<Button class="code-copy-btn" @click="copyCode">{{ copyButtonText }}</Button>
		</div>
		<pre class="hljs"><code v-html="highlightedCode"/></pre>
	</div>
</template>


<style scoped lang="less">
.code-block-wrapper {
	position: relative;
	border-radius: 8px;
	overflow: hidden;
	z-index: 0;

	&:hover {
		.controls .code-copy-btn {
			opacity: 1;
		}
	}

	.controls {
		position: absolute;
		top: 10px;
		padding: 0 16px;
		box-sizing: border-box;
		width: 100%;
		display: grid;
		grid-template-columns: auto auto 1fr auto;
		gap: 5px;
		align-items: center;
		user-select: none;
		z-index: 1;

		.ball {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 5px;

			div {
				width: 12px;
				height: 12px;
				border-radius: 50%;
			}

			.red {
				background-color: #ff605c;
			}

			.yellow {
				background-color: #ffbd2e;
			}

			.green {
				background-color: #27c93f;
			}
		}

		span {
			color: #999;
			white-space: nowrap;
			font-size: 16px;
			font-weight: 700;
		}

		.code-copy-btn {
			padding: 5px 10px;
			width: 100px;
			opacity: 0;
		}
	}

	pre {
		position: relative;
		max-height: 500px;
		margin: 0;
		border-radius: 6px;
		overflow: hidden;

		code {
			padding: 30px 20px 30px 20px;
			box-sizing: border-box;
			display: block;
			overflow: auto;
			max-height: 500px;
		}
	}
}
</style>