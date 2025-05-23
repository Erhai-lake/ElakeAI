<script>
import FoldingPanel from "@/components/FoldingPanel.vue"
import ThemeSelect from "@/components/ThemeSwitch.vue"
import LanguageSelect from "@/components/LanguageSelect.vue"

export default {
    name: "Options",
    components: {LanguageSelect, ThemeSelect, FoldingPanel}
}
</script>

<template>
    <div class="OptionsContainer">
        <FoldingPanel>
            <template #Title>
                {{ $t("Options.PERSONALIZATION") }}
            </template>
            <template #Content>
                <div class="Item">
                    {{ $t("Options.THEME") }}
                    <ThemeSelect/>
                </div>
                <div class="Item">
                    {{ $t("Options.LANGUAGE") }}
                    <LanguageSelect/>
                </div>
            </template>
        </FoldingPanel>
    </div>
</template>

<style scoped lang="less">
.OptionsContainer {
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