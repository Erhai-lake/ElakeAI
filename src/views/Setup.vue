<script>
import FoldingPanel from "@/components/FoldingPanel.vue";
import ThemeSelect from "@/components/ThemeSwitch.vue";

export default {
    name: 'Setup',
    components: {ThemeSelect, FoldingPanel}
}
</script>

<template>
    <div class="SetupContainer">
        <FoldingPanel>
            <template #Title>
                个性化
            </template>
            <template #Content>
                <div class="Item">
                    <p>主题</p>
                    <ThemeSelect/>
                </div>
            </template>
        </FoldingPanel>
    </div>
</template>

<style scoped lang="less">
.SetupContainer {
    padding: 20px;
}

.Item{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
}
</style>