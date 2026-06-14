import fs from 'fs';
import path from 'path';

const files = {
  'app/(app)/segments/page.tsx': `
export default function Segments() {
  return (
    <div className="space-y-6">
      <h1 className="font-display-lg text-on-surface">Segments</h1>
      <div className="glass-card p-6 rounded-xl flex items-center gap-4">
        <input type="text" placeholder="Describe your segment (e.g. High spenders in Mumbai)" className="flex-1 bg-surface border border-surface-variant rounded-full px-6 py-3 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
        <button className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold hover:bg-primary-container transition flex items-center gap-2"><span className="material-symbols-outlined">auto_awesome</span> Generate with AI</button>
      </div>
    </div>
  );
}
`,
  'app/(app)/campaigns/page.tsx': `
import Link from 'next/link';
export default function Campaigns() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display-lg text-on-surface">Campaigns</h1>
        <Link href="/campaigns/new" className="bg-primary text-on-primary px-4 py-2 rounded font-bold hover:bg-primary-container transition">New Campaign</Link>
      </div>
    </div>
  );
}
`,
  'app/(app)/campaigns/new/page.tsx': `
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCampaign() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="font-display-lg text-on-surface">New Campaign</h1>
      
      <div className="glass-card p-6 rounded-xl space-y-6">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-on-surface">Step 1: Select Audience</h2>
            <button onClick={() => setStep(2)} className="bg-primary text-on-primary px-4 py-2 rounded font-bold mt-4">Next: Channel</button>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-on-surface">Step 2: Choose Channel</h2>
            <button onClick={() => setStep(3)} className="bg-primary text-on-primary px-4 py-2 rounded font-bold mt-4">Next: Creative</button>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-on-surface">Step 3: Creative (AI Draft)</h2>
            <button onClick={() => setStep(4)} className="bg-primary text-on-primary px-4 py-2 rounded font-bold mt-4">Next: Review</button>
          </div>
        )}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-on-surface">Step 4: Review & Deploy</h2>
            <button onClick={() => router.push('/analytics')} className="bg-tertiary text-on-tertiary px-4 py-2 rounded font-bold mt-4">Send Now</button>
          </div>
        )}
      </div>
    </div>
  );
}
`,
  'app/(app)/analytics/page.tsx': `
export default function Analytics() {
  return (
    <div className="space-y-6">
      <h1 className="font-display-lg text-on-surface">Analytics</h1>
      <div className="glass-card p-6 rounded-xl">
        <p className="text-on-surface-variant">Live Campaign Velocity and Revenue Metrics</p>
      </div>
    </div>
  );
}
`,
  'app/(app)/import/page.tsx': `
export default function Import() {
  return (
    <div className="space-y-6">
      <h1 className="font-display-lg text-on-surface">Import Data</h1>
      <div className="glass-card p-12 rounded-xl border-dashed border-2 flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">cloud_upload</span>
        <h3 className="text-lg font-bold text-on-surface mb-2">Drag and drop your CSV here</h3>
        <p className="text-on-surface-variant mb-6">or click to browse</p>
        <button className="bg-primary text-on-primary px-6 py-2 rounded font-bold">Select File</button>
      </div>
    </div>
  );
}
`
};

for (const [filePath, content] of Object.entries(files)) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content.trim());
}
console.log('UI 2 generated');
