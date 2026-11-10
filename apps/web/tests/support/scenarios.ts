// The 32 states of contracts/ui-contracts.md §10, driven through the local API
// and the database: the real forms, the real one-time code from the fake
// transport, the seeded accounts, and the database fixtures a browser cannot
// produce (a blocked account, an administrator, an expired code, a spent
// budget). The visual and accessibility suites share these drivers, so one
// named state has one definition (T194, T201; FR-021, FR-040; AC-023, AC-043).
import { expect, type Page } from '@playwright/test';
import { dispatchMark, waitForDispatch } from './fake-inbox';
import {
  blockAccount,
  clearRateLimits,
  expireCode,
  forgetPhone,
  provisionAdministrator,
  seedLimit,
} from './seed';

export type PageName = 'sign-up' | 'sign-in' | 'forgot';
export type Appearance = 'light' | 'dark';

export interface Scenario {
  page: PageName;
  state: string;
  path: string;
  /** The fixed number this scenario owns; a rerun removes the rows first. */
  phone: string;
  /** Prepares the database before the page opens. */
  prepare: () => Promise<void>;
  /** Drives the page from its first step to the state being captured. */
  drive: (page: Page) => Promise<void>;
  /** The element AC-043's focus move must land on, when the state fixes one. */
  focus?: string;
  /** A text the polite announcement must carry, when the state states one. */
  announcement?: string;
}

export const password = 'correct horse battery staple';
export const newPassword = 'a longer replacement phrase';

const paths: Record<PageName, string> = {
  'sign-up': '/auth/sign-up',
  'sign-in': '/auth/sign-in',
  forgot: '/auth/forgot-password',
};

/** A fixed number per scenario, so the baseline carries a stable value. */
function phoneFor(index: number): string {
  return `95${String(index).padStart(7, '0')}`;
}

const stampWaitMs = 3_100;

/** Opens a page after its render bootstrap, and waits for the form stamp. */
async function open(page: Page, path: string, stamp = false): Promise<void> {
  const bootstrap = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/auth/csrf'),
  );
  await page.goto(path);
  await bootstrap;
  await expect(page.locator('.bare-layout__card')).toBeVisible();
  if (stamp) await page.waitForTimeout(stampWaitMs);
}

async function fillSignUp(
  page: Page,
  phone: string,
  values: { fullName?: string; password?: string; city?: string; shopName?: string } = {},
): Promise<void> {
  await page.locator('input[autocomplete="name"]').fill(values.fullName ?? 'محمد علي');
  await page.locator('input[autocomplete="tel-national"]').fill(phone);
  await page.locator('input[type="password"]').fill(values.password ?? password);
  await page.locator('#wf-city-input').fill(values.city ?? 'طرابلس');
  await page.getByRole('option', { name: values.city ?? 'طرابلس', exact: true }).click();
  if (values.shopName !== undefined) {
    await page.locator('input[autocomplete="organization"]').fill(values.shopName);
  }
}

async function submitSignUp(page: Page): Promise<string> {
  const before = dispatchMark();
  await page.locator('button.wf-submit').click();
  const dispatch = await waitForDispatch({ kind: 'otp_sign_up', after: before });
  return dispatch.code;
}

async function reachSignUpCode(page: Page, phone: string): Promise<string> {
  await open(page, paths['sign-up'], true);
  await fillSignUp(page, phone);
  const code = await submitSignUp(page);
  await expect(page.locator('#wf-code-heading')).toBeVisible();
  return code;
}

async function submitCode(page: Page, code: string): Promise<void> {
  await page.locator('input[autocomplete="one-time-code"]').fill(code);
  await page.locator('button.wf-code-step__submit').click();
}

function wrongCode(code: string): string {
  return code === '000000' ? '111111' : '000000';
}

async function createMerchant(page: Page, phone: string): Promise<void> {
  const code = await reachSignUpCode(page, phone);
  await submitCode(page, code);
  await expect(page.locator('.wf-outcome')).toBeVisible();
}

function clearBrowser(page: Page): Promise<void> {
  return page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
}

async function resetBrowser(page: Page): Promise<void> {
  await page.context().clearCookies();
  await clearBrowser(page);
}

async function forget(phone: string): Promise<void> {
  await forgetPhone(phone);
  await clearRateLimits();
}

async function reachRecoveryCode(page: Page, phone: string): Promise<string> {
  await open(page, paths.forgot);
  await page.locator('input[autocomplete="tel-national"]').fill(phone);
  const before = dispatchMark();
  await page.getByRole('button', { name: 'إرسال رمز التحقق' }).click();
  const dispatch = await waitForDispatch({ kind: 'otp_recovery', after: before });
  await expect(page.locator('#wf-code-heading')).toBeVisible();
  return dispatch.code;
}

