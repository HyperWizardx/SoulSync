import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BottomNav } from "@/presentation/components/layout/BottomNav";
import { PageTransition } from "@/presentation/components/motion/PageTransition";
import { useAuthSession } from "@/presentation/components/layout/AuthSessionProvider";
import { ReminderNudge } from "@/presentation/components/layout/ReminderNudge";

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { hasSession, isCheckingSession } = useAuthSession();

  useEffect(() => {
    if (isCheckingSession) return;
    if (!hasSession) {
      navigate({ to: "/auth", search: { mode: "login" } });
    }
  }, [isCheckingSession, hasSession, navigate]);

  if (isCheckingSession || !hasSession) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[430px] items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background pb-20">
      <PageTransition>{children}</PageTransition>
      <ReminderNudge />
      <BottomNav />
    </div>
  );
}
