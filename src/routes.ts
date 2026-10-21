import { byKind, type Kind } from "./config.ts";

// The page's addresses. Each is a fragment, which never reaches a server: `#app`, `#about`, `#hydrex/carbon-impact`,
// `#hydrex/9540`. A page's section is one more part, such as `#about/check`. Anything else is Home.

export type Route =
  | { view: "home" }
  | { view: "app" }
  | { view: "about"; section?: string }
  | { view: "product"; kind: Kind; section?: string }
  | { view: "position"; id: bigint };

// The sections each page has, in the order they come. A product has its own between "control" and "check".
export const ABOUT_SECTIONS = ["check", "safe", "figures"];
export const PRODUCT_SECTIONS: Record<Kind, string[]> = {
  "carbon-impact": ["record", "joining", "control", "carbon", "check"],
  automaxi: ["record", "joining", "control", "votes", "check"],
};

// Hydrex's accounts are numbered from 1. A number has at most 78 digits, as a uint256.
const ACCOUNT = /^[1-9]\d{0,77}$/;

const HOME: Route = { view: "home" };

export function parse(hash: string): Route {
  let fragment = hash.replace(/^#/, "");
  try {
    fragment = decodeURIComponent(fragment);
  } catch {}
  const [first = "", second, third, ...rest] = fragment.split("/");
  if (rest.length) return HOME;
  if (first === "" && second === undefined) return HOME;
  if (first === "app" && second === undefined) return { view: "app" };
  if (first === "about") {
    if (second === undefined) return { view: "about" };
    return third === undefined && ABOUT_SECTIONS.includes(second) ? { view: "about", section: second } : HOME;
  }
  if (first !== "hydrex") return HOME;
  // Until a second protocol, Hydrex's page is the App.
  if (second === undefined) return { view: "app" };
  if (ACCOUNT.test(second)) return third === undefined ? { view: "position", id: BigInt(second) } : HOME;
  const automation = byKind(second);
  if (!automation) return HOME;
  const { kind } = automation;
  if (third === undefined) return { view: "product", kind };
  return PRODUCT_SECTIONS[kind].includes(third) ? { view: "product", kind, section: third } : HOME;
}

export function hrefOf(route: Route): string {
  switch (route.view) {
    case "home":
      return "#";
    case "app":
      return "#app";
    case "about":
      return route.section ? `#about/${route.section}` : "#about";
    case "product":
      return `#hydrex/${route.kind}${route.section ? `/${route.section}` : ""}`;
    case "position":
      return `#hydrex/${route.id}`;
  }
}
