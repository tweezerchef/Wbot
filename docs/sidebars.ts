import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * Sidebar configuration for Wbot documentation.
 * Organizes docs into logical sections by project area.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Architecture',
      items: ['architecture/overview', 'architecture/data-flow'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Frontend (Web)',
      items: [
        'web/authentication',
        'web/ai-client',
        'web/activities',
        'web/meditation',
        'web/supabase',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Backend (AI)',
      items: ['ai/langgraph', 'ai/logging', 'ai/memory', 'ai/meditation'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Database',
      items: ['database/schema', 'database/migrations'],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Tooling',
      items: ['tooling/storybook', 'tooling/docusaurus', 'tooling/testing'],
      collapsed: true,
    },
    'ROADMAP',
  ],
};

export default sidebars;
