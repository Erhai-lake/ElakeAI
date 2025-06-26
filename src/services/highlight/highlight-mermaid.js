import highlight from "highlight.js/lib/core"

highlight.registerLanguage("mermaid", function (highlight) {
	return {
		name: "Mermaid",
		case_insensitive: true,
		contains: [
			highlight.COMMENT("%", "$"),
			// diagram 类型
			{
				className: "keyword",
				begin: /\b(graph|sequenceDiagram|classDiagram|stateDiagram-v2|erDiagram|flowchart|gantt|journey|pie)\b/
			},
			// 条件关键词等
			{
				className: "built_in",
				begin: /\b(subgraph|end|click|style|link|activate|deactivate|note|loop|opt|alt|else|rect|section)\b/
			},
			// true / false / null
			{
				className: "literal",
				begin: /\b(true|false|null)\b/
			},
			// 箭头带说明：|text|
			{
				className: "string",
				begin: /\|[^|]+\|/
			},
			// 方框节点 [xxx]
			{
				className: "symbol",
				begin: /\[[^\]]+]/
			},
			// 圆角框节点 (xxx)
			{
				className: "symbol",
				begin: /\([^)]+\)/
			},
			// 条件判断框 {xxx}
			{
				className: "symbol",
				begin: /\{[^}]+}/
			},
			// 箭头符号
			{
				className: "bullet",
				begin: /-->|--|==>|==|<--|<==|<-|->/
			}
		]
	}
})