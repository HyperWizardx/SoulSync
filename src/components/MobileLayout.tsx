import { BottomNav } from "./BottomNav";

export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
