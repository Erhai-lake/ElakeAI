<script setup>
import {ref, onMounted, onUnmounted, computed} from "vue"
import {useRoute, useRouter} from "vue-router"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import EventBus from "@/services/EventBus"
import RightClickMenu from "@/components/RightClickMenu.vue"
import SVGIcon from "@/components/SVGIcon.vue"
import Loading from "@/components/Loading.vue"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"

const name = "Sidebar"

// 路由和路由实例
const route = useRoute()
const router = useRouter()

// 响应式数据
const leftMenuTitle = ref(null)
const logoImage = ref({
	enabled: false,
	url: "",
	blob: null
})
const sidebarStatus = ref(true)
const chatList = ref([])
const conversationListLoading = ref(false)
const inProgress = ref([])
const menu = ref(null)

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
 * 左侧菜单标题应用
 */
const leftMenuTitleApply = async () => {
	try {
		const LEFT_MENU_TITLE_DATA = await Dexie.configs.get("leftMenuTitle")
		leftMenuTitle.value = LEFT_MENU_TITLE_DATA ? LEFT_MENU_TITLE_DATA.value : leftMenuTitle.value
	} catch (error) {
		Logger.error(`[${name}] 左侧菜单标题配置获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Sidebar.toast.getLeftMenuTitleError")}`)
	}
}

/**
 * logo图片应用
 */
const logoImageApply = async () => {
	try {
		const LOGO_IMAGE_DATA = await Dexie.configs.get("logoImage")
		if (LOGO_IMAGE_DATA?.value) {
			logoImage.value = {
				enabled: LOGO_IMAGE_DATA.value.enabled,
				url: LOGO_IMAGE_DATA.value.url,
				blob: null
			}
			if (LOGO_IMAGE_DATA.value.blob) {
				logoImage.value.blob = new Blob([LOGO_IMAGE_DATA.value.blob])
				logoImage.value.url = URL.createObjectURL(logoImage.value.blob)
			}
		}
	} catch (error) {
		Logger.error(`[${name}] logo图片配置获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Sidebar.toast.getLogoImageError")}`)
	}
}

/**
 * 侧边栏展开收起, 展开时获取聊天列表
 */
const sidebarSwitch = async () => {
	sidebarStatus.value = !sidebarStatus.value
	if (sidebarStatus.value) await chatListGet()
}

/**
 * 获取聊天列表
 */
const chatListGet = async () => {
	conversationListLoading.value = true
	try {
		const CHAT_LIST = await Dexie.chats.toArray()
		chatList.value = CHAT_LIST.map(ITEM => {
			const lastMsg = ITEM.data.at(-1)
			return {
				key: String(ITEM.key),
				title: ITEM.title,
				length: ITEM.data.length,
				timestamp: lastMsg?.timestamp || ITEM.timestamp,
			}
		}).sort((a, b) => b.timestamp - a.timestamp)
	} catch (error) {
		Logger.error(`[${name}] 聊天列表获取失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Sidebar.toast.errorGettingChatList")}`)
	} finally {
		conversationListLoading.value = false
	}
}

/**
 * 格式化时间戳
 * @param {number} timestamp 时间戳
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
	return `${YEAR}-${MONTH}-${DAY} ${HOURS}:${MINUTES}:${SECONDS}`
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
			title: t("components.Sidebar.openChat"),
			icon: {
				type: "svg",
				src: "#icon-new"
			},
			color: "var(--theme-color)",
			onClick: (key) => openChat(key)
		},
		{
			title: t("components.Sidebar.archivesChat"),
			icon: {
				type: "svg",
				src: "#icon-file"
			},
			onClick: (key) => archivesChat(key)
		},
		{
			title: t("components.Sidebar.deleteChat"),
			icon: {
				type: "svg",
				src: "#icon-delete"
			},
			color: "red",
			onClick: (key) => deleteChat(key)
		}
	], item.key)
}

/**
 * 打开聊天
 * @param key 聊天ID
 */
const openChat = (key) => {
	router.push(`/chat/${key}`)
}

/**
 * 归档聊天
 * @param key 聊天ID
 */
const archivesChat = async (key) => {
	try {
		const CHAT_DATA = await Dexie.chats.get(key)
		await Dexie.archives.add({
			key: crypto.randomUUID(),
			value: CHAT_DATA
		})
		await Dexie.chats.delete(key)
		await chatListGet()
		await router.push({name: "ArchivesChat"})
		EventBus.emit("[update] archivesListUpdate")
	} catch (error) {
		Logger.error(`[${name}] 聊天列表归档失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Sidebar.toast.errorArchivesChat")}`)
	}
}

