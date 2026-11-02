import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

describe("App routing", () => {
  const routesToTest = [
    "/",
    "/sms",
    "/qr",
    "/audio",
    "/assistant",
    "/apprendre",
    "/historique",
    "/guide",
    "/a-propos",
    "/parametres",
  ];

  it.each(routesToTest)("matches a page for %s instead of falling back to not found", (routePath) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes(routePath);
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.length).toBeGreaterThan(0);
  });
});

