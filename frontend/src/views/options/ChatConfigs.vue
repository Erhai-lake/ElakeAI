<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from "vue"
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
import SharePreview from "@/components/options/SharePreview.vue"

const name = "ChatConfigs"

const props = defineProps({
	/**
	 * 聊天配置
	 */
	chatConfigs: {
		type: Object,
		default: () => ({})
	}
})

/**
 * 全屏
 */
const fullscreen = ref(80)

/**
 * 聊天标题
 */
const chatTitle = ref("")

/**
 * 编辑标题
 */
const editingTitle = ref({
	show: false,
	value: ""
})

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
const sharePreview = ref({
	chatKey: "",
	shareTitle: "",
	shareChoice: [],
	display: false,
	type: "chat"
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
 * 初始化组件
 */
const init = async () => {
	chatTitle.value = t("components.AIInput.newChat")
	editingTitle.value = {
		show: false,
		value: ""
	}
	await loadGlobalConfig()
	originalChatData.value = []
	chatData.value = []
	chatRecords.value = []
	page.value = 1
	totalPages.value = 0
	order.value = orderList.value[0]
	sharePreview.value = {
		chatKey: "",
		shareTitle: "",
		shareChoice: [],
		display: false,
		type: "chat"
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
		toastRegistry.error(`[${name}] ${t("views.ChatConfigs.toast.getGlobalConfigError")}`)
	}
}

/**
 * 加载聊天数据
 */
const loadChatData = async () => {
	try {
		let getChatData = null
		if (props.chatConfigs.type === "chat") {
			getChatData = await Dexie.chats.get(props.chatConfigs.chatKey)
		} else if (props.chatConfigs.type === "mask") {
			getChatData = await Dexie.masks.get(props.chatConfigs.chatKey)
		}
		if (getChatData && getChatData.data) {
			chatData.value = getChatData.data
			originalChatData.value = JSON.parse(JSON.stringify(chatData.value))
		}
		if (getChatData) {
			chatTitle.value = getChatData.title || t("components.AIInput.newChat")
			if (getChatData.configs) configs.value = getChatData.configs
		}
	} catch (error) {
		Logger.error(`[${name}] 获取聊天数据失败`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatConfigs.toast.getError")}`)
	}
}

/**
 * 显示标题输入框
 */
const titleInput = () => {
	editingTitle.value.value = chatTitle.value
	editingTitle.value.show = true
	nextTick(() => {
		const INPUT = document.querySelector(".top-title input")
		if (INPUT) {
			INPUT.focus()
		}
	})
}

/**
 * 处理标题框键盘事件
 * @param event {KeyboardEvent} - 键盘事件
 */
const handleTitleKeydown = (event) => {
	if (event.key === "Enter") {
		saveTitle()
	} else if (event.key === "Escape") {
		cancelEditTitle()
	}
}

/**
 * 保存标题
 * @returns {Promise<void>} - 保存标题的Promise
 */
const saveTitle = async () => {
	// 检查标题是否重复
	if (editingTitle.value.value === chatTitle.value) {
		editingTitle.value.show = false
		return
	}
	// 检查标题是否为空
	if (!editingTitle.value.value) {
		editingTitle.value.value = t("components.AIInput.newChat")
	}
	try {
		const NEW_TITLE = editingTitle.value.value
		chatTitle.value = NEW_TITLE
		if (props.chatConfigs.type === "chat") {
			await Dexie.chats.update(props.chatConfigs.chatKey, {title: NEW_TITLE})
			EventBus.emit("[update] chatListUpdate")
			EventBus.emit("[update] chatTitle", NEW_TITLE)
		} else if (props.chatConfigs.type === "mask") {
			await Dexie.masks.update(props.chatConfigs.chatKey, {title: NEW_TITLE})
			EventBus.emit("[update] maskListUpdate")
		}
		toastRegistry.success(`[${name}] ${t("views.ChatConfigs.toast.titleUpdated")}`)
	} catch (error) {
		Logger.error(`[${name}] 标题更新失败`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatConfigs.toast.titleUpdateError")}`)
		editingTitle.value.value = chatTitle.value
	} finally {
		editingTitle.value.show = false
	}
}

/**
 * 取消编辑标题
 */
const cancelEditTitle = () => {
	editingTitle.value.show = false
	editingTitle.value.value = chatTitle.value
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
 * 分享通信回调
 * @param data - 分享预览数据
 */
const showSharePreview = (data) => {
	if (!data) return
	sharePreview.value = data
}

/**
 * 选择分享
 */
const selectShare = (element) => {
	if (sharePreview.value.shareChoice.includes(element.id)) {
		sharePreview.value.shareChoice = sharePreview.value.shareChoice.filter(item => item !== element.id)
	} else {
		sharePreview.value.shareChoice.push(element.id)
	}
}

/**
 * 选择所有
 */
const selectAll = () => {
	if (sharePreview.value.shareChoice.length === chatData.value.length) {
		sharePreview.value.shareChoice = []
	} else {
		sharePreview.value.shareChoice = chatData.value.map(item => item.id)
	}
}

/**
 * 选择当前页
 */
const selectPage = () => {
	const CURRENT_PAGE_IDS = chatRecords.value.map(item => item.id)
	const ALL_SELECTED = CURRENT_PAGE_IDS.every(id => sharePreview.value.shareChoice.includes(id))
	if (ALL_SELECTED) {
		sharePreview.value.shareChoice = sharePreview.value.shareChoice.filter(id => !CURRENT_PAGE_IDS.includes(id))
	} else {
		sharePreview.value.shareChoice = [...new Set([...sharePreview.value.shareChoice, ...CURRENT_PAGE_IDS])]
	}
}

/**
 * 分享
 */
const share = () => {
	if (sharePreview.value.shareChoice.length === 0) {
		toastRegistry.error(`[${name}] ${t("views.ChatConfigs.toast.shareIsEmpty")}`)
		return
	}
	sharePreview.value = {
		chatKey: props.chatConfigs.chatKey,
		shareTitle: chatTitle.value,
		shareChoice: sharePreview.value.shareChoice,
		display: true,
		type: props.chatConfigs.type
	}
}

/**
 * 保存聊天配置
 */
const save = async () => {
	try {
		// 检查是否为面具
		if (props.chatConfigs.type === "chat") {
			await Dexie.chats.update(props.chatConfigs.chatKey, {
				data: JSON.parse(JSON.stringify(chatData.value)),
				configs: JSON.parse(JSON.stringify(configs.value))
			})
			EventBus.emit("[update] initChatView")
			EventBus.emit("[update] chatListUpdate")
		} else if (props.chatConfigs.type === "mask") {
			await Dexie.masks.update(props.chatConfigs.chatKey, {
				data: JSON.parse(JSON.stringify(chatData.value)),
				configs: JSON.parse(JSON.stringify(configs.value))
			})
			EventBus.emit("[update] maskListUpdate")
		}
		await close()
		toastRegistry.success(`[${name}] ${t("views.ChatConfigs.toast.saveSuccess")}`)
	} catch (error) {
		Logger.error(`[${name}] 保存聊天配置失败`, error)
		toastRegistry.error(`[${name}] ${t("views.ChatConfigs.toast.saveError")}`)
	}
}

/**
 * 关闭
 */
const close = async () => {
	await init()
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
watch(() => props.chatConfigs.display, async (newVal) => {
	await init()
	if (newVal) {
		await loadChatData()
		page.value = 1
		getChatRecords(page.value, "asc")
	}
})

onMounted(async () => {
	EventBus.on("[function] showSharePreview", showSharePreview)
	await init()
	if (props.chatConfigs.chatKey) {
		await loadChatData()
		page.value = 1
		getChatRecords(page.value, "asc")
	}
})

onUnmounted(() => {
	EventBus.off("[function] showSharePreview", showSharePreview)
})
</script>

<template>
	<SharePreview :share-title="chatTitle" :share-configs="sharePreview"/>
	<transition name="fade">
		<div class="chat-configs" v-if="chatConfigs.display" @click="close">
			<div class="chat-configs-content" :style="{width: fullscreen + '%', height: fullscreen + '%'}" @click.stop>
				<div class="title">
					<h2>{{ t(`views.ChatConfigs.${chatConfigs.type || "chat"}Setup`) }}</h2>
					<Button @click="fullscreen = fullscreen === 80 ? 95 : 80">
						<SVGIcon :name="`#icon-zoom${fullscreen === 80 ? 'In' : 'Out'}Window`" size="2em"/>
					</Button>
				</div>
				<div class="chat-configs-content-container">
					<div class="container">
						<div class="item" style="grid-template-columns: 1fr 40%">
							<p>{{ t("views.ChatConfigs.chatTitle") }}</p>
							<div class="top-title">
								<p v-show="!editingTitle.show" @click="titleInput" :title="chatTitle">
									{{ chatTitle }}
								</p>
								<input
									type="text"
									v-show="editingTitle.show"
									v-model="editingTitle.value"
									@blur="saveTitle"
									@keydown="handleTitleKeydown"
									class="title-input">
							</div>
						</div>
					</div>
					<div class="container">
						<div class="share">
							<Button @click="selectAll">
								{{
									t(`views.ChatConfigs.${sharePreview.shareChoice.length === chatData.length ? 'cancelSelectAll' : 'selectAll'}`)
								}}
							</Button>
							<Button @click="selectPage">
								{{
									t(`views.ChatConfigs.${chatRecords.map(item => item.id).every(id => sharePreview.shareChoice.includes(id)) ? 'cancelSelectPage' : 'selectPage'}`)
								}}
							</Button>
							<Button @click="share">{{ t("views.ChatConfigs.share") }}</Button>
						</div>
						<hr>
						<draggable
							v-model="chatRecords"
							item-key="id"
							handle=".move"
							animation="200"
							ghost-class="dragging-ghost"
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
											   :checked="sharePreview.shareChoice.includes(element.id)"
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
					<!--<div class="container">-->
					<!--</div>-->
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
	transform: translate(-50%, -50%) scale(1);
	background-color: var(--background-color);
	border-radius: 12px;
	display: grid;
	grid-template-rows: 50px 1fr 50px;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	z-index: 5;

	.title {
		margin-bottom: 20px;
		display: flex;
		justify-content: center;
		align-items: center;

		h2 {
			flex: 1;
			text-align: center;
		}

		button {
			padding: 5px;
		}
	}

	.chat-configs-content-container {
		padding: 0 20px;
		overflow: hidden auto;

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
	}
}

.dragging-ghost {
	padding: 2px 5px;
	opacity: 0.5;
	border-radius: 10px;
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
	grid-template-columns: repeat(3, auto);
	gap: 10px;
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