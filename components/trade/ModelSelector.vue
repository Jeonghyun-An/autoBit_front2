<template>
  <div class="flex gap-8">
    <div class ="flex-1">
        <p class="flex p-2 text-sm text-slate-800 ">Model</p>
    <select v-model="model" class="p-2 border rounded-lg w-full">
      <option value="lstm">LSTM</option>
      <option value="xgb">XGBoost</option>
    </select>
</div>
    <div class="flex-1">
        <p class="flex p-2 text-sm text-slate-800 ">Strategy</p>
    <select v-model="strategy" class="p-2 border rounded-lg w-full">
      <option value="basic">기본</option>
      <option value="ema">EMA</option>
      <option value="macd">MACD</option>
    </select>
    </div>
     </div>

    <div class="flex flex-1 py-2 ">
        <button
      @click="emitRun"
      :disabled="loading"
      class="bg-slate-600 text-white w-full py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50"
    >
      {{ loading ? '실행 중...' : '실행' }}
    </button>
   
    
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineProps } from 'vue'

const emit = defineEmits(['run'])
const props = defineProps<{ loading: boolean }>()

const model = ref('lstm')
const strategy = ref('basic')

const emitRun = () => {
  emit('run', {
    model: model.value,
    strategy: strategy.value,
    threshold: 100000,
  })
}

</script>