async function reachNewPassword(page: Page, phone: string): Promise<void> {
  const code = await reachRecoveryCode(page, phone);
  await submitCode(page, code);
  await expect(page.locator('.wf-new-password')).toBeVisible();
}

async function submitNewPassword(page: Page): Promise<void> {
  await page.getByLabel('كلمة المرور الجديدة').fill(newPassword);
  await page.locator('.wf-new-password__submit').click();
}

/** Holds one real request open, so a transient state is the one captured. */
async function hold(page: Page, url: string): Promise<void> {
  await page.route(url, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 60_000));
    await route.continue();
  });
}

async function fillSignIn(page: Page, phone: string, value = password): Promise<void> {
  await page.locator('input[autocomplete="tel-national"]').fill(phone);
  await page.locator('input[autocomplete="current-password"]').fill(value);
}

async function submitSignIn(page: Page): Promise<void> {
  await page.locator('button.wf-submit').click();
}

function scenario(
  index: number,
  page: PageName,
  state: string,
  drive: (page: Page, phone: string) => Promise<void>,
  prepare?: (phone: string) => Promise<void>,
  checks: Pick<Scenario, 'focus' | 'announcement'> = {},
): Scenario {
  const phone = phoneFor(index);
  return {
    page,
    state,
    path: paths[page],
    phone,
    prepare: () => (prepare ?? forget)(phone),
    drive: (browser) => drive(browser, phone),
    ...checks,
  };
}

