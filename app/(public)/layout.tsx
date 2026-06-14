import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Synara — AI-Native CRM for Reaching Shoppers',
  description: 'Synara helps consumer brands segment their shoppers, launch AI-crafted campaigns across WhatsApp, SMS, Email & RCS, and track every delivery in real time.',
  keywords: 'CRM, AI marketing, WhatsApp campaigns, shopper engagement, D2C CRM, India CRM',
  openGraph: {
    title: 'Synara — Intelligence Terminal',
    description: 'AI-native CRM for brands that reach. Segment, campaign, and track in real time.',
    type: 'website',
  }
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
