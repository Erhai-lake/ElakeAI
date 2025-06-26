<script>
import highlight from "highlight.js"
import "@/assets/styles/highlight.css"
import "@/services/highlight/highlight-mermaid"
import "@/services/highlight/highlight-flowchart"
import "@/services/highlight/highlight-plantuml"
import Button from "@/components/Button.vue"

export default {
	name: "CodeBlockRenderer",
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
			copyButtonText: this.$t("components.CodeBlockRenderer.copy")
		}
	},
	mounted() {
		this.highlightCode()
	},
	methods: {
		highlightCode() {
			const CODE_ELEMENT = this.$refs.codeRef
			if (CODE_ELEMENT) {
				highlight.highlightElement(CODE_ELEMENT)
			}
		},
		copyCode() {
			navigator.clipboard.writeText(this.code).then(() => {
				this.copyButtonText = this.$t("components.CodeBlockRenderer.copied")
				setTimeout(() => {
					this.copyButtonText = this.$t("components.CodeBlockRenderer.copy")
				}, 1500)
			}).catch((error) => {
				this.copyButtonText = this.$t("components.CodeBlockRenderer.failed")
				this.$log.error(`[${this.name}] 复制失败`, error)
				setTimeout(() => {
					this.copyButtonText = this.$t("components.CodeBlockRenderer.copy")
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
			return `${FRIENDLY_NAME} ${IS_SUPPORTED ? "" : `[${this.$t("components.CodeBlockRenderer.notSupported")}]`}`
		}
	}
}
</script>

<template>
	<div class="code-block-wrapper">
		<span>{{ languageTitle(language) }}</span>
		<pre ref="codeRef" class="hljs" :class="`language-${language}`"><code>{{ code }}</code></pre>
		<Button class="code-copy-btn" @click="copyCode">{{ copyButtonText }}</Button>
	</div>
</template>

<style scoped lang="less">
.code-block-wrapper {
	position: relative;
	border-radius: 8px;
	overflow: auto;
	padding: 12px;
	z-index: 0;

	span {
		position: absolute;
		top: 25px;
		left: 100px;
		color: #999;
		white-space: nowrap;
		font-size: 16px;
		font-weight: 700;
		z-index: 1;
	}

	&:hover {
		.code-copy-btn {
			opacity: 1;
		}
	}

	.code-copy-btn {
		position: absolute;
		top: 30px;
		right: 20px;
		padding: 5px 10px;
		width: 100px;
		opacity: 0;
		z-index: 1;
	}
}
</style>