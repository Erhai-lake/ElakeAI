import Dexie from "dexie"

const DB = new Dexie("ElakeAI")
DB.version(1).stores({
    Chats: "&key, title, timestamp, data",
    Configs: "&item, value",
    APIKeys: "&key ,model, value, remark, url, enabled"
})

export default DB