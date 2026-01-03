import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * Sidebar configuration for Wbot documentation.
 * Organizes docs into logical sections for easy navigation.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Architecture',
      items: ['architecture/overview', 'architecture/data-flow'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'API Guides',
      items: ['api-guides/langgraph', 'api-guides/supabase'],
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
      label: 'Integration',
      items: ['integration/authentication', 'integration/activities'],
      collapsed: true,
    },
  ],
};

export default sidebars;
