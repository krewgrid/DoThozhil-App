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

  // Remove the back button entirely
  // It looks like:
  // <button \n onClick={onBack} \n className="absolute top-8 left-8 text-zinc-400 hover:text-white transition-colors z-20">
  //   <ArrowLeft className="w-5 h-5" />
  // </button>
  content = content.replace(/<button[^>]*onClick=\{onBack\}[^>]*>[\s\S]*?<\/button>/g, '');
  content = content.replace(/<button[^>]*onClick=\{handleBack\}[^>]*>[\s\S]*?<\/button>/g, '');

  // For get-work-view, the outer is: <div className="flex w-full min-h-screen p-6 justify-center">
  // Inner is: <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md p-6 shadow-sm md:p-10 relative mt-16 md:mt-20 flex flex-col h-[calc(100vh-100px)]">
  
  // Outer replacement: match anything that is the outermost wrapper (usually starting with <div className="flex w-full min-h-screen...)
  content = content.replace(
    /<div className="flex w-full min-h-screen[^"]*">/g,
    '<div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto text-white">'
  );
  content = content.replace(
    /<div className="flex w-full min-h-screen[^"]*"[^>]*>/g,
    '<div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto text-white">'
  );
  content = content.replace(
    /<div className="flex w-full h-full overflow-y-auto[^"]*">/g,
    '<div className="w-full flex flex-col gap-6 relative z-10 pt-24 px-4 sm:px-6 md:px-10 pb-8 h-full overflow-y-auto max-w-7xl mx-auto text-white">'
  );

  // Inner replacement: match the inner glass container
  // e.g. <div className="w-full max-w-3xl rounded-3xl border bg-background p-6 shadow-sm md:p-8 relative">
  // We want to turn it into a simple max-w wrapper.
  content = content.replace(
    /<div className="w-full max-w-[a-z0-9]+ rounded-3xl[^"]*">/g,
    (match) => {
      const wMatch = match.match(/max-w-[a-z0-9]+/);
      const w = wMatch ? wMatch[0] : 'max-w-3xl';
      return `<div className="w-full ${w} mx-auto mt-4">`;
    }
  );

  // For the ones I already patched previously, the inner is:
  // <div className="w-full max-w-[...] rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md p-6 text-white shadow-sm md:p-8 relative">
  content = content.replace(
    /<div className="w-full max-w-[a-z0-9]+ rounded-3xl border border-white\/10[^"]*">/g,
    (match) => {
      const wMatch = match.match(/max-w-[a-z0-9]+/);
      const w = wMatch ? wMatch[0] : 'max-w-3xl';
      return `<div className="w-full ${w} mx-auto mt-4">`;
    }
  );

  // Remove `onBack` from component signature
  content = content.replace(/\{ onBack \}: \{ onBack: \(\) => void \}/g, '');
  content = content.replace(/\{ onBack \}/g, '{}');

  fs.writeFileSync(filePath, content);
  console.log(`Patched ${file}`);
});
