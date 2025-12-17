<script setup>
import {nextTick, ref} from "vue"
import {encode} from "gpt-tokenizer"
import Button from "@/components/input/Button.vue"
import EventBus from "@/services/EventBus"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import RightClickMenu from "@/components/RightClickMenu.vue"

const props = defineProps({
	/**
	 * 消息
	 */
	message: {
		type: Object,
		required: true
	},
	/**
	 * 当前消息ID
	 */
	currentMessageId: {
		type: String,
		default: ""
	},
	/**
	 * 控制
	 */
	controls: {
		type: Boolean,
		default: true
	}
})

/**
 * 编辑内容
 */
const editingContent = ref({
	show: false,
	value: ""
})

/**
 * 右键菜单
 */
const menu = ref(null)

/**
 * 文本域
 */
const textarea = ref(null)

/**
 * 翻译
 * @param key {String} - 键
 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
 * @returns {String} - 翻译后的文本
 */
const t = (key, params = {}) => {
	return i18nRegistry.translate(key, params)
}

/**
 * 格式化信息
 * @param content - 原始内容
 * @returns {String} - 格式化后的信息
 */
const formattingMessage = (content) => {
	return content.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;")
}

/**
 * 格式化时间戳
 * @param timestamp - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
const formatTimestamp = (timestamp) => {
	const DATE = new Date(timestamp)
	const YEAR = DATE.getFullYear()
	const MONTH = String(DATE.getMonth() + 1).padStart(2, "0")
	const DAY = String(DATE.getDate()).padStart(2, "0")
	const HOURS = String(DATE.getHours()).padStart(2, "0")
	const MINUTES = String(DATE.getMinutes()).padStart(2, "0")
	const SECONDS = String(DATE.getSeconds()).padStart(2, "0")
	const MILLISECONDS = String(DATE.getMilliseconds()).padStart(3, "0")
	return `${YEAR}-${MONTH}-${DAY} ${HOURS}:${MINUTES}:${SECONDS}.${MILLISECONDS}`
}

/**
 * 计算tokens
 * @param content - 内容
 * @returns {number} - tokens数量
 */
const tokens = (content) => {
	return encode(content).length
}

/**
 * 右键点击
 * @param event 事件
 * @param item 项
 */
const onRightClick = (event, item) => {
	event.preventDefault()
	event.stopPropagation()
	menu.value?.show(event.clientX, event.clientY, [
		{
			title: t("components.MessageCard.editMessage"),
			icon: {
				type: "svg",
				src: "#icon-inputBox"
			},
			color: "var(--theme-color)",
			onClick: () => editInput()
		},
		{
			title: t("components.MessageCard.removeMessage"),
			icon: {
				type: "svg",
				src: "#icon-delete"
			},
			color: "red",
			onClick: () => remove()
		}
	], item.id)
}

/**
 * 显示输入框
 */
const editInput = () => {
	editingContent.value.value = props.message.message.content
	editingContent.value.show = true
	nextTick(() => {
		textarea.value.focus()
		adjustTextareaHeight()
	})
}

/**
 * 保存消息
 */
const saveContent = () => {
	if (editingContent.value.value === props.message.message.content) return
	if (editingContent.value.value.trim() === "") return
	EventBus.emit("[function] editMessage", props.message.id, editingContent.value.value)
	editingContent.value.show = false
}
/**
 * 调整 textarea 高度
 */
const adjustTextareaHeight = () => {
	const TEXTAREA = textarea.value
	if (TEXTAREA) {
		TEXTAREA.style.height = "auto"
		// 获取滚动高度
		const scrollHeight = TEXTAREA.scrollHeight
		// 设置最大高度为 600px
		TEXTAREA.style.height = Math.min(scrollHeight, 600) + "px"
	}
}

/**
 * 移除消息
 */
const remove = () => {
	EventBus.emit("[function] removeMessage", props.message.id)
}
</script>

<template>
	<RightClickMenu ref="menu"/>
	<div
		:class="['system-message-card', currentMessageId === message.id ? 'current' : '']"
		@contextmenu.prevent="onRightClick($event, message)">
		<div class="message-content">
			<div v-if="!editingContent.show" v-html="formattingMessage(message.message.content)"></div>
			<textarea
				v-else
				spellcheck="false"
				v-model="editingContent.value"
				class="content-input"
				ref="textarea"
				@input="adjustTextareaHeight"></textarea>
		</div>
		<div class="message-bottom">
			<div class="functional-controls" v-if="controls">
				<template v-if="editingContent.show">
					<Button @click="editingContent.show = false">
						{{ t("components.MessageCard.cancel") }}
					</Button>
					<Button @click="saveContent">{{ t("components.MessageCard.save") }}</Button>
				</template>
				<template v-if="!editingContent.show">
					<Button @click="editInput">{{ t("components.MessageCard.editMessage") }}</Button>
					<Button @click="remove">{{ t("components.MessageCard.removeMessage") }}</Button>
				</template>
			</div>
			<div v-if="!controls"></div>
			<div class="message-info">
				<div>
					{{
						message.status === "error" ? t("components.MessageCard.error") : message.status === "loading" ? t("components.MessageCard.loading") : t("components.MessageCard.done")
					}}
					-
					{{ t("components.Role.SystemMessageCard.systemPrompt") }}
					-
					{{ formatTimestamp(message.timestamp) }}
				</div>
				<div>{{ message.id }} - {{ tokens(message.message.content) }} tokens</div>
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

.current {
	border: 1px solid red !important;
	transition: border 0.3s ease-in-out;
}

.system-message-card {
	position: relative;
	padding: 16px 20px;
	border-radius: 12px;
	border: 1px solid transparent;
	background-color: var(--chat-system-background-color);
	color: var(--chat-system-text-color);

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
		transition: opacity 0.3s ease-in-out;
	}

	.message-info {
		font-size: 12px;
		color: var(--chat-dialogue-time-text-color);
	}
}
</style>