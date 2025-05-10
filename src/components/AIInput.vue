<script lang="ts">
import {defineComponent, ref, onMounted} from 'vue';

export default defineComponent({
    name: "AIInput",
    setup() {
        const textareaRef = ref<HTMLTextAreaElement | null>(null)
        const adjustTextareaHeight = () => {
            if (!textareaRef.value) return
            textareaRef.value.style.height = 'auto'
            const newHeight = Math.min(textareaRef.value.scrollHeight, 600)
            textareaRef.value.style.height = `${Math.max(newHeight, 50)}px`
        }
        onMounted(() => {
            if (textareaRef.value) {
                adjustTextareaHeight()
                textareaRef.value.addEventListener('input', adjustTextareaHeight)
            }
        })
        return {textareaRef}
    }
})
</script>

<template>
    <div class="AIInput">
        <!--附件栏-->
        <input id="Appendix" type="checkbox"/>
        <div class="AppendixBar">
            <!--关闭-->
            <label for="Appendix">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Close"></use>
                </svg>
            </label>
            <!--拍照-->
            <input type="file" id="Camera" accept="image/*" capture="environment"/>
            <label for="Camera">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Photograph"></use>
                </svg>
            </label>
            <!--相册-->
            <input type="file" id="Photos" accept="image/*"/>
            <label for="Photos">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-PhotoAlbum"></use>
                </svg>
            </label>
            <!--文件-->
            <input type="file" id="Files"/>
            <label for="Files">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-File"></use>
                </svg>
            </label>
        </div>
        <textarea id="ChatInput" placeholder="想问点什么?" ref="textareaRef"></textarea>
        <div class="ButtonBar">
            <!--附件-->
            <label for="Appendix">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Link"></use>
                </svg>
            </label>
            <!--联网搜索-->
            <input id="Search" type="checkbox"/>
            <label for="Search">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Networking"></use>
                </svg>
            </label>
            <div></div>
            <!--语音-->
            <input id="Voice" type="checkbox"/>
            <label for="Voice">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Microphone-on"></use>
                </svg>
            </label>
            <!--发送-->
            <label for="Send" class="Send">
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

.AIInput {
    position: relative;
    padding: 16px;
    margin: 0 10px;
    width: 100%;
    border: 2px solid var(--border-color);
    border-radius: 15px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .ButtonBar {
        width: 100%;
        display: grid;
        grid-template-columns: auto auto 1fr auto auto;
        gap: 10px;

        label {
            padding: 10px;
            border-radius: 50%;
            border: 2px solid var(--chat-input-button-border-color);
            cursor: pointer;
            outline: none;
            transition: all 0.2s ease-in-out, transform 0.1s ease-in-out;

            &:hover {
                box-shadow: 0 0 5px 3px var(--chat-input-button-hover-shadow-color);
            }

            &:active {
                transform: scale(0.9);
            }
        }

        .Send {
            background-color: var(--chat-input-button-send-background-color);
        }
    }

    .AppendixBar {
        position: absolute;
        width: 100%;
        height: 100%;
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;

        label {
            padding: 15px;
            border-radius: 50%;
            border: 2px solid var(--chat-input-attachment-button-border-color);
            font-size: 14px;
            color: var(--chat-input-attachment-button-text-color);
            background-color: var(--chat-input-attachment-button-background-color);
            cursor: pointer;
        }
    }
}


#Appendix, #Camera, #Photos, #Files, #Search, #Voice {
    display: none;
}

#ChatInput {
    margin: 10px 0;
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

#Appendix {
    & ~ .AppendixBar {
        display: none;
    }

    &:checked ~ .AppendixBar {
        display: flex;
    }
}

#Search {
    &:checked + label {
        border: 2px solid lightskyblue;
        color: lightskyblue;
    }
}
</style>