<template>
  <div v-if="trades.length">
    <h2 class="text-lg font-bold mb-2">🧾 시뮬레이션 기록</h2>
    <table class="w-full border text-sm">
      <thead class="bg-gray-100">
        <tr>
          <th class="border px-2 py-1">액션</th>
          <th class="border px-2 py-1">가격</th>
          <th class="border px-2 py-1">모델</th>
          <th class="border px-2 py-1">전략</th>
          <th class="border px-2 py-1">차이</th>
          <th class="border px-2 py-1">시각</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in trades" :key="t.id" class="text-center">
          <td class="border px-2 py-1">{{ t.action }}</td>
          <td class="border px-2 py-1">{{ t.price.toLocaleString() }}</td>
          <td class="border px-2 py-1">{{ t.model }}</td>
          <td class="border px-2 py-1">{{ t.strategy }}</td>
          <td class="border px-2 py-1">{{ t.diff.toFixed(2) }}</td>
          <td class="border px-2 py-1">{{ formatDate(t.created_at) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <TradeChart :trades="trades" />

</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

onMounted(() => {
  const ws = new WebSocket('ws://localhost:8000/ws/trades')

  ws.onmessage = (event) => {
    try {
      trades.value = JSON.parse(event.data)
    } catch (e) {
      console.error('WebSocket parsing error', e)
    }
  }
})

defineProps<{ trades: any[] }>()


const config = useRuntimeConfig()
const trades = ref<any[]>([])

const fetchTrades = async () => {
  const res = await axios.get(`${config.public.backendHost}trade/trades`)
  trades.value = res.data
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR')
}

onMounted(fetchTrades)
</script>
