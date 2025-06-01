<script>
import {defineComponent, ref, onMounted, onUnmounted} from "vue"
import ModelList from "@/assets/data/ModelList.json"
import Chat from "@/services/api/Chat"
import EventBus from "@/services/EventBus"

export default defineComponent({
    name: "AIInput",
    inject: ["$DB"],
    data() {
        return {
            // 模型选择器状态
            modelStatus: false,
            // Key选择器状态
            keyStatus: false,
            // 模型列表
            modelList: ModelList,
            // Key列表
            keyPools: null,
            // 选中的模型
            selectedModel: ModelList[0],
            // 选中的Key
            selectedKey: {
                key: "auto",
                remark: "自动",
            },
            // 输入框
            ChatInput: "",
            // 联网搜索状态
            enableWebSearch: false
        }
    },
    watch: {
        // 监听模型变化
        selectedModel(newVal) {
            this.selectModel(newVal)
        },
        // 监听Key变化
        selectedKey(newVal) {
            this.selectKey(newVal)
        }
    },
    created() {
        // 初始化Key池
        this.loadKeyPools()
    },
    setup() {
        const textareaRef = ref(null)
        const adjustTextareaHeight = () => {
            if (!textareaRef.value) return
            textareaRef.value.style.height = "auto"
            const newHeight = Math.min(textareaRef.value.scrollHeight, 600)
            textareaRef.value.style.height = `${Math.max(newHeight, 50)}px`
        }
        onMounted(() => {
            if (textareaRef.value) {
                adjustTextareaHeight()
                textareaRef.value.addEventListener("input", adjustTextareaHeight)
            }
        })
        onUnmounted(() => {
            if (textareaRef.value) {
                textareaRef.value.removeEventListener("input", adjustTextareaHeight)
            }
        })
        return {textareaRef}
    },
    methods: {
        // 点击外部关闭下拉列表
        handleClickOutside(e) {
            if (!this.$el.contains(e.target)) {
                this.modelStatus = false
                this.keyStatus = false
            }
        },
        // 选择模型
        selectModel(selectModel) {
            if (!selectModel) return
            if (selectModel === this.selectedModel.name) return
            this.selectedModel = selectModel
            this.modelStatus = false
            this.loadKeyPools()
        },
        // 选择模型
        selectKey(selectKey) {
            if (!selectKey) return
            if (selectKey === this.selectedKey.name) return
            this.selectedKey = selectKey
            this.keyStatus = false
        },
        // 加载Key
        async loadKeyPools() {
            try {
                const DEFAULT = {key: "auto", remark: "自动"}
                this.keyPools = [
                    DEFAULT,
                    ...(await this.$DB.APIKeys.where("model").equals(this.selectedModel.name).toArray())
                ]
                this.selectedKey = DEFAULT
            } catch (error) {
                console.error("[Chats AI Key] 加载Key池错误", error)
                this.$toast.error("[Chats AI Key] 加载Key池错误")
            }
        },
        // 发送
        async Send() {
            // 检查输入框是否为空
            if (this.ChatInput.trim() === "") return
            // 判断路由
            if (this.$route.name === "ChatKey") {
                await Chat.chat(crypto.randomUUID(), this.selectedModel.name, this.selectedKey.key, this.selectedModel.url, this.ChatInput.trim(), this.enableWebSearch)
            } else {
                const NEW_CHAY_KEY = crypto.randomUUID()
                this.$router.push(`/chat/${NEW_CHAY_KEY}`)
                await this.$DB.Chats.add({
                    key: NEW_CHAY_KEY,
                    title: this.$t("components.AIInput.newChat"),
                    timestamp: Date.now(),
                    data: []
                })
                // 触发事件 更新ChatsList
                EventBus.emit("chatListGet")
            }
        }
    },
    mounted() {
        document.addEventListener("click", this.handleClickOutside)
    },
    beforeDestroy() {
        document.removeEventListener("click", this.handleClickOutside)
    }
})
</script>

