import { useState, useEffect } from "react";

/**
 * useDebounce
 * Delays updating the target state until the user stops typing or changing input.
 * Used for live filtering and searching hackathon tables without excessive re-renders.
 *
 * @param {any} value - Input value to debounce
 * @param {number} [delay=300] - Delay period in milliseconds
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;