<template>
    <div class="d-flex flex-column min-vh-100">
        <header-component-vue></header-component-vue>
        <notice-detail-component-vue></notice-detail-component-vue>
        <footer-component-vue class="mt-auto"></footer-component-vue>

    </div>
</template>

<script>
import HeaderComponentVue from '../components/HeaderComponent.vue'
import FooterComponentVue from '../components/FooterComponent.vue'
import NoticeDetailComponentVue from '../components/NoticeDetailComponent.vue'
export default {
    name:'NoticeDetailView',
    components:{
        HeaderComponentVue,
        FooterComponentVue,
        NoticeDetailComponentVue
    }
}
</script>

<style>

</style>