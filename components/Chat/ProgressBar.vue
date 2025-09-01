<template>
  <div class="w-full">
    <div class="flex justify-between mb-1">
      <span class="text-xs text-zinc-400">{{ label ?? "임베딩 진행률" }}</span>
      <span class="text-xs text-zinc-400">{{ value }}%</span>
    </div>
    <div class="w-full bg-zinc-800 rounded-full h-2">
      <div
        class="h-2 rounded-full bg-gradient-to-r from-indigo-400 to-cyan-400 transition-all"
        :style="{ width: Math.min(100, Math.max(0, value)) + '%' }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ value: number; label?: string }>();
</script>
