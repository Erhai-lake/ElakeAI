<script>
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import SVGIcon from "@/components/SVGIcon.vue"
import RightClickMenu from "@/components/RightClickMenu.vue"
import Button from "@/components/input/Button.vue"
import InputText from "@/components/input/InputText.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import EventBus from "@/services/EventBus"

export default {
	name: "ArchivesChatView",
	inject: ["$DB", "$log"],
	components: {InputText, Button, RightClickMenu, SVGIcon},
	data() {
		return {
			archives: []
		}
	},
	beforeUnmount() {
		EventBus.off("[update] archivesListUpdate", this.getArchivesChats)
	},
	created() {
		EventBus.on("[update] archivesListUpdate", this.getArchivesChats)
		this.getArchivesChats()
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
		 * 获取归档列表
		 * @param search {String} - 搜索关键词
		 */
		async getArchivesChats(search = "") {
			try {
				let archives = await this.$DB.archives.toArray()
				// 如果有搜索词, 进行本地过滤
				if (search && search.trim() !== "") {
					const KEYWORD = search.trim().toLowerCase()
					archives = archives.filter(archive =>
						(archive.value.title && archive.value.title.toLowerCase().includes(KEYWORD))
					)
				}
				this.archives = archives
			} catch (error) {
				this.$log.error(`[${this.name}] 归档列表获取失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ArchivesChatView.toast.errorGettingArchivesChatList")}`)
			}
		},
		/**
		 * 右键点击
		 * @param event 事件
		 * @param item 项
		 */
		onRightClick(event, item) {
			event.preventDefault()
			event.stopPropagation()
			this.$refs.menu.show(event.clientX, event.clientY, [
				{
					title: this.t("views.ArchivesChatView.openChat"),
					icon: {
						type: "svg",
						src: "#icon-new"
					},
					color: "var(--theme-color)",
					onClick: () => this.openChat(item)
				},
				{
					title: this.t("views.ArchivesChatView.deleteChat"),
					icon: {
						type: "svg",
						src: "#icon-close"
					},
					color: "red",
					onClick: (key) => this.deleteChat(key)
				}
			], item.key)
		},
		/**
		 * 打开聊天
		 * @param archive 归档
		 */
		async openChat(archive) {
			try {
				await this.$DB.chats.add(JSON.parse(JSON.stringify(archive.value)))
				await this.$DB.archives.delete(archive.key)
				this.$router.push({name: "ChatKey", params: {key: archive.value.key}})
				EventBus.emit("[update] chatListUpdate")
			} catch (error) {
				this.$log.error(`[${this.name}] 聊天列表打开失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ArchivesChatView.toast.errorOpeningChat")}`)
			}
		},
		/**
		 * 删除聊天
		 * @param key 键
		 */
		async deleteChat(key) {
			try {
				await this.$DB.archives.delete(key)
				await this.getArchivesChats()
			} catch (error) {
				this.$log.error(`[${this.name}] 聊天删除失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.ArchivesChatView.toast.errorDeletingChat")}`)
			}
		}
	}
}
</script>

<template>
	<RightClickMenu ref="menu"/>
	<div class="archives-chat-view">
		<div class="header">
			<InputText :placeholder="t('views.ArchivesChatView.search')" @input="getArchivesChats"/>
		</div>
		<div class="container">
			<div
				class="item"
				v-for="archive in archives"
				:key="archive.key"
				@contextmenu.prevent="onRightClick($event, archive)">
				<div class="left">
					<p>{{ archive.value.title }}</p>
					<p>{{ t("views.MaskView.num", {num: archive.value.data ? archive.value.data.length : 0}) }}</p>
				</div>
				<div class="right">
					<Button @click="openChat(archive)">
						<SVGIcon name="#icon-new"/>
						{{ t("views.MaskView.chat") }}
					</Button>
					<Button @click="deleteChat(archive.key)">
						<SVGIcon name="#icon-close"/>
						{{ t("views.MaskView.delete") }}
					</Button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="less">
.archives-chat-view {
	padding: 20px;
	box-sizing: border-box;
	height: 100%;
	display: grid;
	grid-template-rows: 38px 1fr;
	overflow: hidden;
}

.header {
	display: grid;
	grid-template-columns: 1fr;
}

.container {
	margin-top: 20px;
	overflow: auto;

	.item {
		padding: 15px;
		display: grid;
		grid-template-columns: 1fr auto;
		border: 1px solid var(--border-color);
		transition: background-color 0.3s ease-in-out;

		&:hover {
			background-color: var(--active-background-color);

			.right {
				opacity: 1;
			}
		}

		&:first-child {
			border-top-right-radius: 10px;
			border-top-left-radius: 10px;
		}

		&:last-child {
			border-bottom-right-radius: 10px;
			border-bottom-left-radius: 10px;
		}

		.right {
			display: flex;
			gap: 10px;
			opacity: 0;
			transition: opacity 0.3s ease-in-out;
		}
	}
}
</style>