<script>
export default {
	name: "MarkdownBlockRenderer",
	props: {
		html: {
			type: String,
			required: true
		}
	}
}
</script>

<template>
	<div class="markdown-body" v-html="html"/>
</template>

<style lang="less">
.markdown-body {
	// 超链接
	a {
		color: #80ceff;
	}

	// 图片
	img {
		max-width: 100%;
		height: auto;
		border-radius: 4px;
	}

	// 列表
	ul, ol {
		padding-left: 24px;
	}

	ul {
		list-style-type: disc;

		ul {
			list-style-type: circle;

			ul {
				list-style-type: square;
			}
		}
	}

	ol {
		list-style-type: decimal;

		ol {
			list-style-type: lower-alpha;

			ol {
				list-style-type: lower-roman;
			}
		}
	}

	// 表格
	table {
		border-collapse: collapse;
		width: 100%;
		margin: 1em 0;

		th, td {
			padding: 0.5em 1em;
			border: 1px solid var(--border-color);
		}

		th {
			background-color: rgba(175, 184, 193, 0.2);
			font-weight: bold;
			text-align: left;
		}

		tr:nth-child(even) {
			background-color: rgba(175, 184, 193, 0.1);
		}
	}

	// 任务列表
	.task-list-item {
		list-style-type: none;
		margin-left: -24px;

		input[type="checkbox"] {
			margin-right: 8px;
		}
	}

	// 引用
	blockquote {
		margin: 16px 0;
		padding: 0 16px;
		color: var(--blockquote-text-color, #6a737d);
		border-left: 4px solid var(--blockquote-border-color, #dfe2e5);
		background-color: var(--blockquote-bg-color, rgba(175, 184, 193, 0.1));

		p {
			margin: 12px 0;
			line-height: 1.6;
		}

		// 嵌套引用样式
		blockquote {
			margin-left: 8px;
			border-left-width: 3px;
			opacity: 0.9;

			blockquote {
				border-left-width: 2px;
				opacity: 0.8;
			}
		}
	}

	// 内嵌代码块
	p > code,
	li > code,
	td > code {
		background-color: rgba(175, 184, 193, 0.2);
		padding: 0.2em 0.4em;
		border-radius: 3px;
		font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
		font-size: 85%;
	}
}
</style>