// composables/useTradeSocket.ts
export const useTradeSocket = () => {
    const messages = ref<any[]>([])
    let socket: WebSocket | null = null

    const connect = () => {
        socket = new WebSocket("ws://localhost:8000/ws/trades")

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.type === "trade_update") {
                messages.value.unshift(data.payload)  // 최신 기록 먼저
            }
        }

        socket.onclose = () => {
            console.warn("WebSocket 연결 종료됨")
        }

        socket.onerror = (err) => {
            console.error("WebSocket 오류 발생:", err)
        }
    }

    onMounted(() => connect())

    return {
        messages,
    }
}
