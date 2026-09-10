# Cannabis & psychosis — research brief

**Status:** `seeded` — compiled 2026-09-09 from the sources already carried in
`src/data/sources.yaml` and the `.Harms` datasets. Every claim below is backed
by a repo-carried citation; where the primary document has not yet been
re-opened, the dataset stays `seeded` and it is flagged here. Do not flip a
line to `cross-checked` until the named primary's tables are re-read.

Brando's standing ask this brief answers: *"honest quantification of
cannabis's non-fatal harms — including the mental-health/schizophrenia
science, not just 'weed has never killed anyone.'"* The site leads with a
cited zero for cannabis overdose deaths; this is the other number the site
owes its readers, kept as sharp as the science actually is.

## The science in one paragraph

Cannabis use is consistently **associated** with higher risk of psychotic
disorders, and the risk climbs with dose, frequency, and potency — but
association is not settled causation, and the literature argues about how
much of the link survives once shared vulnerability is accounted for. The
quantified parts are real odds ratios; the contested parts are *why*.

| Finding | Figure | Dataset |
| --- | --- | --- |
| Ever-use vs never-use, psychosis risk (meta-analysis) | adjusted OR **1.41** | `harms.cannabis.us.psychosis_risk_ever_use` |
| Heaviest/frequent use vs never-use (same meta-analysis) | adjusted OR **2.09** | `harms.cannabis.us.psychosis_risk_heavy_use` |
| Daily use of **high-potency** cannabis, psychotic disorder (EU-GEI case-control) | adjusted OR **~5** (headline; site-specific estimates vary) | `harms.cannabis.us.psychosis_risk_high_potency_daily` |
| Past-year cannabis use disorder, US ages 12+ (NSDUH 2023) | **19.7M people (7.0%)** | `harms.cannabis.us.cannabis_use_disorder` |

Sources:
[marconi_2016_psychosis_meta](https://pmc.ncbi.nlm.nih.gov/articles/PMC4988731/)
(Schizophrenia Bulletin; Marconi, Di Forti, Lewis, Murray & Vassos);
[diforti_2019_eugei](https://doi.org/10.1016/S2215-0366(19)30048-3)
(The Lancet Psychiatry; Di Forti et al., EU-GEI multicentre);
[nsduh_2023_annual_report](https://www.samhsa.gov/data/sites/default/files/reports/rpt47095/National%20Report/National%20Report/2023-nsduh-annual-national.htm)
(SAMHSA).

## The dose-response gradient (the part legislators should hear)

The 2016 Marconi dose-response meta-analysis is the headline number because
it gives a *shape*, not just a point: **1.41 for ever-use, 2.09 for
heaviest/frequent use.** A risk that doubles as exposure climbs is harder to
dismiss as noise — but the authors themselves note that observational studies
cannot fully rule out reverse causation (early psychosis driving use) or
shared vulnerability.

The potency dimension comes from the 2019 EU-GEI study: daily use of
high-potency cannabis carried a headline **~5x** adjusted odds of psychotic
disorder versus never-use, with site-specific estimates varying across the
European sites. The study also computed a population attributable fraction:
at the highest-use sites, roughly **a third of first-episode cases might have
been avoided** without daily cannabis use. Case-control design — residual
confounding stays possible, and the honest reading is the range across sites,
not the single "5".

## What this does and does not say about schizophrenia

- **"1.41" is a risk ratio, not a sentence.** An OR of 1.41 means ~41% higher
  odds *relative to never-users*, applied to a low baseline. It does not mean
  cannabis gives 1.41× the chance of schizophrenia in any absolute sense the
  public would recognize — and the site should never phrase it that way.
- **Causation is genuinely unsettled.** The gradient and the potency findings
  argue for a real effect; twin studies, genetic-correlation work, and the
  self-medication debate argue for shared liability. The brief keeps the
  literature's own disagreement instead of picking a side.
- **The adolescent brain is the vulnerable window.** Persistent cannabis
  dependence from adolescence is associated with ~8 IQ-point decline by age 38
  in the Dunedin cohort — but that finding is itself contested by a
  re-analysis attributing the association to socioeconomic confounding. Both
  studies are in the catalog, the dataset carries `basis: contested`, and any
  honest page cites both. Sources:
  [meier_2012_dunedin](https://doi.org/10.1073/pnas.1206820109) /
  [rogeberg_2013_dunedin_reanalysis](https://doi.org/10.1073/pnas.1215678110).

## Adversarial honesty (the counterweights, kept)

GOALS §4.2 demands datasets deliberately include figures that cut against the
campaign — the .Harms family is that dataset. Alongside the psychosis
figures, the family carries: doubled motor-vehicle collision risk with acute
cannabis consumption (Asbridge et al. 2012 BMJ meta-analysis, OR ~1.92;
[asbridge_2012_driving_meta](https://doi.org/10.1136/bmj.e536)); NHTSA's own
2017 report to Congress concluding the science could not support a per-se THC
impairment threshold analogous to 0.08 BAC
([nhtsa_marijuana_congress_report](https://www.nhtsa.gov/behavioral-research/marijuana-impaired-driving-report-congress));
and the **cited zero** on cannabis overdose deaths that still anchors
`.Deaths`. The site can lead with the zero and still carry the ORs — that is
what makes it a credible comparison, not a pamphlet.

## Honest unknowns (do not fill without sources)

- Re-verification of every OR against the published results tables — the
  datasets stay `seeded` until this pass happens.
- Population attributable fraction of US schizophrenia cases for cannabis —
  no repo-carried figure; do not back it out of the ORs on your own.
- Whether potency-adjusted dose-response changes the Marconi gradient for
  high-THC US market products — no repo-carried figure.
- Texas-grain psychosis figures (state hospitalization series with cannabis
  attribution) — not yet in the family.
- Employment-linked mental-health outcomes (drug-testing + psychosis risk
  intersection) — not yet researched.

## Verification log

- 2026-09-09 — Brief seeded from repo-carried sources (Marconi 2016,
  Di Forti 2019 EU-GEI, NSDUH 2023 CUD, Asbridge 2012 driving, NHTSA 2017
  impairment report, Meier/Rogeberg Dunedin pair). Every figure gates on a
  re-read of the primary tables before any `seeded` → `cross-checked` flip.