<template>
    <div class="AIInput">
        <!--附件栏-->
        <input id="Appendix" type="checkbox"/>
        <div class="AppendixBar">
            <!--关闭-->
            <label for="Appendix" :title="$t('components.AIInput.appendix.close')">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Close"></use>
                </svg>
            </label>
            <!--拍照-->
            <label for="Camera" :title="$t('components.AIInput.appendix.camera')">
                <input type="file" id="Camera" accept="image/*" capture="environment"/>
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Photograph"></use>
                </svg>
            </label>
            <!--相册-->
            <label for="Photos" :title="$t('components.AIInput.appendix.picture')">
                <input type="file" id="Photos" accept="image/*"/>
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-PhotoAlbum"></use>
                </svg>
            </label>
            <!--文件-->
            <label for="Files" :title="$t('components.AIInput.appendix.file')">
                <input type="file" id="Files"/>
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-File"></use>
                </svg>
            </label>
        </div>
        <!--聊天输入框-->
        <textarea
            id="ChatInput"
            :placeholder="$t('components.AIInput.inputTip')"
            ref="textareaRef"
            spellcheck="false"
            v-model="ChatInput"></textarea>
        <!--按钮栏-->
        <div class="ButtonBar">
            <!--附件-->
            <label for="Appendix" :title="$t('components.AIInput.function.appendix')" @click="modelStatus = false">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Link"></use>
                </svg>
            </label>
            <!--联网搜索-->
            <input id="Search" type="checkbox" v-model="enableWebSearch"/>
            <label for="Search" :title="$t('components.AIInput.function.webSearch')">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Networking"></use>
                </svg>
            </label>
            <!-- 模型选择 -->
            <div class="ModelSelector">
                <div class="SelectedModel" :class="{ 'Open': modelStatus }"
                     @click="modelStatus = !modelStatus">
                    <img class="Logo" :src="this.selectedModel.logo" :alt="this.selectedModel.name">
                    <span class="ModelOption">{{ this.selectedModel.name }}</span>
                </div>
                <transition name="slide">
                    <ul v-show="modelStatus" class="ModelList">
                        <li
                            v-for="model in modelList"
                            :key="model.name"
                            @click="this.selectedModel = model"
                            :class="{ 'Active': model.name === this.selectedModel.name }">
                            <img :src="model.logo" class="Logo" :alt="model.name">
                            <span class="ModelOption">{{ model.name }}</span>
                        </li>
                    </ul>
                </transition>
            </div>
            <!-- Key选择 -->
            <div class="KeySelector">
                <div class="SelectedKey" :class="{ 'Open': keyStatus }"
                     @click="keyStatus = !keyStatus">
                    <span class="KeyOption">{{ this.selectedKey.remark }}</span>
                </div>
                <transition name="slide">
                    <ul v-show="keyStatus" class="KeyList">
                        <li
                            v-for="key in keyPools"
                            :key="key.key"
                            @click="this.selectedKey = key"
                            :class="{ 'Active': key.key === this.selectedKey.key }">
                            <span class="KeyOption">{{ key.remark }}</span>
                        </li>
                    </ul>
                </transition>
            </div>
            <div></div>
            <!--发送-->
            <label for="Send" :title="$t('components.AIInput.function.send')" class="Send" @click="Send">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Send"></use>
                </svg>
            </label>
        </div>
    </div>
</template>

<style scoped lang="less">
.icon {
    width: 2em;
    height: 2em;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
}

@media screen and (max-width: 768px) {
    .AIInput {
        width: 100% !important;
    }
}

