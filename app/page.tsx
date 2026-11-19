import type { Metadata } from "next";
import { HomeLanding } from "@/components/home/home-landing";

export const metadata: Metadata = {
  title: "JOB-CENTER | Recrutement intelligent au Togo",
  description:
    "La première plateforme de recrutement intelligente au Togo. Découvrez les opportunités, valorisez vos talents et recrutez plus simplement.",
  openGraph: {
    title: "JOB-CENTER — Les bonnes opportunités commencent ici",
    description:
      "Connectez les meilleurs talents aux meilleures opportunités grâce à une plateforme pensée pour les entreprises et les candidats africains.",
    url: "/",
    type: "website",
  },
};

export default function HomePage() {
  return <HomeLanding />;
}
