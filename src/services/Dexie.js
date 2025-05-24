import Dexie from "dexie"

const DB = new Dexie("ElakeAI")
DB.version(1).stores({
    Chats: "&key, title, data",
    Configs: "&item, value"
})

export default DB