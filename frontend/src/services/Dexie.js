import Dexie from "dexie"

const DB = new Dexie("ElakeAI")
DB.version(1).stores({
	// 聊天记录
	chats: "&key, title, data, timestamp",
	// 配置
	configs: "&item, value",
	// API密钥
	apiKeys: "&key ,model, value, remark, url, enabled",
	// 面具
	masks: "&key, title, data, timestamp",
	// 日志
	logs: "++id, level, component, message, timestamp"
})

export default DB