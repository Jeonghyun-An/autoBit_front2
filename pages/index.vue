<template>
  <div class="p-6 text-center">
    <h1 class="text-4xl font-bold text-blue-600">🚀 Tailwind + Nuxt 세팅 완료!</h1>
    <p class="mt-2 text-gray-500">이제부터 마음껏 시작하세요.</p>
    
  </div>
</template>
<script setup lang="ts">
const config = useRuntimeConfig()
console.log("✅ 백엔드 주소:", config.public.backendHost)
</script>
