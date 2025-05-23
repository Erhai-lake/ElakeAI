<script>
import {defineComponent} from "vue"
import AIInput from "@/components/AIInput.vue"

export default defineComponent({
    name: "HomeView",
    components: {AIInput}
})
</script>

<template>
    <div class="home">
        <AIInput/>
    </div>
</template>

<style scoped lang="less">
.home {
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>