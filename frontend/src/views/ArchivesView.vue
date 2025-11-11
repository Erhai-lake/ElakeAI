<script setup>
import {onMounted, onUnmounted, ref} from "vue"
import {useRouter} from "vue-router"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import SVGIcon from "@/components/SVGIcon.vue"
import RightClickMenu from "@/components/RightClickMenu.vue"
import Button from "@/components/input/Button.vue"
import InputText from "@/components/input/InputText.vue"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"
import EventBus from "@/services/EventBus"

const name = "ArchivesChatView"

/**
 * 路由服务
 */
const router = useRouter()

/**
 * 归档列表
 */
const archives = ref([])

/**
 * 右键点击菜单
 */
const menu = ref(null)

/**
 * 翻译函数
 * @function t
 * @param {string} key - 翻译键值
 * @param {Object} params - 翻译参数
 * @returns {string} - 翻译后的字符串
 */
const t = (key, params = {}) => {
	return i18nRegistry.translate(key, params)
}

/**
 * 获取归档列表
 * @function getArchivesChats
 * @param search {String} - 搜索关键词
 */
const getArchivesChats = async (search = "") => {
	try {
		let archivesData = await Dexie.archives.toArray()
		// 如果有搜索词, 进行本地过滤
		if (search && search.trim() !== "") {
			const KEYWORD = search.trim().toLowerCase()
			archivesData = archivesData.filter(archive =>
				(archive.value.title && archive.value.title.toLowerCase().includes(KEYWORD))
			)
		}
		archives.value = archivesData
	} catch (error) {
		Logger.error(`[${name}] 归档列表获取失败`, error)
		toastRegistry.error(`[${name}] ${t("views.ArchivesChatView.toast.errorGettingArchivesChatList")}`)
	}
}

/**
 * 右键点击
 * @function onRightClick
 * @param event 事件
 * @param item 项
 */
const onRightClick = (event, item) => {
	event.preventDefault()
	event.stopPropagation()
	menu.value.show(event.clientX, event.clientY, [
		{
			title: t("views.ArchivesChatView.openChat"),
			icon: {
				type: "svg",
				src: "#icon-new"
			},
			color: "var(--theme-color)",
			onClick: () => openChat(item)
		},
		{
			title: t("views.ArchivesChatView.deleteChat"),
			icon: {
				type: "svg",
				src: "#icon-close"
			},
			color: "red",
			onClick: (key) => deleteChat(key)
		}
	], item.key)
}

/**
 * 打开聊天
 * @function openChat
 * @param archive 归档
 */
const openChat = async (archive) => {
	try {
		await Dexie.chats.add(JSON.parse(JSON.stringify(archive.value)))
		await Dexie.archives.delete(archive.key)
		await router.push({name: "ChatKey", params: {key: archive.value.key}})
		EventBus.emit("[update] chatListUpdate")
	} catch (error) {
		Logger.error(`[${name}] 聊天列表打开失败`, error)
		toastRegistry.error(`[${name}] ${t("views.ArchivesChatView.toast.errorOpeningChat")}`)
	}
}

/**
 * 删除聊天
 * @function deleteChat
 * @param key 键
 */
const deleteChat = async (key) => {
	try {
		await Dexie.archives.delete(key)
		await getArchivesChats()
	} catch (error) {
		Logger.error(`[${name}] 聊天删除失败`, error)
		toastRegistry.error(`[${name}] ${t("views.ArchivesChatView.toast.errorDeletingChat")}`)
	}
}

onMounted(() => {
	EventBus.on("[update] archivesListUpdate", getArchivesChats)
	getArchivesChats()
})

onUnmounted(() => {
	EventBus.off("[update] archivesListUpdate", getArchivesChats)
})
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
					<p>{{ t("views.ArchivesChatView.num", {num: archive.value.data ? archive.value.data.length : 0}) }}</p>
				</div>
				<div class="right">
					<Button @click="openChat(archive)">
						<SVGIcon name="#icon-new"/>
						{{ t("views.ArchivesChatView.openChat") }}
					</Button>
					<Button @click="deleteChat(archive.key)">
						<SVGIcon name="#icon-close"/>
						{{ t("views.ArchivesChatView.deleteChat") }}
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