"use client";

import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, type KeyboardEvent } from "react";
import { sortImages, type ProductImage } from "@/domain";
import { useLocalize } from "@/hooks/use-localize";
import { cn } from "@/lib/utils/cn";

/** Image gallery with thumbnails; arrow keys navigate (mirrored in RTL). */
export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const t = useTranslations("product");
  const tCommon = useTranslations("common");
  const text = useLocalize();
  const sorted = sortImages(images);
  const [index, setIndex] = useState(0);
  const current = sorted[index];
  const total = sorted.length;

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
        <ImageOff className="size-12" aria-hidden />
        <span className="sr-only">{t("noImage")}</span>
      </div>
    );
  }

  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);
  const onKeyDown = (event: KeyboardEvent) => {
    const rtl = document.documentElement.dir === "rtl";
    if (event.key === "ArrowRight") go(rtl ? -1 : 1);
    if (event.key === "ArrowLeft") go(rtl ? 1 : -1);
  };

  return (
    <section aria-roledescription="carousel" aria-label={t("gallery")} onKeyDown={onKeyDown} className="flex flex-col gap-3">
      <div className="group relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 shadow-md">
        <Image
          key={current.id}
          src={current.url}
          alt={text(current.alt) || title}
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="animate-fade-in object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
        />
        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={tCommon("previous")}
              className="absolute start-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-900/60 text-white transition hover:bg-neutral-900/80"
            >
              <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={tCommon("next")}
              className="absolute end-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-900/60 text-white transition hover:bg-neutral-900/80"
            >
              <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
            </button>
            <p className="absolute bottom-3 start-3 rounded-full bg-neutral-900/60 px-2.5 py-0.5 text-xs text-white" aria-live="polite">
              {t("imageOf", { index: index + 1, total })}
            </p>
          </>
        ) : null}
      </div>
      {total > 1 ? (
        <ul className="no-scrollbar flex gap-3 overflow-x-auto">
          {sorted.map((image, i) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t("showImage", { index: i + 1 })}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "relative block size-20 overflow-hidden rounded-lg border-2 transition sm:size-24",
                  i === index ? "border-neutral-900" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image src={image.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
