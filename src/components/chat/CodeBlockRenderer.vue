<script>
import highlight from "highlight.js"
import "@/assets/styles/highlight.css"
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
		}
	}
}
</script>

<template>
	<div class="code-block-wrapper">
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
	}
}
</style>