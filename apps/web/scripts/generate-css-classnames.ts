/**
 * Generates TypeScript files with CSS Module class name mappings.
 *
 * For each .module.css file, creates a corresponding .classnames.ts file
 * that exports the class name mappings without importing the CSS.
 * This allows components to use class names without triggering CSS bundling.
 *
 * Usage: pnpm generate:classnames
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { basename, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC_DIR = join(__dirname, '../src');

/**
 * Recursively find all .module.css files
 */
function findCssModules(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findCssModules(fullPath));
    } else if (entry.endsWith('.module.css')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract class names from CSS content by parsing selectors.
 * Returns an array of class names (without the leading dot).
 */
function extractClassNames(cssContent: string): string[] {
  const classNames = new Set<string>();

  // Remove comments
  const noComments = cssContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');

  // Match class selectors: .className or .class-name
  // This regex finds selectors that start with a dot
  const selectorRegex = /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;
  let match;

  while ((match = selectorRegex.exec(noComments)) !== null) {
    classNames.add(match[1]);
  }

  return Array.from(classNames).sort();
}

/**
 * Convert kebab-case to camelCase.
 * Matches Vite's CSS modules localsConvention: 'camelCase'
 */
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Generate TypeScript content for the classnames file.
 * Creates a typed object with class name mappings.
 */
function generateClassNamesContent(cssFileName: string, classNames: string[]): string {
  const entries = classNames.map((className) => {
    const camelCase = toCamelCase(className);
    // If camelCase equals original, no transformation needed
    // We export the camelCase version pointing to the original CSS class name
    return `  ${camelCase}: '${className}'`;
  });

  return `// AUTO-GENERATED - DO NOT EDIT
// Generated from: ${cssFileName}
// Run 'pnpm generate:classnames' to regenerate

const styles = {
${entries.join(',\n')},
} as const;

export default styles;
export type Styles = typeof styles;
`;
}

/**
 * Generate .classnames.ts file for a CSS module
 */
function generateClassNamesFile(cssPath: string): boolean {
  const cssContent = readFileSync(cssPath, 'utf-8');
  const classNames = extractClassNames(cssContent);

  if (classNames.length === 0) {
    // eslint-disable-next-line no-console
    console.log(`  Skipped (no classes): ${basename(cssPath)}`);
    return false;
  }

  const outputPath = cssPath.replace('.module.css', '.classnames.ts');
  const content = generateClassNamesContent(basename(cssPath), classNames);

  writeFileSync(outputPath, content);
  // eslint-disable-next-line no-console
  console.log(`  Generated: ${basename(outputPath)} (${String(classNames.length)} classes)`);
  return true;
}

// Main execution
// eslint-disable-next-line no-console
console.log('CSS Class Names Generator\n');
// eslint-disable-next-line no-console
console.log(`Searching in: ${SRC_DIR}\n`);

const cssFiles = findCssModules(SRC_DIR);
// eslint-disable-next-line no-console
console.log(`Found ${String(cssFiles.length)} CSS modules\n`);

let generated = 0;
for (const cssFile of cssFiles) {
  if (generateClassNamesFile(cssFile)) {
    generated++;
  }
}

// eslint-disable-next-line no-console
console.log(`\nDone! Generated ${String(generated)} files.`);
// eslint-disable-next-line no-console
console.log('\nNext steps:');
// eslint-disable-next-line no-console
console.log("1. Update component imports: import styles from './Component.classnames'");
// eslint-disable-next-line no-console
console.log('2. Add route CSS via head() function');
