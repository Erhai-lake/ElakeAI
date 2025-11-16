<script setup>
import {onMounted, ref, watch} from "vue"
import html2canvas from "html2canvas"
import Button from "@/components/input/Button.vue"
import Loading from "@/components/Loading.vue"
import SystemMessageCard from "@/components/chat/role/SystemMessageCard.vue"
import AssistantMessageCard from "@/components/chat/role/AssistantMessageCard.vue"
import UserMessageCard from "@/components/chat/role/UserMessageCard.vue"
import CodeBlockRenderer from "@/components/chat/renderer/CodeBlockRenderer.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import InputText from "@/components/input/InputText.vue"
import Selector from "@/components/input/Selector.vue"
import EventBus from "@/services/EventBus"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "SharePreview"

const props = defineProps({
	/**
	 * 分享配置
	 */
	shareConfigs: {
		type: Object,
		default: () => ({})
	}
})

/**
 * 分享标题
 */
const title = ref("")

/**
 * 分享类型列表
 */
const shareList = [
	{title: "png"},
	{title: "text"},
	{title: "json"}
]

/**
 * 选中的分享类型
 */
const selectShare = ref({title: "png"})

/**
 * 分享内容
 */
const content = ref("")

/**
 * 分享预览格式
 */
const previewFormat = ref("")

/**
 * 分享加载状态
 */
const loading = ref(false)

/**
 * 分享图片元素
 */
const sharePng = ref(null)

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
 * 更新分享类型
 * @param shareType {Object} - 分享类型
 */
const updateShareSelected = (shareType) => {
	selectShare.value = shareType
	previewFormat.value = ""
}

/**
 * 初始化组件
 */
const init = async () => {
	selectShare.value = shareList[0]
	content.value = ""
	previewFormat.value = ""
	loading.value = false
}

/**
 * 关闭
 */
const close = async () => {
	await init()
	EventBus.emit("[function] showSharePreview", {
		shareTitle: "",
		shareChoice: props.shareConfigs.shareChoice,
		display: false,
	})
}

/**
 * 预览分享内容
 */
const preview = async () => {
	if (!props.shareConfigs.chatKey) return
	let getChatData = null
	try {
		if (props.shareConfigs.type === "chat") {
			getChatData = await Dexie.chats.get(props.shareConfigs.chatKey)
		} else if (props.shareConfigs.type === "mask") {
			getChatData = await Dexie.masks.get(props.shareConfigs.chatKey)
		}
	} catch (error) {
		Logger.error(`[${name}] 获取分享内容失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.SharePreview.toast.getError")}`)
		return
	}
	if (!getChatData || !getChatData.data) {
		Logger.error(`[${name}] 获取分享内容失败`)
		toastRegistry.error(`[${name}] ${t("components.Options.SharePreview.toast.getError")}`)
		return
	}
	const SELECTED_MESSAGES = getChatData.data.filter(item => props.shareConfigs.shareChoice.includes(item.id))
	if (selectShare.value.title === "text") {
		let text = `# ${title.value}\n\n`
		SELECTED_MESSAGES.forEach(item => {
			text += `## ${item.message.role}`
			if (item.model) {
				text += ` [${item.model.platform}] [${item.model.model}]`
			}
			text += `:\n${item.message.content}\n\n`
		})
		content.value = text
		previewFormat.value = "text"
	} else if (selectShare.value.title === "json") {
		let json = {
			message: []
		}
		SELECTED_MESSAGES.forEach(item => {
			json.message.push({
				role: item.message.role,
				content: item.message.content,
				model: item.model
			})
		})
		content.value = JSON.stringify(json, null, 4)
		previewFormat.value = "json"
	} else {
		content.value = SELECTED_MESSAGES
		previewFormat.value = "png"
	}
}

/**
 * 渲染分享图片
 * @returns {HTMLCanvasElement} - 分享图片元素
 */
const renderPicture = async () => {
	if (!sharePng.value) return
	return await html2canvas(sharePng.value, {
		backgroundColor: null,
		useCORS: true,
		scale: 2
	})
}

/**
 * 复制
 */
const copy = async () => {
	loading.value = true
	try {
		if (selectShare.value.title === "png") {
			const CANVAS = await renderPicture()
			CANVAS.toBlob(async (blob) => {
				if (!blob) return
				await navigator.clipboard.write([
					new ClipboardItem({"image/png": blob})
				])
			})
		} else if (selectShare.value.title === "text") {
			await navigator.clipboard.writeText(content.value)
		} else if (selectShare.value.title === "json") {
			await navigator.clipboard.writeText(JSON.stringify(JSON.parse(content.value)))
		}
		toastRegistry.success(`[${name}] ${t("components.Options.SharePreview.toast.writeToClipboard")}`)
	} catch (error) {
		Logger.error(`[${name}] 复制失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.SharePreview.toast.copyError")}`)
	} finally {
		loading.value = false
	}
}

/**
 * 下载
 */
