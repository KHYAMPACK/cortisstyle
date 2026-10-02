"use client";

import { X } from "lucide-react";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
} from "@/components/tr/panel/panelUi";
import { normalizeTags } from "@/lib/tr/productDetails";

/**
 * "Type a value or pick one already used" fields (Marka, Tedarikçi, Etiket). There
 * are no Markalar / Etiketler pages yet, so the suggestions are the values the
 * boutique's products already carry, and anything typed is fine. Both fields extend
 * their suggestion list past the card's edge: give the card `allowOverflow`.
 */

const MAX_SUGGESTIONS = 8;

function key(value: string): string {
  return value.toLocaleLowerCase("tr");
}

function matching(
  options: readonly string[],
  query: string,
  exclude: ReadonlySet<string>,
): string[] {
  const needle = key(query.trim());
  return options
    .filter((option) => !exclude.has(key(option)) && key(option).includes(needle))
    .slice(0, MAX_SUGGESTIONS);
}

function SuggestionList({
  id,
  suggestions,
  activeIndex,
  onPick,
  addLabel,
}: {
  id: string;
  suggestions: readonly string[];
  activeIndex: number;
  onPick: (value: string) => void;
  /** A first row that adds what was typed, when it is not among the suggestions. */
  addLabel?: string;
}) {
  const rows = addLabel ? [addLabel, ...suggestions] : suggestions;
  return (
    <ul
      id={id}
      role="listbox"
      className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
    >
      {rows.map((row, index) => (
        <li
          key={`${index}-${row}`}
          id={`${id}-${index}`}
          role="option"
          aria-selected={index === activeIndex}
          // Keep focus in the input: a click must not blur (and so close) the list first.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(addLabel && index === 0 ? "" : row)}
          className={`cursor-pointer px-3 py-2 text-[14px] lg:text-[13px] ${
            index === activeIndex
              ? "bg-[color:var(--panel-accent-soft)] text-[color:var(--panel-accent-deep)]"
              : "text-neutral-800 hover:bg-neutral-50"
          }`}
        >
          {addLabel && index === 0 ? <span className="font-medium">{row}</span> : row}
        </li>
      ))}
    </ul>
  );
}

/** One free-text value with suggestions (Marka, Tedarikçi). The typed text is the value. */
export function TrPanelCreatableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  hint,
  maxLength,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: readonly string[];
  placeholder?: string;
  hint?: string;
  maxLength?: number;
  disabled?: boolean;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapper = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () => matching(options, value, new Set([key(value.trim())])),
    [options, value],
  );
  const showList = open && suggestions.length > 0;

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, -1));
    } else if (event.key === "Enter" && showList && active >= 0) {
      // Picks the highlighted suggestion instead of submitting the form.
      event.preventDefault();
      pick(suggestions[active]!);
    } else if (event.key === "Escape" && showList) {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div
      ref={wrapper}
      className="relative space-y-2"
      onBlur={(event) => {
        if (!wrapper.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
          setActive(-1);
        }
      }}
    >
      <label className="block space-y-2">
        <span className={panelLabelClass}>{label}</span>
        <input
          value={value}
          disabled={disabled}
          maxLength={maxLength}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={panelFieldClass}
        />
      </label>
      {showList ? (
        <SuggestionList
          id={listId}
          suggestions={suggestions}
          activeIndex={active}
          onPick={pick}
        />
      ) : null}
      {hint ? <p className={panelHintClass}>{hint}</p> : null}
    </div>
  );
}

