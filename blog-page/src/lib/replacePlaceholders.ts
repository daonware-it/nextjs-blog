export function replacePlaceholders(template: string, replacements: Record<string, string>) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? '');
}

