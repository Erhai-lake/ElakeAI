import highlight from "highlight.js/lib/core"

highlight.registerLanguage("plantuml", function(highlight) {
	return {
		name: "PlantUML",
		case_insensitive: true,
		contains: [
			// 注释
			highlight.COMMENT(/'/, /$/),
			// 预处理 @startuml / @enduml
			{
				className: "meta",
				begin: /@startuml|@enduml/
			},
			// skinparam 本身
			{
				className: "keyword",
				begin: /\bskinparam\b/
			},
			// skinparam 后的属性名
			{
				className: "attr",
				begin: /\b(?:sequence|actor|participant)[A-Z][a-zA-Z]+\b/
			},
			// 颜色代码
			{
				className: "number",
				begin: /#[0-9a-fA-F]{3,6}/
			},
			// 颜色名/字体名等
			{
				className: "string",
				begin: /\b(?:DeepSkyBlue|DodgerBlue|aqua|blue|Impact|Aapex)\b/
			},
			// 实体定义
			{
				className: "keyword",
				begin: /\b(actor|participant|boundary|control|entity|database|collections?)\b/
			},
			// 消息箭头
			{
				className: "bullet",
				begin: /--?>|<--?|==>|<==/
			},
			// 操作指令
			{
				className: "built_in",
				begin: /\b(activate|deactivate|destroy|create)\b/
			},
			// 引号文本
			{
				className: "string",
				begin: /"[^"]*"/
			},
			// 别名
			{
				className: "keyword",
				begin: /\bas\b/
			}
		]
	}
})