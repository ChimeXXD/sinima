"use client";

import { useEffect } from "react";
import { Icon, type IconName } from "./Icon";
import s from "./toast.module.css";

// Toast (Figma Cinema › Toast · saved): navy, 384 wide and centred, 70 above the bottom on a phone
// and an iPad, over the tab bar's top edge. It goes by itself after a few seconds; Undo takes the
// action back. A live region, so screen readers hear it without moving focus.

const SHOWN_MS = 4000;

export function Toast({ icon, text, onUndo, onDone }: { icon: IconName; text: string; onUndo?: () => void; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, SHOWN_MS);
    return () => clearTimeout(id);
  }, [onDone]);
  return (
    <div className={s.toast} role="status" data-testid="toast">
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
