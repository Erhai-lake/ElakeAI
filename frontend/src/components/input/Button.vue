<script>
export default {
	name: "Button"
}
</script>

<template>
	<button>
		<slot/>
	</button>
</template>

<style scoped lang="less">
button {
	padding: 10px 30px;
	background-color: var(--background-color);
	color: var(--text-color);
	border: 1px solid #909399FF;
	border-radius: 8px;
	font-size: 14px;
	cursor: pointer;
	user-select: none;
	transition: all 0.15s;
	white-space: nowrap;

	&:hover {
		background-color: var(--button-hover-background-color);
	}

	&:active {
		background-color: var(--button-active-background-color);
	}

	&:disabled {
		background-color: var(--disabled-background-color);
		color: var(--disabled-text-color);
		border-color: var(--border-color);
		cursor: not-allowed;
	}
}
</style>