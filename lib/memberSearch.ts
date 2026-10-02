const digitsOnly = (value: string) => value.replace(/\D/g, '');

export const normalizeName = (name: string) =>
  name.toLowerCase().replace(/\s+/g, ' ').trim();

/** Phone digits with and without the leading 0 (e.g. 0244123456 and 244123456) */
export const phoneVariants = (phone: string): string[] => {
  const d = digitsOnly(phone);
  if (!d) return [];
  const variants = new Set<string>([d]);
  if (d.startsWith('0')) variants.add(d.slice(1));
  else variants.add(`0${d}`);
  return [...variants];
};

const phoneMatchesQuery = (phone: string | undefined, query: string): boolean => {
  const qDigits = digitsOnly(query);
  if (!qDigits || qDigits.length < 2) return false;
  const qVars = phoneVariants(query);
  const pVars = phone ? phoneVariants(phone) : [];
  return pVars.some(p => qVars.some(q => p.includes(q) || q.includes(p)));
};

const nameMatchesQuery = (name: string | undefined, query: string): boolean => {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const n = normalizeName(name || '');
  return words.every(word => n.includes(word));
};

const emailMatchesQuery = (email: string | undefined, query: string): boolean => {
  if (!email || !query.trim()) return false;
  return email.toLowerCase().includes(query.toLowerCase().trim());
};

/** Match name (any word order), phone (with/without leading 0), or email */
export const matchesClientSearch = (
  fields: { name?: string; phone?: string; email?: string },
  query: string
): boolean => {
  const q = query.trim();
  if (!q) return true;
  return (
    nameMatchesQuery(fields.name, q) ||
    phoneMatchesQuery(fields.phone, q) ||
    emailMatchesQuery(fields.email, q)
  );
};
