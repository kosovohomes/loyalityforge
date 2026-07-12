"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CustomerSearch({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`/customers${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md gap-2">
      <div className="flex-1">
        <label htmlFor="customer-search" className="sr-only">
          Search customers by name, email, or phone
        </label>
        <input
          id="customer-search"
          type="search"
          className="input"
          placeholder="Search by name, email, or phone…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Search customers"
        />
      </div>
      <button type="submit" className="btn-secondary shrink-0">
        Search
      </button>
      {value && (
        <button
          type="button"
          className="btn-secondary shrink-0 text-xs"
          onClick={() => {
            setValue("");
            router.push("/customers");
          }}
        >
          Clear
        </button>
      )}
    </form>
  );
}
