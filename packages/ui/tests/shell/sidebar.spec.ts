// The sidebar's structure: nine destinations in order with their recorded
// labels and hrefs, the collapse control's three names, and the rail consuming
// the layer's rail-width token (FR-039, FR-022, AC-042, AC-024; T094).
import { mount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import WfShellSidebar from '../../app/components/shell/WfShellSidebar.vue';

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  WfIcon: { template: '<i />' },
};

describe('the sidebar', () => {
  it('renders the nine destinations in order with their names and hrefs', () => {
    const wrapper = mount(WfShellSidebar, { global: { stubs } });
    const items = wrapper.findAll('.wf-nav-list__item');
    expect(items).toHaveLength(9);
    expect(items.map((item) => item.attributes('href'))).toEqual([
      '/',
      '/parts',
      '/catalogs',
      '/upload',
      '/my-files',
      '/cart',
      '/notifications',
      '/messages',
      '/profile',
    ]);
    expect(items.map((item) => item.text())).toEqual([
      'الرئيسية',
      'بحث وفر',
      'الكتالوج',
      'رفع كتالوج',
      'ملفاتي',
      'سلة المشتريات',
      'الإشعارات',
      'المراسلة',
      'الملف الشخصي',
    ]);
  });

  it('carries the whole label as the item’s accessible name in the rail', () => {
    const wrapper = mount(WfShellSidebar, { global: { stubs } });
    expect(wrapper.find('nav').attributes('aria-label')).toBe('القائمة');
    expect(wrapper.findAll('.wf-nav-list__label')).toHaveLength(9);
  });

  it('names the collapse control for each state', async () => {
    const wrapper = mount(WfShellSidebar, { global: { stubs } });
    const control = wrapper.find('.wf-shell-sidebar__collapse');
    expect(control.text()).toBe('طي القائمة');
    await control.trigger('click');
    expect(control.text()).toBe('توسيع القائمة');
    expect(wrapper.find('.wf-shell-sidebar--collapsed').exists()).toBe(true);
  });

  it('narrows the rail through the layer token, not a width of its own', () => {
    const source = readFileSync(
      resolve('packages/ui/app/components/shell/WfShellSidebar.vue'),
      'utf8',
    );
    expect(source).toContain('inline-size: var(--wf-rail-width)');
    expect(source).not.toContain('4.25rem');
  });

  it('renders the drawer copy of the four static links', () => {
    const wrapper = mount(WfShellSidebar, {
      props: { drawer: true },
      global: { stubs },
    });
    expect(
      wrapper.findAll('.wf-shell-sidebar__footer-link').map((link) => link.attributes('href')),
    ).toEqual(['/contact', '/privacy', '/terms', '/faq']);
  });

  it('keeps a guest’s Catalog href public while the six merchant-area items redirect', () => {
    const wrapper = mount(WfShellSidebar, {
      props: { guest: true },
      global: { stubs },
    });
    const hrefs = wrapper
      .findAll('.wf-nav-list__item')
      .map((item) => item.attributes('href'));
    expect(hrefs.slice(0, 3)).toEqual(['/', '/parts', '/catalogs']);
    expect(hrefs.slice(3)).toEqual(Array(6).fill('/auth/sign-in'));
  });
});
