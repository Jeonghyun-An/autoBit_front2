<template>
  <div class="mt-6">
    <h2 class="text-lg font-bold mb-2">🧾 백테스트 결과</h2>
    <table class="w-full border text-sm">
      <thead class="bg-gray-100">
        <tr>
          <th class="border px-2 py-1">액션</th>
          <th class="border px-2 py-1">가격 (₩)</th>
          <th class="border px-2 py-1">BTC</th>
          <th class="border px-2 py-1">모델</th>
          <th class="border px-2 py-1">전략</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="index" class="text-center">
          <td class="border px-2 py-1">{{ item.action }}</td>
          <td class="border px-2 py-1">{{ item.price.toLocaleString() }}</td>
          <td class="border px-2 py-1">{{ parseFloat(item.btc).toFixed(6) }}</td>
          <td class="border px-2 py-1">{{ item.model }}</td>
          <td class="border px-2 py-1">{{ item.strategy }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{ items: any[] }>()
</script>
