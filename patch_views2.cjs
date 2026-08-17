const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Revert all changes first
execSync('git checkout src/components/ui/*-view.tsx');

const files = [
  'post-work-view.tsx',
  'report-no-show-view.tsx',
  'review-workers-view.tsx',
  'profile-view.tsx',
  'contact-us-view.tsx',
  'buy-slots-view.tsx',
  'get-work-view.tsx',
  'review-clients-view.tsx',
  'disputes-view.tsx'
];

const dir = 'C:/Users/luthu/Downloads/Project-K AG/src/components/ui';

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace outer wrapper
  // from: className="flex w-full min-h-screen items-center justify-center bg-background p-6"
  // to:   className="flex w-full h-full overflow-y-auto items-start justify-center p-6 pt-28 pb-20 relative z-10"
  content = content.replace(
    /className="flex w-full min-h-screen items-center justify-center bg-background p-6"/g,
    'className="flex w-full h-full overflow-y-auto items-start justify-center p-6 pt-28 pb-20 relative z-10"'
  );

  // ReviewWorkersView specific wrapper
  content = content.replace(
    /className="flex w-full min-h-screen items-center justify-center p-6"/g,
    'className="flex w-full h-full overflow-y-auto items-start justify-center p-6 pt-28 pb-20 relative z-10"'
  );

  // Replace any other min-h-screen if missed
  content = content.replace(
    /className="min-h-screen/g,
    'className="h-full overflow-y-auto pt-28 pb-20 relative z-10'
  );

  // Replace inner container
  // from: className="w-full max-w-3xl rounded-3xl border bg-background p-6 shadow-sm md:p-8 relative"
  // to:   className="w-full max-w-3xl rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md p-6 text-white shadow-sm md:p-8 relative"
  content = content.replace(
    /border bg-background p-6/g,
    'border border-white/10 bg-black/40 backdrop-blur-md p-6 text-white'
  );

  // The back button is absolute top-8 left-8, which looks good if the container is relative and has enough padding.
  
  fs.writeFileSync(filePath, content);
  console.log(`Patched ${file}`);
});
