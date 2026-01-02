// ============================================================================
// Lint-Staged Configuration
// ============================================================================
// Runs linters on staged files before commit (via Husky pre-commit hook).
// ============================================================================

export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,css}': ['prettier --write'],
};
