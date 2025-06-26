import highlight from "highlight.js/lib/core"

highlight.registerLanguage("flowchart", function(highlight) {
	return {
		name: "Flowchart",
		case_insensitive: true,
		contains: [
			// 注释（如果你有用 // 或 #）
			highlight.COMMENT("//", "$"),
			highlight.COMMENT("#", "$"),
			// 节点定义：id=>type: label
			{
				className: "keyword",
				begin: /\b\w+=>\w+:/
			},
			// label 内容部分
			{
				className: "string",
				begin: /:\s*[^->\n]+/
			},
			// 条件路径 (yes) / (no)
			{
				className: "literal",
				begin: /\((yes|no)\)/
			},
			// 箭头
			{
				className: "bullet",
				begin: /->/
			}
		]
	}
})
