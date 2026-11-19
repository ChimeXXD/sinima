import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Actions";
import type { IcsDay } from "@/lib/ics/ics";

type IcsModule = typeof import("@/lib/ics/ics");

// "Add 18 Dec to my calendar" on a coming film's page (D-151): an all-day event on the sinima's first
// date. The calendar code is its own small file, so no page's script carries it (D-153); it starts
// loading when the button appears, so a tap saves the file at once, inside the tap (a phone's browser
// may refuse a download that comes long after it).
export function CalendarButton({ label, event, fileName }: { label: string; event: IcsDay; fileName: string }) {
  const ics = useRef<Promise<IcsModule> | null>(null);
  useEffect(() => {
    const loading = import("@/lib/ics/ics");
    ics.current = loading;
    // Offline, it fails: the tap tries again.
    loading.catch(() => {
      if (ics.current === loading) ics.current = null;
    });
  }, []);
  async function add() {
    const loading = (ics.current ??= import("@/lib/ics/ics"));
    try {
      const { buildAllDayIcs, saveIcs } = await loading;
      saveIcs(buildAllDayIcs(event, new Date().toISOString()), fileName);
    } catch {
      // Offline or a failed load: the next tap loads it again.
      if (ics.current === loading) ics.current = null;
    }
  }
  return (
    <Button kind="secondary" icon="calendar-plus" onClick={() => void add()} testId="coming.calendar">
      {label}
    </Button>
  );
}
