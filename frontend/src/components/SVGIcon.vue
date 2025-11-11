<script setup>
defineProps({
	name: {
		type: String,
		default: ""
	},
	size: {
		type: String,
		default: "1em"
	}
})
</script>

<template>
	<svg class="icon" :style="`--size: ${size}`" aria-hidden="true">
		<use :href="name"></use>
	</svg>
</template>

<style scoped lang="less">
.icon {
	width: var(--size);
	height: var(--size);
	vertical-align: -0.15em;
	fill: currentColor;
	overflow: hidden;
}
</style>