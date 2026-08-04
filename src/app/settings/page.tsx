import { Toaster } from "@/components/ui/sonner";
import { SettingsConsole } from "@/components/settings-console";

export default function SettingsPage() {
  return (
    <>
      <SettingsConsole />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
