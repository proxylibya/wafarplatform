// The city combobox's two missing states: the closed control's placeholder
// `اختر المدينة` while no entry is chosen, and the single non-selectable row
// `لا توجد مدينة مطابقة` a query with no match renders inside the listbox
// (FR-005, AC-005; contracts/ui-contracts.md §3.2; T186).
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import cities from '@wafar/shared/reference/cities' with { type: 'json' };
import CityCombobox from '../../app/components/auth/CityCombobox.vue';

const first = cities.entries[0] ?? 'طرابلس';

describe('the city combobox', () => {
  it('shows the placeholder while no entry is chosen', () => {
    const wrapper = mount(CityCombobox, { props: { modelValue: '' } });
    expect(wrapper.find('#wf-city-input').attributes('placeholder')).toBe(
      'اختر المدينة',
    );
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
  });

  it('drops the placeholder once an entry is chosen', async () => {
    const wrapper = mount(CityCombobox, { props: { modelValue: '' } });
    await wrapper.find('#wf-city-input').trigger('focus');
    const option = wrapper.findAll('[role="listbox"] button')[0];
    expect(option).toBeDefined();
    await option!.trigger('click');
    expect(wrapper.find('#wf-city-input').attributes('placeholder')).toBeUndefined();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([first]);
  });

  it('renders one non-selectable row when the query matches no entry', async () => {
    const wrapper = mount(CityCombobox, { props: { modelValue: '' } });
    const input = wrapper.find('#wf-city-input');
    await input.trigger('focus');
    await input.setValue('ززززززز');

    const listbox = wrapper.find('[role="listbox"]');
    expect(listbox.exists()).toBe(true);
    const rows = listbox.findAll('[role="option"]');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.attributes('aria-disabled')).toBe('true');
    expect(rows[0]!.text()).toBe('لا توجد مدينة مطابقة');
  });
});
