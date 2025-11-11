<script setup>
import {nextTick, ref, watch} from "vue"
import EventBus from "@/services/EventBus"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "ChatTitle"

/**
 * 定义组件属性
 */
const props = defineProps({
	chatTitle: {
		type: String,
		default: ""
	},
	chatKey: {
		type: String,
		default: ""
	},
	type: {
		type: String,
		default: "chat"
	}
})

/**
 * 编辑标题
 */
const editingTitle = ref({
	show: false,
	value: ""
})

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
 * 标题
 */
const title = ref(props.chatTitle || t("components.AIInput.newChat"))

/**
 * 显示标题输入框
 */
const titleInput = () => {
	editingTitle.value.value = title.value
	editingTitle.value.show = true
	nextTick(() => {
		const INPUT = document.querySelector(".top-title input")
		if (INPUT) {
			INPUT.focus()
		}
	})
}

/**
 * 保存标题
 * @returns {Promise<void>} - 保存标题的Promise
 */
const saveTitle = async () => {
	// 检查标题是否重复
	if (editingTitle.value.value === title.value) {
		editingTitle.value.show = false
		return
	}
	// 检查标题是否为空
	if (!editingTitle.value.value) {
		editingTitle.value.value = t("components.AIInput.newChat")
	}
	try {
		const NEW_TITLE = editingTitle.value.value
		title.value = NEW_TITLE
		if (props.type === "chat") {
			await Dexie.chats.update(props.chatKey, {title: NEW_TITLE})
			EventBus.emit("[update] chatListUpdate")
			EventBus.emit("[update] chatTitle", NEW_TITLE)
		} else if (props.type === "mask") {
			await Dexie.masks.update(props.chatKey, {title: NEW_TITLE})
			EventBus.emit("[update] maskListUpdate")
		}
		toastRegistry.success(t("views.ChatView.toast.titleUpdated"))
	} catch (error) {
		Logger.error(`[${name}] 标题更新失败`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatView.toast.titleUpdateError")}`)
		editingTitle.value.value = title.value
	} finally {
		editingTitle.value.show = false
	}
}

/**
 * 处理标题键盘事件
 * @param e {KeyboardEvent} - 键盘事件
 */
const handleTitleKeydown = (e) => {
	if (e.key === "Enter") {
		saveTitle()
	} else if (e.key === "Escape") {
		cancelEditTitle()
	}
}

/**
 * 取消编辑标题
 */
const cancelEditTitle = () => {
	editingTitle.value.show = false
	editingTitle.value.value = title.value
}

/**
 * 监听chatTitle属性变化
 */
watch(() => props.chatTitle, (newTitle) => {
	title.value = newTitle || t("components.AIInput.newChat")
})
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
	width: 100%;
	height: 39px;
	display: flex;
	align-items: center;
	justify-content: end;

	p {
		font-size: 18px;
		font-weight: bold;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		cursor: pointer;
	}

	.title-input {
		padding: 8px 12px;
		width: 100%;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		background-color: var(--background-color);
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