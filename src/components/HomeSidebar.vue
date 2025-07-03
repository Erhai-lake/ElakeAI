<script>
import {defineComponent} from "vue"
import EventBus from "@/services/EventBus"
import {useRoute} from "vue-router"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"

export default defineComponent({
	name: "HomeSidebar",
	inject: ["$DB"],
	data() {
		return {
			name: "HomeSidebar",
			route: useRoute(),
			sidebarStatus: true,
			chatList: []
		}
	},
	mounted() {
		// 判断是否为移动端
		if (window.innerWidth < 768) {
			this.sidebarStatus = false
		}
		// 初始化时获取聊天列表
		this.chatListGet()
		// 监听更新列表事件
		EventBus.on("[update] chatListUpdate", this.chatListGet)
	},
	beforeUnmount() {
		// 移除更新列表事件监听
		EventBus.off("[update] chatListUpdate", this.chatListGet)
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
			const SIDEBAR_EXPAND = document.querySelector(".sidebar-expand-container")
			const SIDEBAR_STOW = document.querySelector(".sidebar-stow-container")
			if (this.sidebarStatus) {
				if (SIDEBAR_EXPAND) {
					SIDEBAR_EXPAND.style.transform = "translateX(-100%)"
					setTimeout(() => {
						this.sidebarStatus = false
					}, 100)
				}
			} else {
				if (SIDEBAR_STOW) {
					SIDEBAR_STOW.style.transform = "translateX(-100%)"
					setTimeout(() => {
						this.sidebarStatus = true
					}, 100)
				}
			}
		},
		/**
		 * 获取聊天列表
		 */
		async chatListGet() {
			try {
				const CHAT_LIST = await this.$DB.chats.toArray()
				let GROUPED_CHATS = []
				for (const ITEM of CHAT_LIST) {
					GROUPED_CHATS = GROUPED_CHATS || []
					let timestamp = ITEM.timestamp
					if (ITEM.data.length > 0) {
						timestamp = ITEM.data[ITEM.data.length - 1].timestamp
					}
					GROUPED_CHATS.push({
						key: String(ITEM.key),
						title: ITEM.title,
						length: ITEM.data.length,
						timestamp: timestamp,
					})
				}
				// 按时间排序
				this.chatList = GROUPED_CHATS.sort((a, b) => b.timestamp - a.timestamp)
			} catch (error) {
				this.$log.error(`[${this.name}] 聊天列表获取失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.HomeSidebar.toast.errorGettingChatList")}`)
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
				toastRegistry.success(`[${this.name}] ${this.t("components.HomeSidebar.toast.successDeletingChatList")}`)
				await this.chatListGet()
				if (this.route.params.key === key) {
					this.$router.push("/")
				}
			} catch (error) {
				this.$log.error(`[${this.name}] 聊天列表删除失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.HomeSidebar.toast.errorDeletingChatList")}`)
			}
		}
	}
})
</script>

