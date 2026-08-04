/**
 * Drops keys whose value is `undefined`.
 *
 * Zod's `.partial()` produces `{ name?: string | undefined }`, but with
 * `exactOptionalPropertyTypes` enabled Prisma's update inputs reject an
 * explicit `undefined`. Stripping those keys lets a partial update pass
 * through untouched fields without casting away type safety.
 */
export function definedFields<T extends object>(
    input: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
    return Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined),
    ) as { [K in keyof T]?: Exclude<T[K], undefined> };
}
