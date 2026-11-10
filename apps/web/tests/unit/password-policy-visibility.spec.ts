// The policy statement belongs to the forms that apply it: the sign-up form and
// the new-password step state it, and the sign-in form neither applies nor
// states a password rule (FR-051, AC-055; T229).
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PasswordField from '../../app/components/auth/PasswordField.vue';
import SignInForm from '../../app/components/auth/SignInForm.vue';

describe('the password policy statement', () => {
  it('is rendered by a password field by default', () => {
    const wrapper = mount(PasswordField, { props: { modelValue: '' } });
    expect(wrapper.find('.wf-password__policy').exists()).toBe(true);
  });

  it('is withheld from the sign-in form', () => {
    const wrapper = mount(SignInForm, { props: { loading: false } });
    expect(wrapper.find('.wf-password__policy').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('كلمات المرور الشائعة');
  });
});
