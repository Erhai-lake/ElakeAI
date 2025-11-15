<script setup>
import {computed, onMounted, ref, watch} from "vue"
import Button from "@/components/input/Button.vue"
import InputNumber from "@/components/input/InputNumber.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"
import Selector from "@/components/input/Selector.vue"
import SVGIcon from "@/components/SVGIcon.vue"
import EventBus from "@/services/EventBus"
import {publicRegistry} from "@/services/plugin/api/PublicClass"
import InputText from "@/components/input/InputText.vue"
import draggable from "vuedraggable"
import ChatTitle from "@/components/chat/ChatTitle.vue"
import SystemMessageCard from "@/components/chat/role/SystemMessageCard.vue"
import AssistantMessageCard from "@/components/chat/role/AssistantMessageCard.vue"
import UserMessageCard from "@/components/chat/role/UserMessageCard.vue"
import html2canvas from "html2canvas"
import Loading from "@/components/Loading.vue"
import CodeBlockRenderer from "@/components/chat/renderer/CodeBlockRenderer.vue"

const name = "ChatConfigs"

const props = defineProps({
	/**
	 * 聊天ID
	 */
	chatKey: {
		type: String,
		default: null
	},
	/**
	 * 是否显示配置弹窗
	 */
	display: {
		type: Boolean,
		default: false
	},
	/**
	 * 配置类型
	 */
	type: {
		type: String,
		default: "chat"
	}
})

/**
 * 聊天标题
 */
const chatTitle = ref("")

/**
 * 聊天配置
 */
const configs = ref({
	temperature: 1,
	frequency_penalty: 0,
	top_p: 1,
	max_tokens: 2048,
	presence_penalty: 0
})

/**
 * 原始聊天数据
 */
const originalChatData = ref([])

/**
 * 聊天数据
 */
const chatData = ref([])

/**
 * 聊天记录
 */
const chatRecords = ref([])

/**
 * 分页
 */
const page = ref(1)

/**
 * 总页数
 */
const totalPages = ref(0)

/**
 * 排序方式
 */
const orderList = ref([
	{
		key: "asc",
		title: "i18n:views.ChatConfigs.asc"
	},
	{
		key: "desc",
		title: "i18n:views.ChatConfigs.desc"
	}
])

/**
 * 选择的排序方式
 */
const order = ref({
	key: "asc",
	title: "i18n:views.ChatConfigs.asc"
})

/**
 * 角色列表
 */
const roleList = ref([
	{
		title: "user"
	},
	{
		title: "assistant"
	},
	{
		title: "system"
	}
])

/**
 * 分享配置
 */
const share = ref({
	shareChoice: [],
	shareTitle: "",
	shareList: [
		{title: "png"},
		{title: "text"},
		{title: "json"}
	],
	share: {title: "png"},
	sharePreview: false,
	content: "",
	loading: false
})

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
 * 初始化组件
 */
const init = async () => {
	console.log(props)
	share.value.shareChoice = []
	await loadChatData()
	page.value = 1
	getChatRecords(page.value, "asc")
}

/**
 * 更新选中角色
 * @param role {Object} - 角色
 * @param id {String} - 消息ID
 */
const updateRoleSelected = (role, id) => {
	const MESSAGE = chatData.value.find(item => item.id === id)
	if (!MESSAGE) return
	MESSAGE.message.role = role
	const ORIGINAL = originalChatData.value.find(item => item.id === id)
	// 处理 model
	if (role === "user" || role === "system") {
		// 移除 model
		delete MESSAGE.model
	} else if (role === "assistant") {
		if (ORIGINAL && ORIGINAL.model) {
			// 原本有 model, 恢复
			MESSAGE.model = {...ORIGINAL.model}
		} else if (!MESSAGE.model) {
			// 原本没有, 新建
			MESSAGE.model = {platform: "", model: ""}
		}
	}
	const RECORD = chatRecords.value.find(item => item.id === id)
	if (RECORD) {
		RECORD.message.role = MESSAGE.message.role
		RECORD.model = MESSAGE.model
	}
}

