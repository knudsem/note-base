import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Loader2, Search } from 'lucide-react';

import { useListNotesQuery } from '../store/api';
import { useDebounce } from '../hooks/useDebounce';
import { PAGINATION, SEARCH_DEBOUNCE_MS } from '../constants';
import { ErrorBanner } from './ErrorBanner';
import { NoteCard } from './NoteCard';

interface Props {
  workspaceId: string;
  onTotalChange?: (total: number) => void;
}

export function NotesList({ workspaceId, onTotalChange }: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);

  const { data, isLoading, isFetching, isError } = useListNotesQuery({
    workspaceId,
    search: debouncedSearch,
    page,
    pageSize: PAGINATION.defaultPageSize,
  });

  // Remonte le total au parent (header), via effect pour éviter setState durant le render.
  useEffect(() => {
    if (data && onTotalChange) {
      onTotalChange(data.total);
    }
  }, [data, onTotalChange]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="select-none border-b border-slate-200/80 bg-white/60 px-4 py-3 backdrop-blur-xl sm:px-7">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={2.25}
          />
          <input
            type="search"
            aria-label="Rechercher dans les notes"
            className={
              'w-full rounded-lg border-0 bg-slate-100 py-2.5 pl-9 pr-9 text-sm ' +
              'ring-1 ring-inset ring-transparent transition-all duration-150 ' +
              'placeholder:text-slate-400 ' +
              'focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none'
            }
            placeholder="Rechercher par titre ou contenu..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {isFetching && search && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>
        {/* Compteur de résultats inline : visible uniquement quand une recherche
            est active et a matché au moins une note. Le cas zéro résultat est déjà
            couvert par l'empty state plus bas. */}
        {debouncedSearch && data && data.total > 0 && (
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            {data.total} résultat{data.total > 1 ? 's' : ''} pour{' '}
            <span className="font-medium text-slate-700">"{debouncedSearch}"</span>
          </p>
        )}
      </div>

      {/* Zone notes : pattern de points très subtil pour animer le fond vide. */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5 sm:px-7"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.25) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      >
        {isLoading && <SkeletonList />}

        {isError && (
          <ErrorBanner message="Impossible de charger les notes. Réessaie ou change de workspace." />
        )}

        {data && data.items.length === 0 && !isFetching && (
          <EmptyNotesState query={debouncedSearch} />
        )}

        {data && data.items.length > 0 && (
          <div className="space-y-3">
            {/* Stagger animation : chaque card apparaît avec 50 ms de décalage. */}
            {data.items.map((note, i) => (
              <div
                key={note.id}
                className="animate-slide-up"
                style={{
                  animationDelay: `${i * 50}ms`,
                  animationFillMode: 'backwards',
                }}
              >
                <NoteCard note={note} searchQuery={debouncedSearch} />
              </div>
            ))}
          </div>
        )}

        {data && data.total > data.pageSize && (
          <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            <button
              type="button"
              className={
                'inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-slate-700 ' +
                'shadow-sm ring-1 ring-slate-200 transition-all duration-150 ease-out-expo ' +
                'hover:bg-slate-50 hover:ring-slate-300 active:scale-[0.98] ' +
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'
              }
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
              Précédent
            </button>
            <span className="text-slate-600 tabular-nums">
              Page <strong className="text-slate-900">{page}</strong> sur {totalPages}
            </span>
            <button
              type="button"
              className={
                'inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-slate-700 ' +
                'shadow-sm ring-1 ring-slate-200 transition-all duration-150 ease-out-expo ' +
                'hover:bg-slate-50 hover:ring-slate-300 active:scale-[0.98] ' +
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'
              }
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyNotesState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center py-20 text-center animate-fade-in">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card ring-1 ring-slate-200/60">
        <FileText className="h-6 w-6 text-slate-400" strokeWidth={1.75} />
      </div>
      {query ? (
        <>
          <p className="mb-1 text-sm font-semibold text-slate-700">Aucun résultat</p>
          <p className="max-w-sm text-sm leading-relaxed text-slate-500">
            Rien ne correspond à{' '}
            <span className="font-medium text-slate-700">"{query}"</span>.
            Essaie un autre mot-clé.
          </p>
        </>
      ) : (
        <>
          <p className="mb-1 text-sm font-semibold text-slate-700">Aucune note</p>
          <p className="text-sm leading-relaxed text-slate-500">
            Crée la première note de ce workspace.
          </p>
        </>
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl bg-white p-5 shadow-card ring-1 ring-slate-200/60">
          <div className="mb-3 h-4 w-1/3 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:1000px_100%] animate-shimmer" />
          <div className="mb-2 h-3 rounded bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:1000px_100%] animate-shimmer" />
          <div className="mb-4 h-3 w-5/6 rounded bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:1000px_100%] animate-shimmer" />
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}