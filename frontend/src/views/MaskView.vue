<script>
import Button from "@/components/input/Button.vue"
import SVGIcon from "@/components/SVGIcon.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import ChatConfigs from "@/views/options/ChatConfigs.vue"
import EventBus from "@/services/EventBus"
import InputText from "@/components/input/InputText.vue";

export default {
	name: "MaskView",
	inject: ["$DB", "$log"],
	components: {InputText, ChatConfigs, SVGIcon, Button},
	data() {
		return {
			name: "MaskView",
			masks: [],
			maskConfigKey: null,
			showSetup: false
		}
	},
	beforeUnmount() {
		EventBus.off("[update] maskListUpdate", this.getMasks)
	},
	created() {
		EventBus.on("[update] maskListUpdate", this.getMasks)
		this.getMasks()
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
		 * 获取面具列表
		 * @param search {String} - 搜索关键词
		 */
		async getMasks(search = "") {
			try {
				let masks = await this.$DB.masks.toArray()
				// 如果有搜索词, 进行本地过滤
				if (search && search.trim() !== "") {
					const KEYWORD = search.trim().toLowerCase()
					masks = masks.filter(mask =>
						(mask.title && mask.title.toLowerCase().includes(KEYWORD))
					)
				}
				this.masks = masks
			} catch (error) {
				this.$log.error(`[${this.name}] 面具列表获取失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.MaskView.toast.errorGettingMaskList")}`)
			}
		},
		/**
		 * 新建面具
		 */
		async newMask() {
			try {
				const NEW_KEY = crypto.randomUUID()
				await this.$DB.masks.add({
					key: NEW_KEY,
					title: this.t("components.AIInput.newChat"),
					data: []
				})
				await this.getMasks()
				this.configMask(NEW_KEY)
			} catch (error) {
				this.$log.error(`[${this.name}] 新建面具失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.MaskView.toast.errorNewMask")}`)
			}
		},
		/**
		 * 聊天面具
		 * @param mask {Object} - 面具
		 */
		async chatMask(mask) {
			try {
				const NEW_KEY = crypto.randomUUID()
				await this.$DB.chats.add({
					key: NEW_KEY,
					title: mask.title,
					data: JSON.parse(JSON.stringify(mask.data || [])),
					configs: JSON.parse(JSON.stringify(mask.configs || {})),
					timestamp: Date.now()
				})
				EventBus.emit("[update] chatListUpdate")
				this.$router.push({name: "ChatKey", params: {key: NEW_KEY}})
			} catch (error) {
				this.$log.error(`[${this.name}] 面具聊天失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.MaskView.toast.errorChattingMask")}`)
			}
		},
		/**
		 * 配置面具
		 * @param key {String} - 面具键
		 */
		configMask(key) {
			this.maskConfigKey = key
			this.showSetup = true
		},
		/**
		 * 删除面具
		 * @param key {String} - 面具键
		 */
		async deleteMask(key) {
			try {
				await this.$DB.masks.delete(key)
				await this.getMasks()
			} catch (error) {
				this.$log.error(`[${this.name}] 面具删除失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("views.MaskView.toast.errorDeletingMask")}`)
			}
		}
	}
}
</script>

<template>
	<ChatConfigs v-model="showSetup" :chatKey="maskConfigKey" type="mask"/>
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
				:key="mask.key">
				<div class="left">
					<p>{{ mask.title }}</p>
					<p>{{ t("views.MaskView.num", {num: mask.data ? mask.data.length : 0}) }}</p>
				</div>
				<div class="right">
					<Button @click="chatMask(mask)">
						<SVGIcon name="#icon-new"/>
						{{ t("views.MaskView.chat") }}
					</Button>
					<Button @click="configMask(mask.key)">
						<SVGIcon name="#icon-setup"/>
						{{ t("views.MaskView.config") }}
					</Button>
					<Button @click="deleteMask(mask.key)">
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

		&:hover {
			background-color: var(--active-background-color);
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
		}
	}
}
</style>