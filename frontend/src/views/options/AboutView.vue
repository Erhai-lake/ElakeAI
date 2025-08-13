<script>
import Button from "@/components/Button.vue"
import {i18nRegistry} from "@/services/plugin/api/I18nClass"

export default {
	name: "AboutView",
	components: {Button},
	methods: {
		/**
		 * 翻译
		 * @param key {String} - 键
		 * @param {Object} [params] - 插值参数, 例如 { name: "洱海" }
		 * @returns {String} - 翻译后的文本
		 */
		t(key, params = {}) {
			return i18nRegistry.translate(key, params)
		}
	}
}
</script>

<template>
	<div class="item">
		{{ t("views.AboutView.aboutApp") }}
		<router-link to="/options/about">
			<Button>{{ t("views.AboutView.aboutApp") }}</Button>
		</router-link>
	</div>
	<div class="item">
		{{ t("views.AboutView.githubRepo") }}
		<a href="https://github.com/Erhai-lake/ElakeAI" target="_blank">
			<Button>{{ t("views.AboutView.githubRepo") }}</Button>
		</a>
	</div>
	<div class="item">
		{{ t("views.AboutView.contactSupport") }}
		<a href="mailto:fuzixuan0714.0826@gmail.com">
			<Button>{{ t("views.AboutView.contactSupport") }}</Button>
		</a>
	</div>
</template>