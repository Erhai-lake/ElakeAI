<script>
import FoldingPanel from "@/components/FoldingPanel.vue"
import ThemeSelect from "@/components/options/ThemeSwitch.vue"
import LanguageSelect from "@/components/options/LanguageSelect.vue"
import ChatAIKey from "@/components/options/ChatsAIKey.vue"
import DefaultChatSettings from "@/components/options/DefaultChatSettings.vue"
import Button from "@/components/Button.vue"

export default {
    name: "OptionsView",
    components: {DefaultChatSettings, Button, ChatAIKey, LanguageSelect, ThemeSelect, FoldingPanel}
}
</script>

<template>
    <div class="OptionsContainer">
        <FoldingPanel>
            <template #Title>
                {{ $t("views.OptionsView.personalization") }}
            </template>
            <template #Content>
                <div class="Item">
                    {{ $t("views.OptionsView.theme") }}
                    <ThemeSelect/>
                </div>
                <div class="Item">
                    {{ $t("views.OptionsView.language") }}
                    <LanguageSelect/>
                </div>
            </template>
        </FoldingPanel>
        <FoldingPanel :Height="600">
            <template #Title>
                {{ $t("views.OptionsView.chats") }}
            </template>
            <template #Content>
                <ChatAIKey/>
                <div class="Item">
                    {{ $t("views.OptionsView.defaultChatSettings") }}
                    <DefaultChatSettings/>
                </div>
            </template>
        </FoldingPanel>
        <div class="Container">
            <router-link :to="{ path: '/options/debug' }">
                <Button>BeBUG</Button>
            </router-link>
            <router-link :to="{ path: '/options/log' }">
                <Button>Log</Button>
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
    white-space: nowrap;
    gap: 10px;
}

.Container {
    padding: 20px;
    margin: 5px 0;
    border-radius: 10px;
    user-select: none;
    background-color: #b3b3b33f;
    display: flex;
    gap: 10px;
}
</style>