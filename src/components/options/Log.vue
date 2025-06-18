<script>
import Button from "@/components/Button.vue"
import EventBus from "@/services/EventBus"
import {nextTick} from "vue"

export default {
    name: "Log",
    inject: ["$DB"],
    components: {Button},
    data() {
        return {
            name: "Log",
            logs: [],
            isKeepScrollToBottom: true,
            isLogSuspensionWindow: false,
        }
    },
    async created() {
        this.loadLogs()
        // 获取悬浮窗设置
        try {
            const LOG_SUSPENSION_WINDOW_DATA = await this.$DB.Configs.get("LogSuspensionWindow")
            this.isLogSuspensionWindow = LOG_SUSPENSION_WINDOW_DATA ? LOG_SUSPENSION_WINDOW_DATA.value : false
        } catch (error) {
            this.$log.error(`[${this.name}] 日志悬浮窗设置获取失败`, error)
            this.$toast.error(`[${this.name}] ${this.$t("components.Log.toast.getLogSuspensionWindowError")}`)
        }
    },
    mounted() {
        // 监听日志
        EventBus.on("[function] log", this.addLog)
    },
    beforeUnmount() {
        // 移除用户消息监听
        EventBus.off("[function] log", this.addLog)
    },
    methods: {
        /**
         * 加载日志
         */
        loadLogs() {
            try {
                const STORED_LOGS = localStorage.getItem("ElakeAILogs")
                this.logs = STORED_LOGS ? JSON.parse(STORED_LOGS) : []
            } catch (error) {
                this.$log.error(`[${this.name}] 加载日志失败`, error)
                this.$toast.error(`[${this.name}] ${this.$t("components.Log.toast.loadError")}`)
            }
            if (this.keepScrollToBottom) this.scrollToBottom()
        },
        /**
         * 添加日志
         * @param log - 日志对象
         */
        addLog(log) {
            this.logs.push(log)
            if (this.keepScrollToBottom) this.scrollToBottom()
        },
        /**
         * 清空日志
         */
        clearLogs() {
            try {
                localStorage.removeItem("ElakeAILogs")
                this.logs = []
            } catch (error) {
                this.$log.error(`[${this.name}] 清空日志失败`, error)
                this.$toast.error(`[${this.name}] ${this.$t("components.Log.toast.clearError")}`)
            }
            if (this.keepScrollToBottom) this.scrollToBottom()
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
         * 滚动到最底部
         */
        scrollToBottom() {
            nextTick(() => {
                const CONTAINER = document.querySelector(".LogList")
                if (CONTAINER) {
                    CONTAINER.scrollTop = CONTAINER.scrollHeight
                }
            })
        },
        /**
         * 保持滚动到底部
         */
        keepScrollToBottom() {
            this.isKeepScrollToBottom = !this.isKeepScrollToBottom
            if (this.isKeepScrollToBottom) {
                this.scrollToBottom()
            }
        },
        /**
         * 悬浮窗口
         */
        async suspensionWindow() {
            // 保存设置
            try {
                if (await this.$DB.Configs.get("LogSuspensionWindow")) {
                    await this.$DB.Configs.put({
                        item: "LogSuspensionWindow",
                        value: !this.isLogSuspensionWindow
                    })
                } else {
                    await this.$DB.Configs.add({
                        item: "LogSuspensionWindow",
                        value: !this.isLogSuspensionWindow
                    })
                }
                this.isLogSuspensionWindow = !this.isLogSuspensionWindow
            } catch (error) {
                this.$log.error(`[${this.name}] 悬浮窗设置保存失败`, error)
                this.$toast.error(`[${this.name}] ${this.$t("components.Log.toast.saveLogSuspensionWindowError")}`)
            }
        }
    }
}
</script>

<template>
    <div class="Log">
        <div class="Header">
            <h3>{{ $t("components.Log.name") }}</h3>
            <span class="LogCount">{{ $t("components.Log.count", {count: logs.length}) }}</span>
            <Button @click="loadLogs">🔄 {{ $t("components.Log.function.load") }}</Button>
            <Button @click="clearLogs">🗑️ {{ $t("components.Log.function.clear") }}</Button>
            <Button @click="keepScrollToBottom">
                {{ $t("components.Log.function.keepScrollToBottom", {is: isKeepScrollToBottom}) }}
            </Button>
            <Button @click="suspensionWindow">
                {{ $t("components.Log.function.suspensionWindow", {is: isLogSuspensionWindow}) }}
            </Button>
        </div>
        <div class="LogList">
            <div v-for="(log, index) in logs" :key="index" :class="['LogItem', log.level]">
                <span class="LogTime">{{ formatTimestamp(log.timestamp) }}</span>
                <span class="LogLevel">[{{ log.level.toUpperCase() || "NULL" }}]</span>
                <span class="LogComponent">[{{ log.component || "NULL" }}]</span>
                <span class="LogMessage">{{ log.message || "NULL" }}</span>
            </div>
            <div v-if="logs.length === 0" class="EmptyTip">{{ $t("components.Log.empty") }}</div>
        </div>
    </div>
</template>

<style scoped lang="less">
.Log {
    padding: 10px;
    box-sizing: border-box;
    height: 100%;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background-color: var(--background-color);
    display: flex;
    flex-direction: column;
}

.Header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
}

.LogList {
    flex: 1;
    overflow-y: auto;
    padding: 5px;
    border-top: 1px solid var(--border-color);
    background-color: var(--background-color);

    .LogItem {
        margin-bottom: 5px;
        padding: 3px 5px;
        border-bottom: 1px solid var(--border-color);
        word-break: break-word;
    }

    .LogTime {
        margin-right: 10px;
        min-width: 80px;
        display: inline-block;
    }

    .LogLevel, .LogComponent {
        font-weight: bold;
        margin-right: 10px;
        display: inline-block;
    }

    .LogMessage {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 0.95em;
        line-height: 1.5;
    }

    .debug {
        color: #666;
    }

    .info {
        color: #2196F3;
    }

    .warn {
        color: #FF9800;
    }

    .error {
        color: #F44336;
    }

    .EmptyTip {
        padding: 20px;
        text-align: center;
        border: 1px solid var(--border-color);
    }
}
</style>