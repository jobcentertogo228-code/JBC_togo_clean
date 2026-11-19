import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/supabase/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const routes = ["/", "/emplois", "/inscription"];

  return routes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
  }));
}
