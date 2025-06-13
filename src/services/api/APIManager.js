import DeepSeekAPI from "@/services/api/DeepSeekAPI.js"
import ChatGPTAPI from "@/services/api/ChatGPTAPI.js"

const APIS = {
    DeepSeek: new DeepSeekAPI(),
    ChatGPT: new ChatGPTAPI()
}

export default {
    async execute(platform, callPolicy, params) {
        if (!APIS[platform]) {
            return {traceability: params, data: null, error: "unsupportedPlatform"}
        }
        return await APIS[platform].execute(callPolicy, params)
    }
}