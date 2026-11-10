// The bidirectional file-name surface (ADR-128 §14, T139).
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import WfFileName from '../app/components/WfFileName.vue';

describe('the file-name surface', () => {
  it('isolates the Latin extension in its own run', () => {
    const wrapper = mount(WfFileName, { props: { name: 'تقرير-المخزون.pdf' } });
    const extension = wrapper.find('.wf-file-name__extension');
    expect(extension.exists()).toBe(true);
    expect(extension.text()).toBe('.pdf');
    expect(extension.attributes('dir')).toBe('ltr');
    expect(wrapper.find('.wf-file-name__stem').text()).toBe('تقرير-المخزون');
  });

  it('renders a name without an extension as one stem', () => {
    const wrapper = mount(WfFileName, { props: { name: 'ملف بدون امتداد' } });
    expect(wrapper.find('.wf-file-name__extension').exists()).toBe(false);
  });
});
