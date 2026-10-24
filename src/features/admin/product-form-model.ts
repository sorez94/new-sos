import { z } from "zod";
import { materialTypes, pricingTypes, type LocalizedText, type Pricing, type Product, type ProductInput } from "@/domain";

type ValidationT = (key: "required" | "min" | "integer" | "rangeOrder", values?: Record<string, number>) => string;

/**
 * Admin product form model. Kept separate from React so mapping/validation is unit-testable.
 * The form only edits category, materials, line, dimensions (L × W × H), images, price and the
 * home-page flag; every other `ProductInput` field is kept from the existing product or defaulted.
 * Numeric inputs use `setValueAs` → number | null.
 */
export function createProductFormSchema(t: ValidationT) {
  const requiredText = z.object({ en: z.string().trim().min(1, t("required")), fa: z.string().trim() });
  const optionalText = z.object({ en: z.string().trim(), fa: z.string().trim() });
  const money = z.number(t("integer")).int(t("integer")).min(0, t("min", { min: 0 }));
  const nullableMeasure = z.number(t("integer")).min(0, t("min", { min: 0 })).nullable();

  return z
    .object({
      categoryId: z.string().min(1, t("required")),
      materialType: z.enum(materialTypes),
      material: requiredText,
      line: requiredText,
      dimensions: z.object({ length: nullableMeasure, width: nullableMeasure, height: nullableMeasure }),
      images: z.array(z.object({ id: z.string().optional(), url: z.string().min(1, t("required")), alt: optionalText })),
      pricingType: z.enum(pricingTypes),
      amount: money.nullable(),
      min: money.nullable(),
      max: money.nullable(),
      isFeatured: z.boolean(),
    })
    .superRefine((values, ctx) => {
      if (values.pricingType === "fixed" && values.amount === null) ctx.addIssue({ code: "custom", path: ["amount"], message: t("required") });
      if (values.pricingType === "range") {
        if (values.min === null) ctx.addIssue({ code: "custom", path: ["min"], message: t("required") });
        if (values.max === null) ctx.addIssue({ code: "custom", path: ["max"], message: t("required") });
        if (values.min !== null && values.max !== null && values.max < values.min) ctx.addIssue({ code: "custom", path: ["max"], message: t("rangeOrder") });
      }
    });
}

export type ProductFormValues = z.infer<ReturnType<typeof createProductFormSchema>>;

const emptyText = () => ({ en: "", fa: "" });
const toForm = (text: LocalizedText | null | undefined) => ({ en: text?.en ?? "", fa: text?.fa ?? "" });
const fromForm = (text: { en: string; fa: string }): LocalizedText => ({ en: text.en.trim(), ...(text.fa.trim() ? { fa: text.fa.trim() } : {}) });

export function emptyProductFormValues(): ProductFormValues {
  return {
    categoryId: "",
    materialType: "stone",
    material: emptyText(),
    line: emptyText(),
    dimensions: { length: null, width: null, height: null },
    images: [],
    pricingType: "fixed",
    amount: null,
    min: null,
    max: null,
    isFeatured: false,
  };
}

export function productToFormValues(product: Product): ProductFormValues {
  const { pricing, dimensions } = product;
  return {
    categoryId: product.category.id,
    materialType: product.materialType,
    material: toForm(product.material),
    // Products created before lines existed fall back to their title, so saving keeps the name.
    line: toForm(product.line ?? product.title),
    dimensions: { length: dimensions.length, width: dimensions.width, height: dimensions.height },
    images: [...product.images].sort((a, b) => a.sortOrder - b.sortOrder).map((img) => ({ id: img.id, url: img.url, alt: toForm(img.alt) })),
    pricingType: pricing.type,
    amount: pricing.type === "fixed" ? pricing.amount : null,
    min: pricing.type === "range" ? pricing.min : null,
    max: pricing.type === "range" ? pricing.max : null,
    isFeatured: product.isFeatured,
  };
}

function toPricing(values: ProductFormValues): Pricing {
  switch (values.pricingType) {
    case "fixed":
      return { type: "fixed", amount: values.amount ?? 0 };
    case "range":
      return { type: "range", min: values.min ?? 0, max: values.max ?? 0 };
    case "on_request":
      return { type: "on_request" };
  }
}

type HiddenFields = Omit<ProductInput, keyof ProductFormValues | "title" | "dimensions" | "images" | "pricing"> & { weight: number | null };

/** Fields the form does not show: kept from `product` when editing, generated when creating. */
function hiddenFields(title: LocalizedText, product: Product | undefined, suffix: string): HiddenFields {
  if (product) {
    const { slug, sku, shortDescription, description, finish, origin, options, specifications, availability, preOrder, status, tags } = product;
    return { slug, sku, shortDescription, description, finish, origin, options, specifications, availability, preOrder, status, tags, weight: product.dimensions.weight };
  }
  return {
    slug: `${slugify(title.en) || "product"}-${suffix}`,
    sku: `SOS-${suffix.toUpperCase()}`,
    shortDescription: title,
    description: title,
    finish: null,
    origin: null,
    options: [],
    specifications: [],
    availability: "made_to_order",
    preOrder: { enabled: true, minQuantity: 1, maxQuantity: 10, leadTimeDays: 30 },
    status: "published",
    tags: [],
    weight: null,
  };
}

const randomSuffix = () => Math.random().toString(36).slice(2, 8);

/** `product` is the product being edited (if any); its hidden fields are preserved. */
export function formValuesToInput(values: ProductFormValues, product?: Product, suffix: string = randomSuffix()): ProductInput {
  const line = fromForm(values.line);
  const { weight, ...hidden } = hiddenFields(line, product, suffix);
  return {
    ...hidden,
    title: line,
    categoryId: values.categoryId,
    materialType: values.materialType,
    material: fromForm(values.material),
    line,
    dimensions: { ...values.dimensions, weight },
    images: values.images.map((image, index) => ({ ...(image.id ? { id: image.id } : {}), url: image.url, alt: image.alt.en ? fromForm(image.alt) : line, sortOrder: index })),
    pricing: toPricing(values),
    isFeatured: values.isFeatured,
  };
}

/** "Luna Coffee Table!" → "luna-coffee-table" */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
