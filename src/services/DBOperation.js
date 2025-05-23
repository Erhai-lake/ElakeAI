class DBOperation {
    db = null

    constructor(options = {}) {
        const {
            toast,
            dbName = "ElakeAI",
            storeName = "Chat",
            dbVersion = 1,
            keyPath = "id",
            onUpgrade
        } = options

        this.config = {
            toast,
            dbName,
            storeName,
            dbVersion,
            keyPath
        }
        this.initDB(onUpgrade).catch(this.handleError.bind(this))
    }

    /**
     * 统一错误处理入口
     * @param error 错误对象
     * @param context 错误上下文（操作描述）
     */
    handleError(error, context = "数据库操作") {
        const ERROR = `[DB Error] ${context}`
        console.error(ERROR, error)
        if (this.config.toast) {
            this.config.toast.open({message: ERROR})
        }
    }

    /**
     * 初始化数据库
     * @param onUpgrade 升级回调函数
     */
    initDB(onUpgrade) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.dbName, this.config.dbVersion)

            request.onupgradeneeded = (event) => {
                const DB = event.target.result
                if (!DB.objectStoreNames.contains(this.config.storeName)) {
                    DB.createObjectStore(this.config.storeName, {
                        keyPath: this.config.keyPath,
                        autoIncrement: false
                    })
                }
                onUpgrade?.(DB, event.oldVersion)
            }

            request.onsuccess = (event) => {
                this.db = event.target.result
                resolve(this.db)
            }

            request.onerror = (event) => {
                reject(event.target.error)
            }
        })
    }

    async ensureDBReady() {
        return this.db || this.initDB()
    }

    /**
     * 执行事务
     * @param mode 模式
     * @param operation 操作
     */
    executeTransaction(mode, operation) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await this.ensureDBReady()
                const transaction = db.transaction([this.config.storeName], mode)
                const store = transaction.objectStore(this.config.storeName)

                transaction.oncomplete = () => resolve()
                transaction.onerror = (event) => reject(event.target.error)

                operation(store, resolve, reject)
            } catch (error) {
                this.handleError(error, `执行${mode}事务`)
                reject(error)
            }
        })
    }

    /**
     * 添加数据
     * @param data
     */
    async add(data) {
        try {
            if (!data || data === "") {
                this.handleError(new Error("数据不能为空"), "添加数据失败")
                return
            }
            const completeData = {
                ...data,
                [this.config.keyPath]: data[this.config.keyPath] || crypto.randomUUID(),
                timestamp: data.timestamp || new Date().toISOString()
            }

            return this.executeTransaction("readwrite", (store, resolve, reject) => {
                const request = store.add(completeData)
                request.onsuccess = () => resolve(request.result)
                request.onerror = (event) => reject(event.target.error)
            })
        } catch (error) {
            this.handleError(error, "添加数据失败")
            throw error
        }
    }

    /**
     * 获取所有数据
     */
    async getAll() {
        try {
            return this.executeTransaction("readonly", (store, resolve, reject) => {
                const request = store.getAll()
                request.onsuccess = () => resolve(request.result)
                request.onerror = (event) => reject(event.target.error)
            })
        } catch (error) {
            this.handleError(error, "获取数据失败")
            throw error
        }
    }

    /**
     * 获取单个数据
     *
     * @param id id
     */
    async get(id) {
        try {
            if (!id || id === "") {
                this.handleError(new Error("ID不能为空"), "获取数据失败")
                return
            }
            return this.executeTransaction("readonly", (store, resolve, reject) => {
                const request = store.get(id)
                request.onsuccess = () => {
                    request.result ? resolve(request.result) :
                        this.handleError(new Error(`ID ${id} 未找到`), "获取数据失败")
                }
                request.onerror = (event) => reject(event.target.error)
            })
        } catch (error) {
            this.handleError(error, "获取数据失败")
            throw error
        }
    }

    /**
     * 更新数据
     *
     * @param id id
     * @param newData 新的数据
     */
    async update(id, newData) {
        try {
            if (!id || id === "") {
                this.handleError(new Error("ID不能为空"), "更新数据失败")
                return
            }
            return this.executeTransaction("readwrite", (store, resolve, reject) => {
                const getRequest = store.get(id)

                getRequest.onsuccess = () => {
                    if (!getRequest.result) {
                        this.handleError(new Error(`ID ${id} 未找到`), "更新数据失败")
                        return
                    }

                    const putRequest = store.put({
                        ...getRequest.result,
                        ...newData,
                        timestamp: new Date().toISOString()
                    })

                    putRequest.onsuccess = () => resolve(putRequest.result)
                    putRequest.onerror = (event) => reject(event.target.error)
                }

                getRequest.onerror = (event) => reject(event.target.error)
            })
        } catch (error) {
            this.handleError(error, "更新数据失败")
            throw error
        }
    }

    /**
     * 删除数据
     *
     * @param id id
     */
    async delete(id) {
        try {
            if (!id || id === "") {
                this.handleError(new Error("ID不能为空"), "删除数据失败")
                return
            }
            return this.executeTransaction("readwrite", (store, resolve, reject) => {
                const request = store.delete(id)
                request.onsuccess = () => resolve(id)
                request.onerror = (event) => reject(event.target.error)
            })
        } catch (error) {
            this.handleError(error, "删除数据失败")
            throw error
        }
    }

    /**
     * 清空所有聊天记录
     */
    async clear() {
        try {
            return this.executeTransaction("readwrite", (store, resolve, reject) => {
                const request = store.clear()
                request.onsuccess = () => resolve()
                request.onerror = (event) => reject(event.target.error)
            })
        } catch (error) {
            this.handleError(error, "清空数据失败")
            throw error
        }
    }

    /**
     * 高级查询方法
     * @param indexName
     * @param value
     * @returns {Promise<unknown>}
     */
    async queryIndex(indexName, value) {
        try {
            return this.executeTransaction("readonly", (store, resolve, reject) => {
                const index = store.index(indexName)
                const request = value ? index.getAll(value) : index.getAll()

                request.onsuccess = () => resolve(request.result)
                request.onerror = (event) => reject(event.target.error)
            })
        } catch (error) {
            this.handleError(error, `查询索引 ${indexName}`)
            throw error
        }
    }
}

export {DBOperation}
