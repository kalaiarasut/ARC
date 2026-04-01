const fs = require('fs');
const path = require('path');

const applyEdits = (filePath, rules) => {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const rule of rules) {
    if (typeof rule.find === 'string') {
      content = content.replace(rule.find, rule.replace);
    } else if (rule.find instanceof RegExp) {
      content = content.replace(rule.find, rule.replace);
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
};

const pagesDir = path.join(__dirname, 'admin_web', 'src', 'pages');

// Verifications.tsx
applyEdits(path.join(pagesDir, 'Verifications.tsx'), [
  {
    find: /import { useNavigate } from 'react-router-dom';/,
    replace: `$&` // If it doesn't exist, we will add it
  },
  {
    find: /import \{(.*?)\} from '@mui\/material';/s,
    replace: `import {$1, Chip} from '@mui/material';\nimport { useNavigate } from 'react-router-dom';`
  },
  {
    find: /export const Verifications: React\.FC = \(\) => \{/,
    replace: `export const Verifications: React.FC = () => {\n  const navigate = useNavigate();`
  },
  {
    find: /          const menuItems = \[/,
    replace: `          const menuItems = [\n            {\n              label: 'Open Review',\n              color: 'primary' as const,\n              onClick: () => navigate(\`/verifications/\${item.id}\`),\n            },`
  },
  {
    find: /<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>/,
    replace: `<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 1 }}>\n        {[ \n          { label: 'Total Cases', count: total.toString(), color: '#3b82f6' },\n          { label: 'New Submission', count: '12', color: '#8b5cf6' },\n          { label: 'In Review', count: '5', color: '#eab308' },\n          { label: 'Awaiting Rework', count: '3', color: '#f97316' },\n          { label: 'Escalated', count: '1', color: '#ef4444' }\n        ].map(stat => (\n          <Box key={stat.label} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: isDark ? '#1e293b' : '#fff' }}>\n            <Typography variant="body2" color="text.secondary">{stat.label}</Typography>\n            <Typography variant="h5" fontWeight="700" sx={{ color: stat.color, mt: 1 }}>{stat.count}</Typography>\n          </Box>\n        ))}\n      </Box>\n\n      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>`
  },
  {
    find: /\{ value: 'escalated', label: 'Escalated' \},\n            \],\n            defaultValue: 'all',\n          \},/g,
    replace: `{ value: 'escalated', label: 'Escalated' },\n            ],\n            defaultValue: 'all',\n          },\n          {\n            name: 'assignedAdmin',\n            label: 'Assigned Admin',\n            options: [\n              { value: 'me', label: 'Assigned to Me' },\n              { value: 'unassigned', label: 'Unassigned Only' },\n            ],\n            defaultValue: 'all',\n            isSecondary: true,\n          },\n          {\n            name: 'missingDocs',\n            label: 'Missing Documents',\n            options: [\n              { value: 'yes', label: 'Missing Documents' },\n              { value: 'no', label: 'Has Documents' },\n            ],\n            defaultValue: 'all',\n            isSecondary: true,\n          },`
  }
]);

// Organization.tsx wait verify path
const orgFile = path.join(pagesDir, 'Organizations.tsx');
if(fs.existsSync(orgFile)) {
  applyEdits(orgFile, [
    {
      find: /<FilterBar\n        tabs=\[\n          \{ label: 'All Organizations', value: 'all' \},/,
      replace: `<FilterBar\n        tabs={[\n          { label: 'All Organizations', value: 'all' },`
    }
  ]);
}
