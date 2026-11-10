// The header and its account menu: the two edges, the four controls of a
// signed-in merchant, the guest's three, the menu's items and sign-out
// confirmation (FR-023, FR-047, FR-025, AC-025, AC-051, AC-027; T095).
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import WfShellHeader from '../../app/components/shell/WfShellHeader.vue';

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  WfIcon: { template: '<i />' },
  WfThemeSwitch: { template: '<button aria-pressed="false">الوضع</button>' },
};

describe('the header', () => {
  it('puts logo/home at the start and the three controls at the end', () => {
    const wrapper = mount(WfShellHeader, {
      props: { signedIn: true },
      global: { stubs },
    });
    const start = wrapper.find('.wf-shell-header__start');
    const end = wrapper.find('.wf-shell-header__end');
    expect(start.find('.wf-wordmark').exists()).toBe(true);
    expect(end.find('.wf-shell-header__notifications').attributes('href')).toBe(
      '/notifications',
    );
    expect(end.find('.wf-shell-header__notifications').attributes('aria-label')).toBe(
      'الإشعارات',
    );
    expect(end.find('[aria-pressed]').exists()).toBe(true);
    expect(end.find('.wf-account-menu__trigger').exists()).toBe(true);
  });

  it('carries no page-navigation link and no drawer control', () => {
    const wrapper = mount(WfShellHeader, {
      props: { signedIn: true },
      global: { stubs },
    });
    const hrefs = wrapper.findAll('a').map((link) => link.attributes('href'));
    expect(hrefs).not.toContain('/parts');
    expect(hrefs).not.toContain('/catalogs');
    expect(wrapper.find('[aria-controls="wf-drawer"]').exists()).toBe(false);
  });

  it('gives the account menu its three items and a sign-out confirmation', async () => {
    const wrapper = mount(WfShellHeader, {
      props: { signedIn: true },
      global: { stubs },
    });
    const trigger = wrapper.find('.wf-account-menu__trigger');
    expect(trigger.attributes('aria-haspopup')).toBe('menu');
    expect(trigger.attributes('aria-label')).toBe('حسابي');
    await trigger.trigger('click');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(
      wrapper.findAll('.wf-account-menu__item').map((item) => item.attributes('href')),
    ).toEqual(['/profile', '/profile#settings', undefined]);
    const signout = wrapper.find('.wf-account-menu__signout');
    await signout.trigger('click');
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('هل تريد تسجيل الخروج؟');
    expect(wrapper.findAll('[role="alertdialog"] button').map((b) => b.text())).toEqual([
      'تسجيل الخروج',
      'إلغاء',
    ]);
  });

  it('gives the guest and the ended state the guest composition', () => {
    const wrapper = mount(WfShellHeader, { global: { stubs } });
    expect(wrapper.find('.wf-wordmark').exists()).toBe(true);
    expect(wrapper.find('.wf-shell-header__signin').attributes('href')).toBe(
      '/auth/sign-in',
    );
    expect(wrapper.find('.wf-shell-header__signin').text()).toBe('تسجيل الدخول');
    expect(wrapper.find('.wf-shell-header__notifications').exists()).toBe(false);
    expect(wrapper.find('[aria-pressed]').exists()).toBe(true);
    expect(wrapper.find('.wf-account-menu').exists()).toBe(false);
  });

  it('keeps the logo/home and theme switch alone in the blocked state', () => {
    const wrapper = mount(WfShellHeader, {
      props: { signedIn: true, blocked: true },
      global: { stubs },
    });
    expect(wrapper.find('.wf-wordmark').exists()).toBe(true);
    expect(wrapper.find('[aria-pressed]').exists()).toBe(true);
    expect(wrapper.find('.wf-shell-header__signin').exists()).toBe(false);
    expect(wrapper.find('.wf-account-menu').exists()).toBe(false);
    expect(wrapper.find('.wf-shell-header__notifications').exists()).toBe(false);
  });

  it('shows the account trigger as its icon alone with «حسابي» as the accessible name', () => {
    const wrapper = mount(WfShellHeader, {
      props: { signedIn: true },
      global: { stubs },
    });
    const trigger = wrapper.find('.wf-account-menu__trigger');
    expect(trigger.text()).toBe('');
    expect(trigger.attributes('aria-label')).toBe('حسابي');
    expect(trigger.element.children).toHaveLength(1);
  });

  it('keeps all four controls inside one row at the 320 px composition', () => {
    const wrapper = mount(WfShellHeader, {
      props: { signedIn: true },
      global: { stubs },
    });
    const end = wrapper.find('.wf-shell-header__end');
    expect(end.findAll(':scope > *')).toHaveLength(3);
    expect(wrapper.findAll('.wf-shell-header__start > *')).toHaveLength(1);
  });
});
