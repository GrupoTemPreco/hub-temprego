import type { ReactNode } from "react";
import { HubFrame } from "@/components/hub/HubFrame";
import { ToastProvider } from "@/components/ui/Toast";

export default function HubLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <HubFrame>{children}</HubFrame>
    </ToastProvider>
  );
}
