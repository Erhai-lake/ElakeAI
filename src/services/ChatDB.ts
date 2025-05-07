import {ChatRecord, ChatDBInterface} from '@/types/ChatIndexedDB';

class ChatDBClass implements ChatDBInterface {
    private db: IDBDatabase | null = null;
    private readonly dbName: string = "ElakeAI";
    private readonly dbVersion: number = 1;
    private readonly storeName: string = "Chat";

    constructor() {
        this.initDB().then(r => r).catch(e => e);
    }

    /**
     * 初始化数据库
     */
    private initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, {
                        keyPath: 'key',
                        autoIncrement: false
                    });
                    console.log(`Created ${this.storeName} object store`);
                }
            };

            request.onsuccess = (event: Event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve(this.db);
            };

            request.onerror = (event: Event) => {
                console.error('Database connection failed:', (event.target as IDBOpenDBRequest).error);
                reject((event.target as IDBOpenDBRequest).error);
            };
        });
    }

    private async ensureDBReady(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        return await this.initDB();
    }

    /**
     * 添加聊天记录
     * @param data
     */
    async add(data: Omit<ChatRecord, 'key'>): Promise<string> {
        const db = await this.ensureDBReady();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add({
                ...data,
                timestamp: data.timestamp || new Date()
            });

            request.onsuccess = () => {
                resolve(request.result as string);
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBRequest).error);
            };
        });
    }

    /**
     * 获取所有聊天记录
     */
    async getAll(): Promise<ChatRecord[]> {
        const db = await this.ensureDBReady();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result as ChatRecord[]);
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBRequest).error);
            };
        });
    }

    /**
     * 获取单个聊天记录
     *
     * @param key 聊天记录key
     */
    async get(key: string): Promise<ChatRecord | undefined> {
        const db = await this.ensureDBReady();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result as ChatRecord | undefined);
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBRequest).error);
            };
        });
    }

    /**
     * 更新聊天记录
     *
     * @param key 聊天记录key
     * @param newData 新的聊天记录数据
     */
    async update(key: string, newData: Partial<ChatRecord>): Promise<void> {
        const db = await this.ensureDBReady();

        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        const existingData = await new Promise<ChatRecord | undefined>((resolve, reject) => {
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result as ChatRecord | undefined);
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBRequest).error);
            };
        });

        if (!existingData) {
            throw new Error(`未找到key为 ${key} 的记录`);
        }

        const updatedData = {...existingData, ...newData};

        return new Promise<void>((resolve, reject) => {
            const request = store.put(updatedData);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBRequest).error);
            };
        });
    }

    /**
     * 删除聊天记录
     *
     * @param key 聊天记录key
     */
    async delete(key: string): Promise<void> {
        const db = await this.ensureDBReady();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBRequest).error);
            };
        });
    }

    /**
     * 清空所有聊天记录
     */
    async clear(): Promise<void> {
        const db = await this.ensureDBReady();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBRequest).error);
            };
        });
    }
}

// 导出单例
export const ChatDB = new ChatDBClass();