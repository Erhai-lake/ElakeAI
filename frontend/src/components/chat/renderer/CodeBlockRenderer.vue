<script>
import highlight from "highlight.js"
import "@/assets/styles/highlight.css"
import "@/services/highlight/highlight-mermaid"
import "@/services/highlight/highlight-flowchart"
import "@/services/highlight/highlight-plantuml"
import Button from "@/components/Button.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"

export default {
	name: "CodeBlockRenderer",
	inject: ["$log"],
	components: {Button},
	props: {
		code: {
			type: String,
			required: true
		},
		language: {
			type: String,
			default: "plaintext"
		}
	},
	data() {
		return {
			name: "CodeBlockRenderer",
			highlightedCode: "",
			copyButtonText: this.t("components.CodeBlockRenderer.copy")
		}
	},
	watch: {
		code() {
			this.highlightCode()
		}
	},
	created() {
		this.highlightCode()
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
		highlightCode() {
			try {
				const {value} = highlight.highlight(this.code, {language: this.language})
				this.highlightedCode = value
			} catch (error) {
				this.highlightedCode = highlight.highlightAuto(this.code).value
				this.$log.warn(`[${this.name}] 语言 ${this.language} 不受支持, 已自动高亮`, error)
			}
		},
		copyCode() {
			navigator.clipboard.writeText(this.code).then(() => {
				this.copyButtonText = this.t("components.CodeBlockRenderer.copied")
				setTimeout(() => {
					this.copyButtonText = this.t("components.CodeBlockRenderer.copy")
				}, 1500)
			}).catch((error) => {
				this.copyButtonText = this.t("components.CodeBlockRenderer.failed")
				this.$log.error(`[${this.name}] 复制失败`, error)
				setTimeout(() => {
					this.copyButtonText = this.t("components.CodeBlockRenderer.copy")
				}, 1500)
			})
		},
		languageTitle(language) {
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
			return `${FRIENDLY_NAME} ${IS_SUPPORTED ? "" : `[${this.t("components.CodeBlockRenderer.notSupported")}]`}`
		}
	}
}
</script>

<template>
	<div class="code-block-wrapper">
		<div class="controls">
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
		padding: 50px 16px 16px 16px;
		margin: 0;
		border-radius: 6px;
		overflow: hidden;

		code {
			display: block;
			overflow: auto;
			max-height: 500px;
		}
	}
}
</style>