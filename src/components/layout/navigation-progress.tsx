"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathname = useRef(pathname);
  const slowTimer = useRef<NodeJS.Timeout | null>(null);
  const navigating = useRef(false);

  const startProgress = useCallback(() => {
    if (navigating.current) return;
    navigating.current = true;
    setVisible(true);
    setProgress(30);

    slowTimer.current = setTimeout(() => {
      setProgress(60);
      slowTimer.current = setTimeout(() => {
        setProgress(80);
      }, 1500);
    }, 500);
  }, []);

  const completeProgress = useCallback(() => {
    if (!navigating.current) return;
    navigating.current = false;
    if (slowTimer.current) {
      clearTimeout(slowTimer.current);
      slowTimer.current = null;
    }
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href === pathname) return;
      startProgress();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startProgress, pathname]);

  // popstate（戻る/進む）時は即座に非表示
  useEffect(() => {
    const onPop = () => {
      navigating.current = false;
      if (slowTimer.current) {
        clearTimeout(slowTimer.current);
        slowTimer.current = null;
      }
      setVisible(false);
      setProgress(0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      completeProgress();
    }
  }, [pathname, completeProgress]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms" }}
    >
      <div
        className="h-full bg-accent"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? "none" : "width 400ms ease-out",
        }}
      />
    </div>
  );
}
