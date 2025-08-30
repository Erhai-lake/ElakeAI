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
				url: "",
				blob: null
			}
		}
	},
	computed: {
		displayUrl: {
			get() {
				if (this.logoImage.blob) {
					return this.t("components.Options.LogoImage.localPlaceholder")
				}
				return this.logoImage.url || ""
			},
			set(val) {
				if (!val.startsWith(this.t("components.Options.LogoImage.localPlaceholder"))) {
					this.logoImage.url = val
					this.logoImage.blob = null
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
				if (LOGO_IMAGE_DATA?.value) {
					this.logoImage = {
						enabled:  LOGO_IMAGE_DATA.value.enabled,
						url: LOGO_IMAGE_DATA.value.url,
						blob: null
					}
					if (LOGO_IMAGE_DATA.value.blob) {
						this.logoImage.blob = new Blob([LOGO_IMAGE_DATA.value.blob])
					}
				}
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
			this.logoImage.blob = FILE
			this.logoImage.url = ""
			event.target.value = ""
			this.apply()
		},
		/**
		 * 应用
		 */
		apply: publicRegistry.debounce(async function () {
			try {
				let value = {
					enabled: this.logoImage.enabled,
					url: this.logoImage.url,
					blob: null
				}
				if (this.logoImage.blob) {
					const BUFFER = await this.logoImage.blob.arrayBuffer()
					value.blob = new Uint8Array(BUFFER)
				}
				await this.$DB.configs.put({ item: "logoImage", value })
				EventBus.emit("[update] logoImageApply")
			} catch (error) {
				this.$log.error(`[${this.name}] logo图片配置应用失败`, error)
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