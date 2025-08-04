<template>
  <div class="p-8 max-w-xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-center text-blue-600">🚀 전략 시뮬레이션</h1>

    <div class="flex gap-4">
      <select v-model="model" class="p-2 border rounded w-full">
        <option value="lstm">LSTM</option>
        <option value="xgb">XGBoost</option>
      </select>

      <select v-model="strategy" class="p-2 border rounded w-full">
        <option value="basic">기본</option>
        <option value="ema">EMA</option>
        <option value="macd">MACD</option>
      </select>
    </div>

    <button
      @click="simulate"
      :disabled="loading"
      class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {{ loading ? '실행 중...' : '시뮬레이션 실행' }}
    </button>

    <div v-if="result" class="p-4 border rounded bg-gray-50 space-y-2">
      <p><strong>예측 가격:</strong> ₩{{ result.predicted_price.toLocaleString() }}</p>
      <p><strong>실제 가격:</strong> ₩{{ result.real_price.toLocaleString() }}</p>
      <p><strong>차이:</strong> {{ result.diff.toLocaleString() }}원</p>
      <p><strong>판단 결과:</strong> <span class="font-bold text-blue-500">{{ result.action }}</span></p>
    </div>
  </div>

  <div v-if="result?.simulated_result?.history?.length" class="mt-6">
  <h2 class="text-lg font-bold mb-2">🧾 시뮬레이션 기록</h2>
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
      <tr v-if="!result.simulated_result.history?.length" class="text-center">
        <td colspan="5" class="py-2 text-gray-500">기록 없음</td>
      </tr>
      <tr v-for="(item, index) in result.simulated_result.history" :key="index" class="text-center">
        <td class="border px-2 py-1">{{ item.action }}</td>
        <td class="border px-2 py-1">{{ item.price.toLocaleString() }}</td>
        <td class="border px-2 py-1">{{ item.btc.toFixed(6) }}</td>
        <td class="border px-2 py-1">{{ item.model }}</td>
        <td class="border px-2 py-1">{{ item.strategy }}</td>
      </tr>
    </tbody>
  </table>
</div>

</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

const config = useRuntimeConfig()

const model = ref("lstm")
const strategy = ref("basic")
const result = ref<any>(null)
const loading = ref(false)

const simulate = async () => {
  loading.value = true
  result.value = null
  try {
    const response = await axios.post(`${config.public.backendHost}strategy/simulate-trade`, null, {
      params: {
        model: model.value,
        strategy_name: strategy.value,
        threshold: 100000
      }
    })
    result.value = response.data
  } catch (e) {
    alert('시뮬레이션 실패')
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>
