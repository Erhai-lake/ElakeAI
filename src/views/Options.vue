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
        <div class="Container">
            <router-link :to="{ path: '/debug' }">
                <button>DeBUG</button>
            </router-link>
        </div>
    </div>
</template>

<style scoped lang="less">
.OptionsContainer {
    padding: 20px;
}

.Item {
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-color);
    border-top: 1px solid var(--border-color);
}

.Container {
    padding: 20px;
    margin: 5px 0;
    border-radius: 10px;
    user-select: none;
    background-color: #b3b3b33f;
}

button {
    padding: 10px 30px;
    background-color: var(--button-background-color);
    color: var(--text-color);
    border: 1px solid #909399FF;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    user-select: none;
    transition: all 0.15s;

    &:hover {
        background-color: var(--button-hover-background-color);
    }

    &:active {
        background-color: var(--button-active-background-color);
    }
}
</style>