import type { ContactFilters } from "./market";

export function parseFilters(p: URLSearchParams): ContactFilters {
  const num = (k: string) => (p.get(k) ? Number(p.get(k)) : undefined);
  return {
    q: p.get("q") || undefined,
    country: p.get("country") || undefined,
    city: p.get("city") || undefined,
    ageMin: num("ageMin"),
    ageMax: num("ageMax"),
    profession: p.get("profession") || undefined,
    gender: p.get("gender") || undefined,
    from: p.get("from") || undefined,
    to: p.get("to") || undefined,
    page: num("page"),
    limit: num("limit"),
  };
}
