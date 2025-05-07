<template>
    <!--    <HomeSidebar>-->
    <!--        <template #SidebarConversationList>-->
    <!--            SidebarConversationList-->
    <!--        </template>-->
    <!--    </HomeSidebar>-->
    <HomeSidebar/>
    <!--  <nav>-->
    <!--    <router-link to="/">Home</router-link>-->
    <!--  </nav>-->
    <!--  <router-view/>-->
</template>

<style lang="less">
* {
    margin: 0;
    padding: 0;
}

#app {
    width: 100%;
    height: 100vh;
    display: flex;
}

@media (max-width: 768px) {
    #app {
        //flex-direction: column;
    }
}
</style>
<script setup lang="ts">
import HomeSidebar from "@/components/HomeSidebar.vue";
</script>