/** Several free-text values as chips (Etiket): Enter or a comma adds what was typed. */
export function TrPanelTagsField({
  label,
  values,
  onChange,
  options,
  placeholder,
  hint,
  maxItems,
  maxLength,
  disabled,
}: {
  label: string;
  values: readonly string[];
  onChange: (next: string[]) => void;
  options: readonly string[];
  placeholder?: string;
  hint?: string;
  maxItems: number;
  maxLength: number;
  disabled?: boolean;
}) {
  const listId = useId();
  const labelId = useId();
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapper = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const chosen = new Set(values.map(key));
  const typed = draft.replace(/\s+/g, " ").trim();
  const suggestions = matching(options, draft, chosen);
  // Offer to add the typed text unless it is already a tag or a suggestion.
  const canAdd = typed !== "" && !chosen.has(key(typed)) && !suggestions.some((s) => key(s) === key(typed));
  const showList = open && (suggestions.length > 0 || canAdd) && values.length < maxItems;
  const addLabel = canAdd ? `“${typed}” ekle` : undefined;

  const add = (raw: string) => {
    const next = normalizeTags([...values, raw.slice(0, maxLength)]);
    if (next.length !== values.length && next.length <= maxItems) onChange(next);
    setDraft("");
    setActive(-1);
  };

  const commitDraft = () => {
    if (typed) add(typed);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const rowCount = suggestions.length + (addLabel ? 1 : 0);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, rowCount - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, -1));
    } else if (event.key === "Enter" || event.key === ",") {
      // Adds a tag (never submits the form).
      event.preventDefault();
      if (showList && active >= 0) {
        const index = addLabel ? active - 1 : active;
        if (index >= 0) add(suggestions[index]!);
        else commitDraft();
      } else {
        commitDraft();
      }
    } else if (event.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    } else if (event.key === "Escape" && showList) {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div
      ref={wrapper}
      className="relative space-y-2"
      onBlur={(event) => {
        if (!wrapper.current?.contains(event.relatedTarget as Node | null)) {
          commitDraft();
          setOpen(false);
          setActive(-1);
        }
      }}
    >
      <div className="space-y-2">
        <span id={labelId} className={`${panelLabelClass}`}>
          {label}
        </span>
        <span
          className={`flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 transition-colors focus-within:border-[color:var(--panel-accent)] lg:min-h-9 ${
            disabled ? "opacity-60" : ""
          }`}
          onClick={() => input.current?.focus()}
        >
          {values.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-[color:var(--panel-accent-soft)] py-1 pr-1 pl-2 text-[13px] font-medium text-[color:var(--panel-accent-deep)]"
            >
              {tag}
              <button
                type="button"
                disabled={disabled}
                aria-label={`${tag} etiketini kaldır`}
                onClick={(event) => {
                  event.preventDefault();
                  onChange(values.filter((value) => value !== tag));
                }}
                className="flex size-5 items-center justify-center rounded hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-[color:var(--panel-accent)]"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
          <input
            ref={input}
            value={draft}
            disabled={disabled || values.length >= maxItems}
            maxLength={maxLength}
            placeholder={values.length === 0 ? placeholder : undefined}
            role="combobox"
            aria-labelledby={labelId}
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
            onChange={(event) => {
              const next = event.target.value;
              // A pasted or typed comma splits into tags.
              if (next.includes(",")) {
                const parts = next.split(",");
                const merged = normalizeTags([
                  ...values,
                  ...parts.map((part) => part.slice(0, maxLength)),
                ]).slice(0, maxItems);
                onChange(merged);
                setDraft("");
              } else {
                setDraft(next);
              }
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-[16px] outline-none lg:text-[13px]"
          />
        </span>
      </div>
      {showList ? (
        <SuggestionList
          id={listId}
          suggestions={suggestions}
          activeIndex={active}
          addLabel={addLabel}
          onPick={(picked) => (picked === "" ? commitDraft() : add(picked))}
        />
      ) : null}
      <p className={panelHintClass}>
        {hint ?? "Yazıp Enter’a basın."} {values.length}/{maxItems}
      </p>
    </div>
  );
}

/**
 * One value from a fixed list, as a compact searchable box (Özellikler choice fields).
 * Focusing it lists every option; typing narrows the list. With `allowCustom` the typed
 * text can be used as the value too. A stored value outside the list stays shown.
 */
export function TrPanelComboboxField({
  label,
  value,
  onChange,
  options,
  allowCustom = false,
  required = false,
  maxLength,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: readonly string[];
  allowCustom?: boolean;
  required?: boolean;
  maxLength?: number;
  disabled?: boolean;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const wrapper = useRef<HTMLDivElement>(null);

  const needle = key(query.trim());
  const suggestions = useMemo(
    () => options.filter((option) => key(option).includes(needle)),
    [options, needle],
  );
  const typed = query.trim();
  const addLabel =
    allowCustom && typed && !options.some((option) => key(option) === key(typed))
      ? `“${typed}” kullan`
      : undefined;
  const rowCount = suggestions.length + (addLabel ? 1 : 0);
  const showList = open && rowCount > 0;

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(-1);
  };
  const pick = (next: string) => {
    onChange(next);
    close();
  };
  const pickRow = (index: number) => {
    if (addLabel && index === 0) pick(typed);
    else pick(suggestions[addLabel ? index - 1 : index]!);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, rowCount - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, -1));
    } else if (event.key === "Enter") {
      // Never submits the form from here.
      event.preventDefault();
      if (showList && active >= 0) pickRow(active);
      else if (addLabel) pick(typed);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    }
  };

  return (
    <div
      ref={wrapper}
      className="relative space-y-2"
      onBlur={(event) => {
        if (!wrapper.current?.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      <label className="block space-y-2">
        <span className="text-[14px] font-medium text-neutral-700">
          {label}
          {required ? <span className="text-[color:var(--panel-accent)]"> *</span> : null}
        </span>
        <div className="relative">
          <input
            value={open ? query : value}
            disabled={disabled}
            maxLength={maxLength}
            placeholder={open && value ? value : "Seçin"}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className={`${panelFieldClass} pr-9`}
          />
          {value && !disabled ? (
            <button
              type="button"
              aria-label={`${label} seçimini temizle`}
              // Keep focus handling simple: clearing doesn't open the list.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick("")}
              className="absolute top-1/2 right-2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>
      </label>
      {showList ? (
        <SuggestionList
          id={listId}
          suggestions={suggestions}
          activeIndex={active}
          onPick={(row) => pick(row === "" && addLabel ? typed : row)}
          addLabel={addLabel}
        />
      ) : null}
    </div>
  );
}
