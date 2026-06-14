import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Synara',
  description: 'AI-native Mini CRM',
  icons: { icon: '/logo.png' },
  openGraph: {
    images: [{ url: '/logo.png' }]
  }
};

const tailwindConfigScript = `
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface": "#101416",
        "background": "#101416",
        "surface-container": "#1d2022",
        "surface-container-low": "#191c1e",
        "surface-container-high": "#272a2d",
        "surface-container-highest": "#323538",
        "surface-container-lowest": "#0b0f11",
        "surface-variant": "#323538",
        "surface-bright": "#363a3c",
        "surface-dim": "#101416",
        "surface-tint": "#cabeff",
        "on-surface": "#e0e3e6",
        "on-background": "#e0e3e6",
        "on-surface-variant": "#c9c4d8",
        "primary": "#cabeff",
        "primary-container": "#947dff",
        "primary-fixed": "#e6deff",
        "primary-fixed-dim": "#cabeff",
        "on-primary": "#32009a",
        "on-primary-container": "#2b0088",
        "on-primary-fixed": "#1c0062",
        "on-primary-fixed-variant": "#4918c8",
        "inverse-primary": "#613de0",
        "secondary": "#adc6ff",
        "secondary-container": "#0566d9",
        "secondary-fixed": "#d8e2ff",
        "secondary-fixed-dim": "#adc6ff",
        "on-secondary": "#002e6a",
        "on-secondary-container": "#e6ecff",
        "on-secondary-fixed": "#001a42",
        "on-secondary-fixed-variant": "#004395",
        "tertiary": "#4ae176",
        "tertiary-container": "#00a74b",
        "tertiary-fixed": "#6bff8f",
        "tertiary-fixed-dim": "#4ae176",
        "on-tertiary": "#003915",
        "on-tertiary-container": "#003111",
        "on-tertiary-fixed": "#002109",
        "on-tertiary-fixed-variant": "#005321",
        "error": "#ffb4ab",
        "error-container": "#93000a",
        "on-error": "#690005",
        "on-error-container": "#ffdad6",
        "outline": "#938ea1",
        "outline-variant": "#484555",
        "inverse-surface": "#e0e3e6",
        "inverse-on-surface": "#2d3133",
      },
      borderRadius: {
        "DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"
      },
      spacing: {
        "xs": "4px", "sm": "8px", "md": "16px", "lg": "24px",
        "xl": "40px", "margin-mobile": "16px", "margin-desktop": "32px", "gutter": "16px"
      },
      fontFamily: {
        "data-tabular": ["JetBrains Mono"],
        "display-lg": ["Inter"], "display-lg-mobile": ["Inter"],
        "headline-md": ["Inter"], "label-xs": ["Inter"], "body-md": ["Inter"]
      },
      fontSize: {
        "data-tabular": ["13px", {"lineHeight":"16px","letterSpacing":"-0.01em","fontWeight":"500"}],
        "display-lg": ["32px", {"lineHeight":"40px","letterSpacing":"-0.02em","fontWeight":"700"}],
        "display-lg-mobile": ["24px", {"lineHeight":"32px","letterSpacing":"-0.01em","fontWeight":"700"}],
        "headline-md": ["20px", {"lineHeight":"28px","letterSpacing":"-0.01em","fontWeight":"600"}],
        "label-xs": ["11px", {"lineHeight":"14px","letterSpacing":"0.04em","fontWeight":"600"}],
        "body-md": ["14px", {"lineHeight":"20px","fontWeight":"400"}]
      }
    }
  }
}
`;

import Providers from '@/components/Providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <script dangerouslySetInnerHTML={{ __html: tailwindConfigScript }} />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500&family=Bangers&family=Righteous&family=Bungee+Shade&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
      </head>
      <body className="bg-background text-on-surface custom-scrollbar antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