/**
 * 更新排序类型
 * @param orderItem {Object} - 排序类型
 */
const updateOrderSelected = (orderItem) => {
	order.value = orderItem
	getChatRecords(page.value, order.value.key)
}

/**
 * 更新分享类型
 * @param shareType {Object} - 分享类型
 */
const updateShareSelected = (shareType) => {
	share.value.share = shareType
	share.value.content = ""
}

/**
 * 加载全局配置
 */
const loadGlobalConfig = async () => {
	try {
		const GLOBAL_CONFIG = await Dexie.configs.get("chatConfigs")
		if (GLOBAL_CONFIG && GLOBAL_CONFIG.value) {
			configs.value = GLOBAL_CONFIG.value
		}
	} catch (error) {
		Logger.error(`[${name}] 获取全局配置失败`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatConfigs.toast.getError")}`)
	}
}

/**
 * 计算可见页码
 */
const visiblePages = computed(() => {
	const PAGES = []
	const LEFT = Math.max(2, page.value - 2)
	const RIGHT = Math.min(totalPages.value, page.value + 2)
	// 首页
	PAGES.push(1)
	if (LEFT > 2) PAGES.push("...")
	// 中间页
	for (let i = LEFT; i <= RIGHT; i++) {
		PAGES.push(i)
	}
	// 尾页
	if (RIGHT < totalPages.value - 1) PAGES.push("...")
	if (totalPages.value > 1) PAGES.push(totalPages.value)
	return PAGES
})

/**
 * 加载聊天数据
 */
const loadChatData = async () => {
	await loadGlobalConfig()
	try {
		let getChatData = null
		if (props.type === "chat") {
			getChatData = await Dexie.chats.get(props.chatKey)
		} else if (props.type === "mask") {
			getChatData = await Dexie.masks.get(props.chatKey)
		}
		if (getChatData && getChatData.data) {
			chatData.value = getChatData.data
			originalChatData.value = JSON.parse(JSON.stringify(chatData.value))
		}
		if (getChatData && getChatData.configs) {
			chatTitle.value = getChatData.title
			share.value.shareTitle = getChatData.title
			configs.value = getChatData.configs
		}
	} catch (error) {
		Logger.error(`[${name}] 获取聊天数据失败`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatConfigs.toast.getError")}`)
	}
}

/**
 * 分页获取聊天记录
 * @param pageItem {Number} - 页码
 */
const getChatRecords = publicRegistry.debounce((pageItem = 1) => {
	const PAGE_SIZE = 10
	const OFFSET = (pageItem - 1) * PAGE_SIZE
	let records = chatData.value.slice()
	if (order.value.key === "desc") {
		records.reverse()
	}
	page.value = pageItem
	totalPages.value = Math.ceil(records.length / PAGE_SIZE)
	chatRecords.value = records.slice(OFFSET, OFFSET + PAGE_SIZE)
}, 100)

/**
 * 新增聊天记录
 */
const addChatRecord = () => {
	const MESSAGE = {
		id: crypto.randomUUID(),
		message: {
			role: "user",
			content: ""
		},
		status: "done",
		timestamp: Date.now()
	}
	chatData.value.push(MESSAGE)
	const PAGE_SIZE = 10
	totalPages.value = Math.ceil(chatData.value.length / PAGE_SIZE)
	order.value.key === "asc" ? getChatRecords(totalPages.value) : getChatRecords(1)
}

/**
 * 移除消息
 * @param id {String} - 消息ID
 */
const remove = (id) => {
	chatRecords.value = chatRecords.value.filter(item => item.id !== id)
	chatData.value = chatData.value.filter(item => item.id !== id)
}

/**
 * 拖动结束
 */
const onDragEnd = () => {
	// 重新拼接 chatData
	const PAGE_SIZE = 10
	let records = chatData.value.slice()
	if (order.value.key === "desc") {
		records.reverse()
	}
	// 替换掉当前页的数据
	const OFFSET = (page.value - 1) * PAGE_SIZE
	records.splice(OFFSET, chatRecords.value.length, ...chatRecords.value)
	// 再反转回去
	if (order.value.key === "desc") {
		records.reverse()
	}
	chatData.value = records
}

/**
 * 移动
 * @param id {String} - 消息ID
 * @param type {String} - 移动类型
 */
const move = (id, type) => {
	const PAGE_SIZE = 10
	const INDEX_ALL = chatData.value.findIndex(item => item.id === id)
	if (INDEX_ALL === -1) return
	let newIndex = INDEX_ALL
	const IS_DESC = order.value.key === "desc"
	// 移动数据
	if (type === "up") {
		if (IS_DESC && INDEX_ALL < chatData.value.length - 1) {
			[chatData.value[INDEX_ALL], chatData.value[INDEX_ALL + 1]] = [chatData.value[INDEX_ALL + 1], chatData.value[INDEX_ALL]]
			newIndex = INDEX_ALL + 1
		} else if (!IS_DESC && INDEX_ALL > 0) {
			[chatData.value[INDEX_ALL - 1], chatData.value[INDEX_ALL]] = [chatData.value[INDEX_ALL], chatData.value[INDEX_ALL - 1]]
			newIndex = INDEX_ALL - 1
		} else return
	} else if (type === "down") {
		if (IS_DESC && INDEX_ALL > 0) {
			[chatData.value[INDEX_ALL - 1], chatData.value[INDEX_ALL]] = [chatData.value[INDEX_ALL], chatData.value[INDEX_ALL - 1]]
			newIndex = INDEX_ALL - 1
		} else if (!IS_DESC && INDEX_ALL < chatData.value.length - 1) {
			[chatData.value[INDEX_ALL], chatData.value[INDEX_ALL + 1]] = [chatData.value[INDEX_ALL + 1], chatData.value[INDEX_ALL]]
			newIndex = INDEX_ALL + 1
		} else return
	}
	// 当前页索引范围
	const PAGE_START = IS_DESC
		? chatData.value.length - page.value * PAGE_SIZE
		: (page.value - 1) * PAGE_SIZE
	const PAGE_END = PAGE_START + PAGE_SIZE - 1
	// 判断是否需要翻页
	if (!IS_DESC) {
		if (newIndex < PAGE_START && page.value > 1) {
			page.value--
		} else if (newIndex > PAGE_END && page.value < totalPages.value) {
			page.value++
		}
	} else {
		if (newIndex < PAGE_START && page.value < totalPages.value) {
			page.value++
		} else if (newIndex > PAGE_END && page.value > 1) {
			page.value--
		}
	}
	// 更新当前页显示
	getChatRecords(page.value)
}

/**
 * 选择分享
 */
const selectShare = (element) => {
	if (share.value.shareChoice.includes(element.id)) {
		share.value.shareChoice = share.value.shareChoice.filter(item => item !== element.id)
	} else {
		share.value.shareChoice.push(element.id)
	}
}

/**
 * 选择所有
 */
const selectAll = () => {
	if (share.value.shareChoice.length === chatData.value.length) {
		share.value.shareChoice = []
	} else {
		share.value.shareChoice = chatData.value.map(item => item.id)
	}
}

/**
 * 选择当前页
 */
const selectPage = () => {
	const CURRENT_PAGE_IDS = chatRecords.value.map(item => item.id)
	const ALL_SELECTED = CURRENT_PAGE_IDS.every(id => share.value.shareChoice.includes(id))
	if (ALL_SELECTED) {
		share.value.shareChoice = share.value.shareChoice.filter(id => !CURRENT_PAGE_IDS.includes(id))
	} else {
		share.value.shareChoice = [...new Set([...share.value.shareChoice, ...CURRENT_PAGE_IDS])]
	}
}

/**
 * 预览
 */
const preview = () => {
	if (share.value.shareChoice.length === 0) {
		toastRegistry.error(`[${name}] ${t("views.ChatConfigs.toast.shareIsEmpty")}`)
		return
	}
	share.value.sharePreview = true
	const SELECTED_MESSAGES = chatData.value.filter(item => share.value.shareChoice.includes(item.id))
	if (share.value.share.title === "png") {
		share.value.content = SELECTED_MESSAGES
	} else if (share.value.share.title === "text") {
		let text = `# ${share.value.shareTitle}\n\n`
		SELECTED_MESSAGES.forEach(item => {
			text += `## ${item.message.role}`
			if (item.model) {
				text += ` [${item.model.platform}] [${item.model.model}]`
			}
			text += `:\n${item.message.content}\n\n`
		})
		share.value.content = text
	} else if (share.value.share.title === "json") {
		let json = {
			message: []
		}
		SELECTED_MESSAGES.forEach(item => {
			json.message.push({
				role: item.message.role,
				content: item.message.content
			})
		})
		share.value.content = JSON.stringify(json, null, 4)
	} else {
		share.value.content = SELECTED_MESSAGES.map(item => item.message.content).join("\n\n")
	}
}

/**
 * 复制
 */
const copy = async () => {
	share.value.loading = true
	try {
		if (share.value.share.title === "png") {
			const EL = sharePng.value
			if (!EL) return
			const CANVAS = await html2canvas(EL, {
				backgroundColor: null,
				useCORS: true,
				scale: 2
			})
			CANVAS.toBlob(async (blob) => {
				if (!blob) return
				await navigator.clipboard.write([
					new ClipboardItem({"image/png": blob})
				])
			})
		} else if (share.value.share.title === "text") {
			await navigator.clipboard.writeText(share.value.content)
		} else if (share.value.share.title === "json") {
			await navigator.clipboard.writeText(JSON.stringify(JSON.parse(share.value.content)))
		}
		toastRegistry.success(`[${name}] ${t("views.ChatConfigs.toast.writeToClipboard")}`)
	} catch (error) {
		Logger.error(`[${name}] 复制失败`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatConfigs.toast.copyError")}`)
	} finally {
		share.value.loading = false
	}
}

/**
 * 下载
 */
const download = async () => {
	share.value.loading = true
	try {
		const DOWNLOAD_A = document.createElement("a")
		let blob = null
		let fileName = ""
		if (share.value.share.title === "png") {
			const EL = sharePng.value
			if (!EL) return
			const CANVAS = await html2canvas(EL, {
				backgroundColor: null,
				useCORS: true,
				scale: 2
			})
			blob = await new Promise((resolve) => CANVAS.toBlob((b) => resolve(b), "image/png"))
			fileName = `${share.value.shareTitle}.png`
		} else if (share.value.share.title === "text") {
			blob = new Blob([share.value.content], {type: "text/plain;charset=utf-8"})
			fileName = `${share.value.shareTitle}.txt`
		} else if (share.value.share.title === "json") {
			blob = new Blob([JSON.stringify(JSON.parse(share.value.content))], {type: "application/json;charset=utf-8"})
			fileName = `${share.value.shareTitle}.json`
		}
		DOWNLOAD_A.href = URL.createObjectURL(blob)
		DOWNLOAD_A.download = fileName
		DOWNLOAD_A.click()
		URL.revokeObjectURL(DOWNLOAD_A.href)
		toastRegistry.success(`[${name}] ${t("views.ChatConfigs.toast.downloadSuccess")}`)
	} catch (error) {
		Logger.error(`[${name}] 下载失败`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatConfigs.toast.downloadError")}`)
	} finally {
		share.value.loading = false
	}
}

/**
 * 保存聊天配置
 */
const save = async () => {
	try {
		// 检查是否为面具
		if (props.type === "chat") {
			await Dexie.chats.update(props.chatKey, {
				data: JSON.parse(JSON.stringify(chatData.value)),
				configs: JSON.parse(JSON.stringify(configs.value))
			})
			EventBus.emit("[update] initChatView")
			EventBus.emit("[update] chatListUpdate")
		} else if (props.type === "mask") {
			await Dexie.masks.update(props.chatKey, {
				data: JSON.parse(JSON.stringify(chatData.value)),
				configs: JSON.parse(JSON.stringify(configs.value))
			})
			EventBus.emit("[update] maskListUpdate")
		}
		close()
		toastRegistry.success(`[${name}] ${t("views.ChatConfigs.toast.saveSuccess")}`)
	} catch (error) {
		Logger.error(`[${name}] 保存聊天配置失败`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatConfigs.toast.saveError")}`)
	}
}

/**
 * 关闭
 */
const close = () => {
	share.value.sharePreview = false
	EventBus.emit("[function] showChatSetup", {
		chatKey: null,
		display: false,
		type: null
	})
}

/**
 * 保存到面具
 */
const saveMask = async () => {
	try {
		await Dexie.masks.add({
			key: crypto.randomUUID(),
			title: chatTitle.value,
			data: JSON.parse(JSON.stringify(chatData.value)),
			configs: JSON.parse(JSON.stringify(configs.value))
		})
		EventBus.emit("[update] maskListUpdate")
		toastRegistry.success(`[${name}] ${t("views.ChatConfigs.toast.saveMaskSuccess")}`)
	} catch (error) {
		Logger.error(`[${name}] 保存面具失败`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatConfigs.toast.saveMaskError")}`)
	}
}

/**
 * 监听display变化
 */
watch(() => props.display, async (newVal) => {
	if (newVal) {
		await init()
	}
})
</script>

<template>
	<transition name="fade">
		<div v-if="share.sharePreview" class="share-preview">
			<Button @click="share.sharePreview = false">{{ t("views.ChatConfigs.close") }}</Button>
			<div class="function">
				<Button @click="copy">{{ t("views.ChatConfigs.copy") }}</Button>
				<Button @click="download">{{ t("views.ChatConfigs.download") }}</Button>
			</div>
			<Loading :loading="share.loading">
				<div v-if="share.share.title === 'png'" class="share" ref="sharePng">
					<div class="head">
						<p class="title">{{ share.shareTitle }}</p>
						<p class="time">
							{{ t("views.ChatConfigs.numberOfConversations", {num: share.content.length}) }}
						</p>
					</div>
					<div
						v-for="message in share.content"
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
				<CodeBlockRenderer
					v-else-if="share.share.title === 'text'"
					class="share"
					:code="decodeURIComponent(share.content)"
					language="plaintext"
					:copy="false"/>
				<CodeBlockRenderer
					v-else-if="share.share.title === 'json'"
					class="share"
					:code="decodeURIComponent(share.content)"
					language="json"
					:copy="false"/>
			</Loading>
		</div>
	</transition>
	<transition name="fade">
		<div class="chat-configs" v-show="display" @click="close">
			<div class="chat-configs-content" @click.stop>
				<h2>{{ t(`views.ChatConfigs.${props.type || "chat"}Setup`) }}</h2>
				<div class="chat-configs-content-container">
					<div class="container">
						<div class="item" style="grid-template-columns: 1fr 40%">
							<p>{{ t("views.ChatConfigs.chatTitle") }}</p>
							<ChatTitle :chatTitle="chatTitle" :chatKey="chatKey" :type="type"/>
						</div>
					</div>
					<div class="container">
						<div class="share">
							<Button @click="selectAll">
								{{
									t(`views.ChatConfigs.${share.shareChoice.length === chatData.length ? 'cancelSelectAll' : 'selectAll'}`)
								}}
							</Button>
							<Button @click="selectPage">
								{{
									t(`views.ChatConfigs.${chatRecords.map(item => item.id).every(id => share.shareChoice.includes(id)) ? 'cancelSelectPage' : 'selectPage'}`)
								}}
							</Button>
							<InputText
								v-model="share.shareTitle"
								:placeholder="t('views.ChatConfigs.shareTitle')"
								:title="t('views.ChatConfigs.shareTitle')"/>
							<Selector
								unique-key="title"
								:selector-list="share.shareList"
								:selector-selected="share.share"
								@select="updateShareSelected"
								:title="t('views.ChatConfigs.shareType')"/>
							<Button @click="preview">{{ t("views.ChatConfigs.preview") }}</Button>
						</div>
						<hr>
						<draggable
							v-model="chatRecords"
							item-key="id"
							handle=".move"
							animation="200"
							ghost-class="dragging-ghost"
							chosen-class="dragging-chosen"
							@end="onDragEnd">
							<template #item="{element}">
								<div class="chat-record-item">
									<SVGIcon name="#icon-move" class="move"/>
									<div class="move-button">
										<Button class="but" @click="move(element.id, 'up')">
											<SVGIcon name="#icon-upArrow"/>
										</Button>
										<Button class="but" @click="move(element.id, 'down')">
											<SVGIcon name="#icon-downArrow"/>
										</Button>
									</div>
									<Selector
										unique-key="title"
										:selector-list="roleList"
										:selector-selected="{title: element.message.role}"
										@select="(role) => updateRoleSelected(role.title, element.id)"/>
									<div class="input-container" v-if="element.message.role === 'assistant'">
										<InputText v-model="element.model.platform"/>
										<InputText v-model="element.model.model"/>
									</div>
									<div v-else></div>
									<textarea spellcheck="false" v-model="element.message.content"></textarea>
									<Button class="but" @click="remove(element.id)">
										<SVGIcon name="#icon-close"/>
									</Button>
									<label>
										<input type="checkbox"
											   :checked="share.shareChoice.includes(element.id)"
											   @change="selectShare(element)">
										<span class="custom-checkbox"></span>
									</label>
								</div>
							</template>
						</draggable>
						<hr>
						<div class="pagination">
							<Button @click="addChatRecord()">{{ t("views.ChatConfigs.addChatRecord") }}</Button>
							<Selector
								unique-key="key"
								:selector-list="orderList"
								:selector-selected="order"
								@select="updateOrderSelected"/>
							<Button @click="getChatRecords(page - 1)" :disabled="page === 1">
								{{ t("views.ChatConfigs.previousPage") }}
							</Button>
							<div class="page-btn-container">
								<Button
									v-for="num in visiblePages"
									:key="num"
									:class="['page-btn', { active: num === page, ellipsis: num === '...' }]"
									@click="getChatRecords(num)"
									:disabled="num === '...'">
									{{ num }}
								</Button>
							</div>
							<Button @click="getChatRecords(page + 1)" :disabled="page === totalPages">
								{{ t("views.ChatConfigs.nextPage") }}
							</Button>
							<InputNumber
								@input="getChatRecords(page)"
								v-model="page"
								:min="1"
								:max="totalPages"
								mode="slider"/>
						</div>
					</div>
					<div class="container">
						<div class="item">
							<p>{{ t("views.ChatConfigs.temperature") }} [<em>temperature</em>]</p>
							<InputNumber
								v-model="configs.temperature"
								mode="slider"
								:min="0.1"
								:max="2"
								:step="0.1"/>
						</div>
						<div class="item">
							<p>{{ t("views.ChatConfigs.top_p") }} [<em>top_p</em>]</p>
							<InputNumber
								v-model="configs.top_p"
								mode="slider"
								:min="0.1"
								:max="1"
								:step="0.1"/>
						</div>
						<div class="item">
							<p>{{ t("views.ChatConfigs.max_tokens") }} [<em>max_tokens</em>]</p>
							<InputNumber
								v-model="configs.max_tokens"
								:min="1"
								:max="4096"/>
						</div>
						<div class="item">
							<p>{{ t("views.ChatConfigs.presence_penalty") }} [<em>presence_penalty</em>]</p>
							<InputNumber
								v-model="configs.presence_penalty"
								mode="slider"
								:min="-2"
								:max="2"
								:step="0.1"/>
						</div>
						<div class="item">
							<p>{{ t("views.ChatConfigs.frequency_penalty") }} [<em>frequency_penalty</em>]</p>
							<InputNumber
								v-model="configs.frequency_penalty"
								mode="slider"
								:min="-2"
								:max="2"
								:step="0.1"/>
						</div>
					</div>
					<!--					<div class="container">-->
					<!--					</div>-->
				</div>
				<div class="but">
					<Button @click="close">{{ t("views.ChatConfigs.close") }}</Button>
					<Button @click="save">{{ t("views.ChatConfigs.save") }}</Button>
					<Button @click="saveMask">{{ t("views.ChatConfigs.saveMask") }}</Button>
					<Button @click="loadGlobalConfig">{{ t("views.ChatConfigs.global") }}</Button>
				</div>
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
	top: 50%;
	left: 50%;
	padding: 20px;
	width: 80%;
	height: 80%;
	transform: translate(-50%, -50%);
	background-color: var(--background-color);
	border-radius: 12px;
	display: grid;
	grid-template-rows: auto auto 1fr;
	gap: 10px;
	z-index: 6;
	overflow: hidden auto;

	.share {
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

.chat-configs {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(127, 127, 127, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 4;
}

.chat-configs-content {
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
	grid-template-rows: 50px 1fr 50px;
	z-index: 5;

	h2 {
		text-align: center;
	}

	.chat-configs-content-container {
		padding: 0 20px;
		overflow: hidden auto;
	}
}

.dragging-chosen {
	background-color: var(--theme-color);
}

.dragging-ghost {
	opacity: 0.5;
	background-color: var(--theme-color);
}

.chat-record-item {
	margin: 10px 0;
	display: grid;
	grid-template-columns: auto auto 100px auto 1fr auto auto;
	align-items: center;
	gap: 5px;

	.move {
		cursor: move;
	}

	.move-button {
		button {
			height: 22px;
		}

		button:first-child {
			border-radius: 8px 8px 0 0;
		}

		button:last-child {
			border-radius: 0 0 8px 8px;
		}
	}

	.input-container {
		margin-left: 5px;
		display: grid;
		grid-template-columns: 100px 150px;
		gap: 5px;
	}

	textarea {
		padding: 10px 12px;
		box-sizing: border-box;
		width: 100%;
		height: 45px;
		background-color: var(--background-color);
		color: var(--text-color);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 14px;
		resize: none;

		&:focus {
			outline: none;
			border-color: var(--button-hover-background-color);
			box-shadow: 0 0 4px var(--button-hover-background-color);
		}
	}

	.but {
		width: 100%;
		height: 45px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	input[type="checkbox"] {
		display: none;

		&:checked + .custom-checkbox::after {
			opacity: 1;
		}
	}

	.custom-checkbox {
		display: inline-block;
		width: 20px;
		height: 20px;
		box-sizing: border-box;
		vertical-align: middle;
		border: 2px solid var(--border-color);
		border-radius: 4px;
		position: relative;
		cursor: pointer;

		&::after {
			content: "";
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 10px;
			height: 10px;
			background-color: var(--background-color-anti);
			border-radius: 2px;
			opacity: 0;
		}
	}
}

.share {
	margin-bottom: 20px;
	width: 100%;
	border-radius: 20px;
	display: grid;
	grid-template-columns: repeat(5, auto);
	gap: 10px;

	.head {
		padding: 0 20px;
		box-sizing: border-box;
		height: 65px;
		border-radius: 20px;
		border: 1px solid var(--border-color);
		box-shadow: 0 6px 15px 0 var(--box-shadow-color);
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;

		.title {
			font-size: 20px;
			font-weight: bold;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			cursor: pointer;
		}

		.time {
			font-size: 14px;
			color: var(--text-secondary-color);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
}

.pagination {
	margin-top: 20px;
	width: 100%;
	display: grid;
	grid-template-columns: 100px 100px auto 1fr auto auto;
	gap: 10px;

	.page-btn-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;

		.page-btn {
			padding: 10px;
		}

		.page-btn.active {
			background-color: var(--theme-color);
			color: var(--text-color-anti);
		}

		.page-btn.ellipsis {
			cursor: default;
			background: transparent;
			border: none;
		}
	}
}

.container {
	padding: 20px;
	margin-bottom: 20px;
	border-radius: 10px;
	background-color: rgba(127, 127, 127, 0.5);
	border: 1px solid var(--border-color);
}

.item {
	padding: 10px;
	display: grid;
	grid-template-columns: 1fr 200px;
	align-items: center;
	gap: 10px;
	border-bottom: 1px solid var(--border-color);
	border-top: 1px solid var(--border-color);
	white-space: nowrap;
}

.but {
	padding: 10px;
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 20px;
}
</style>