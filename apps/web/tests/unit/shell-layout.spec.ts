// The frame's one composition: the layout owns the drawer's open state, so
// «المزيد» opens the drawer, the drawer's close event ends it, and the sidebar,
// the bar, and the drawer all carry the guest composition (FR-022, FR-039,
// FR-048, FR-052; T226).
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ShellLayout from '../../app/layouts/shell.vue';

const stubs = {
  WfShellHeader: {
    props: ['signedIn', 'blocked', 'fullName'],
    template: '<header />',
  },
  WfShellSidebar: {
    props: ['guest'],
    template: '<nav class="sidebar" :data-guest="String(guest)" />',
  },
  WfShellFooter: { template: '<footer />' },
  WfShellBottomBar: {
    props: ['guest', 'drawerOpen'],
    emits: ['openDrawer'],
    template:
      '<button data-slot="more" @click="$emit(\'openDrawer\')">{{ guest }}</button>',
  },
  WfShellDrawer: {
    props: ['open', 'guest'],
    emits: ['close'],
    template:
      '<div v-if="open" class="drawer" :data-guest="String(guest)"><button class="drawer-close" @click="$emit(\'close\')" /></div>',
  },
};

describe('the shell layout', () => {
  it('opens the drawer from «المزيد» and closes it on the drawer’s close event', async () => {
    const wrapper = mount(ShellLayout, { global: { stubs } });
    expect(wrapper.find('.drawer').exists()).toBe(false);

    await wrapper.find('[data-slot="more"]').trigger('click');
    expect(wrapper.find('.drawer').exists()).toBe(true);

    await wrapper.find('.drawer-close').trigger('click');
    expect(wrapper.find('.drawer').exists()).toBe(false);
  });

  it('gives the guest composition to the sidebar, the bar, and the drawer', async () => {
    const wrapper = mount(ShellLayout, { global: { stubs } });
    expect(wrapper.find('.sidebar').attributes('data-guest')).toBe('true');
    await wrapper.find('[data-slot="more"]').trigger('click');
    expect(wrapper.find('.drawer').attributes('data-guest')).toBe('true');
  });

  it('gives a signed-in merchant the signed-in composition', async () => {
    const wrapper = mount(ShellLayout, { props: { signedIn: true }, global: { stubs } });
    expect(wrapper.find('.sidebar').attributes('data-guest')).toBe('false');
    await wrapper.find('[data-slot="more"]').trigger('click');
    expect(wrapper.find('.drawer').attributes('data-guest')).toBe('false');
  });
});
