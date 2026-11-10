// The ended-session state in both variants: the live region, the focusable
// heading, the withheld sign-in control, and the guest redirect rule
// (FR-049, FR-048, AC-053, AC-052; T097).
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import WfEndedSession from '../../app/components/shell/WfEndedSession.vue';
import WfNavList from '../../app/components/shell/WfNavList.vue';

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  WfIcon: { template: '<i />' },
};

describe('the ended-session state', () => {
  it('announces ahead of the page and focuses its heading (ended)', async () => {
    const wrapper = mount(WfEndedSession, {
      props: { variant: 'ended' },
      global: { stubs },
      attachTo: document.body,
    });
    const region = wrapper.find('[role="status"]');
    expect(region.attributes('aria-live')).toBe('polite');
    expect(wrapper.find('h2').text()).toBe('انتهت الجلسة');
    expect(wrapper.find('h2').attributes('tabindex')).toBe('-1');
    expect(wrapper.find('a').attributes('href')).toBe('/auth/sign-in');
    expect(wrapper.find('a').text()).toBe('تسجيل الدخول');
    expect(document.activeElement).toBe(wrapper.find('h2').element);
    wrapper.unmount();
  });

  it('withholds the sign-in control in the blocked variant', async () => {
    const wrapper = mount(WfEndedSession, {
      props: { variant: 'blocked' },
      global: { stubs },
      attachTo: document.body,
    });
    expect(wrapper.find('h2').text()).toBe('الحساب موقوف');
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.text()).toContain(
      'أوقفت الإدارة هذا الحساب، ولن يقبل تسجيل الدخول حتى يعاد تفعيله.',
    );
    expect(document.activeElement).toBe(wrapper.find('h2').element);
    wrapper.unmount();
  });

  it('takes a guest from a merchant-area item to sign-in and keeps it enabled', () => {
    const wrapper = mount(WfNavList, {
      props: { guest: true },
      global: { stubs },
    });
    const profile = wrapper.findAll('.wf-nav-list__item').at(-1);
    expect(profile?.attributes('href')).toBe('/auth/sign-in');
    expect(profile?.attributes('disabled')).toBeUndefined();
  });
});
