<script>
import FoldingPanel from "@/components/FoldingPanel.vue";
import ThemeSelect from "@/components/ThemeSwitch.vue";
import LanguageSelect from "@/components/LanguageSelect.vue";

export default {
    name: 'Setup',
    components: {LanguageSelect, ThemeSelect, FoldingPanel}
}
</script>

<template>
    <div class="SetupContainer">
        <FoldingPanel>
            <template #Title>
                {{ $t('Setup.Personalization') }}
            </template>
            <template #Content>
                <div class="Item">
                    {{ $t('Setup.Theme') }}
                    <ThemeSelect/>
                </div>
                <div class="Item">
                    {{ $t('Setup.Language') }}
                    <LanguageSelect/>
                </div>
            </template>
        </FoldingPanel>
    </div>
</template>

<style scoped lang="less">
.SetupContainer {
    padding: 20px;
}

.Item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    border-bottom: 1px solid var(--border-color);
    border-top: 1px solid var(--border-color);
}
</style>