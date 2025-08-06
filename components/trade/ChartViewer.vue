<template>
  <div>
    <img :src="`data:image/png;base64,${src}`" alt="Trade Chart" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ src: string }>()
</script>
