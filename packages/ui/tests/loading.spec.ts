// The loading-state rule: the indicator appears after 120 ms and stays for at
// least 300 ms, and the skeleton's geometry equals the content's (T138).
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WfLoadingBar from '../app/components/WfLoadingBar.vue';
import WfContentSkeleton from '../app/components/WfContentSkeleton.vue';

function display(wrapper: ReturnType<typeof mount>): string {
  const element = wrapper.find('.wf-loading-bar').element as HTMLElement;
  return element.style.display;
}

describe('the in-place loading bar', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not show inside the first 120 ms', async () => {
    const wrapper = mount(WfLoadingBar, { props: { loading: true } });
    expect(display(wrapper)).toBe('none');
    await vi.advanceTimersByTimeAsync(119);
    expect(display(wrapper)).toBe('none');
    await vi.advanceTimersByTimeAsync(1);
    await wrapper.vm.$nextTick();
    expect(display(wrapper)).toBe('');
  });

  it('stays visible for at least 300 ms after the work ends', async () => {
    const wrapper = mount(WfLoadingBar, { props: { loading: true } });
    await vi.advanceTimersByTimeAsync(120);
    await wrapper.vm.$nextTick();
    expect(display(wrapper)).toBe('');

    await wrapper.setProps({ loading: false });
    await vi.advanceTimersByTimeAsync(299);
    await wrapper.vm.$nextTick();
    expect(display(wrapper)).toBe('');

    await vi.advanceTimersByTimeAsync(1);
    await wrapper.vm.$nextTick();
    expect(display(wrapper)).toBe('none');
  });
});

describe('the content skeleton', () => {
  it('carries one Arabic sentence and the declared rows', () => {
    const wrapper = mount(WfContentSkeleton, {
      props: { rows: 4, label: 'جارٍ تحميل القطع' },
    });
    expect(wrapper.findAll('.wf-skeleton__line')).toHaveLength(5);
    expect(wrapper.text()).toContain('جارٍ تحميل القطع');
  });
});
