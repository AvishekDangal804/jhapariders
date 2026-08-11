import { Container } from "@/components/shared/container";
import { PageHero } from "@/components/shared/page-hero";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export function LegalDocument({
  title,
  description,
  updated,
  sections,
}: {
  title: string;
  description: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title} description={description} />
      <Container className="max-w-3xl py-16 sm:py-20">
        <p className="text-xs text-muted-foreground">Last updated: {updated}</p>
        <p className="mt-4 rounded-lg border bg-secondary/40 p-4 text-xs text-muted-foreground">
          This document is provided for demonstration purposes as part of the JhapaRide product
          build and does not constitute legal advice.
        </p>

        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-lg font-semibold">{section.heading}</h2>
              <div className="mt-2 space-y-3 text-sm text-muted-foreground">
                {section.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
