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
        <textarea id="ChatInput" placeholder="想问点什么?" ref="textareaRef"></textarea>
        <div class="ButtonBar">
            <!--附件-->
            <input id="Appendix" type="checkbox"/>
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
            <label for="Voice">
                <svg class="icon" aria-hidden="true">
                    <use xlink:href="#icon-Microphone-on"></use>
                </svg>
            </label>
            <!--发送-->
            <label for="Send">
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
    padding: 16px;
    margin: 0 10px;
    width: 100%;
    border: 2px solid var(--border-color);
    border-radius: 15px;
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

        #Search {
            &:checked + label {
                border: 2px solid lightskyblue;
                color: lightskyblue;
            }
        }
    }
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

#Appendix, #Search {
    display: none;
}
</style>