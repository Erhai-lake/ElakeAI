<script>
import Button from "@/components/Button.vue"
import EventBus from "@/services/EventBus"

export default {
    name: "UserMessageCard",
    components: {Button},
    props: {
        message: {
            type: Object,
            required: true
        }
    },
    methods: {
        /**
         * 格式化信息
         * @param message {String} - 信息
         * @returns {String} - 格式化后的信息
         */
        formattingMessage(message) {
            return message.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;")
        },
        /**
         * 格式化时间戳
         * @param {number} timestamp 时间戳
         * @returns {string} 格式化后的时间字符串
         */
        formatTimestamp(timestamp) {
            const DATE = new Date(timestamp)
            const YEAR = DATE.getFullYear()
            const MONTH = String(DATE.getMonth() + 1).padStart(2, "0")
            const DAY = String(DATE.getDate()).padStart(2, "0")
            const HOURS = String(DATE.getHours()).padStart(2, "0")
            const MINUTES = String(DATE.getMinutes()).padStart(2, "0")
            const SECONDS = String(DATE.getSeconds()).padStart(2, "0")
            return `${YEAR}-${MONTH}-${DAY} ${HOURS}:${MINUTES}:${SECONDS}`
        },
        /**
         * 移除消息
         * @param {string} id 消息ID
         */
        remove(id) {
            EventBus.emit("[function] removeMessage", id)
        }
    }
}
</script>

<template>
    <div class="user-message-card">
        <div class="message-content" v-html="formattingMessage(message.message.content)"></div>
        <div class="message-bottom">
            <div class="functional-controls">
                <Button @click="remove(message.id)">移除</Button>
            </div>
            <div class="message-info">
                <div>
                    [{{ $t("components.UserMessageCard.earthOnline") }}]
                    -
                    [{{ $t("components.UserMessageCard.players") }}]
                    -
                    {{ formatTimestamp(message.timestamp) }}
                </div>
                <div>{{ message.id }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="less">
@media screen and (max-width: 768px) {
    .message-info {
        display: none;
    }
}

.user-message-card {
    position: relative;
    padding: 16px 20px;
    border-radius: 12px;

    .user & {
        background-color: var(--chat-user-background-color);
        color: var(--chat-user-text-color);
    }

    .message-content{
        font-size: 16px;
        line-height: 1.5;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: pre-wrap;
    }

    .message-bottom {
        margin-top: 8px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        white-space: pre-wrap;
        word-break: break-word;
    }

    &:hover .functional-controls {
        opacity: 1;
    }

    .functional-controls {
        opacity: 0;
    }

    .message-info {
        font-size: 12px;
        color: var(--chat-dialogue-time-text-color);
    }
}
</style>