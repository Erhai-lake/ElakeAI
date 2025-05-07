export interface ChatRecord {
    id?: number;
    user: string;
    message: string;
    timestamp: Date;
    [key: string]: any;
}

export interface ChatDBInterface {
    add(data: Omit<ChatRecord, 'key'>): Promise<string>;
    getAll(): Promise<ChatRecord[]>;
    get(key: string): Promise<ChatRecord | undefined>;
    update(key: string, newData: Partial<ChatRecord>): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}