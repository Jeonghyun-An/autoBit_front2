<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6">
    <ModelSelector @run="runBacktest" :loading="loading" />
    <ChartViewer v-if="result.chart_base64" :src="result.chart_base64" />
    <ResultTable v-if="result?.history?.length" :items="result.history" />

  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import axios from 'axios'
import ModelSelector from '../components/trade/ModelSelector.vue'
import ChartViewer from '../components/trade/ChartViewer.vue'
import ResultTable from '../components/trade/ResultTable.vue'

const config = useRuntimeConfig()
const result = ref<{ chart_base64?: string; history: any[] }>({ history: [] })
const loading = ref(false)
const ws = ref<WebSocket | null>(null)

const runBacktest = async (params: { model: string; strategy: string; threshold: number }) => {
  loading.value = true
  try {
    const res = await axios.get(`${config.public.backendHost}strategy/backtest`, {
      params: {
        model: params.model,
        strategy_name: params.strategy,
        threshold: params.threshold,
        count: 200,
      },
    })
    result.value = res.data
	await fetchChart() 
  } catch (e) {
    alert('백테스트 실패')
    console.error(e)
  } finally {
    loading.value = false
  }
}

const fetchChart = async () => {
  try {
    const res = await axios.get(`${config.public.backendHost}model/predict/plot`, {
      params: {
        model: 'lstm',
        count: 300,
        use_experiment: false,
      },
      responseType: 'arraybuffer',
    })
    const base64 = btoa(
      new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
    )
    result.value.chart_base64 = base64
  } catch (e) {
    console.error('차트 가져오기 실패:', e)
  }
}

onMounted(() => {
	fetchChart() 
  ws.value = new WebSocket('ws://localhost:8000/ws/trades')

  ws.value.onopen = () => {
    ws.value?.send('ping')
  }

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('🔥 실시간 트레이드 데이터 수신:', data)

if (data?.type === 'trade_update') {
  const payload = data.payload
  if (payload) {
    result.value.history.unshift(payload)
    if (result.value.history.length > 200) result.value.history.pop()

    // 실시간 차트 동기화
    if (payload.chart_base64) {
      result.value.chart_base64 = payload.chart_base64
    } else {
      fetchChart()
    }
  }
}
  }

  ws.value.onerror = (err) => {
    console.error('❌ WebSocket 오류:', err)
  }

  ws.value.onclose = () => {
    console.warn('🔌 WebSocket 연결 종료')

  }
})

onBeforeUnmount(() => {
  ws.value?.close()
})
</script>
