import { useEffect, useRef, useState } from "react";

export function useSmartAutoScroll(depKey: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [showJump, setShowJump] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) {
      el.scrollTop = el.scrollHeight;
      setShowJump(false);
    } else {
      setShowJump(true);
    }
  }, [depKey]);

  const jumpToBottom = () => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setShowJump(false);
  };

  return { ref, showJump, jumpToBottom };
}
