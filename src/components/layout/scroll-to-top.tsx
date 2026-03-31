"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTop() {
  const pathname = usePathname();
  const isPop = useRef(false);

  useEffect(() => {
    const onPop = () => {
      isPop.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (isPop.current) {
      isPop.current = false;
      return;
    }
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, [pathname]);

  return null;
}
