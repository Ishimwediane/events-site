/**
 * Reads an environment value, treating blank as unset.
 *
 * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time, and a variable
 * that is not defined in the build environment can arrive as an empty string
 * rather than `undefined`. `??` does not catch that — `"" ?? fallback` is `""` —
 * which silently produced a site with every feature switched off and an empty
 * API URL. So compare on content, not on nullishness.
 *
 * Pass the member expression directly (`envOr(process.env.NEXT_PUBLIC_X, ...)`)
 * so the build-time replacement still happens.
 */
export function envOr(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}
