<script>
export default {
    name: "UserMessageCard",
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
        }
    }
}
</script>

<template>
    <div class="MessageCard">
        <div class="MessageContent" v-html="formattingMessage(message.message.content)"></div>
        <div class="MessageInfo">
            [{{ $t("components.UserMessageCard.earthOnline") }}]
            -
            [{{ $t("components.UserMessageCard.players") }}]
            -
            {{ formatTimestamp(message.timestamp) }}
        </div>
        <div class="MessageInfo">{{ message.id }}</div>
    </div>
</template>

<style scoped lang="less">
.MessageCard {
    position: relative;
    padding: 16px 20px;
    border-radius: 12px;

    .user & {
        background-color: var(--chat-user-background-color);
        color: var(--chat-user-text-color);
    }

    .MessageInfo {
        margin-top: 8px;
        font-size: 12px;
        color: var(--chat-dialogue-time-text-color);
        text-align: right;
    }
}
</style>