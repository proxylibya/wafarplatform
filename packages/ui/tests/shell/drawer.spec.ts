// The drawer: «المزيد»’s open state, the bar staying rendered, the three
// dismissals with focus returning to «المزيد», and item activation closing the
// drawer as part of navigation (FR-022, FR-052, AC-024, AC-042; T132).
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import WfShellDrawer from '../../app/components/shell/WfShellDrawer.vue';
import WfShellBottomBar from '../../app/components/shell/WfShellBottomBar.vue';

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  WfIcon: { template: '<i />' },
};

afterEach(() => {
  document.body.innerHTML = '';
});

function mountBoth(): { bar: ReturnType<typeof mount>; drawer: ReturnType<typeof mount> } {
  const bar = mount(WfShellBottomBar, {
    props: { drawerOpen: true },
    global: { stubs },
    attachTo: document.body,
  });
  const drawer = mount(WfShellDrawer, {
    props: { open: true },
    global: { stubs },
    attachTo: document.body,
  });
  return { bar, drawer };
}

describe('the drawer', () => {
  it('shows «المزيد»’s open state while the bar stays rendered', () => {
    const { bar } = mountBoth();
    const more = bar.find('[data-slot="more"]');
    expect(more.attributes('aria-expanded')).toBe('true');
    expect(bar.find('.wf-shell-bottom-bar--hidden').exists()).toBe(false);
    expect(bar.findAll('.wf-shell-bottom-bar__slot')).toHaveLength(5);
  });

  it('closes on the collapse control and returns focus to «المزيد»', async () => {
    const { bar, drawer } = mountBoth();
    const more = bar.find('[data-slot="more"]');
    (more.element as HTMLElement).focus();
    await drawer.find('.wf-shell-sidebar__collapse').trigger('click');
    expect(drawer.emitted('close')).toHaveLength(1);
    expect(document.activeElement).toBe(more.element);
  });

  it('closes on Escape', async () => {
    const { drawer } = mountBoth();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(drawer.emitted('close')).toHaveLength(1);
  });

  it('closes on an activation outside the panel', async () => {
    const { drawer } = mountBoth();
    await drawer.find('.wf-shell-drawer__overlay').trigger('click');
    expect(drawer.emitted('close')).toHaveLength(1);
  });

  it('closes on item activation without a confirmation', async () => {
    const { drawer } = mountBoth();
    await drawer.find('.wf-nav-list__item').trigger('click');
    expect(drawer.emitted('close')).toHaveLength(1);
    expect(drawer.find('[role="alertdialog"]').exists()).toBe(false);
  });
});