/**
 * 删除聊天
 * @param key 聊天ID
 */
const deleteChat = async (key) => {
	try {
		await Dexie.chats.delete(key)
		await chatListGet()
		if (route.params.key === key) {
			await router.push("/")
		}
	} catch (error) {
		Logger.error(`[${name}] 聊天列表删除失败`, error)
		toastRegistry.error(`[${name}] ${t("components.Sidebar.toast.errorDeletingChat")}`)
	}
}

/**
 * 用户消息
 * @param message {Object} - 消息
 */
const userMessage = (message) => {
	inProgress.value.push(message.chatKey)
}

/**
 * 流完成
 * @param message {Object} - 消息
 */
const streamComplete = (message) => {
	const INDEX = inProgress.value.indexOf(message.chatKey)
	if (INDEX !== -1) {
		inProgress.value.splice(INDEX, 1)
	}
}

/**
 * 计算 logo URL
 */
const logoUrl = computed(() => {
	return logoImage.value?.enabled && logoImage.value?.url ? logoImage.value.url : '/images/logo.svg'
})

/**
 * 计算显示标题
 */
const displayTitle = computed(() => {
	return leftMenuTitle.value?.enabled && leftMenuTitle.value?.title ? leftMenuTitle.value.title : "ElakeAI"
})

onMounted(() => {
	// 判断是否为移动端
	if (window.innerWidth < 768) {
		sidebarStatus.value = false
	}

	EventBus.on("[update] leftMenuTitleApply", leftMenuTitleApply)
	EventBus.on("[update] logoImageApply", logoImageApply)
	EventBus.on("[update] chatListUpdate", chatListGet)
	EventBus.on("[stream] userMessage", userMessage)
	EventBus.on("[stream] streamComplete", streamComplete)

	// 初始化时获取左侧菜单标题
	leftMenuTitleApply()
	// 初始化时获取logo图片
	logoImageApply()
	// 初始化时获取聊天列表
	chatListGet()
})

onUnmounted(() => {
	EventBus.off("[update] leftMenuTitleApply", leftMenuTitleApply)
	EventBus.off("[update] logoImageApply", logoImageApply)
	EventBus.off("[update] chatListUpdate", chatListGet)
	EventBus.off("[stream] userMessage", userMessage)
	EventBus.off("[stream] streamComplete", streamComplete)
})
</script>

<template>
	<RightClickMenu ref="menu"/>
	<div
		class="sidebar-container"
		:class="sidebarStatus ? 'sidebar-expand-container' : 'sidebar-stow-container'"
		:aria-label="t('components.Sidebar.barrierFree.title')">
		<div class="sidebar-top">
			<div
				class="sidebar-top-logo"
				:style="{ backgroundImage: `url(${logoUrl})` }"
				aria-hidden="true"></div>
			<h1 v-if="sidebarStatus" aria-label="ElakeAI">
				{{ displayTitle }}
			</h1>
			<router-link
				to="/"
				class="sidebar-new"
				:title="t('components.Sidebar.function.new')"
				:aria-label="t('components.Sidebar.function.new')">
				<SVGIcon name="#icon-new" size="2em"/>
			</router-link>
			<div
				class="sidebar-stow"
				:title="t('components.Sidebar.function.stow')"
				@click="sidebarSwitch"
				:aria-label="t('components.Sidebar.function.stow')">
				<SVGIcon :name="sidebarStatus ? '#icon-stow' : '#icon-expand'" size="2em"/>
			</div>
		</div>
		<Loading :loading="conversationListLoading" class="sidebar-conversation-list-loading">
			<div
				class="sidebar-conversation-list"
				v-if="sidebarStatus"
				:aria-label="t('components.Sidebar.barrierFree.conversationList')">
				<div
					class="conversation-card"
					role="button"
					:aria-label="chatItem.title"
					:class="{ active: route.params.key === chatItem.key , progress: inProgress.includes(chatItem.key)}"
					v-for="chatItem in chatList"
					:key="chatItem.key"
					@click="openChat(chatItem.key)"
					@contextmenu.prevent="onRightClick($event, chatItem)">
					<p class="title" :title="chatItem.title" :aria-label="chatItem.title">{{ chatItem.title }}</p>
					<div class="bottom">
						<p aria-hidden="true">
							{{ chatItem.length }}
						</p>
						<p :aria-label="formatTimestamp(chatItem.timestamp)">
							{{ formatTimestamp(chatItem.timestamp) }}
						</p>
					</div>
					<div
						class="conversation-delete"
						:title="t('components.Sidebar.function.delete')"
						@click.stop="deleteChat(chatItem.key)"
						:aria-label="t('components.Sidebar.function.delete')">
						<SVGIcon name="#icon-delete" size="2em"/>
					</div>
				</div>
			</div>
		</Loading>
		<div>
			<router-link
				to="/archivesChat"
				class="sidebar-archives-chat"
				:title="t('components.Sidebar.function.archivesChat')"
				:aria-label="t('components.Sidebar.function.archivesChat')">
				<SVGIcon name="#icon-archiving" size="2em"/>
				<p v-if="sidebarStatus" aria-hidden="true">{{ t("components.Sidebar.function.archivesChat") }}</p>
			</router-link>
			<router-link
				to="/mask"
				class="sidebar-mask"
				:title="t('components.Sidebar.function.mask')"
				:aria-label="t('components.Sidebar.function.mask')">
				<SVGIcon name="#icon-mask" size="2em"/>
				<p v-if="sidebarStatus" aria-hidden="true">{{ t("components.Sidebar.function.mask") }}</p>
			</router-link>
			<router-link
				to="/options"
				class="sidebar-setup"
				:title="t('components.Sidebar.function.options')"
				:aria-label="t('components.Sidebar.function.options')">
				<SVGIcon name="#icon-setup" size="2em"/>
				<p v-if="sidebarStatus" aria-hidden="true">{{ t("components.Sidebar.function.options") }}</p>
			</router-link>
		</div>
	</div>
