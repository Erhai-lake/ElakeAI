<script>
import Button from "@/components/Button.vue"
import EventBus from "@/services/EventBus"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import { encode } from "gpt-tokenizer"

export default {
	name: "UserMessageCard",
	components: {Button},
	props: {
		message: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			editingContent: {
				show: false,
				value: ""
			}
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
		 * 格式化信息
		 * @returns {String} - 格式化后的信息
		 */
		formattingMessage() {
			return this.message.message.content.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;")
		},
		/**
		 * 格式化时间戳
		 * @returns {string} 格式化后的时间字符串
		 */
		formatTimestamp() {
			const DATE = new Date(this.message.timestamp)
			const YEAR = DATE.getFullYear()
			const MONTH = String(DATE.getMonth() + 1).padStart(2, "0")
			const DAY = String(DATE.getDate()).padStart(2, "0")
			const HOURS = String(DATE.getHours()).padStart(2, "0")
			const MINUTES = String(DATE.getMinutes()).padStart(2, "0")
			const SECONDS = String(DATE.getSeconds()).padStart(2, "0")
			return `${YEAR}-${MONTH}-${DAY} ${HOURS}:${MINUTES}:${SECONDS}`
		},
		/**
		 * 计算tokens
		 */
		tokens() {
			return encode(this.message.message.content).length
		},
		/**
		 * 移除消息
		 */
		remove() {
			EventBus.emit("[function] removeMessage", this.message.id)
		},
		/**
		 * 显示输入框
		 */
		editInput() {
			this.editingContent.value = this.message.message.content
			this.editingContent.show = true
			this.$nextTick(() => {
				this.$refs.textarea.focus()
				this.adjustTextareaHeight()
			})
		},
		/**
		 * 保存消息
		 */
		saveContent() {
			if (this.editingContent.value === this.message.message.content) return
			if (this.editingContent.value.trim() === "") return
			EventBus.emit("[function] editMessage", this.message.id, this.editingContent.value)
			this.editingContent.show = false
		},
		/**
		 * 调整 textarea 高度
		 */
		adjustTextareaHeight() {
			const TEXTAREA = this.$refs.textarea
			if (TEXTAREA) {
				TEXTAREA.style.height = "auto"
				// 获取滚动高度
				const scrollHeight = TEXTAREA.scrollHeight
				// 设置最大高度为 600px
				TEXTAREA.style.height = Math.min(scrollHeight, 600) + "px"
			}
		},
		/**
		 * 当 textarea 失去焦点时隐藏输入框
		 */
		handleTextareaBlur() {
			setTimeout(() => {
				this.editingContent.show = false
			}, 200)
		}
	}
}
</script>

<template>
	<div class="user-message-card">
		<div class="message-content">
			<div v-if="!editingContent.show" v-html="formattingMessage()"></div>
			<textarea
				v-else
				spellcheck="false"
				v-model="editingContent.value"
				class="content-input"
				ref="textarea"
				@input="adjustTextareaHeight"
				@blur="handleTextareaBlur"></textarea>
		</div>
		<div class="message-bottom">
			<div class="functional-controls">
				<template v-if="editingContent.show">
					<Button @click="editingContent.show = false">
						{{ t("components.UserMessageCard.cancel") }}
					</Button>
					<Button @click="saveContent">{{ t("components.UserMessageCard.save") }}</Button>
				</template>
				<template v-if="!editingContent.show">
					<Button @click="remove">{{ t("components.UserMessageCard.remove") }}</Button>
					<Button @click="editInput">
						{{ t("components.UserMessageCard.edit") }}
					</Button>
				</template>
			</div>
			<div class="message-info">
				<div>
					[{{ t("components.UserMessageCard.earthOnline") }}]
					-
					[{{ t("components.UserMessageCard.players") }}]
					-
					{{ formatTimestamp() }}
				</div>
				<div>
					{{ message.id }}
					-
					{{ tokens() }} tokens
				</div>
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

	.message-content {
		font-size: 16px;
		line-height: 1.5;
		word-wrap: break-word;
		overflow-wrap: break-word;
		white-space: pre-wrap;
	}

	.content-input {
		padding: 8px 12px;
		box-sizing: border-box;
		width: 100%;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		background: var(--background-color);
		color: var(--text-color);
		font-size: 18px;

		&:focus {
			outline: none;
		}
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
		display: flex;
		gap: 10px;
	}

	.message-info {
		font-size: 12px;
		color: var(--chat-dialogue-time-text-color);
	}
}
</style>