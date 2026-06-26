"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const STAGES = [
  { key: "POST", desc: "Drop in a URL, screenshot, or raw text — any post, any platform." },
  { key: "INTELLIGENCE", desc: "Topics, audience segments, and intent get extracted in seconds." },
  { key: "STRATEGY", desc: "Four engagement strategies compete, each with visible reasoning." },
  { key: "COMMENT", desc: "The Comment Lab generates, scores, and refines your reply." },
  { key: "ENGAGEMENT", desc: "Track what lands. The system gets sharper with every post." },
];

export function FlowStory() {
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const track = trackRef.current;
    const section = sectionRef.current;
    if (!track || !section) return;

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${track.scrollWidth - window.innerWidth}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    // Fonts/layout can settle after mount and shift scrollWidth — refresh
    // once everything has loaded so the pin distance stays accurate.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    const timeoutId = window.setTimeout(refresh, 300);

    return () => {
      window.removeEventListener("load", refresh);
      window.clearTimeout(timeoutId);
      ctx.revert();
    };
  }, []);

  return (
    <section id="flow" ref={sectionRef} className="relative h-screen overflow-hidden">
      <div className="absolute left-6 top-10 z-10 sm:left-10">
        <p className="text-xs uppercase tracking-[0.25em] text-highlight/40">
          The loop
        </p>
      </div>
      <div
        ref={trackRef}
        className="flex h-full items-center gap-10 px-[8vw] will-change-transform"
        style={{ width: "max-content" }}
      >
        {STAGES.map((stage, i) => (
          <div key={stage.key} className="flex items-center gap-10">
            <div className="glass-panel-strong flex h-[60vh] w-[78vw] max-w-xl flex-col justify-between rounded-[2rem] p-10 sm:w-[42vw]">
              <span className="font-display text-sm text-accent-teal/80">
                0{i + 1}
              </span>
              <div>
                <h3 className="font-display text-gradient-signal text-4xl sm:text-5xl">
                  {stage.key}
                </h3>
                <p className="mt-4 max-w-sm text-highlight/60">{stage.desc}</p>
              </div>
            </div>
            {i < STAGES.length - 1 && (
              <span className="h-px w-16 bg-gradient-to-r from-accent-teal/40 to-transparent sm:w-24" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
