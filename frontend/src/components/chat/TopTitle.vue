<script>
import EventBus from "@/services/EventBus"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"

export default {
    name: "TopTitle",
    inject: ["$DB", "$log"],
    props: {
        chatTitle: {
            type: String,
            default: ""
        },
        chatKey: {
            type: String,
            default: ""
        }
    },
    data() {
        return {
            name: "TopTitle",
            title: this.chatTitle || this.t("components.AIInput.newChat"),
            editingTitle: {
                show: false,
                value: ""
            }
        }
    },
	watch: {
		chatTitle(newTitle) {
			this.title = newTitle || this.t("components.AIInput.newChat")
		}
	},
	methods: {
		/**
		 * 翻译
		 * @param key {String} - 键
		 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
		 * @returns {String} - 翻译后的文本
		 */
		t(key, params = {}) {
			return i18nRegistry.translate(key, params)
		},
        /**
         * 显示标题输入框
         */
        titleInput() {
            this.editingTitle.value = this.title
            this.editingTitle.show = true
            this.$nextTick(() => {
                const INPUT = this.$el.querySelector(".top-title input")
                if (INPUT) {
					INPUT.focus()
					INPUT.select()
                }
            })
        },
        /**
         * 保存标题
         * @returns {Promise<void>} - 保存标题的Promise
         */
        async saveTitle() {
            // 检查标题是否重复
            if (this.editingTitle.value.trim() === this.title) {
                this.editingTitle.show = false
                return
            }
            // 检查标题是否为空
            if (!this.editingTitle.value.trim()) {
                this.editingTitle.value = this.t("components.AIInput.newChat")
            }
            try {
                const NEW_TITLE = this.editingTitle.value.trim()
                this.title = NEW_TITLE
                await this.$DB.chats.update(this.chatKey, {title: NEW_TITLE})
                toastRegistry.success(this.t("views.ChatView.toast.titleUpdated"))
                EventBus.emit("[update] chatListUpdate")
            } catch (error) {
                this.$log.error(`[${this.name}] 标题更新失败`, error)
                toastRegistry.error(`[${this.name}] ${this.t("views.ChatView.toast.titleUpdateError")}`)
                this.editingTitle.value = this.title
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
            this.editingTitle.value = this.title
        },
    }
}
</script>

<template>
    <div class="top-title">
        <p v-if="!editingTitle.show" @click="titleInput" :title="title">{{ title }}</p>
        <input
            type="text"
            v-else
            v-model="editingTitle.value"
            @blur="saveTitle"
            @keydown="handleTitleKeydown"
            class="title-input">
    </div>
</template>

<style scoped lang="less">
.top-title {
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

    .title-input {
        max-width: 500px;
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