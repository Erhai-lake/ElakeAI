<script>
import EventBus from "@/services/EventBus"

export default {
    name: "TopTitle",
    inject: ["$DB"],
    props: {
        chatTitle: {
            type: String,
            required: true
        },
        chatKey: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            data: {
                title: "",
                key: ""
            },
            editingTitle: {
                show: false,
                value: ""
            }
        }
    },
    watch: {
        chatTitle(newTitle) {
            this.data.title = newTitle
        },
        chatKey(newKey) {
            this.data.key = newKey
        }
    },
    methods: {
        /**
         * 显示标题输入框
         */
        titleInput() {
            this.editingTitle.value = this.data.title
            this.editingTitle.show = true
            this.$nextTick(() => {
                const input = this.$el.querySelector(".TopTitle input")
                if (input) {
                    input.focus()
                    input.select()
                }
            })
        },
        /**
         * 保存标题
         * @returns {Promise<void>} - 保存标题的Promise
         */
        async saveTitle() {
            // 检查标题是否重复
            if (this.editingTitle.value.trim() === this.data.title) {
                this.editingTitle.show = false
                return
            }
            // 检查标题是否为空
            if (!this.editingTitle.value.trim()) {
                this.editingTitle.value = this.$t("components.AIInput.newChat")
            }
            try {
                const NEW_TITLE = this.editingTitle.value.trim()
                this.data.title = NEW_TITLE
                await this.$DB.Chats.update(this.data.key, {title: NEW_TITLE})
                this.$toast.success(this.$t("views.ChatView.toast.titleUpdated"))
                EventBus.emit("[function] chatListGet")
            } catch (error) {
                console.error("[Chat View] 标题更新错误", error)
                this.$toast.error(`[Chat View] ${this.$t("views.ChatView.toast.titleUpdateError")}`)
                this.editingTitle.value = this.data.title
            } finally {
                this.editingTitle.show = false
            }
        },
        /**
         * 处理标题键盘事件
         * @param e {KeyboardEvent} - 键盘事件
         */
        handleTitleKeydown(e) {
            if (e.key === "Enter") {
                this.saveTitle()
            } else if (e.key === "Escape") {
                this.cancelEditTitle()
            }
        },
        /**
         * 取消编辑标题
         */
        cancelEditTitle() {
            this.editingTitle.show = false
            this.editingTitle.value = this.data.title
        },
    }
}
</script>

<template>
    <div class="TopTitle">
        <p v-if="!editingTitle.show" @click="titleInput" :title="data.title">{{ data.title }}</p>
        <input
            type="text"
            v-else
            v-model="editingTitle.value"
            @blur="saveTitle"
            @keydown="handleTitleKeydown"
            class="TitleInput">
    </div>
</template>

<style scoped lang="less">
.TopTitle {
    position: relative;
    height: 65px;
    font-size: 18px;
    font-weight: bold;
    border-radius: 0 0 20px 20px;
    backdrop-filter: blur(10px);
    box-shadow: 0 6px 15px 0 var(--box-shadow-color);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;

    p {
        position: absolute;
        max-width: 90%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
    }

    .TitleInput {
        width: 500px;
        padding: 8px 12px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--background-color);
        color: var(--text-color);
        font-size: 18px;
        font-weight: bold;
        text-align: center;

        &:focus {
            outline: none;
        }
    }
}
</style>