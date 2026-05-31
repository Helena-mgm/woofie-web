import { useEffect, useMemo, useState } from 'react';
import { DOG_BREEDS, MIXED_BREED_LABEL } from '@/shared/data/dog-breeds';

interface BreedSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
}

const MAX_MIXED_COMPONENTS = 3;

const normalizeBreed = (text: string): string => {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      const lower = word.toLowerCase();
  if (['de', 'du', 'des', 'la', 'le', 'les', 'et', 'à', 'd\u2019', "d'"].includes(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\s*-\s*/g, '-');
};

const formatSelection = (breeds: string[], isMixed: boolean): string => {
  if (isMixed) {
    if (breeds.length === 0) {
      return MIXED_BREED_LABEL;
    }
    return `${MIXED_BREED_LABEL} : ${breeds.join(' x ')}`;
  }

  return breeds[0] ?? '';
};

const parseSelection = (value: string): { isMixed: boolean; breeds: string[] } => {
  if (!value) {
    return { isMixed: false, breeds: [] };
  }

  const trimmed = value.trim();
  if (trimmed.toLowerCase().startsWith(MIXED_BREED_LABEL.toLowerCase())) {
    const parts = trimmed.split(':')[1];
    if (!parts) {
      return { isMixed: true, breeds: [] };
    }

    const breeds = parts
      .split(/x|,|·|\/|&/i)
      .map(normalizeBreed)
      .filter((item) => item.length > 0);

    return { isMixed: true, breeds };
  }

  return { isMixed: false, breeds: [normalizeBreed(trimmed)] };
};

export function BreedSelect({
  label = 'Race',
  value,
  onChange,
  error,
  helperText,
  disabled,
  required,
}: BreedSelectProps) {
  const parsedValue = useMemo(() => parseSelection(value), [value]);
  const [isMixed, setIsMixed] = useState(parsedValue.isMixed);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>(parsedValue.breeds);
  const [query, setQuery] = useState<string>(parsedValue.isMixed ? '' : parsedValue.breeds[0] ?? '');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setIsMixed(parsedValue.isMixed);
    setSelectedBreeds(parsedValue.breeds);
    setQuery(parsedValue.isMixed ? '' : parsedValue.breeds[0] ?? '');
  }, [parsedValue]);

  useEffect(() => {
    const formatted = formatSelection(selectedBreeds, isMixed);
    if (formatted !== value) {
      onChange(formatted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBreeds, isMixed]);

  const filteredBreeds = useMemo(() => {
    const input = query.trim().toLowerCase();
    if (!input) {
      return DOG_BREEDS.slice(0, 12);
    }
    return DOG_BREEDS.filter((breed) => breed.toLowerCase().includes(input)).slice(0, 12);
  }, [query]);

  const handleSelectBreed = (breed: string) => {
    if (!breed) return;
    const normalized = normalizeBreed(breed);
    if (isMixed) {
      setSelectedBreeds((prev) => {
        if (prev.includes(normalized)) return prev;
        if (prev.length >= MAX_MIXED_COMPONENTS) return prev;
        return [...prev, normalized];
      });
      setQuery('');
      setShowDropdown(false);
    } else {
      setSelectedBreeds([normalized]);
      setQuery(normalized);
      setShowDropdown(false);
    }
  };

  const handleCommitQuery = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    handleSelectBreed(trimmed);
  };

  const handleRemoveBreed = (breed: string) => {
    setSelectedBreeds((prev) => prev.filter((item) => item !== breed));
  };

  const handleToggleMixed = () => {
    setIsMixed((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedBreeds((current) => (current.length > 0 ? [current[0]] : []));
        setQuery((current) => (current ? normalizeBreed(current) : selectedBreeds[0] ?? ''));
      } else {
        setQuery('');
      }
      return next;
    });
    setShowDropdown(false);
  };

  const handleUnknownMix = () => {
    setIsMixed(true);
    setSelectedBreeds([]);
    setQuery('');
    setShowDropdown(false);
  };

  const dropdownVisible = showDropdown && !disabled && filteredBreeds.length > 0;
  const inputValue = isMixed ? query : query || selectedBreeds[0] || '';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={handleToggleMixed}
          className="text-xs font-semibold text-[#D2691E] hover:text-[#8B4513] transition-colors disabled:text-gray-400"
          disabled={disabled}
        >
          {isMixed ? 'Race unique' : 'Déclarer un croisé'}
        </button>
      </div>

      {isMixed && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedBreeds.map((breed) => (
            <span
              key={breed}
              className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs text-[#8B4513] font-semibold"
            >
              {breed}
              <button
                type="button"
                onClick={() => handleRemoveBreed(breed)}
                className="text-[#D2691E] hover:text-[#8B4513]"
                aria-label={`Retirer ${breed}`}
              >
                ✕
              </button>
            </span>
          ))}
          {selectedBreeds.length === 0 && (
            <span className="text-xs text-gray-500">
              Ajoutez jusqu&apos;à {MAX_MIXED_COMPONENTS} races pour décrire le croisé.
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => {
              setTimeout(() => setShowDropdown(false), 150);
              if (!isMixed) {
                handleCommitQuery();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleCommitQuery();
              }
              if (event.key === 'Escape') {
                setShowDropdown(false);
              }
            }}
            disabled={disabled}
            placeholder={isMixed ? 'Ajoutez une race' : 'Recherchez une race'}
            className={`w-full rounded-2xl border ${error ? 'border-red-500' : 'border-[#E7D9C7]'} bg-white px-4 py-3 text-sm font-medium text-[#3E2A1B] placeholder:text-[#B19A82] shadow-inner focus:border-[#D2691E] focus:outline-none focus:ring-2 focus:ring-[#FFD9A6]`}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${label}-error` : undefined}
          />
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setShowDropdown(true);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
              aria-label="Effacer la recherche"
            >
              ✕
            </button>
          )}
        </div>

        {dropdownVisible && (
          <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-orange-100 bg-white shadow-xl">
            <ul className="divide-y divide-orange-50">
              {filteredBreeds.map((breed) => (
                <li key={breed}>
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-orange-50"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectBreed(breed)}
                  >
                    {breed}
                  </button>
                </li>
              ))}
              {query.trim() && !DOG_BREEDS.some((breed) => breed.toLowerCase() === query.trim().toLowerCase()) && (
                <li>
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm font-semibold text-[#D2691E] hover:bg-orange-50"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectBreed(query)}
                  >
                    Ajouter «&nbsp;{normalizeBreed(query)}&nbsp;»
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {isMixed && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUnknownMix}
            className="rounded-full border border-dashed border-[#D2691E] px-3 py-1 text-xs font-semibold text-[#D2691E] hover:bg-orange-50"
          >
            Croisé (parents inconnus)
          </button>
          <span className="text-xs text-gray-500">
            Combinez jusqu&apos;à {MAX_MIXED_COMPONENTS} races pour décrire le croisé.
          </span>
        </div>
      )}

      {error ? (
        <p id={`${label}-error`} className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
}
