<script>
import Button from "@/components/input/Button.vue"
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
		{{ t("views.OptionsView.AboutView.aboutApp") }}
		<router-link to="/options/aboutElakeAI">
			<Button>{{ t("views.OptionsView.AboutView.view") }}</Button>
		</router-link>
	</div>
	<div class="item">
		{{ t("views.OptionsView.AboutView.githubRepo") }}
		<a href="https://github.com/Erhai-lake/ElakeAI" target="_blank">
			<Button>{{ t("views.OptionsView.AboutView.view") }}</Button>
		</a>
	</div>
	<div class="item">
		{{ t("views.OptionsView.AboutView.contactSupport") }}
		<a href="mailto:fuzixuan0714.0826@gmail.com">
			<Button>{{ t("views.OptionsView.AboutView.view") }}</Button>
		</a>
	</div>
	<div class="item">
		{{ t("views.OptionsView.AboutView.openSourceDeclaration") }}
		<router-link to="/options/openSourceDeclaration">
			<Button>{{ t("views.OptionsView.AboutView.view") }}</Button>
		</router-link>
	</div>
</template>

<style scoped lang="less">
.item {
	padding: 10px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	border-bottom: 1px solid var(--border-color);
	border-top: 1px solid var(--border-color);
	white-space: nowrap;
}
</style>
