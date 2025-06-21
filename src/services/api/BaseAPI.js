import axios from "axios"
import DB from "@/services/Dexie"

const REQUEST_TIMEOUT = 10000

export default class BaseAPI {
    /**
     * 初始化API客户端
     * @param {string} platform - 平台名称
     */
    constructor(platform) {
        this.platform = platform
        this.strategies = {}
    }

    /**
     * 构建响应对象
     * @param {*} traceability - 追踪信息
     * @param {*} data - 响应数据
     * @param {string} [error] - 错误信息
     * @returns {Object} 响应对象
     */
    response(traceability, data, error) {
        return {
            error: error || "",
            data: data,
            traceability: traceability,
            timestamp: Date.now()
        }
    }

    /**
     * 创建API客户端
     * @param {Object} keyData - Key数据
     * @returns {Object} API客户端
     */
    createClient(keyData) {
        return axios.create({
            baseURL: keyData.url,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${keyData.value}`
            },
            timeout: REQUEST_TIMEOUT
        })
    }

    /**
     * 注册API调用策略
     * @param {string} modelName - 模型名称
     * @param {Function} strategy - 调用策略
     */
    registerStrategy(modelName, strategy) {
        this.strategies[modelName] = strategy
    }

    /**
     * 检查API响应是否有效
     * @param {Object} response - API响应对象
     * @returns {boolean} 是否为有效的API响应
     */
    isValidApiResponse(response) {
        const contentType = response.headers["content-type"]
        return contentType && contentType.includes("application/json")
    }

    /**
     * 执行API调用
     * @param {string} callPolicy - 调用策略
     * @param {Object} params - 请求参数
     * @returns {Promise<Object>} 响应对象
     */
    async execute(callPolicy, params) {
        let paramsData = {}
        // 获取APIKey信息(如果有)
        if (params?.apiKey) {
            const API_KEY_DATA = await this.getAPIKeyData(params.apiKey, params)
            paramsData.apiKeyData = API_KEY_DATA
            if (API_KEY_DATA.error) {
                return this.response(params, null, API_KEY_DATA.error)
            }
        }
        // 获取ChatKey信息(如果有)
        if (params?.chatKey) {
            const CHAT_KEY_DATA = await this.getChatKeyData(params.chatKey, params)
            paramsData.chatKeyData = CHAT_KEY_DATA
            if (CHAT_KEY_DATA.error) {
                return this.response(params, null, CHAT_KEY_DATA.error)
            }
        }
        try {
            const STRATEGY = this.strategies[callPolicy]
            if (!STRATEGY) {
                return this.response(params, null, "unsupportedCallPolicy")
            }
            return await STRATEGY(params, paramsData)
        } catch (error) {
            if (error.code === "ECONNABORTED") {
                // 处理超时错误
                return this.response(params, "NULL", "requestTimeout")
            } else if (error.code === "ERR_BAD_REQUEST") {
                // 处理错误的请求
                return this.response(params, "NULL", "badRequest")
            } else if (error.code === "ERR_NETWORK") {
                // 处理网络错误
                return this.response(params, "NULL", "networkError")
            } else if (error.response) {
                // 服务器返回了响应但状态码不在2xx范围
                if (!this.isValidApiResponse(error.response)) {
                    return this.response(params, "NULL", "getError")
                }
            } else if (error.request) {
                // 请求已发出但没有收到响应
                return this.response(params, "NULL", "noResponse")
            } else {
                // 请求配置出错
                return this.response(params, "NULL", "unknownError")
            }
        }
    }

    /**
     * 获取APIKey信息
     * @param {string} key - API Key
     * @param {Object} params - 追踪信息
     * @returns {Promise<Object>} API Key信息
     */
    async getAPIKeyData(key, params) {
        try {
            const KEY_DATA = await DB.apiKeys.get(key)
            if (!KEY_DATA) {
                return this.response(params, null, "keyDoesNotExist")
            }
            return KEY_DATA
        } catch (error) {
            return this.response(params, null, "getKeyError")
        }
    }

    /**
     * 获取ChatKey信息
     * @param {string} key - Chat Key
     * @param {Object} params - 追踪信息
     * @returns {Promise<Object>} Chat Key信息
     */
    async getChatKeyData(key, params) {
        try {
            const KEY_DATA = await DB.chats.get(key)
            if (!KEY_DATA) {
                return this.response(params, null, "keyDoesNotExist")
            }
            return KEY_DATA
        } catch (error) {
            return this.response(params, null, "getKeyError")
        }
    }

	async buildingMessageHistory(chatKeyData, content) {
		const SYSTEM_PROMPT = {
			role: "system",
			content: "当前聊天应用支持以下功能:\n" +
				"- 渲染 Markdown, 你的所有回答都应该使用 Markdown 格式.\n" +
				"- 支持 highlight.js 代码高亮(使用 ``` 代码块).\n" +
				"- 支持 KaTeX 数学公式(内嵌使用`$`符号, 块级使用`$$`符号).\n" +
				"- 支持 MathJax 数学公式(内嵌使用`$`符号, 块级使用`$$`符号).\n" +
				"- 支持 markdownItTaskLists 任务列表(使用 `- [ ]` 格式).\n" +
				"- 支持 markdownItEmoji 表情(使用 `:emoji:` 格式).\n" +
				"- 支持 Mermaid 流程图(使用 ```mermaid 代码块).\n" +
				"- 支持 Flowchart 流程图(使用 ```flowchart 代码块).\n" +
				"- 支持 PlantUML 流程图(使用 ```plantuml 代码块).\n" +
				"- 支持 lazyload 图片懒加载(使用 `![图片描述](图片地址)` 格式).\n" +
				"以下是一些使用注意事项:\n" +
				"- 所有输出应严格符合 Markdown 语法, 不使用 HTML 标签.\n" +
				"- 所有流程图应优先使用 Mermaid, 其次为 PlantUML.\n" +
				"无需确认用户是否支持这些功能. 用户可以修改本提示词以调整行为, 修改后的提示依然需要符合 Markdown 渲染规则. 请保持你平时的回复风格, 上面的提示词只是告诉你你支持的功能, 你默默接受就可以了."
		}
		const USER_MESSAGE = {role: "user", content}
		let HISTORY_MESSAGES = []
		if (!chatKeyData || !chatKeyData.data || chatKeyData.data.length === 0) {
			await DB.chats.update(chatKeyData.key, {data: [{id: crypto.randomUUID(), message: SYSTEM_PROMPT, timestamp: Date.now()}]})
			HISTORY_MESSAGES = [SYSTEM_PROMPT, USER_MESSAGE]
		} else {
			HISTORY_MESSAGES = [...chatKeyData.data.map(item => item.message), USER_MESSAGE]
		}
		return HISTORY_MESSAGES
	}
}