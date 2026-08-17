const fs = require('fs');
const path = require('path');

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

  // Replace min-h-screen bg-background
  content = content.replace(
    /className="([^"]*)min-h-screen([^"]*)bg-background([^"]*)"/g,
    'className="$1h-full overflow-y-auto relative z-10 pt-24$2$3"'
  );
  
  // Specifically for ReviewWorkersView which has "flex w-full min-h-screen items-center justify-center p-6"
  content = content.replace(
    /className="flex w-full min-h-screen items-center justify-center p-6"/g,
    'className="flex w-full h-full overflow-y-auto items-start justify-center p-6 pt-24 relative z-10"'
  );

  // Some might have min-h-screen without bg-background but we already caught the specific one above. Let's generally replace min-h-screen
  content = content.replace(/min-h-screen/g, 'h-full overflow-y-auto pt-24 relative z-10');
  
  // Also we want the inner container to be glass.
  // Many have: border bg-background p-6
  content = content.replace(
    /border bg-background p-6/g,
    'border border-white/10 bg-black/40 backdrop-blur-md p-6 text-white'
  );
  
  // For ReviewWorkersView inner container: it already has bg-black/40 backdrop-blur-md, we just need to ensure the outer container is right.
  // It has items-center, we might want items-start and mt-4 so it doesn't get hidden behind the nav.
  content = content.replace(/items-center justify-center/g, 'items-start justify-center pb-20');

  // Remove absolute top-8 left-8 back buttons because they are now inside a scrolling container. Let's keep them but make them relative or top-4.
  // Wait, if it's items-start, the back button inside the relative container will be fine at top-8 left-8.

  fs.writeFileSync(filePath, content);
  console.log(`Patched ${file}`);
});