<template>
	<div class="sidebar-container sidebar-expand-container" v-if="sidebarStatus">
		<div class="sidebar-top">
			<div class="sidebar-top-logo"></div>
			<p>ElakeAI</p>
			<router-link to="/" class="sidebar-new" :title="t('components.HomeSidebar.function.new')">
				<svg class="icon">
					<use xlink:href="#icon-new"></use>
				</svg>
			</router-link>
			<div class="sidebar-stow" :title="t('components.HomeSidebar.function.stow')" @click="sidebarSwitch">
				<svg class="icon">
					<use xlink:href="#icon-stow"></use>
				</svg>
			</div>
		</div>
		<div class="sidebar-conversation-list">
			<div
				class="conversation-card"
				:class="{ active: route.params.key === chatItem.key }"
				v-for="chatItem in chatList"
				:key="chatItem.key"
				@click="openChat(chatItem.key)">
				<p class="title" :title="chatItem.title">{{ chatItem.title }}</p>
				<div class="bottom">
					<p>{{ t("components.HomeSidebar.numberOfConversations", {num: chatItem.length}) }}</p>
					<p>{{ formatTimestamp(chatItem.timestamp) }}</p>
				</div>
				<div
					class="conversation-delete"
					:title="t('components.HomeSidebar.function.delete')"
					@click.stop="deleteChat(chatItem.key)">
					<svg class="icon">
						<use xlink:href="#icon-delete"></use>
					</svg>
				</div>
			</div>
		</div>
		<div class="sidebar-preset" :title="t('components.HomeSidebar.function.preset')">
			<svg class="icon">
				<use xlink:href="#icon-preset"></use>
			</svg>
			<p>{{ t("components.HomeSidebar.function.preset") }}</p>
		</div>
		<router-link to="/options" class="sidebar-setup" :title="t('components.HomeSidebar.function.options')">
			<svg class="icon">
				<use xlink:href="#icon-setup"></use>
			</svg>
			<p>{{ t("components.HomeSidebar.function.options") }}</p>
		</router-link>
	</div>
	<div class="sidebar-container sidebar-stow-container" v-else>
		<div class="sidebar-top-logo"></div>
		<router-link to="/" class="sidebar-new" :title="t('components.HomeSidebar.function.new')">
			<svg class="icon">
				<use xlink:href="#icon-new"></use>
			</svg>
		</router-link>
		<div class="sidebar-expand" :title="t('components.HomeSidebar.function.expand')" @click="sidebarSwitch">
			<svg class="icon">
				<use xlink:href="#icon-expand"></use>
			</svg>
		</div>
		<div class="sidebar-preset" :title="t('components.HomeSidebar.function.preset')">
			<svg class="icon">
				<use xlink:href="#icon-preset"></use>
			</svg>
		</div>
		<div></div>
		<router-link to="/options" class="sidebar-setup" :title="t('components.HomeSidebar.function.options')">
			<svg class="icon">
				<use xlink:href="#icon-setup"></use>
			</svg>
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

@media screen and (max-width: 768px) {
	.sidebar-expand-container {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 10;
	}
}

.sidebar-container {
	height: 100%;
	background-color: var(--sidebar-expand-container-background-color);
	border-right: 1px solid var(--border-color);
	display: grid;
	user-select: none;
	transform: translateX(0%);
	transition: transform 0.3s ease;

	.sidebar-top-logo {
		width: 48px;
		height: 48px;
		background-image: url("@/assets/images/logo/logo.svg");
		background-size: cover;
		background-repeat: no-repeat;
		background-position: center;
	}

	.sidebar-new,
	.sidebar-stow,
	.sidebar-preset,
	.sidebar-setup {
		cursor: pointer;
	}
}

.sidebar-expand-container {
	width: 256px;
	grid-template-rows: auto 1fr auto auto;

	.sidebar-top {
		padding: 0 8px;
		border-bottom: 1px solid var(--border-color);
		display: grid;
		grid-template-rows: 64px;
		align-items: center;
		justify-items: center;
		grid-template-columns: 48px 1fr repeat(2, 32px);

		p {
			margin: 0 20px;
			font-size: 18px;
			color: var(--text-color);
		}
	}

	.sidebar-conversation-list {
		padding: 0 20px;
		white-space: nowrap;
		overflow: hidden auto;
	}

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

	.sidebar-preset,
	.sidebar-setup {
		padding: 0 8px;
		border-top: 1px solid var(--border-color);
		display: grid;
		grid-template-columns: 48px 1fr;
		grid-template-rows: 64px;
		align-items: center;
		justify-items: center;
	}
}

.sidebar-stow-container {
	width: 64px;
	grid-template-rows: auto auto auto auto 1fr auto;
	justify-items: center;

	.sidebar-top-logo {
		margin: 15px 0;
	}

	.sidebar-new,
	.sidebar-expand,
	.sidebar-preset,
	.sidebar-setup {
		padding: 5px;
		margin: 10px 0;
		border-radius: 10px;

		&:hover {
			background-color: var(--sidebar-item-hover-background-color);
		}
	}
}
</style>