<script>
import InputText from "@/components/input/InputText.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import {publicRegistry} from "@/services/plugin/api/PublicClass"
import EventBus from "@/services/EventBus"

export default {
	name: "LeftMenuTitle",
	inject: ["$DB", "$log"],
	components: {InputText},
	data() {
		return {
			name: "LeftMenuTitle",
			leftMenuTitle: {
				enabled: false,
				title: "ElakeAI"
			}
		}
	},
	watch: {
		"leftMenuTitle.title" () {
			this.apply()
		}
	},
	created() {
		this.read()
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
		 * 读取
		 */
		async read() {
			try {
				const LEFT_MENU_TITLE_DATA = await this.$DB.configs.get("leftMenuTitle")
				this.leftMenuTitle = LEFT_MENU_TITLE_DATA ? LEFT_MENU_TITLE_DATA.value : this.leftMenuTitle
			} catch (error) {
				this.$log.error(`[${this.name}] 左侧菜单标题配置获取失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.Options.LeftMenuTitle.toast.getLeftMenuTitleError")}`)
			}
		},
		/**
		 * 应用
		 */
		apply: publicRegistry.debounce(async function () {
			try {
				await this.$DB.configs.put({
					item: "leftMenuTitle",
					value: JSON.parse(JSON.stringify(this.leftMenuTitle))
				})
				EventBus.emit("[update] leftMenuTitleApply")
			} catch (error) {
				this.$log.error(`[${this.name}] 左侧菜单标题配置应用失败`, {
					leftMenuTitle: this.leftMenuTitle,
					error
				})
				toastRegistry.error(`[${this.name}] ${this.t("components.Options.LeftMenuTitle.toast.applyLeftMenuTitleError")}`)
			}
		}, 500)
	}
}
</script>

<template>
	<div class="left-menu-title">
		<label class="switch">
			<input type="checkbox" v-model="leftMenuTitle.enabled" @change="apply"/>
			<span class="custom-checkbox"></span>
		</label>
		<InputText class="text" v-model="leftMenuTitle.title" :disabled="!leftMenuTitle.enabled"/>
	</div>
</template>

<style scoped lang="less">
.left-menu-title {
	display: flex;
	gap: 10px;
}

.text {
	width: 250px;
}

input[type="checkbox"] {
	display: none;

	&:checked + .custom-checkbox::after {
		opacity: 1;
	}
}

.switch {
	display: flex;
	align-items: center;
	padding: 8px 0;
	cursor: pointer;

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
</style>