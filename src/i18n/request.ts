import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const locales = ["en", "ru"] as const;
type Locale = (typeof locales)[number];

function detectLocale(cookieLocale: string | undefined, acceptLanguage: string | null): Locale {
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }
  if (acceptLanguage?.toLowerCase().startsWith("ru")) return "ru";
  return "en";
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  const { headers } = await import("next/headers");
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");

  const locale = detectLocale(cookieLocale, acceptLanguage);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