.AIInput {
    position: relative;
    padding: 16px;
    margin: 0 10px;
    width: 50%;
    border: 2px solid var(--border-color);
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .ButtonBar {
        padding: 5px;
        width: 100%;
        display: grid;
        grid-template-columns: auto auto auto auto 1fr auto;
        gap: 10px;

        label {
            padding: 10px;
            font-size: 12px;
            border-radius: 50%;
            border: 2px solid var(--chat-input-button-border-color);
            cursor: pointer;
            outline: none;
            transition: all 0.2s ease-in-out, transform 0.1s ease-in-out;

            &:hover {
                box-shadow: 0 0 5px 3px var(--box-shadow-color);
            }

            &:active {
                transform: scale(0.9);
            }
        }

        .Send {
            background-color: var(--chat-input-button-send-background-color);
        }
    }
}

.ModelSelector, .KeySelector {
    width: 170px;
    position: relative;
    user-select: none;

    .SelectedModel, .SelectedKey {
        display: flex;
        align-items: center;
        padding: 12px;
        border: 2px solid var(--chat-input-button-border-color);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
        background-color: var(--background-color);

        &:hover {
            border-color: #80ceff;
            box-shadow: 0 2px 8px var(--box-shadow-color);
        }
    }

    .Open {
        border-radius: 8px 8px 0 0;
    }

    .ModelList, .KeyList {
        position: absolute;
        left: 0;
        right: 0;
        list-style: none;
        border: 1px solid var(--border-color);
        border-top: none;
        border-radius: 0 0 8px 8px;
        background-color: var(--background-color);
        overflow: hidden;

        li {
            display: flex;
            align-items: center;
            padding: 12px;
            cursor: pointer;
            transition: background 0.2s;

            &:hover {
                background-color: var(--background-color-Anti);
                color: var(--background-color);
            }
        }

        .Active {
            --Active-Background-Color: rgba(189, 229, 255, 0.5);
            background-color: var(--Active-Background-Color);
            color: #292A2DFF;

            &:hover {
                background-color: var(--Active-Background-Color);
                color: #292A2DFF;
            }
        }
    }

    .Logo {
        width: 24px;
        height: 18px;
        margin-right: 12px;
        border-radius: 2px;
        object-fit: cover;
    }

    .ModelOption, .KeyOption {
        font-size: 14px;
    }

    .slide-enter-active,
    .slide-leave-active {
        transition: all 0.3s ease;
    }

    .slide-enter-from,
    .slide-leave-to {
        opacity: 0;
        transform: translateY(-10px);
    }
}

#Appendix, #Camera, #Photos, #Files, #Search {
    display: none;
}

#ChatInput {
    width: 100%;
    min-height: 50px;
    max-height: 600px;
    color: var(--text-color);
    font-size: 16px;
    letter-spacing: 3px;
    background: none;
    border: none;
    resize: none;

    &:focus {
        outline: none;
    }
}


.AppendixBar {
    z-index: 1;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    border-radius: 16px;
    overflow: hidden;
    pointer-events: none;
    transition: all 0.2s 0.4s ease-in-out;

    label {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px;
        border-radius: 50%;
        border: 2px solid var(--chat-input-attachment-button-border-color);
        font-size: 14px;
        color: var(--chat-input-attachment-button-text-color);
        background-color: var(--chat-input-attachment-button-background-color);
        opacity: 0;
        transition: all 0.2s ease-in-out;
        transform: translate(-600%, 600%);
        cursor: pointer;
    }

    & :nth-child(1) {
        transition-delay: 0.1s;
    }

    & :nth-child(2) {
        transition-delay: 0.2s;
    }

    & :nth-child(3) {
        transition-delay: 0.3s;
    }

    & :nth-child(4) {
        transition-delay: 0.4s;
    }
}

#Appendix {
    &:checked {
        & ~ .AppendixBar {
            background-color: var(--scrollbar-thumb-hover-color);
            backdrop-filter: blur(5px);
            pointer-events: all;
            transition: all 0.2s ease-in-out;

            label {
                opacity: 1;
                transform: translate(0);
            }
        }
    }
}

#Search {
    &:checked + label {
        border: 2px solid lightskyblue;
        color: lightskyblue;
    }
}
</style>