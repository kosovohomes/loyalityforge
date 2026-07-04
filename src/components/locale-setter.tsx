"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

export function LocaleSetter() {
  const locale = useLocale();

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", locale);
    html.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    if (locale === "ar") {
      html.classList.add("rtl");
    } else {
      html.classList.remove("rtl");
    }
  }, [locale]);

  return null;
}
