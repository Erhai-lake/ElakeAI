<script>
import AIInput from "@/components/AIInput.vue"
import {useRoute} from "vue-router"

export default {
    name: "ChatView",
    inject: ["$DB"],
    components: {AIInput},
    data() {
        return {
            TopTitle: "ChatView",
            messages: [
                {
                    "message": {
                        "content": "你好!",
                        "role": "user"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "model": "DeepSeek",
                    "message": {
                        "content": "1你好! 今天我能帮你什么?",
                        "role": "assistant"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "message": {
                        "content": "你好!",
                        "role": "user"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "model": "DeepSeek",
                    "message": {
                        "content": "2你好! 今天我能帮你什么?",
                        "role": "assistant"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "message": {
                        "content": "你好!",
                        "role": "user"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "model": "DeepSeek",
                    "message": {
                        "content": "3你好! 今天我能帮你什么?",
                        "role": "assistant"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "message": {
                        "content": "你好!",
                        "role": "user"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "model": "DeepSeek",
                    "message": {
                        "content": "4你好! 今天我能帮你什么?",
                        "role": "assistant"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "message": {
                        "content": "你好!",
                        "role": "user"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "model": "DeepSeek",
                    "message": {
                        "content": "5你好! 今天我能帮你什么?",
                        "role": "assistant"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "message": {
                        "content": "你好!",
                        "role": "user"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "model": "DeepSeek",
                    "message": {
                        "content": "6你好! 今天我能帮你什么?",
                        "role": "assistant"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "message": {
                        "content": "你好!",
                        "role": "user"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "model": "DeepSeek",
                    "message": {
                        "content": "7你好! 今天我能帮你什么?",
                        "role": "assistant"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "message": {
                        "content": "你好!",
                        "role": "user"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "model": "DeepSeek",
                    "message": {
                        "content": "8你好! 今天我能帮你什么?",
                        "role": "assistant"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "message": {
                        "content": "你好!",
                        "role": "user"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "model": "DeepSeek",
                    "message": {
                        "content": "9你好! 今天我能帮你什么?",
                        "role": "assistant"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "message": {
                        "content": "你好!",
                        "role": "user"
                    },
                    "timestamp": 1698230400000
                },
                {
                    "model": "DeepSeek",
                    "message": {
                        "content": "10你好! 今天我能帮你什么?",
                        "role": "assistant"
                    },
                    "timestamp": 1698230400000
                }
            ]
        }
    },
    async created() {
        try {
            const ROUTE = useRoute()
            const CHAT_KEY = ROUTE.params.key
            // 检查ChatKey是否存在
            const CHAT_KEY_DATA = await this.$DB.Chats.get(CHAT_KEY)
            if (!CHAT_KEY_DATA) {
                this.$toast.warning(this.$t("views.ChatView.toast.noChatKey"))
                this.$router.push("/")
            }
        } catch (error) {
            console.error("[Chat View] 聊天记录获取错误", error)
            this.$toast.error("[Chat View] 聊天记录获取错误")
        }
    }
}
</script>

<template>
    <div class="ChatView">
        <!-- 顶部标题 -->
        <div class="TopTitle">{{ TopTitle }}</div>
        <!-- 聊天内容区域 -->
        <!-- 消息列表 -->
        <div class="MessageList">
            <div v-for="message in messages" :key="message.timestamp" :class="['Message', message.message.role]">
                <div class="MessageCard">
                    <div class="MessageContent">{{ message.message.content }}</div>
                    <div class="MessageTime">{{ message.timestamp }}</div>
                </div>
            </div>
        </div>
        <!-- 底部输入框 -->
        <div class="InputArea">
            <AIInput/>
        </div>
        <!-- AI提示信息 -->
        <div class="AIDisclaimer">
            内容由 AI 生成, 请仔细甄别
        </div>
    </div>
</template>

<style scoped lang="less">
.ChatView {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-rows: auto 1fr auto auto;
    overflow: hidden;
}

.TopTitle {
    height: 65px;
    font-size: 18px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
}

.MessageList {
    padding: 0 30px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
}

.Message {
    display: flex;

    &.user {
        justify-content: flex-end;
    }

    &.assistant {
        justify-content: flex-start;
    }
}

.MessageCard {
    max-width: 80%;
    padding: 12px 16px;
    border-radius: 12px;
    position: relative;

    .user & {
        background-color: var(--chat-user-background-color);
        color: var(--chat-user-text-color);
        border-bottom-right-radius: 0;
    }

    .assistant & {
        background-color: var(--chat-assistant-background-color);
        color: var(--chat-assistant-text-color);
        border-bottom-left-radius: 0;
    }
}

.MessageContent {
    font-size: 16px;
    line-height: 1.5;
}

.MessageTime {
    margin-top: 4px;
    font-size: 12px;
    color: var(--chat-dialogue-time-text-color);
    text-align: right;
}

.InputArea {
    display: flex;
    align-items: center;
    justify-content: center;
}

.AIDisclaimer {
    padding: 10px 0;
    text-align: center;
    font-size: 12px;
    color: var(--chat-disclaimer-text-color);
}
</style>