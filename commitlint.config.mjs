/**
 * @type {import('@commitlint/types').UserConfig}
 */
export default {
  extends: ['@commitlint/config-conventional'],
  parserPreset: 'conventional-changelog-conventionalcommits',
  rules: {
    'scope-empty': [2, 'always'],
    'subject-empty': [0, 'always'],
    'subject-min-length': [2, 'always', 5],
    'subject-max-length': [2, 'always', 128],
    'references-empty': [2, 'always'],
    'body-empty': [2, 'always'],
    'footer-empty': [2, 'always'],
  },
  prompt: {
    messages: {
      skip: "'Enterでスキップ'",
      max: '最大%d文字',
      min: '最小%d文字',
      emptyWarning: '必須事項です',
      upperLimitWarning: '最大文字数を超えています',
      lowerLimitWarning: '最低文字数に足りていません',
    },
    questions: {
      type: {
        description: 'コミットする変更の種類を選択してください',
        enum: {
          feat: {
            description: '新機能の追加',
            title: 'Features',
          },
          fix: {
            description: 'バグの修正',
            title: 'Bug Fixes',
          },
          docs: {
            description: 'ドキュメントのみの変更',
            title: 'Documentation',
          },
          style: {
            description: 'コードの意味に影響を与えない変更',
            title: 'Styles',
          },
          refactor: {
            description: '新機能追加でもバグ修正でもないコードの変更',
            title: 'Code Refactoring',
          },
          test: {
            description: 'テストの追加や変更',
            title: 'Tests',
          },
          chore: {
            description: 'ソースやテストの変更を含まない変更',
            title: 'Chores',
          },
        },
      },
    },
  },
};
