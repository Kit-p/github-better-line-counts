export interface CompareRefs {
  /**
   * The base ref, or undefined when the URL only names the head. GitHub omits the base when it is
   * the repository's default branch, for example on the pull request creation page.
   */
  base?: string;
  head: string;
}

export function getCurrentCompare(
  window: Pick<Window, "location"> = globalThis.window,
): CompareRefs | undefined {
  const [_, refs] =
    window.location.pathname.match(/\/compare\/(.+?)\/?$/) ?? [];
  if (!refs) return undefined;

  // Refs can contain slashes ("feat/foo") and cross-fork prefixes ("owner:repo:branch"), but never
  // "..", so the separator is unambiguous.
  const separated = refs.match(/^(.*?)\.{2,3}(.*)$/);
  if (!separated) return refs === "." ? undefined : { head: refs };

  const [__, base, head] = separated;
  if (!base || base === "." || !head || head === ".") return undefined;
  return { base, head };
}
