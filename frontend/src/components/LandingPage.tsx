import { LandingHeader } from "./navigation/Navigation";
import CommonFooter from "./Footer";
import React from 'react';
import RoyalHero from './RoyalHero';

export default function LandingPage() {
  // isSignedIn intentionally unused in the landing page

  return (
    <div className="flex flex-col min-h-screen w-full bg-ink font-sans text-parchment overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-5 z-0"></div>
      <LandingHeader />
      
      {/* Use the full-screen RoyalHero component */}
      <RoyalHero />

      <CommonFooter />
    </div>
  );
}