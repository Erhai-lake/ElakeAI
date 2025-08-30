<script>
import InputText from "@/components/input/InputText.vue"
import Button from "@/components/input/Button.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import {toastRegistry} from "@/services/plugin/api/ToastClass"
import EventBus from "@/services/EventBus"
import {publicRegistry} from "@/services/plugin/api/PublicClass"

export default {
	name: "LogoImage",
	inject: ["$DB", "$log"],
	components: {Button, InputText},
	data() {
		return {
			name: "LogoImage",
			logoImage: {
				enabled: false,
				url: ""
			}
		}
	},
	computed: {
		displayUrl: {
			get() {
				const URL = this.logoImage.url
				if (!URL) return ""
				// 如果是 Base64, 用占z位文本代替
				return URL.startsWith("data:image/") ? this.t("components.Options.LogoImage.base64Placeholder") : URL
			},
			set(val) {
				// 如果用户输入的不是占位符, 直接写入
				if (!val.startsWith(this.t("components.Options.LogoImage.base64Placeholder"))) {
					this.logoImage.url = val
				}
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
			try {
				const LOGO_IMAGE_DATA = await this.$DB.configs.get("logoImage")
				this.logoImage = LOGO_IMAGE_DATA ? LOGO_IMAGE_DATA.value : this.logoImage
			} catch (error) {
				this.$log.error(`[${this.name}] logo图片配置获取失败`, error)
				toastRegistry.error(`[${this.name}] ${this.t("components.Options.LogoImage.toast.getLogoImageError")}`)
			}
		},
		/**
		 * 上传
		 */
		async upload() {
			this.$refs.fileInput.click()
		},
		/**
		 * 处理文件选择
		 */
		handleFileChange(event) {
			const FILE = event.target.files[0]
			if (!FILE) return
			const READER = new FileReader()
			READER.onload = (readerEvent) => {
				this.logoImage.url = readerEvent.target.result
			}
			READER.onerror = (readerEvent) => {
				this.$log.error(`[${this.name}] logo图片读取失败`, readerEvent)
				toastRegistry.error(`[${this.name}] ${this.t("components.Options.LogoImage.toast.uploadError")}`)
			}
			READER.readAsDataURL(FILE)
			event.target.value = ""
			this.apply()
		},
		/**
		 * 应用
		 */
		apply: publicRegistry.debounce(async function () {
			try {
				await this.$DB.configs.put({
					item: "logoImage",
					value: JSON.parse(JSON.stringify(this.logoImage))
				})
				EventBus.emit("[update] logoImageApply")
			} catch (error) {
				this.$log.error(`[${this.name}] logo图片配置应用失败`, {
					logoImage: this.logoImage,
					error
				})
				toastRegistry.error(`[${this.name}] ${this.t("components.Options.LogoImage.toast.applyLogoImageError")}`)
			}
		}, 500)
	}
}
</script>

<template>
	<div class="logo-image">
		<label class="switch">
			<input type="checkbox" v-model="logoImage.enabled" @change="apply"/>
			<span class="custom-checkbox"></span>
		</label>
		<input type="file" ref="fileInput" style="display: none;" accept="image/*" @change="handleFileChange">
		<Button @click="upload" :disabled="!logoImage.enabled">
			{{ t('components.Options.LogoImage.upload') }}
		</Button>
		<InputText
			class="text"
			:placeholder="t('components.Options.LogoImage.logoImageURL')"
			:title="t('components.Options.LogoImage.logoImageURL')"
			:disabled="!logoImage.enabled"
			v-model="displayUrl"
			@input="apply"/>
	</div>
</template>

<style scoped lang="less">
.logo-image {
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