</template>

<style scoped lang="less">
.sidebar-container {
	height: 100%;
	background-color: var(--sidebar-expand-container-background-color);
	border-right: 1px solid var(--border-color);
	overflow: hidden;
	display: grid;
	grid-template-rows: auto 1fr auto;
	user-select: none;
	transition: width 0.3s ease-in-out;
}

.sidebar-top-logo {
	width: 48px;
	height: 48px;
	background-size: cover;
	background-repeat: no-repeat;
	background-position: center;
}

.sidebar-top {
	display: grid;
	align-items: center;
	justify-items: center;

	h1 {
		margin: 0 20px;
		font-size: 18px;
		color: var(--text-color);
	}
}

.sidebar-mask, .sidebar-archives-chat, .sidebar-setup {
	border-top: 1px solid var(--border-color);
	display: grid;
	justify-content: center;
	align-items: center;

	p {
		font-size: 16px;
		text-align: center;
	}
}

.sidebar-expand-container {
	width: 256px;

	.sidebar-top {
		padding: 0 8px;
		border-bottom: 1px solid var(--border-color);
		grid-template-rows: 64px;
		grid-template-columns: 48px 1fr repeat(2, 32px);
	}

	.sidebar-mask, .sidebar-archives-chat, .sidebar-setup {
		padding: 0 8px;
		grid-template-columns: 48px 1fr;
		grid-template-rows: 64px;
	}
}

.sidebar-stow-container {
	width: 64px;

	.sidebar-top {
		padding: 8px 0;
		grid-template-columns: 64px;
		grid-template-rows: auto auto auto;
		gap: 32px;
	}

	.sidebar-mask, .sidebar-archives-chat, .sidebar-setup {
		grid-template-rows: 64px;
	}
}

.sidebar-conversation-list-loading {
	overflow: hidden;

	.sidebar-conversation-list {
		padding: 0 20px;
		height: 100%;
		white-space: nowrap;
		overflow-y: auto;
	}

	.conversation-card {
		position: relative;
		padding: 10px;
		margin: 20px 0;
		border: 2px solid var(--border-color);
		border-radius: 10px;
		overflow: hidden;
		cursor: pointer;
		transition: background-color 0.3s ease-in-out;

		&.active {
			border-color: var(--theme-color);
		}

		&.progress {
			background-color: #9eaeb7;
		}

		&:hover {
			background-color: var(--sidebar-item-hover-background-color);

			.bottom {
				color: var(--sidebar-expand-container-info-text-color-anti);
			}

			.conversation-delete {
				transition: opacity 0.3s ease-in-out;
				opacity: 1;
			}
		}

		.title {
			color: var(--text-color);
			font-size: 16px;
			font-weight: bold;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.bottom {
			margin-top: 10px;
			color: var(--sidebar-expand-container-info-text-color);
			font-size: 12px;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.conversation-delete {
			position: absolute;
			top: 0;
			right: 0;
			opacity: 0;

			svg {
				width: 24px;
				height: 24px;
			}
		}
	}
}
</style>