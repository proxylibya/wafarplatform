<!-- The city combobox: the bundled fixed list, matched without diacritics, and only an entry's exact name is submitted (FR-005, AC-005). -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { normalizeArabic } from '@wafar/shared';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };

const props = defineProps<{ modelValue: string; message?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const query = ref(props.modelValue);
const open = ref(false);
/** True once an entry's exact name is the control's value. */
const chosen = ref(
  props.modelValue !== '' && cities.entries.includes(props.modelValue),
);

const matches = computed(() => {
  const needle = normalizeArabic(query.value);
  if (needle.length === 0) return cities.entries.slice(0, 8);
  return cities.entries
    .filter((entry) => normalizeArabic(entry).includes(needle))
    .slice(0, 8);
});

function choose(name: string): void {
  query.value = name;
  open.value = false;
  chosen.value = true;
  emit('update:modelValue', name);
}
</script>

<template>
  <div class="wf-city">
    <label class="wf-city__label" for="wf-city-input">المدينة</label>
    <p class="wf-city__helper">قائمة ثابتة قابلة للبحث</p>
    <input
      id="wf-city-input"
      v-model="query"
      type="search"
      autocomplete="off"
      role="combobox"
      aria-controls="wf-city-list"
      :placeholder="chosen ? undefined : 'اختر المدينة'"
      :aria-expanded="open"
      @input="open = true; chosen = false; emit('update:modelValue', query)"
      @focus="open = true"
    />
    <p v-if="message" role="alert" class="wf-city__message">{{ message }}</p>
    <ul v-if="open" id="wf-city-list" class="wf-city__list" role="listbox">
      <template v-if="matches.length > 0">
        <li v-for="entry in matches" :key="entry" role="option">
          <button type="button" @click="choose(entry)">{{ entry }}</button>
        </li>
      </template>
      <li v-else role="option" aria-disabled="true" class="wf-city__empty">
        لا توجد مدينة مطابقة
      </li>
    </ul>
  </div>
</template>

<style scoped>
.wf-city {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-1);
}
.wf-city__label {
  font-weight: var(--wf-weight-medium);
}
.wf-city__helper {
  margin: 0;
  color: var(--wf-ink-muted);
  font-size: var(--wf-text-sm);
}
.wf-city input {
  min-block-size: var(--wf-touch-floor);
  padding-inline: var(--wf-space-3);
  border: var(--wf-border-width) solid var(--wf-border);
  border-radius: var(--wf-radius);
  font: inherit;
}
.wf-city__list {
  position: absolute;
  inset-block-start: 100%;
  inset-inline: 0;
  z-index: var(--wf-z-overlay);
  max-block-size: 14rem;
  overflow: auto;
  margin: 0;
  padding: 0;
  border: var(--wf-border-width) solid var(--wf-border);
  border-radius: var(--wf-radius);
  background: var(--wf-surface);
  list-style: none;
}
.wf-city__list button {
  inline-size: 100%;
  min-block-size: var(--wf-touch-floor);
  border: 0;
  background: transparent;
  color: var(--wf-ink);
  font: inherit;
  text-align: start;
}
.wf-city__message {
  margin: 0;
  color: var(--wf-danger);
  font-size: var(--wf-text-sm);
}
.wf-city__empty {
  min-block-size: var(--wf-touch-floor);
  display: flex;
  align-items: center;
  padding-inline: var(--wf-space-3);
  color: var(--wf-ink-muted);
  font-size: var(--wf-text-sm);
}
</style>
