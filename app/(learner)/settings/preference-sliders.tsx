"use client";

import { useState } from "react";

type Modality = "V" | "A" | "R" | "K";
type SliderValues = Record<Modality, number>;

const options: Array<{ id: Modality; label: string; description: string }> = [
  {
    id: "V",
    label: "Visual",
    description: "Diagrams and annotated screenshots",
  },
  {
    id: "A",
    label: "Listen and discuss",
    description: "Walkthrough scripts and discussion prompts",
  },
  {
    id: "R",
    label: "Read and write",
    description: "Written guides and quizzes",
  },
  {
    id: "K",
    label: "Practice",
    description: "Hands-on work in the Figma file",
  },
];

export function PreferenceSliders({ initialValues }: { initialValues: SliderValues }) {
  const [values, setValues] = useState(initialValues);

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <div
          className="grid gap-4 border border-[var(--border-strong)] bg-paper px-5 py-5 sm:grid-cols-[220px_1fr] sm:items-center sm:px-6"
          key={option.id}
        >
          <div>
            <label className="font-medium text-ink" htmlFor={`weight-${option.id}`}>
              {option.label}
            </label>
            <p className="mt-1 mb-0 text-sm leading-normal text-ink-soft">
              {option.description}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_88px] sm:items-center sm:gap-4">
            <input
              aria-describedby={`value-${option.id}`}
              aria-label={`${option.label} priority`}
              className="h-11 w-full cursor-pointer accent-ocean focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
              id={`weight-${option.id}`}
              max="100"
              min="0"
              name={option.id}
              onChange={(event) => {
                setValues((current) => ({
                  ...current,
                  [option.id]: Number(event.target.value),
                }));
              }}
              step="5"
              type="range"
              value={values[option.id]}
            />
            <output
              aria-live="polite"
              className="rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-bone px-3 py-2 text-center text-sm font-medium tabular-nums text-ink"
              htmlFor={`weight-${option.id}`}
              id={`value-${option.id}`}
            >
              {values[option.id]} / 100
            </output>
          </div>
        </div>
      ))}

      <button
        className="mt-2 min-h-11 rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-bone px-4 text-sm font-medium text-ocean transition hover:border-ocean focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean focus-visible:ring-offset-2"
        onClick={() => setValues({ V: 25, A: 25, R: 25, K: 25 })}
        type="button"
      >
        Reset to balanced
      </button>
    </div>
  );
}
