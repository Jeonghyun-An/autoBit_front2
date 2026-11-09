<template>
  <!-- 관리자 화면: 같은 채팅 + 응답 설정(시험 모드) + 파인튜닝·모델 관리 링크 -->
  <ChatWorkspace admin />
</template>

<script setup lang="ts">
import ChatWorkspace from "~/components/Chat/ChatWorkspace.vue";

// 관리자가 아니면 사용자 화면으로 이동 (middleware/admin-only.ts)
definePageMeta({ middleware: "admin-only" });
</script>
