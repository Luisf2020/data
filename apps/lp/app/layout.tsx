import './css/style.css';

import { GoogleAnalytics } from '@next/third-parties/google';
import { Metadata } from 'next';
import {
  Bricolage_Grotesque,
  Nunito,
  Caveat,
  Inter,
  Inter_Tight,
} from 'next/font/google';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';

import ThemeRegistry from '@chaindesk/ui/src/ThemeRegistry';

const inter = Nunito({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const caveat = Nunito({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
});

const bricolage = Nunito({
  subsets: ['latin'],
  variable: '--font-bricolage-grotesque',
  display: 'swap',
  adjustFontFallback: false,
});

const inter_tight = Nunito({
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_LANDING_PAGE_URL!),
  title: 'ChatsappAI - ChatGPT AI | Agente de IA para tu negocio',
  description:
    'ChatsappAI ofrece una plataforma sin código para crear Agentes de IA personalizados entrenados con tus datos. Nuestra solución facilita el soporte al cliente y simplifica los flujos de trabajo del equipo.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    images: ['/api/og'],
  },
  icons: {
    icon: '/images/logo.png',
  },
  keywords: [
    'Agente de IA',
    'Chatbot de IA',
    'ChatGPT Personalizado',
    'Chatbot de Soporte al Cliente de IA',
    'Agente de IA para tu negocio',
    'Chatbot de IA para tu negocio',
    'ChatGPT Personalizado para tu negocio',
    'Agente de IA de Soporte al Cliente de IA para tu negocio',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ThemeRegistry>
        <body
          id="__next"
          className={`${inter.variable} ${inter_tight.variable} ${bricolage.variable} ${caveat.variable} font-inter antialiased bg-white text-zinc-900 tracking-tight relative`}
        >
          <Toaster />
          <div className="flex flex-col min-h-screen overflow-hidden supports-[overflow:clip]:overflow-clip">
            {children}
          </div>
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
        </body>
      </ThemeRegistry>
    </html>
  );
}
