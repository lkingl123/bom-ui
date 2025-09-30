import type { Category } from "../types";

export function resolveTopLevelCategory(
  cat: Category | undefined,
  all: Category[]
): string {
  const TOP_LEVELS = [
    "Account",
    "Finished Goods",
    "Bulk",
    "Ingredients",
    "Materials",
  ];

  let current = cat;
  while (current && current.parentCategoryId) {
    current = all.find(
      (c: Category) => c.categoryId === current!.parentCategoryId
    );
  }

  if (current) {
    const name = current.name.trim();
    if (TOP_LEVELS.includes(name)) return name;
  }

  return "Uncategorized"; // catch-all
}
