<script>
import InputText from "@/components/input/InputText.vue"
import InputNumber from "@/components/input/InputNumber.vue"
import Button from "@/components/input/Button.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import EventBus from "@/services/EventBus"

export default {
	name: "BackgroundImage",
	inject:["$DB", "$log"],
	components: {Button, InputText, InputNumber},
	data() {
		return {
			name: "BackgroundImage",
			backgroundImage: {
				enabled: false,
				url: "https://www.loliapi.com/acg",
				opacity: 50,
				mask: 30
			}
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
			try{
				const BACKGROUND_IMAGE_DATA = await this.$DB.configs.get("backgroundImage")
				this.backgroundImage = BACKGROUND_IMAGE_DATA ? BACKGROUND_IMAGE_DATA.value : this.backgroundImage
			} catch (error) {
				this.$log.error(`[${this.name}] 背景图片配置获取失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.BackgroundImage.toast.getBackgroundImageError")}`)
			}
		},
		/**
		 * 应用
		 */
		async apply() {
			try {
				await this.$DB.configs.put({
					item: "backgroundImage",
					value: JSON.parse(JSON.stringify(this.backgroundImage))
				})
				EventBus.emit("[function] configInitialization")
				toastRegistry.success(`[${this.name}] ${this.t("components.BackgroundImage.toast.applyBackgroundImageSuccess")}`)
			} catch (error) {
				this.$log.error(`[${this.name}] 背景图片配置应用失败`, {
					backgroundImage: this.backgroundImage,
					error
				})
				toastRegistry.error(`[${this.name}] ${this.t("components.BackgroundImage.toast.applyBackgroundImageError")}`)
			}
		}
	}
}
</script>

<template>
	<div class="background-image">
		<label class="switch">
			<input type="checkbox" v-model="backgroundImage.enabled"/>
			<span class="custom-checkbox"></span>
		</label>
		<InputText
			class="input"
			:placeholder="t('components.BackgroundImage.backgroundImageURL')"
			:title="t('components.BackgroundImage.backgroundImageURL')"
			v-model="backgroundImage.url"/>
		<InputNumber
			class="input"
			:min="0"
			:max="100"
			:placeholder="t('components.BackgroundImage.backgroundImageOpacity')"
			:title="t('components.BackgroundImage.backgroundImageOpacity')"
			v-model="backgroundImage.opacity"/>
		<InputNumber
			class="input"
			:min="0"
			:max="100"
			:placeholder="t('components.BackgroundImage.backgroundImageMask')"
			:title="t('components.BackgroundImage.backgroundImageMask')"
			v-model="backgroundImage.mask"/>
		<Button @click="apply">{{ t('components.BackgroundImage.save') }}</Button>
	</div>
</template>

<style scoped lang="less">
.background-image {
	display: flex;
	gap: 10px;
}

.input {
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