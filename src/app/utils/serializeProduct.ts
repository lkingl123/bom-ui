import { ProductCalc, ComponentEditable } from "@/app/types";

export function serializeForUpdate(product: ProductCalc) {
  return {
    productId: product.productId,
    updates: {
      name: product.name,
      description: product.description,
      remarks: product.remarks,
      sku: product.sku,
      inci: product.customFields?.custom1,
      account: product.customFields?.custom8,

      // if you want to include BOM edits later, keep them here
      itemBoms: product.components?.map((c: ComponentEditable) => ({
        itemBomId: (c as { itemBomId?: string }).itemBomId, // 👈 safe cast since not all comps may have it
        productId: product.productId,
        childProductId: c.childProductId,
        quantity: {
          standardQuantity: c.quantity.toFixed(4),
          uomQuantity: c.quantity.toFixed(4),
          uom: c.uom || "",
          serialNumbers: [] as string[],
        },
      })),
    },
  };
}
