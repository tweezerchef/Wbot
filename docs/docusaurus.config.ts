import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'Wbot Documentation',
  tagline: 'AI Wellness Chatbot Developer Guide',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://wbot-docs.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/',

  // GitHub pages deployment config (optional)
  organizationName: 'your-org',
  projectName: 'wbot',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: '.', // Docs are in the same folder as this config
          sidebarPath: './sidebars.ts',
          routeBasePath: '/', // Docs at root instead of /docs
          exclude: ['**/src/**', '**/node_modules/**', 'package.json', '*.ts', '*.js', 'README.md'],
        },
        blog: false, // Disable blog feature
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  // Enable Mermaid diagrams
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  // AI documentation plugins
  plugins: [
    [
      'docusaurus-plugin-llms',
      {
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        docsDir: '.',
        title: 'Wbot Documentation',
        description:
          'AI Wellness Chatbot Developer Guide - Complete reference for the AI wellness chatbot built with LangGraph, TanStack Start, and Supabase.',
      },
    ],
  ],

  themeConfig: {
    // Navbar configuration
    navbar: {
      title: 'Wbot',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/your-org/wbot',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },

    // Footer configuration
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Getting Started', to: '/' },
            { label: 'Architecture', to: '/architecture/overview' },
            { label: 'AI Backend', to: '/ai/langgraph' },
          ],
        },
        {
          title: 'Resources',
          items: [
            { label: 'Component Storybook', href: 'http://localhost:6006' },
            { label: 'GitHub', href: 'https://github.com/your-org/wbot' },
          ],
        },
      ],
      copyright: `Copyright ${String(new Date().getFullYear())} Wbot. Built with Docusaurus.`,
    },

    // Syntax highlighting
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python', 'bash', 'sql', 'json'],
    },

    // Mermaid diagram styling
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },

    // Color mode configuration
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
