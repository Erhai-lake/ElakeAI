<script setup>
import {onMounted, onUnmounted, ref} from "vue"
import {useRouter} from "vue-router"
import Button from "@/components/input/Button.vue"
import SVGIcon from "@/components/SVGIcon.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import Dexie from "@/services/Dexie"
import Logger from "@/services/Logger"
import RightClickMenu from "@/components/RightClickMenu.vue"
import InputText from "@/components/input/InputText.vue"
import EventBus from "@/services/EventBus"

const name = "MaskView"

/**
 * 路由服务
 */
const router = useRouter()

/**
 * 面具列表
 */
const masks = ref([])

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
 * 获取面具列表
 * @function getMasks
 * @param search {String} - 搜索关键词
 */
const getMasks = async (search = "") => {
	try {
		let masksData = await Dexie.masks.toArray()
		// 如果有搜索词, 进行本地过滤
		if (search && search.trim() !== "") {
			const KEYWORD = search.trim().toLowerCase()
			masksData = masksData.filter(mask =>
				(mask.title && mask.title.toLowerCase().includes(KEYWORD))
			)
		}
		masks.value = masksData
	} catch (error) {
		Logger.error(`[${name}] 面具列表获取失败`, error)
		toastRegistry.error(`[${name}] ${t("views.MaskView.toast.errorGettingMaskList")}`)
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
			title: t("views.MaskView.chat"),
			icon: {
				type: "svg",
				src: "#icon-new"
			},
			color: "var(--theme-color)",
			onClick: () => chatMask(item)
		},
		{
			title: t("views.MaskView.config"),
			icon: {
				type: "svg",
				src: "#icon-setup"
			},
			onClick: () => configMask(item.key)
		},
		{
			title: t("views.MaskView.delete"),
			icon: {
				type: "svg",
				src: "#icon-close"
			},
			color: "red",
			onClick: () => deleteMask(item.key)
		}
	], item.key)
}

/**
 * 新建面具
 * @function newMask
 */
const newMask = async () => {
	try {
		const NEW_KEY = crypto.randomUUID()
		await Dexie.masks.add({
			key: NEW_KEY,
			title: t("components.AIInput.newChat"),
			data: []
		})
		await getMasks()
		configMask(NEW_KEY)
	} catch (error) {
		Logger.error(`[${name}] 新建面具失败`, error)
		toastRegistry.error(`[${name}] ${t("views.MaskView.toast.errorNewMask")}`)
	}
}

/**
 * 聊天面具
 * @function chatMask
 * @param mask {Object} - 面具
 */
const chatMask = async (mask) => {
	try {
		const NEW_KEY = crypto.randomUUID()
		await Dexie.chats.add({
			key: NEW_KEY,
			title: mask.title,
			data: JSON.parse(JSON.stringify(mask.data || [])),
			configs: JSON.parse(JSON.stringify(mask.configs || {})),
			timestamp: Date.now()
		})
		EventBus.emit("[update] chatListUpdate")
		await router.push({name: "ChatKey", params: {key: NEW_KEY}})
	} catch (error) {
		Logger.error(`[${name}] 面具聊天失败`, error)
		toastRegistry.error(`[${name}] ${t("views.MaskView.toast.errorChattingMask")}`)
	}
}

/**
 * 配置面具
 * @function configMask
 * @param key {String} - 面具键
 */
const configMask = (key) => {
	EventBus.emit("[function] showChatSetup", {
		chatKey: key,
		display: true,
		type: "mask"
	})
}

/**
 * 删除面具
 * @function deleteMask
 * @param key {String} - 面具键
 */
const deleteMask = async (key) => {
	try {
		await Dexie.masks.delete(key)
		await getMasks()
	} catch (error) {
		Logger.error(`[${name}] 面具删除失败`, error)
		toastRegistry.error(`[${name}] ${t("views.MaskView.toast.errorDeletingMask")}`)
	}
}

onMounted(() => {
	EventBus.on("[update] maskListUpdate", getMasks)
	getMasks()
})

onUnmounted(() => {
	EventBus.off("[update] maskListUpdate", getMasks)
})
</script>

<template>
	<RightClickMenu ref="menu"/>
	<div class="mask-view">
		<div class="header">
			<InputText :placeholder="t('views.MaskView.search')" @input="getMasks"/>
			<Button @click="newMask">
				<SVGIcon name="#icon-new"/>
				{{ t("views.MaskView.newMask") }}
			</Button>
		</div>
		<div class="container">
			<div
				class="item"
				v-for="mask in masks"
				:key="mask.key"
				@click="configMask(mask.key)"
				@contextmenu.prevent="onRightClick($event, mask)">
				<div class="left">
					<p>{{ mask.title }}</p>
					<p>{{ t("views.MaskView.num", {num: mask.data ? mask.data.length : 0}) }}</p>
				</div>
				<div class="right">
					<Button @click="chatMask(mask)" @click.stop>
						<SVGIcon name="#icon-new"/>
						{{ t("views.MaskView.chat") }}
					</Button>
					<Button @click="configMask(mask.key)" @click.stop>
						<SVGIcon name="#icon-setup"/>
						{{ t("views.MaskView.config") }}
					</Button>
					<Button @click="deleteMask(mask.key)" @click.stop>
						<SVGIcon name="#icon-close"/>
						{{ t("views.MaskView.delete") }}
					</Button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="less">
.mask-view {
	padding: 20px;
	box-sizing: border-box;
	height: 100%;
	display: grid;
	grid-template-rows: 38px 1fr;
	overflow: hidden;
}

.header {
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 10px;
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