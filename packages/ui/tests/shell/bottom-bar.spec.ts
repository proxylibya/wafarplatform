// The bottom bar: five slots, the raised search action, the guest's redirect
// from a merchant-area slot, and the bound scroll rule (FR-052, AC-042; T096).
import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import WfShellBottomBar from '../../app/components/shell/WfShellBottomBar.vue';

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  WfIcon: { template: '<i />' },
};

beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
});

function scrollTo(y: number): void {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  window.dispatchEvent(new Event('scroll'));
}

describe('the bottom bar', () => {
  it('renders the five slots in order', () => {
    const wrapper = mount(WfShellBottomBar, { global: { stubs } });
    const slots = wrapper.findAll('.wf-shell-bottom-bar__slot');
    expect(slots).toHaveLength(5);
    expect(slots.map((slot) => slot.attributes('data-slot'))).toEqual([
      'home',
      'upload',
      'search',
      'my-files',
      'more',
    ]);
  });

  it('names the raised action with the act it performs and points at /parts', () => {
    const wrapper = mount(WfShellBottomBar, { global: { stubs } });
    const raised = wrapper.find('.wf-shell-bottom-bar__slot--raised');
    expect(raised.attributes('href')).toBe('/parts');
    expect(raised.attributes('aria-label')).toBe('البحث في القطع');
  });

  it('sends a guest from a merchant-area slot to sign-in and keeps the slot', () => {
    const wrapper = mount(WfShellBottomBar, {
      props: { guest: true },
      global: { stubs },
    });
    const upload = wrapper.find('[data-slot="upload"]');
    const files = wrapper.find('[data-slot="my-files"]');
    expect(upload.attributes('href')).toBe('/auth/sign-in');
    expect(files.attributes('href')).toBe('/auth/sign-in');
    expect(wrapper.find('[data-slot="home"]').attributes('href')).toBe('/');
  });

  it('shows «المزيد»’s open state without closing the bar', () => {
    const wrapper = mount(WfShellBottomBar, {
      props: { drawerOpen: true },
      global: { stubs },
    });
    const more = wrapper.find('[data-slot="more"]');
    expect(more.attributes('aria-expanded')).toBe('true');
    expect(wrapper.find('.wf-shell-bottom-bar--hidden').exists()).toBe(false);
  });

  it('hides after 32 px down and returns on 16 px up', async () => {
    scrollTo(0);
    const wrapper = mount(WfShellBottomBar, { global: { stubs } });
    await wrapper.vm.$nextTick();
    scrollTo(10);
    scrollTo(60);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.wf-shell-bottom-bar--hidden').exists()).toBe(true);
    scrollTo(40);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.wf-shell-bottom-bar--hidden').exists()).toBe(false);
  });

  it('keeps the bar visible within 56 px of the top', async () => {
    scrollTo(0);
    const wrapper = mount(WfShellBottomBar, { global: { stubs } });
    scrollTo(200);
    scrollTo(240);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.wf-shell-bottom-bar--hidden').exists()).toBe(true);
    scrollTo(40);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.wf-shell-bottom-bar--hidden').exists()).toBe(false);
  });
});
