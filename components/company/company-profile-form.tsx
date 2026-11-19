"use client";

import { useActionState } from "react";
import { saveCompanyProfileAction } from "@/app/actions/company";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { CompanyLogoUpload } from "@/components/company/company-logo-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CompanyProfileInitial = {
  id: string;
  companyCode: string;
  name: string;
  industry: string;
  description: string;
  phone: string;
  email: string;
  websiteUrl: string;
  address: string;
  city: string;
  countryCode: string;
  logoUrl: string | null;
  isVerified: boolean;
};

export function CompanyProfileForm({
  company,
  userId,
  canManage,
}: {
  company: CompanyProfileInitial;
  userId: string;
  canManage: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveCompanyProfileAction, {});

  return (
    <div className="space-y-5">
      <CompanyLogoUpload
        canManage={canManage}
        companyId={company.id}
        logoUrl={company.logoUrl}
        name={company.name}
        userId={userId}
      />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{company.name}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">{company.companyCode}</span>
              <span className={company.isVerified ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800" : "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900"}>
                {company.isVerified ? "Vérifiée" : "Non vérifiée"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <input name="companyId" type="hidden" value={company.id} />
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`company-name-${company.id}`}>Nom de l’entreprise</Label>
                <Input defaultValue={company.name} disabled={!canManage} id={`company-name-${company.id}`} maxLength={180} name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`company-industry-${company.id}`}>Secteur d’activité</Label>
                <Input defaultValue={company.industry} disabled={!canManage} id={`company-industry-${company.id}`} maxLength={120} name="industry" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`company-email-${company.id}`}>E-mail professionnel</Label>
                <Input autoComplete="email" defaultValue={company.email} disabled={!canManage} id={`company-email-${company.id}`} maxLength={254} name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`company-phone-${company.id}`}>Téléphone</Label>
                <Input autoComplete="tel" defaultValue={company.phone} disabled={!canManage} id={`company-phone-${company.id}`} maxLength={40} name="phone" type="tel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`company-website-${company.id}`}>Site internet</Label>
                <Input autoComplete="url" defaultValue={company.websiteUrl} disabled={!canManage} id={`company-website-${company.id}`} maxLength={2048} name="websiteUrl" placeholder="https://exemple.tg" type="url" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`company-city-${company.id}`}>Ville</Label>
                <Input autoComplete="address-level2" defaultValue={company.city} disabled={!canManage} id={`company-city-${company.id}`} maxLength={120} name="city" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`company-address-${company.id}`}>Adresse</Label>
                <Input autoComplete="street-address" defaultValue={company.address} disabled={!canManage} id={`company-address-${company.id}`} maxLength={240} name="address" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`company-country-${company.id}`}>Pays (code ISO)</Label>
                <Input autoComplete="country" defaultValue={company.countryCode} disabled={!canManage} id={`company-country-${company.id}`} maxLength={2} name="countryCode" pattern="[A-Za-z]{2}" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`company-description-${company.id}`}>Description de l’entreprise</Label>
              <Textarea defaultValue={company.description} disabled={!canManage} id={`company-description-${company.id}`} maxLength={10000} name="description" rows={6} />
            </div>
            {canManage ? (
              <>
                <AuthFeedback state={state} />
                <Button disabled={pending} type="submit">{pending ? "Enregistrement…" : "Enregistrer le profil"}</Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Seuls les propriétaires et administrateurs peuvent modifier ce profil.</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
