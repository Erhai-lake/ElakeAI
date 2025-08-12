<script>
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {useRoute} from "vue-router"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import EventBus from "@/services/EventBus"

export default {
	name: "Sidebar",
	inject: ["$DB", "$log"],
	data() {
		return {
			name: "Sidebar",
			route: useRoute(),
			sidebarStatus: true,
			chatList: [],
			inProgress: []
		}
	},
	beforeUnmount() {
		// 移除更新列表事件监听
		EventBus.off("[update] chatListUpdate", this.chatListGet)
		EventBus.off("[stream] userMessage", this.userMessage)
		EventBus.off("[stream] streamComplete", this.streamComplete)
	},
	created() {
		// 监听更新列表事件
		EventBus.on("[update] chatListUpdate", this.chatListGet)
		EventBus.on("[stream] userMessage", this.userMessage)
		EventBus.on("[stream] streamComplete", this.streamComplete)
		// 判断是否为移动端
		if (window.innerWidth < 768) {
			this.sidebarStatus = false
		}
		// 初始化时获取聊天列表
		this.chatListGet()
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
		 * 侧边栏展开收起
		 */
		sidebarSwitch() {
			this.sidebarStatus = !this.sidebarStatus
		},
		/**
		 * 获取聊天列表
		 */
		async chatListGet() {
			try {
				const CHAT_LIST = await this.$DB.chats.toArray()
				this.chatList = CHAT_LIST.map(ITEM => {
					const lastMsg = ITEM.data.at(-1)
					return {
						key: String(ITEM.key),
						title: ITEM.title,
						length: ITEM.data.length,
						timestamp: lastMsg?.timestamp || ITEM.timestamp,
					}
				}).sort((a, b) => b.timestamp - a.timestamp)
			} catch (error) {
				this.$log.error(`[${this.name}] 聊天列表获取失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.Sidebar.toast.errorGettingChatList")}`)
			}
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
		 * 打开聊天
		 * @param key 聊天ID
		 */
		openChat(key) {
			this.$router.push(`/chat/${key}`)
		},
		/**
		 * 删除聊天
		 * @param key 聊天ID
		 */
		async deleteChat(key) {
			try {
				await this.$DB.chats.delete(key)
				toastRegistry.success(`[${this.name}] ${this.t("components.Sidebar.toast.successDeletingChatList")}`)
				await this.chatListGet()
				if (this.route.params.key === key) {
					this.$router.push("/")
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 聊天列表删除失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.Sidebar.toast.errorDeletingChatList")}`)
			}
		},
		/**
		 * 用户消息
		 * @param message {Object} - 消息
		 */
		userMessage(message) {
			this.inProgress.push(message.chatKey)
		},
		/**
		 * 流完成
		 * @param message {Object} - 消息
		 */
		streamComplete(message) {
			const INDEX = this.inProgress.indexOf(message.chatKey)
			if (INDEX !== -1) {
				this.inProgress.splice(INDEX, 1)
			}
		}
	}
}
</script>

<template>
	<div
		class="sidebar-container"
		:class="sidebarStatus ? 'sidebar-expand-container' : 'sidebar-stow-container'"
		:aria-label="t('components.Sidebar.barrierFree.title')">
		<div class="sidebar-top">
			<div class="sidebar-top-logo" aria-hidden="true"></div>
			<h1 v-if="sidebarStatus" aria-label="ElakeAI">ElakeAI</h1>
			<router-link
				to="/"
				class="sidebar-new"
				:title="t('components.Sidebar.function.new')"
				:aria-label="t('components.Sidebar.function.new')">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-new"></use>
				</svg>
			</router-link>
			<div
				class="sidebar-stow"
				:title="t('components.Sidebar.function.stow')"
				@click="sidebarSwitch"
				:aria-label="t('components.Sidebar.function.stow')">
				<svg class="icon" aria-hidden="true">
					<use xlink:href="#icon-stow"></use>
				</svg>
			</div>
		</div>
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
				@click="openChat(chatItem.key)">
				<p class="title" :title="chatItem.title" :aria-label="chatItem.title">{{ chatItem.title }}</p>
				<div class="bottom">
					<p aria-hidden="true">
						{{ t("components.Sidebar.numberOfConversations", {num: chatItem.length}) }}
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
					<svg class="icon" aria-hidden="true">
						<use xlink:href="#icon-delete"></use>
					</svg>
				</div>
			</div>
		</div>
		<div v-if="!sidebarStatus"></div>
		<div
			class="sidebar-preset"
			:title="t('components.Sidebar.function.preset')"
			:aria-label="t('components.Sidebar.function.preset')">
			<svg class="icon" aria-hidden="true">
				<use xlink:href="#icon-preset"></use>
			</svg>
			<p v-if="sidebarStatus" aria-hidden="true">{{ t("components.Sidebar.function.preset") }}</p>
		</div>
		<router-link
			to="/options"
			class="sidebar-setup"
			:title="t('components.Sidebar.function.options')"
			:aria-label="t('components.Sidebar.function.options')">
			<svg class="icon" aria-hidden="true">
				<use xlink:href="#icon-setup"></use>
			</svg>
			<p v-if="sidebarStatus" aria-hidden="true">{{ t("components.Sidebar.function.options") }}</p>
		</router-link>
	</div>
</template>

<style scoped lang="less">
.icon {
	width: 2em;
	height: 2em;
	vertical-align: -0.15em;
	fill: currentColor;
	overflow: hidden;
}

.sidebar-container {
	height: 100%;
	background-color: var(--sidebar-expand-container-background-color);
	border-right: 1px solid var(--border-color);
	overflow: hidden;
	display: grid;
	grid-template-rows: auto 1fr auto auto;
	user-select: none;
}

.sidebar-top-logo {
	width: 48px;
	height: 48px;
	background-image: url("@/assets/images/logo.svg");
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

.sidebar-preset, .sidebar-setup {
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

	.sidebar-preset, .sidebar-setup {
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

	.sidebar-preset, .sidebar-setup {
		grid-template-rows: 64px;
	}
}

.sidebar-conversation-list {
	padding: 0 20px;
	white-space: nowrap;
	overflow: hidden auto;

	.conversation-card {
		position: relative;
		padding: 10px;
		margin: 20px 0;
		border: 2px solid var(--border-color);
		border-radius: 10px;
		overflow: hidden;
		cursor: pointer;

		&.active {
			border-color: #80ceff;
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