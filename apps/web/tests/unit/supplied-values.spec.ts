// Supplied values render as supplied: their own script and digits, never
// transliterated or re-numeralised, each in one isolated bidirectional run
// (FR-045, AC-049).
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CodeStep from '../../app/components/auth/CodeStep.vue';

const stubs = {
  MessageAlert: { props: ['message', 'kind'], template: '<div />' },
};

describe('the code step’s supplied values', () => {
  it('renders Arabic-Indic digits unchanged and isolated', () => {
    const wrapper = mount(CodeStep, {
      props: {
        collected: [{ label: 'الاسم الكامل', value: 'محمد ١٢٣' }],
        displayPhone: '+218 91 234 5678',
        remainingReRequests: 3,
        loading: false,
      },
      global: { stubs },
    });
    const runs = wrapper.findAll('bdi');
    expect(runs[0]?.text()).toBe('محمد ١٢٣');
    expect(runs[1]?.text()).toBe('+218 91 234 5678');
    expect(runs[1]?.attributes('dir')).toBe('ltr');
  });

  it('shows a value typed as markup or script as text, not as elements', () => {
    const wrapper = mount(CodeStep, {
      props: {
        collected: [
          {
            label: 'الاسم الكامل',
            value: '<b>محمد</b> <script>alert(1)</script>',
          },
        ],
        displayPhone: '+218 91 234 5678',
        remainingReRequests: 3,
        loading: false,
      },
      global: { stubs },
    });
    const run = wrapper.findAll('bdi')[0];
    expect(run?.text()).toBe('<b>محمد</b> <script>alert(1)</script>');
    expect(run?.find('b').exists()).toBe(false);
    expect(run?.find('script').exists()).toBe(false);
    expect(wrapper.html()).toContain('&lt;b&gt;');
    expect(wrapper.html()).not.toContain('<b>');
    expect(wrapper.html()).not.toContain('<script>');
  });

  it('renders every supplied value in its own auto-direction run', () => {
    const wrapper = mount(CodeStep, {
      props: {
        collected: [
          { label: 'الاسم الكامل', value: 'Mohamed' },
          { label: 'المدينة', value: 'طرابلس' },
        ],
        displayPhone: '+218 91 234 5678',
        remainingReRequests: 2,
        loading: false,
      },
      global: { stubs },
    });
    const runs = wrapper.findAll('bdi');
    expect(runs[0]?.attributes('dir')).toBe('auto');
    expect(runs[1]?.attributes('dir')).toBe('auto');
  });

  it('disables the resend control when the allowance is spent', () => {
    const wrapper = mount(CodeStep, {
      props: {
        collected: [],
        displayPhone: '+218 91 234 5678',
        remainingReRequests: 0,
        loading: false,
      },
      global: { stubs },
    });
    const resend = wrapper.findAll('button').find((button) => button.text() === 'إرسال رمز جديد');
    expect(resend?.attributes('disabled')).toBeDefined();
  });
});
