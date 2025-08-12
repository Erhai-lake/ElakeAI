<script>
export default {
	name: "Loading",
	props: {
		loading: {
			type: Boolean,
			default: false
		},
		text: {
			type: String,
			default: ""
		}
	},
}
</script>

<template>
	<div class="loading-wrapper" :class="{ active: loading }">
		<slot/>
		<div class="loading-mask" v-if="loading">
			<div class="loading-spinner">
				<!--可以通过 slot 传入自定义 spinner-->
				<slot name="spinner">
					<div class="default-spinner"></div>
				</slot>
				<div class="loading-text" v-if="text" v-html="text.replace(/\n/g, '<br />')"></div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="less">
.loading-wrapper {
	position: relative;
	width: 100%;
	height: 100%;
}

.loading-mask {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--loading-mask-background-color);
	z-index: 10;
	pointer-events: all;
}

.loading-spinner {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.default-spinner {
	width: 40px;
	height: 40px;
	border: 4px solid var(--loading-spinner-border-color);
	border-top-color: #80ceff;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

.loading-text {
	margin-top: 10px;
	font-size: 14px;
	color: var(--text-color);
	text-align: center;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>