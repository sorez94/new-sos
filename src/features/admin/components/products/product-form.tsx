"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox, Select } from "@/components/ui/form-controls";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/states";
import { materialTypes, type Product } from "@/domain";
import { useFormErrorHandler } from "@/hooks/use-api-error";
import { useLocalize } from "@/hooks/use-localize";
import { useRouter } from "@/i18n/navigation";
import { useAdminCategories, useSaveProduct } from "../../hooks";
import { createProductFormSchema, emptyProductFormValues, formValuesToInput, productToFormValues, type ProductFormValues } from "../../product-form-model";
import { LocalizedField, NumberField } from "./form-fields";
import { ImageManager } from "./image-manager";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-neutral-200 bg-white p-5">
      <legend className="float-start mb-4 w-full text-base text-neutral-900">{title}</legend>
      <div className="clear-both space-y-4">{children}</div>
    </fieldset>
  );
}

/** Create/edit product form. Converts to `ProductInput` (docs/API.md §6.3) on submit. */
export function ProductForm({ product }: { product?: Product }) {
  const t = useTranslations("admin.productForm");
  const tProducts = useTranslations("admin.products");
  const tValidation = useTranslations("validation");
  const tMaterial = useTranslations("materialType");
  const tCommon = useTranslations("common");
  const text = useLocalize();
  const router = useRouter();
  const categories = useAdminCategories();
  const save = useSaveProduct(product?.id);
  const handleError = useFormErrorHandler();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = useMemo(() => createProductFormSchema(tValidation), [tValidation]);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: product ? productToFormValues(product) : emptyProductFormValues(),
  });
  const { register, formState, control } = form;
  const { errors } = formState;
  const pricingType = useWatch({ control, name: "pricingType" });

  const onSubmit = form.handleSubmit(
    (values) => {
      setFormError(null);
      save.mutate(formValuesToInput(values, product), {
        onSuccess: (saved) => {
          toast.success(tProducts("saved"));
          router.push(`/admin/products/${saved.id}`);
        },
        onError: (error) => setFormError(handleError(error, form.setError)),
      });
    },
    () => setFormError(t("unsaved")),
  );

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={onSubmit} className="space-y-6">
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <Section title={t("materials")}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField id="product-category" labelStyle="normal" label={t("category")} error={errors.categoryId?.message} required>
              <Select {...register("categoryId")}>
                <option value="">{t("chooseCategory")}</option>
                {categories.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {text(category.name)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="product-material-type" labelStyle="normal" label={t("materialType")} required>
              <Select {...register("materialType")}>
                {materialTypes.map((type) => (
                  <option key={type} value={type}>
                    {tMaterial(type)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <LocalizedField name="material" label={t("material")} required />
          <LocalizedField name="line" label={t("line")} required />
          <p className="-mt-2 text-xs text-neutral-500">{t("lineHint")}</p>
        </Section>

        <Section title={t("dimensions")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <NumberField name="dimensions.length" label={t("lengthCm")} />
            <NumberField name="dimensions.width" label={t("widthCm")} />
            <NumberField name="dimensions.height" label={t("heightCm")} />
          </div>
        </Section>

        <Section title={t("media")}>
          <ImageManager />
        </Section>

        <Section title={t("pricing")}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField id="product-pricing-type" labelStyle="normal" label={t("pricingType")}>
              <Select {...register("pricingType")}>
                <option value="fixed">{t("pricingFixed")}</option>
                <option value="range">{t("pricingRange")}</option>
                <option value="on_request">{t("pricingOnRequest")}</option>
              </Select>
            </FormField>
            {pricingType === "fixed" ? <NumberField name="amount" label={t("amount")} required step={100000} /> : null}
            {pricingType === "range" ? (
              <>
                <NumberField name="min" label={t("min")} required step={100000} />
                <NumberField name="max" label={t("max")} required step={100000} />
              </>
            ) : null}
          </div>
        </Section>

        <Section title={t("publishing")}>
          <Checkbox id="product-featured" label={t("featured")} {...register("isFeatured")} />
        </Section>

        <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
          <Button variant="outline" onClick={() => router.back()}>
            {tCommon("cancel")}
          </Button>
          <Button type="submit" loading={save.isPending}>
            {product ? t("update") : t("create")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
