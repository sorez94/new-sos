import { describe, expect, it } from "vitest";
import { createSeedDatabase } from "@/mocks/db/seed";
import { resolveProduct } from "@/mocks/server/handlers/shared";
import { productInputSchema } from "@/mocks/server/schemas";
import { createProductFormSchema, emptyProductFormValues, formValuesToInput, productToFormValues, slugify } from "./product-form-model";

const t = (key: string) => key;
const schema = createProductFormSchema(t);

describe("product form model", () => {
  it("round-trips a product through the form, keeping fields the form does not show", () => {
    const db = createSeedDatabase();
    const product = resolveProduct(db, db.products.find((p) => p.id === "prd_nature_dining")!);
    const input = formValuesToInput(schema.parse(productToFormValues(product)), product);

    expect(input.title).toEqual(product.title);
    expect(input.line).toEqual(product.title);
    expect(input.pricing).toEqual(product.pricing);
    expect(input.dimensions).toEqual(product.dimensions);
    expect(input.images.map((i) => i.url)).toEqual(product.images.map((i) => i.url));
    expect(input.categoryId).toBe(product.category.id);
    expect(input.slug).toBe(product.slug);
    expect(input.sku).toBe(product.sku);
    expect(input.options).toEqual(product.options);
    expect(input.specifications).toEqual(product.specifications);
    expect(input.tags).toEqual(product.tags);
    expect(input.preOrder).toEqual(product.preOrder);
    expect(input.status).toBe(product.status);
  });

  it("validates required fields and pricing by type", () => {
    const base = { ...emptyProductFormValues(), categoryId: "c", material: { en: "Marble", fa: "" }, line: { en: "Luna", fa: "" } };
    const range = schema.safeParse({ ...base, pricingType: "range", min: 10, max: 5 });
    expect(range.success).toBe(false);
    expect(range.error?.issues.map((i) => i.path.join("."))).toContain("max");

    const fixed = schema.safeParse({ ...base, pricingType: "fixed", amount: null });
    expect(fixed.error?.issues.map((i) => i.path.join("."))).toContain("amount");

    const missing = schema.safeParse({ ...base, amount: 1, line: { en: "", fa: "" } });
    expect(missing.error?.issues.map((i) => i.path.join("."))).toContain("line.en");

    expect(schema.safeParse({ ...base, amount: 1 }).success).toBe(true);
  });

  it("generates a valid API payload for a new product from the line", () => {
    const values = { ...emptyProductFormValues(), categoryId: "cat_tables", material: { en: "Marble", fa: "مرمر" }, line: { en: "Luna", fa: "لونا" }, amount: 5, isFeatured: true };
    const input = formValuesToInput(values, undefined, "abc123");
    expect(input.title).toEqual({ en: "Luna", fa: "لونا" });
    expect(input.slug).toBe("luna-abc123");
    expect(input.sku).toBe("SOS-ABC123");
    expect(input.dimensions.weight).toBeNull();
    expect(input.isFeatured).toBe(true);
    expect(productInputSchema.safeParse(input).success).toBe(true);
  });

  it("slugifies titles", () => {
    expect(slugify("  Luna Coffee Table! ")).toBe("luna-coffee-table");
    expect(slugify("Café Crème")).toBe("cafe-creme");
  });
});
