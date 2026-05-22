import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "./BottomNav";

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        navigate({ to: "/auth", search: { mode: "login" } });
      } else {
        setReady(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth", search: { mode: "login" } });
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [navigate]);

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[430px] items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
