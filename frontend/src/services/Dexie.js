import Dexie from "dexie"

const DB = new Dexie("ElakeAI")
DB.version(1).stores({
	chats: "&key, title, timestamp, data",
	configs: "&item, value",
	apiKeys: "&key ,model, value, remark, url, enabled",
	logs: "++id, level, component, message, timestamp",
})

export default DB