<!-- Latin numerals, always: an Arabic-Indic digit a supplied value carries is mapped, and the run is isolated left-to-right (Principle V, FR-026). -->
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ value: string | number }>();

const ARABIC = '٠١٢٣٤٥٦٧٨٩';
const EASTERN = '۰۱۲۳۴۵۶۷۸۹';

const rendered = computed(() => {
  let out = String(props.value);
  for (let index = 0; index < 10; index += 1) {
    out = out.split(ARABIC.charAt(index)).join(String(index));
    out = out.split(EASTERN.charAt(index)).join(String(index));
  }
  return out;
});
</script>

<template>
  <span class="wf-numeral" dir="ltr">{{ rendered }}</span>
</template>

<style scoped>
.wf-numeral {
  direction: ltr;
  unicode-bidi: isolate;
  font-family: var(--wf-font-mono);
  font-variant-numeric: tabular-nums;
}
</style>
