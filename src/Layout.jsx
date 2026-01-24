import React from 'react';
import BottomNav from '@/components/BottomNav';
import { MockDataProvider } from '@/components/MockDataProvider';

export default function Layout({ children }) {
  return (
    <MockDataProvider>
      <div className="min-h-screen bg-[#0a0e27] text-white">
        <style>{`
          :root {
            --background: 222.2 84% 4.9%;
            --foreground: 210 40% 98%;
          }
          
          body {
            background: linear-gradient(180deg, #0a0e27 0%, #0d1229 50%, #0a0e27 100%);
            min-height: 100vh;
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 4px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: #374151;
            border-radius: 4px;
          }
          
          /* Safe area for mobile */
          .pb-safe {
            padding-bottom: env(safe-area-inset-bottom, 0);
          }
        `}</style>
        
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-pink-500/8 rounded-full blur-3xl" />
        </div>
        
        {/* Main content */}
        <main className="relative pb-20">
          {children}
        </main>
        
        {/* Bottom navigation */}
        <BottomNav />
      </div>
    </MockDataProvider>
  );
}