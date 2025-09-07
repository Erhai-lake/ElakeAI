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
		color: var(--theme-color);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}

	// 图片
	img {
		max-width: 100%;
		height: auto;
		border-radius: 6px;
		box-shadow: 0 2px 8px var(--box-shadow-color);
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
		margin: 1.2em 0;
		overflow: hidden;

		th, td {
			padding: 0.6em 1em;
			border: 1px solid var(--border-color);
		}

		th {
			background-color: rgba(175, 184, 193, 0.2);
			font-weight: 600;
			text-align: left;
		}

		tr{
			transition: background-color 0.3s ease-in-out;
		}

		tr:nth-child(even) {
			background-color: rgba(175, 184, 193, 0.1);
		}

		tr:hover {
			background-color: var(--active-background-color);
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
		color: var(--blockquote-text-color);
		border-left: 4px solid var(--blockquote-border-color);
		background-color: var(--blockquote-bg-color);
		border-radius: 4px;

		p {
			margin: 0.4em 0;
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
		background-color: rgba(175, 184, 193, 0.25);
		padding: 0.25em 0.5em;
		border-radius: 4px;
		font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, Menlo, monospace;
		font-size: 0.9em;
		font-weight: 500;
		letter-spacing: 0.2px;
		color: var(--theme-color);
	}
}
</style>