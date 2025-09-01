<template>
  <div v-if="!sources?.length" class="text-sm text-zinc-400">
    연결된 근거가 없습니다.
  </div>
  <div v-else class="space-y-2">
    <div
      v-for="(s, i) in sources"
      :key="s.id || i"
      class="rounded-xl border border-zinc-800 p-3 bg-zinc-900/40"
    >
      <div class="flex items-center justify-between gap-3">
        <!-- <div class="font-medium text-sm">
          {{ s.title || s.metadata?.title || s.doc_id || "문서" }}
        </div> -->
        <span v-if="typeof s.score === 'number'" class="text-xs text-zinc-400"
          >score {{ s.score.toFixed(3) }}</span
        >
      </div>
      <div class="mt-1 text-sm text-zinc-300 whitespace-pre-line">
        {{ (s.snippet && s.snippet.trim()) || s.metadata?.text?.slice(0, 300) }}
      </div>
      <div class="mt-2 text-xs text-zinc-400 flex flex-wrap gap-2">
        <span v-if="s.page != null">p.{{ s.page }}</span>
        <span v-if="s.chunk_index != null">chunk #{{ s.chunk_index }}</span>
        <span v-if="s.metadata?.section">TITLE: {{ s.metadata.section }}</span>
        <a
          v-if="s.url"
          class="underline underline-offset-2 hover:text-zinc-200"
          :href="s.url"
          target="_blank"
          rel="noreferrer"
          >원문 열기</a
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SourceMeta } from "@/composables/useApi";

defineProps<{ sources?: SourceMeta[] }>();
</script>
