import { parse, type Route } from "./routes.ts";

// The page is one HTML file split into views, one for each kind of page. The hash says which, as a route: this shows
// its view, sets the title, marks the header's link to the view shown, and opens the section asked for. Home shows
// until the script runs.

const views = [...document.querySelectorAll<HTMLElement>(".view")];
const home = views.find(({ dataset }) => dataset.view === "home")!;
const listeners: ((route: Route) => void)[] = [];
let current: Route = { view: "home" };
let currentView: HTMLElement | undefined;

export const route = (): Route => current;

// Called with each route shown, after its view shows, and at once with the one shown now.
export function onRoute(listener: (route: Route) => void): void {
  listeners.push(listener);
  listener(current);
}

function viewOf(route: Route): HTMLElement {
  const found = views.find(
    ({ dataset }) => dataset.view === route.view && (route.view !== "product" || dataset.kind === route.kind),
  );
  return found ?? home;
}

const titleOf = (route: Route, view: HTMLElement): string =>
  route.view === "position" ? `Account #${route.id} · metaDEX Café` : (view.dataset.title ?? document.title);

function showRoute(moved: boolean): void {
  const next = parse(location.hash);
  const view = viewOf(next);
  const changed =
    view !== currentView || (next.view === "position" && current.view === "position" && next.id !== current.id);
  for (const each of views) each.hidden = each !== view;
  document.title = titleOf(next, view);
  // The header's button reads as where you are on the App itself.
  const toApp = document.querySelector("header.site .to-app")!;
  if (next.view === "app") toApp.setAttribute("aria-current", "page");
  else toApp.removeAttribute("aria-current");
  current = next;
  currentView = view;
  for (const listener of listeners) listener(next);
  const section =
    "section" in next && next.section ? view.querySelector<HTMLElement>(`[data-section="${next.section}"]`) : null;
  if (section) {
    for (let fold = section.closest("details"); fold; fold = fold.parentElement?.closest("details") ?? null) {
      fold.open = true;
    }
    section.scrollIntoView();
    if (moved) section.querySelector<HTMLElement>("summary, h2")?.focus({ preventScroll: true });
    return;
  }
  if (!changed) return;
  // A new view starts at the top, with its heading focused so that screen readers announce it.
  scrollTo(0, 0);
  if (moved) view.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
}

// Safe{Wallet} shows the page in a frame: start on the App there.
if (window.parent !== window && !location.hash) location.replace("#app");
showRoute(false);
addEventListener("hashchange", () => showRoute(true));
