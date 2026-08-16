import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
}

export const WordsPullUp = ({ text, className = "", showAsterisk = false, style }: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block relative"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- PrismaHero ---------------- */
interface PrismaHeroProps {
  role: "client" | "worker";
  onPrimaryAction?: () => void;
  onSignOut?: () => void;
  onNavClick?: (item: string) => void;
  children?: React.ReactNode;
}

export const PrismaHero = ({ role, onPrimaryAction, onSignOut, onNavClick, children }: PrismaHeroProps) => {
  const isClient = role === "client";

  const navItems = isClient
    ? ["Dashboard", "Review Workers", "Report No Show", "Profile", "Contact Us", "Sign Out"]
    : ["Dashboard", "Review Clients", "Buy Slots", "Profile", "Disputes", "Contact Us", "Sign Out"];

  const buttonText = isClient ? "Post a work" : "Get a work";

  return (
    <section className="h-screen w-full p-2 md:p-4">
      <div className="relative h-full w-full overflow-hidden rounded-2xl md:rounded-[2rem]">
        
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
        />

        {/* Noise overlay */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.7] mix-blend-overlay" />

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* Navbar */}
        <nav className="absolute left-1/2 top-0 z-20 -translate-x-1/2 w-full flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-b-2xl bg-black px-4 py-3 sm:gap-6 md:gap-12 md:rounded-b-3xl md:px-8 lg:gap-14 max-w-[95%]">
            {navItems.map((item) => {
              if (item === "Sign Out") {
                return (
                  <button
                    key={item}
                    onClick={onSignOut}
                    className="text-[10px] transition-colors sm:text-xs md:text-sm whitespace-nowrap"
                    style={{ color: "rgba(225, 224, 204, 0.8)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#E1E0CC")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(225, 224, 204, 0.8)")}
                  >
                    {item}
                  </button>
                )
              }
              return (
                <button
                  key={item}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavClick) onNavClick(item);
                  }}
                  className="text-[10px] transition-colors sm:text-xs md:text-sm whitespace-nowrap"
                  style={{ color: "rgba(225, 224, 204, 0.8)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#E1E0CC")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(225, 224, 204, 0.8)")}
                >
                  {item}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Hero content */}
        {children ? (
          children
        ) : (
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 sm:px-6 md:px-10">
            <div className="grid grid-cols-12 items-end gap-4">
              
              <div className="col-span-12 lg:col-span-8">
                <h1
                  className="font-medium leading-none tracking-normal text-[18vw] sm:text-[16vw] md:text-[14vw] lg:text-[12vw] xl:text-[11vw] 2xl:text-[11vw] pb-4"
                  style={{ color: "#E1E0CC" }}
                >
                  <WordsPullUp text="krewgrid" />
                </h1>
              </div>

              <div className="col-span-12 flex flex-col gap-5 pb-6 lg:col-span-4 lg:pb-10">
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-xs text-zinc-300 sm:text-sm md:text-base font-medium"
                  style={{ lineHeight: 1.4 }}
                >
                  krewgrid is a platform where event teams and workers interact directly. Built for speed, reliability, and growing your network in the event industry.
                </motion.p>

                <motion.button
                  onClick={onPrimaryAction}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="group inline-flex items-center gap-2 self-start rounded-full bg-white py-1 pl-5 pr-1 text-sm font-medium text-black transition-all hover:gap-3 sm:text-base"
                >
                  {buttonText}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                    <ArrowRight className="h-4 w-4" style={{ color: "#E1E0CC" }} />
                  </span>
                </motion.button>

              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
