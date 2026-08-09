import { RuleConfigSeverity, type UserConfig } from '@commitlint/types';

/**
 * Custom commit convention:
 *   - Only `feat`, `refactor`, `fix` are allowed.
 *   - Scopes are forbidden.
 *   - Emoji are forbidden.
 *   - Subject/body written in English (convention; not machine-enforced).
 *
 * Example: `feat: add reservation optimistic update`
 */
const config: UserConfig = {
  plugins: [
    {
      rules: {
        'body-no-emoji': ({ raw }) => {
          const hasEmoji = /\p{Extended_Pictographic}/u.test(raw ?? '');
          return [!hasEmoji, 'emoji are not allowed in commit messages'];
        },
      },
    },
  ],
  rules: {
    'type-enum': [RuleConfigSeverity.Error, 'always', ['feat', 'refactor', 'fix']],
    'type-empty': [RuleConfigSeverity.Error, 'never'],
    'type-case': [RuleConfigSeverity.Error, 'always', 'lower-case'],
    'scope-empty': [RuleConfigSeverity.Error, 'always'],
    'subject-empty': [RuleConfigSeverity.Error, 'never'],
    'subject-full-stop': [RuleConfigSeverity.Error, 'never', '.'],
    'header-max-length': [RuleConfigSeverity.Error, 'always', 72],
    'body-no-emoji': [RuleConfigSeverity.Error, 'always'],
  },
};

export default config;
