import { SiteHeader } from "@/components/landing/SiteHeader";
import { Hero } from "@/components/landing/Hero";
import { SoundsFamiliar } from "@/components/landing/SoundsFamiliar";
import { HowWeWork } from "@/components/landing/HowWeWork";
import { Dimensions } from "@/components/landing/Dimensions";
import { Semaphore } from "@/components/landing/Semaphore";
import { WhatYouGet } from "@/components/landing/WhatYouGet";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { SiteFooter } from "@/components/landing/SiteFooter";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <SoundsFamiliar />
        <HowWeWork />
        <Dimensions />
        <Semaphore />
        <WhatYouGet />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
