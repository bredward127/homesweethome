/**
 * Test stub for the `server-only` package.
 *
 * The real package throws when resolved outside a React Server Component, so
 * importing a server module in a unit test fails. Vitest aliases the package
 * here so server-side logic (token signing, audit helpers) can be tested
 * directly.
 *
 * This does NOT weaken the guarantee in the app: the alias applies only to
 * Vitest. `next build` still resolves the real package, so a client component
 * importing a server module remains a build error.
 */
export {};
