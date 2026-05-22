import { Fragment, type ReactNode } from 'react';

// Échappe les caractères spéciaux pour que la query soit traitée comme du littéral
// et pas comme une regex (sinon "test." ou "(foo)" feraient n'importe quoi).
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Retourne un ReactNode avec les occurrences de `query` surlignées via <mark>.
// Comparaison case-insensitive, le texte original (case + caractères spéciaux) est préservé.
// Si `query` est vide ou ne match rien, le texte est rendu tel quel.
export function highlight(text: string, query: string): ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return text;

  // Le groupe capturé permet à split() de conserver les matches dans le tableau résultant.
  const pattern = new RegExp(`(${escapeRegex(trimmed)})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, i) =>
    // split avec un groupe capturé : matches aux indices impairs, séparateurs aux pairs.
    i % 2 === 1 ? (
      <mark
        key={i}
        className="rounded-sm bg-yellow-200/70 px-0.5 font-medium text-slate-900"
      >
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}