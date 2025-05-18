class ChatDBClass {
    db = null
    dbName = "ElakeAI"
    dbVersion = 1
    storeName = "Chat"

    constructor() {
        this.initDB().catch (error => {
            console.error('数据库连接失败', error)
            this.$toast.open({message: '数据库连接失败!'})
        })
    }

    /**
     * 初始化数据库
     */
    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion)

            request.onupgradeneeded = (event) => {
                const db = (event.target).result
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, {
                        keyPath: 'key',
                        autoIncrement: false
                    })
                }
            }

            request.onsuccess = (event) => {
                this.db = (event.target).result
                resolve(this.db)
            }

            request.onerror = (event) => {
                console.error('数据库连接失败:', (event.target).error)
                this.$toast.open({message: '数据库连接失败!'})
                reject((event.target).error)
            }
        })
    }

    async ensureDBReady() {
        if (this.db) return this.db
        return await this.initDB()
    }

    /**
     * 添加聊天记录
     * @param data
     */
    async add(data) {
        const db = await this.ensureDBReady()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite')
            const store = transaction.objectStore(this.storeName)
            const request = store.add({
                ...data,
                timestamp: data.timestamp || new Date()
            })

            request.onsuccess = () => {
                resolve(request.result)
            }

            request.onerror = (event) => {
                reject((event.target).error)
            }
        })
    }

    /**
     * 获取所有聊天记录
     */
    async getAll() {
        const db = await this.ensureDBReady()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly')
            const store = transaction.objectStore(this.storeName)
            const request = store.getAll()

            request.onsuccess = () => {
                resolve(request.result)
            }

            request.onerror = (event) => {
                reject((event.target).error)
            }
        })
    }

    /**
     * 获取单个聊天记录
     *
     * @param key 聊天记录key
     */
    async get(key) {
        const db = await this.ensureDBReady()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly')
            const store = transaction.objectStore(this.storeName)
            const request = store.get(key)

            request.onsuccess = () => {
                resolve(request.result)
            }

            request.onerror = (event) => {
                reject((event.target).error)
            }
        })
    }

    /**
     * 更新聊天记录
     *
     * @param key 聊天记录key
     * @param newData 新的聊天记录数据
     */
    async update(key, newData) {
        const db = await this.ensureDBReady()

        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)

        const existingData = await new Promise((resolve, reject) => {
            const request = store.get(key)

            request.onsuccess = () => {
                resolve(request.result)
            }

            request.onerror = (event) => {
                reject((event.target ).error)
            }
        })

        if (!existingData) {
            throw new Error(`未找到key为 ${key} 的记录`)
        }

        const updatedData = {...existingData, ...newData}

        return new Promise((resolve, reject) => {
            const request = store.put(updatedData)

            request.onsuccess = () => {
                resolve()
            }

            request.onerror = (event) => {
                reject((event.target).error)
            }
        })
    }

    /**
     * 删除聊天记录
     *
     * @param key 聊天记录key
     */
    async delete(key) {
        const db = await this.ensureDBReady()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite')
            const store = transaction.objectStore(this.storeName)
            const request = store.delete(key)

            request.onsuccess = () => {
                resolve()
            }

            request.onerror = (event) => {
                reject((event.target).error)
            }
        })
    }

    /**
     * 清空所有聊天记录
     */
    async clear(){
        const db = await this.ensureDBReady()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite')
            const store = transaction.objectStore(this.storeName)
            const request = store.clear()

            request.onsuccess = () => {
                resolve()
            }

            request.onerror = (event) => {
                reject((event.target).error)
            }
        })
    }
}

// 导出单例
export const ChatDB = new ChatDBClass()