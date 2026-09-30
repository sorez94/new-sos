import Image from "next/image";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function Hero() {
  const t = useTranslations("home");
  return (
    <section className="relative isolate overflow-hidden bg-sage">
      <Image
        src="/images/landing-products/p1.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover opacity-60 mix-blend-multiply"
      />
      <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col items-start justify-center gap-5 px-6 py-20 lg:min-h-[560px] lg:px-20">
        <p className="rounded-full bg-white/70 px-3 py-1 text-xs tracking-widest text-neutral-800 uppercase backdrop-blur rtl:tracking-normal">
          {t("heroEyebrow")}
        </p>
        <h1 className="max-w-2xl text-4xl leading-tight text-neutral-900 sm:text-5xl lg:text-7xl">{t("heroTitle")}</h1>
        <p className="max-w-xl text-base text-neutral-800 lg:text-lg">{t("heroSubtitle")}</p>
        <Link href="/products" className={buttonStyles({ variant: "dark", size: "lg" })}>
          {t("heroCta")}
        </Link>
      </div>
    </section>
  );
}
