"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "./Icon";
import s from "./toast.module.css";

// Toast (Figma Cinema › Toast · saved): 384 wide and centred, 70 above the bottom on a phone
// and an iPad, over the tab bar's top edge. It goes by itself after a few seconds; Undo takes the
// action back. A live region, so screen readers hear it without moving focus. It slips away over
// 160 ms before it goes (D-112 F8); a new `stamp` (another cinema saved) starts its time again
// without drawing it afresh.

const SHOWN_MS = 4000;
const LEAVE_MS = 200; // its 160 ms exit, and a frame to spare

/** `tone`: info (a saved cinema, a copied link) is blue; an error is red (D-109 d). */
export function Toast({ icon, text, tone = "info", stamp, onUndo, onDone }: { icon: IconName; text: string; tone?: "info" | "error"; /** What it's about: a new one restarts its time. */ stamp?: string; onUndo?: () => void; onDone: () => void }) {
  // Leaving for this stamp: a new stamp makes it stay again.
  const [leaving, setLeaving] = useState<string | null | undefined>(null);
  const gone = leaving !== null && leaving === stamp;
  useEffect(() => {
    const id = setTimeout(() => setLeaving(stamp), SHOWN_MS);
    return () => clearTimeout(id);
  }, [stamp]);
  useEffect(() => {
    if (!gone) return;
    const id = setTimeout(onDone, LEAVE_MS);
    return () => clearTimeout(id);
  }, [gone, onDone]);
  return (
    <div className={s.toast} role={tone === "error" ? "alert" : "status"} data-tone={tone} data-leaving={gone || undefined} data-testid="toast">
      <Icon name={icon} size={18} className={s.icon} />
      <span className={s.text}>{text}</span>
      {onUndo && (
        <button type="button" className={s.undo} onClick={onUndo}>
          Undo
        </button>
      )}
    </div>
  );
}
