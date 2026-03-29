/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  'src/**/*.ts': ['biome check src/**/*.ts --no-errors-on-unmatched'],
};
