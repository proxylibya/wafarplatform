// The footer band: the brand line and the four static links in order, absent
// below 1024 px and carried by the drawer (FR-024, AC-026; T096).
import { mount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import WfShellFooter from '../../app/components/shell/WfShellFooter.vue';
import WfShellSidebar from '../../app/components/shell/WfShellSidebar.vue';

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  WfIcon: { template: '<i />' },
};

describe('the footer band', () => {
  it('carries the brand line and the four recorded links', () => {
    const wrapper = mount(WfShellFooter, { global: { stubs } });
    expect(wrapper.text()).toContain('منصة وفر — كتالوج قطع الغيار');
    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toEqual([
      '/contact',
      '/privacy',
      '/terms',
      '/faq',
    ]);
    expect(wrapper.findAll('a').map((link) => link.text())).toEqual([
      'اتصل بنا',
      'سياسة الخصوصية',
      'شروط الاستخدام',
      'الأسئلة الشائعة',
    ]);
  });

  it('is absent below 1024 px and its links live in the drawer', () => {
    const source = readFileSync(
      resolve('packages/ui/app/components/shell/WfShellFooter.vue'),
      'utf8',
    );
    expect(source).toContain('@media (max-width: 1023px)');
    const sidebar = mount(WfShellSidebar, {
      props: { drawer: true },
      global: { stubs },
    });
    expect(
      sidebar
        .findAll('.wf-shell-sidebar__footer-link')
        .map((link) => link.text()),
    ).toEqual(['اتصل بنا', 'سياسة الخصوصية', 'شروط الاستخدام', 'الأسئلة الشائعة']);
  });
});
