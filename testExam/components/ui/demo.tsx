import { GlowingShadow } from "@/components/ui/glowing-shadow";

export default function DemoOne() {
  return (
    <div className="flex items-center justify-center min-h-[300px] p-6 bg-slate-950">
      <GlowingShadow> 
        <span className="pointer-events-none z-10 text-center text-4xl lg:text-6xl leading-none font-semibold tracking-tighter text-white">
          Glowing Shadow
        </span>
      </GlowingShadow>
    </div>
  )
}