export const scenarios: Scenario[] = [
  // sign-up: 13 states.
  scenario(1, 'sign-up', 'form', (page) => open(page, paths['sign-up'])),
  scenario(2, 'sign-up', 'submitting', async (page, phone) => {
    await open(page, paths['sign-up'], true);
    await fillSignUp(page, phone);
    await hold(page, '**/api/v1/auth/sign-up');
    await page.locator('button.wf-submit').click();
    await expect(page.locator('button.wf-submit')).toHaveText('يجري الإرسال…');
  }),
  scenario(
    3,
    'sign-up',
    'form_error',
    async (page, phone) => {
      await open(page, paths['sign-up'], true);
      await fillSignUp(page, phone);
      await page.locator('button.wf-submit').click();
      await expect(page.getByRole('alert').first()).toContainText(
        'تجاوزت الحد المسموح',
      );
    },
    async (phone) => {
      await forget(phone);
      await seedLimit('account_creation', phone, 3);
    },
  ),
  scenario(4, 'sign-up', 'code', async (page, phone) => {
    await reachSignUpCode(page, phone);
  }),
  scenario(5, 'sign-up', 'verifying', async (page, phone) => {
    const code = await reachSignUpCode(page, phone);
    await hold(page, '**/api/v1/auth/sign-up/verify');
    await submitCode(page, code);
    await expect(page.locator('button.wf-code-step__submit')).toHaveText(
      'يجري التحقق…',
    );
  }),
  scenario(6, 'sign-up', 'code_error', async (page, phone) => {
    const code = await reachSignUpCode(page, phone);
    await submitCode(page, wrongCode(code));
    await expect(page.getByRole('alert').first()).toContainText('الرمز غير صحيح.');
  }),
  scenario(7, 'sign-up', 'resending', async (page, phone) => {
    await reachSignUpCode(page, phone);
    await hold(page, '**/api/v1/auth/verifications/resend');
    await page.getByRole('button', { name: 'إرسال رمز جديد' }).click();
    // The control states its own progress and disables itself; the idle label is
    // gone while the request is held (T232, T248).
    const resending = page.getByRole('button', { name: 'يجري الإرسال…' });
    await expect(resending).toBeVisible();
    await expect(resending).toBeDisabled();
    await expect(page.locator('input[autocomplete="one-time-code"]')).toBeVisible();
  }),
  scenario(8, 'sign-up', 'expired_notice', async (page, phone) => {
    const code = await reachSignUpCode(page, phone);
    await expireCode(phone);
    await submitCode(page, code);
    await expect(page.getByRole('status').first()).toContainText(
      'انتهت صلاحية الرمز',
    );
  }, undefined, {
    focus: 'input[autocomplete="name"]',
    announcement: 'انتهت صلاحية الرمز',
  }),
  scenario(9, 'sign-up', 'ended_notice', async (page, phone) => {
    const code = await reachSignUpCode(page, phone);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await submitCode(page, wrongCode(code));
    }
    await expect(page.getByRole('status').first()).toContainText(
      'انتهت محاولات التحقق',
    );
  }, undefined, {
    focus: 'input[autocomplete="name"]',
    announcement: 'انتهت محاولات التحقق',
  }),
  scenario(10, 'sign-up', 'done', async (page, phone) => {
    await createMerchant(page, phone);
  }, undefined, {
    focus: '.wf-outcome__heading',
    announcement: 'حسابك جاهز',
  }),
  scenario(11, 'sign-up', 'existing', async (page, phone) => {
    await createMerchant(page, phone);
    await resetBrowser(page);
    await open(page, paths['sign-up'], true);
    await fillSignUp(page, phone, { password: 'another different password' });
    const code = await submitSignUp(page);
    await submitCode(page, code);
    await expect(page.locator('.wf-outcome')).toBeVisible();
  }, undefined, {
    focus: '.wf-outcome__heading',
    announcement: 'رقمك مسجل مسبقا',
  }),
  scenario(12, 'sign-up', 'blocked', async (page, phone) => {
    await createMerchant(page, phone);
    await blockAccount(phone);
    await resetBrowser(page);
    await open(page, paths['sign-up'], true);
    await fillSignUp(page, phone, { password: 'another different password' });
    const code = await submitSignUp(page);
    await submitCode(page, code);
    await expect(page.locator('.wf-outcome')).toBeVisible();
  }, undefined, {
    focus: '.wf-outcome__heading',
    announcement: 'الحساب موقوف',
  }),
  scenario(
    13,
    'sign-up',
    'administrator',
    async (page, phone) => {
      await provisionAdministrator({
        phoneNumber: phone,
        fullName: 'مدير المنصة',
        city: 'طرابلس',
        password: 'administrator initial password',
      });
      await open(page, paths['sign-up'], true);
      await fillSignUp(page, phone);
      const code = await submitSignUp(page);
      await submitCode(page, code);
      await expect(page.locator('.wf-outcome')).toBeVisible();
    },
    forget,
    {
      focus: '.wf-outcome__heading',
      announcement: 'الحساب إداري',
    },
  ),

  // sign-in: 4 states.
  scenario(14, 'sign-in', 'form', (page) => open(page, paths['sign-in'])),
  scenario(15, 'sign-in', 'submitting', async (page, phone) => {
    await open(page, paths['sign-in']);
    await fillSignIn(page, phone);
    await hold(page, '**/api/v1/auth/sign-in');
    await submitSignIn(page);
    await expect(page.locator('button.wf-submit')).toHaveText(
      'يجري تسجيل الدخول…',
    );
  }),
  scenario(16, 'sign-in', 'form_error', async (page, phone) => {
    await open(page, paths['sign-in']);
    await fillSignIn(page, phone, 'a wrong password value');
    await submitSignIn(page);
    await expect(page.getByRole('alert').first()).toContainText(
      'رقم الهاتف أو كلمة المرور غير صحيحة.',
    );
  }),
  scenario(17, 'sign-in', 'done', async (page, phone) => {
    await createMerchant(page, phone);
    await resetBrowser(page);
    await open(page, paths['sign-in']);
    await fillSignIn(page, phone);
    await submitSignIn(page);
    await expect(page.locator('.wf-signed-in')).toBeVisible();
  }, undefined, {
    focus: '.wf-signed-in__heading',
    announcement: 'أنت مسجل الدخول الآن.',
  }),

  // forgot: 15 states.
  scenario(18, 'forgot', 'form', (page) => open(page, paths.forgot)),
  scenario(19, 'forgot', 'submitting', async (page, phone) => {
    await open(page, paths.forgot);
    await page.locator('input[autocomplete="tel-national"]').fill(phone);
    await hold(page, '**/api/v1/auth/password/forgot');
    await page.getByRole('button', { name: 'إرسال رمز التحقق' }).click();
    await expect(page.locator('button.wf-submit')).toHaveText('يجري الإرسال…');
  }),
  scenario(
    20,
    'forgot',
    'form_error',
    async (page, phone) => {
      await open(page, paths.forgot);
      await page.locator('input[autocomplete="tel-national"]').fill(phone);
      await page.getByRole('button', { name: 'إرسال رمز التحقق' }).click();
      await expect(page.getByRole('alert').first()).toContainText(
        'تجاوزت الحد المسموح',
      );
    },
    async (phone) => {
      await forget(phone);
      await seedLimit('recovery', phone, 3);
    },
  ),
  scenario(21, 'forgot', 'code', async (page, phone) => {
    await reachRecoveryCode(page, phone);
  }),
  scenario(22, 'forgot', 'verifying', async (page, phone) => {
    const code = await reachRecoveryCode(page, phone);
    await hold(page, '**/api/v1/auth/password/forgot/verify');
    await submitCode(page, code);
    await expect(page.locator('button.wf-code-step__submit')).toHaveText(
      'يجري التحقق…',
    );
  }),
  scenario(23, 'forgot', 'code_error', async (page, phone) => {
    const code = await reachRecoveryCode(page, phone);
    await submitCode(page, wrongCode(code));
    await expect(page.getByRole('alert').first()).toContainText('الرمز غير صحيح.');
  }),
  scenario(24, 'forgot', 'resending', async (page, phone) => {
    await reachRecoveryCode(page, phone);
    await hold(page, '**/api/v1/auth/verifications/resend');
    await page.getByRole('button', { name: 'إرسال رمز جديد' }).click();
    // The control states its own progress and disables itself; the idle label is
    // gone while the request is held (T232, T248).
    const resending = page.getByRole('button', { name: 'يجري الإرسال…' });
    await expect(resending).toBeVisible();
    await expect(resending).toBeDisabled();
    await expect(page.locator('input[autocomplete="one-time-code"]')).toBeVisible();
  }),
  scenario(25, 'forgot', 'new_password', async (page, phone) => {
    await createMerchant(page, phone);
    await resetBrowser(page);
    await reachNewPassword(page, phone);
  }, undefined, {
    focus: '.wf-new-password input',
  }),
  scenario(26, 'forgot', 'setting', async (page, phone) => {
    await createMerchant(page, phone);
    await resetBrowser(page);
    await reachNewPassword(page, phone);
    await hold(page, '**/api/v1/auth/password/reset');
    await submitNewPassword(page);
    await expect(page.locator('.wf-new-password__submit')).toBeDisabled();
  }),
  scenario(27, 'forgot', 'done', async (page, phone) => {
    await createMerchant(page, phone);
    await resetBrowser(page);
    await reachNewPassword(page, phone);
    await submitNewPassword(page);
    await expect(page.locator('.wf-outcome')).toBeVisible();
  }, undefined, {
    focus: '.wf-outcome__heading',
    announcement: 'تم تعيين كلمة المرور',
  }),
  scenario(28, 'forgot', 'done_blocked', async (page, phone) => {
    await createMerchant(page, phone);
    await blockAccount(phone);
    await resetBrowser(page);
    await reachNewPassword(page, phone);
    await submitNewPassword(page);
    await expect(page.locator('.wf-outcome')).toBeVisible();
  }, undefined, {
    focus: '.wf-outcome__heading',
    announcement: 'الحساب موقوف',
  }),
  scenario(29, 'forgot', 'no_account', async (page, phone) => {
    const code = await reachRecoveryCode(page, phone);
    await submitCode(page, code);
    await expect(page.locator('.wf-outcome')).toBeVisible();
  }, undefined, {
    focus: '.wf-outcome__heading',
    announcement: 'لا يوجد حساب لهذا الرقم',
  }),
  scenario(
    30,
    'forgot',
    'administrator',
    async (page, phone) => {
      await provisionAdministrator({
        phoneNumber: phone,
        fullName: 'مدير المنصة',
        city: 'طرابلس',
        password: 'administrator initial password',
      });
      const code = await reachRecoveryCode(page, phone);
      await submitCode(page, code);
      await expect(page.locator('.wf-outcome')).toBeVisible();
    },
    forget,
    {
      focus: '.wf-outcome__heading',
      announcement: 'لا يمكن إعادة التعيين من هنا',
    },
  ),
  scenario(31, 'forgot', 'expired_notice', async (page, phone) => {
    const code = await reachRecoveryCode(page, phone);
    await expireCode(phone);
    await submitCode(page, code);
    await expect(page.getByRole('status').first()).toContainText(
      'انتهت صلاحية الرمز',
    );
  }, undefined, {
    focus: 'input[autocomplete="tel-national"]',
    announcement: 'انتهت صلاحية الرمز',
  }),
  scenario(32, 'forgot', 'ended_notice', async (page, phone) => {
    const code = await reachRecoveryCode(page, phone);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await submitCode(page, wrongCode(code));
    }
    await expect(page.getByRole('status').first()).toContainText(
      'انتهت محاولات التحقق',
    );
  }, undefined, {
    focus: 'input[autocomplete="tel-national"]',
    announcement: 'انتهت محاولات التحقق',
  }),
];

/** Sets the appearance and lets the fonts and the first paint settle. */
export async function settle(page: Page, appearance: Appearance): Promise<void> {
  await page.evaluate(async (value) => {
    document.documentElement.dataset['appearance'] = value;
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }, appearance);
}
