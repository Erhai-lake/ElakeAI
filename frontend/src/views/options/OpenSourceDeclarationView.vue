<script setup>
import {computed} from 'vue'
import {i18nRegistry} from "@/services/plugin/api/I18nClass"
import Button from "@/components/input/Button.vue"
import OpenSourceDeclaration from "@/assets/data/OpenSourceDeclaration.json"

/**
 * 开源声明数据
 */
const data = OpenSourceDeclaration

/**
 * 按 category 分组
 */
const grouped = computed(() => {
	return data.reduce((acc, item) => {
		(acc[item.category] ||= []).push(item)
		return acc
	}, {})
})

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
</script>

<template>
	<div class="category" v-for="(items, category) in grouped" :key="category">
		<h3 class="category-title">{{ category }}</h3>
		<div class="item" v-for="item in items" :key="item.name">
		<span class="info">
			<strong>{{ item.name }}</strong>
			<em class="license">({{ item.license }})</em> -
			<span class="desc">{{ item.description }}</span>
		</span>
			<a :href="item.url" target="_blank">
				<Button size="sm">{{ t("views.OptionsView.OpenSourceDeclarationView.view") }}</Button>
			</a>
		</div>
	</div>
</template>

<style scoped lang="less">
.category {
	margin-bottom: 20px;
}

.category-title {
	padding-left: 8px;
	margin: 12px 0;
	font-size: 1.1em;
	font-weight: bold;
	color: var(--text-primary);
	border-left: 4px solid var(--primary-color);
}

.item {
	padding: 10px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	border-bottom: 1px solid var(--border-color);
	border-top: 1px solid var(--border-color);
	white-space: nowrap;
	transition: background-color 0.3s ease-in-out;

	&:hover {
		background-color: var(--active-background-color);
	}
}

.info {
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
}

.license {
	margin-left: 4px;
	color: var(--text-secondary);
	font-size: 0.9em;
}

.desc {
	margin-left: 6px;
	color: var(--text-secondary);
	font-size: 0.95em;
}

a {
	text-decoration: none;
}
</style>