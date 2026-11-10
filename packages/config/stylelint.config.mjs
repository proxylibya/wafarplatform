// Stylelint enforces logical CSS properties only: `margin-inline-start`, never
// `margin-left` (Principle IX; the platform is right-to-left everywhere).
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'declaration-property-value-disallowed-list': {
      '/^(margin|padding|border|inset)(-top|-right|-bottom|-left)?$/': [
        /(^|\s)(left|right)(\s|$)/,
      ],
    },
    'property-disallowed-list': [
      'left',
      'right',
      'margin-left',
      'margin-right',
      'padding-left',
      'padding-right',
      'border-left',
      'border-right',
      'border-top-left-radius',
      'border-top-right-radius',
      'border-bottom-left-radius',
      'border-bottom-right-radius',
      'text-align',
    ],
  },
};