const download = async () => {
	loading.value = true
	try {
		const DOWNLOAD_A = document.createElement("a")
		let blob = null
		let fileName = ""
		if (selectShare.value.title === "png") {
			const CANVAS = await renderPicture()
			blob = await new Promise((resolve) => CANVAS.toBlob((b) => resolve(b), "image/png"))
			fileName = `${title.value}.png`
		} else if (selectShare.value.title === "text") {
			blob = new Blob([content.value], {type: "text/plain;charset=utf-8"})
			fileName = `${title.value}.txt`
		} else if (selectShare.value.title === "json") {
			blob = new Blob([JSON.stringify(JSON.parse(content.value))], {type: "application/json;charset=utf-8"})
			fileName = `${title.value}.json`
		}
		DOWNLOAD_A.href = URL.createObjectURL(blob)
		DOWNLOAD_A.download = fileName
		DOWNLOAD_A.click()
		URL.revokeObjectURL(DOWNLOAD_A.href)
		toastRegistry.success(`[${name}] ${t("components.Options.SharePreview.toast.downloadSuccess")}`)
	} catch (error) {
		Logger.error(`[${name}] 下载失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Options.SharePreview.toast.downloadError")}`)
	} finally {
		loading.value = false
	}
}

/**
 * 监听分享配置变化
 */
watch(() => props.shareConfigs, async (newVal) => {
	await init()
	if (newVal.display) {
		title.value = newVal.shareTitle
	}
})

onMounted(async () => {
	await init()
	if (props.shareConfigs.chatKey) {
		title.value = props.shareConfigs.shareTitle
	}
})
</script>

<template>
	<transition name="fade">
		<div class="share-preview" v-if="shareConfigs.display" @click="close">
			<div class="share-preview-content" @click.stop>
				<Button @click="close">{{ t("components.Options.SharePreview.close") }}</Button>
				<div class="share">
					<InputText
						v-model="title"
						:placeholder="t('components.Options.SharePreview.shareTitle')"
						:title="t('components.Options.SharePreview.shareTitle')"/>
					<Selector
						unique-key="title"
						:selector-list="shareList"
						:selector-selected="selectShare"
						@select="updateShareSelected"
						:title="t('components.Options.SharePreview.shareType')"/>
					<Button @click="preview">{{ t("components.Options.SharePreview.preview") }}</Button>
				</div>
				<div class="function" v-if="previewFormat">
					<Button @click="copy">{{ t("components.Options.SharePreview.copy") }}</Button>
					<Button @click="download">{{ t("components.Options.SharePreview.download") }}</Button>
				</div>
				<Loading :loading="loading">
					<div v-if="previewFormat === 'png'" class="share-png" ref="sharePng">
						<div class="head">
							<p class="title">{{ title }}</p>
							<p class="time">
								{{ t("components.Options.SharePreview.numberOfConversations", {num: content.length}) }}
							</p>
						</div>
						<div class="message-list">
							<div
								v-for="message in content"
								:key="message.id"
								class="message"
								:data-message-id="message.id">
								<SystemMessageCard
									v-if="message.message.role === 'system'"
									:message="message"
									currentMessageId="0"
									:controls="false"/>
								<AssistantMessageCard
									v-if="message.message.role === 'assistant'"
									:message="message"
									currentMessageId="0"
									:controls="false"/>
								<UserMessageCard
									v-if="message.message.role === 'user'"
									:message="message"
									currentMessageId="0"
									:controls="false"/>
							</div>
						</div>
					</div>
					<CodeBlockRenderer
						v-else-if="previewFormat === 'text'"
						class="preview"
						:code="decodeURIComponent(content)"
						language="plaintext"
						:copy="false"/>
					<CodeBlockRenderer
						v-else-if="previewFormat === 'json'"
						class="preview"
						:code="decodeURIComponent(content)"
						language="json"
						:copy="false"/>
				</Loading>
			</div>
		</div>
	</transition>
</template>

<style scoped lang="less">
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
	opacity: 1;
}

.share-preview {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(127, 127, 127, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 5;
}

.share-preview-content {
	position: absolute;
	top: 50%;
	left: 50%;
	padding: 20px;
	width: 80%;
	height: 80%;
	transform: translate(-50%, -50%);
	background-color: var(--background-color);
	border-radius: 12px;
	display: grid;
	grid-template-rows: auto auto auto 1fr;
	gap: 10px;
	z-index: 6;
	overflow: hidden auto;

	.preview {
		padding: 20px 50px;
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 30px;
		user-select: none;
		font-size: 16px;
		line-height: 1.5;
		word-wrap: break-word;
		overflow-wrap: break-word;
		white-space: pre-wrap;
	}

	.function {
		display: flex;
		justify-content: center;
		gap: 10px;

		Button {
			flex: 1;
		}
	}
}

.share {
	width: 100%;
	border-radius: 20px;
	display: grid;
	grid-template-columns: repeat(3, auto);
	gap: 10px;
}

.share-png{
	padding: 20px;
	background-color: var(--background-color);
	border-radius: 20px;
	border: 1px solid var(--border-color);

	.head {
		padding: 20px;
		margin: 20px;
		border-radius: 20px;
		border: 1px solid var(--border-color);
		box-shadow: 0 6px 15px 0 var(--box-shadow-color);
		display: flex;
		flex-direction: column;
		justify-content: center;

		.title {
			font-size: 20px;
			font-weight: bold;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.time {
			font-size: 14px;
			color: var(--text-secondary-color);
			white-space: nowrap;
			text-overflow: ellipsis;
		}
	}

	.message-list{
		padding: 0 40px;
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 30px;

		.message {
			border-radius: 12px;
			display: flex;
			flex-direction: column;
		}
	}
}
</style>