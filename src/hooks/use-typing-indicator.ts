"use client";

import { useEffect, useRef, useState } from "react";

type UseTypingIndicatorOptions = {
  delayMs?: number;
  onTypingStart: () => void;
  onTypingStop: () => void;
};

export function useTypingIndicator({
  delayMs = 300,
  onTypingStart,
  onTypingStop,
}: UseTypingIndicatorOptions) {
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const notifyInput = () => {
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart();
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
      onTypingStop();
      timeoutRef.current = null;
    }, delayMs);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isTyping, notifyInput };
}
