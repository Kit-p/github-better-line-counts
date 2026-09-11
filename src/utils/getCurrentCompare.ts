export function getCurrentCompare(
  window: Pick<Window, "location"> = globalThis.window,
): [string, string] | undefined {
  // Refs can contain slashes ("feat/foo") and cross-fork prefixes ("owner:repo:branch"), so the
  // head ref runs to the end of the path.
  const [_, ref1, ref2] =
    window.location.pathname.match(/\/compare\/(.+?)\.{2,3}(.+?)\/?$/) ?? [];

  if (!ref1 || ref1 === "." || !ref2 || ref2 === ".") return undefined;
  return [ref1, ref2];
}
