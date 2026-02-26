<template>
  <div class="space-y-1">
    <div class="flex items-center justify-between">
      <label class="text-xs font-medium text-zinc-600">{{ label }}</label>
      <span
        class="text-xs font-mono font-semibold text-slate-800 min-w-[3rem] text-right"
      >
        {{ displayValue }}
      </span>
    </div>
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      @input="onInput"
      class="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-zinc-200 accent-slate-800"
    />
    <div class="flex justify-between text-[10px] text-zinc-400">
      <span>{{ min }}</span>
      <span v-if="hint" class="text-center px-2 truncate">{{ hint }}</span>
      <span>{{ max }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    modelValue: number;
    min: number;
    max: number;
    step?: number;
    decimals?: number;
    hint?: string;
  }>(),
  {
    step: 1,
    decimals: 0,
  },
);

const emit = defineEmits<{ "update:modelValue": [value: number] }>();

const displayValue = computed(() =>
  props.decimals > 0
    ? props.modelValue.toFixed(props.decimals)
    : String(props.modelValue),
);

function onInput(e: Event) {
  const v = parseFloat((e.target as HTMLInputElement).value);
  emit(
    "update:modelValue",
    props.decimals > 0 ? parseFloat(v.toFixed(props.decimals)) : v,
  );
}
</script>
