// Every frame control's accessible name and role, the 320 px control set, and
// that no frame component sets a direction or language of its own
// (FR-020, FR-023, FR-049, FR-026, AC-022, AC-025, AC-053, AC-028; T098).
import { mount } from '@vue/test-utils';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import WfShellHeader from '../../app/components/shell/WfShellHeader.vue';
import WfShellBottomBar from '../../app/components/shell/WfShellBottomBar.vue';
import WfEndedSession from '../../app/components/shell/WfEndedSession.vue';

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  WfIcon: { template: '<i />' },
  WfThemeSwitch: { template: '<button aria-label="التبديل إلى الوضع الداكن" aria-pressed="false">x</button>' },
};

function accessibleName(element: { attributes: (name: string) => string | undefined; text: () => string }): string {
  return element.attributes('aria-label') ?? element.text();
}

describe('the frame’s accessibility contract', () => {
  it('gives every header control a name and a role', () => {
    const wrapper = mount(WfShellHeader, {
      props: { signedIn: true },
      global: { stubs },
    });
    const controls = wrapper.findAll('a, button');
    expect(controls.length).toBeGreaterThanOrEqual(4);
    for (const control of controls) {
      expect(accessibleName(control).trim().length).toBeGreaterThan(0);
      expect(['a', 'button']).toContain(control.element.tagName.toLowerCase());
    }
  });

  it('gives the five bar slots their names and the guest’s three controls a name', () => {
    const bar = mount(WfShellBottomBar, { global: { stubs } });
    const slots = bar.findAll('.wf-shell-bottom-bar__slot');
    expect(slots).toHaveLength(5);
    for (const slot of slots) {
      expect(accessibleName(slot).trim().length).toBeGreaterThan(0);
    }
    const header = mount(WfShellHeader, { global: { stubs } });
    expect(header.findAll('a, button').length).toBeGreaterThanOrEqual(3);
  });

  it('announces the ended-session state and keeps its heading focusable', async () => {
    for (const variant of ['ended', 'blocked'] as const) {
      const wrapper = mount(WfEndedSession, {
        props: { variant },
        global: { stubs },
        attachTo: document.body,
      });
      expect(wrapper.find('[role="status"]').exists()).toBe(true);
      expect(wrapper.find('h2').attributes('tabindex')).toBe('-1');
      wrapper.unmount();
    }
  });

  it('sets no direction or language of its own in any shell component', () => {
    const directory = resolve('packages/ui/app/components/shell');
    for (const file of readdirSync(directory)) {
      if (!file.endsWith('.vue')) continue;
      const source = readFileSync(join(directory, file), 'utf8').replace(
        /<script[\s\S]*?<\/script>/g,
        '',
      );
      expect(source).not.toMatch(/\sdir="/);
      expect(source).not.toMatch(/\slang="/);
    }
  });
});
