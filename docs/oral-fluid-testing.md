# Oral-fluid (cotton-swab) drug testing — research brief

**Status:** `seeded` — compiled 2026-09-09 from the sources already carried in
`src/data/sources.yaml` and the `.Testing` datasets. Every claim below is backed
by a repo-carried citation; where the primary document has not yet been read, it
is flagged `NEEDS-CITATION` and filed under [Honest unknowns](#honest-unknowns).
Do not flip a line to `cross-checked` until the named primary is opened.

Brando's standing ask this brief answers: *"the shift from urine to oral-fluid
drug testing: timeline + employment effects"* — the reason cotton-swab THC
testing now sits between a worker and a paycheck.

## The science in one paragraph

Oral fluid detects **parent THC itself**; urine detects **THCCOOH**, the
metabolite your body leaves behind after processing THC. That single chemical
difference is the whole argument: a swab measures *recency of use*, urine
measures *history of use*.

| Specimen | What the lab finds | THC window, "up to" | Dataset |
| --- | --- | --- | --- |
| Oral fluid (swab) | parent THC | ~24 h occasional · ~72 h chronic/heavy | `testing.cannabis.us.detection_window_oral_fluid` |
| Urine | THCCOOH metabolite | weeks · up to ~67 days chronic (EMIT 20 ng/mL) | `testing.cannabis.us.detection_window_urine` |
| Hair | parent THC (deposited) | ~90 days | `testing.cannabis.us.detection_window_hair` |

Windows are review-table *maxima*, not averages — an occasional user clears a
swab in well under 24 hours. Sources:
[pmc_thc_detection_windows](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4920965/table/T1/)
(review table;
[pmc_cannabinoid_urine_chronic](https://pmc.ncbi.nlm.nih.gov/articles/PMC2700061/)
(67-day chronic urine figure);
[tx_dfps_cps_drug_windows](https://dfps.texas.gov/handbooks/CPS/Files/CPS_px_1922_1.asp)
(Texas CPS lists THC oral-fluid detection at 18–24 h — the occasional-use end).

## Timeline of the urine → oral-fluid shift

- **Urine era.** Urine has been the backbone of federal workplace drug testing
  for decades under the SAMHSA Mandatory Guidelines for Federal Workplace Drug
  Testing Programs. *(NEEDS-CITATION: the original guideline year is not yet
  re-verified from the Federal Register — filed under Honest unknowns.)*
- **2019-10-25 — SAMHSA publishes the Oral Fluid Mandatory Guidelines (OFMG).**
  The Mandatory Guidelines for Federal Workplace Drug Testing Programs using
  Oral Fluid are published and take effect **2020-01-01**. They set the THC
  **screen cutoff at 4 ng/mL** and the **confirmation cutoff at 2 ng/mL** — the
  federal numbers that decide whether a worker's swab is "positive."
  Source: [ohs_online_samhsa_ofmg](https://ohsonline.com/articles/2020/03/01/an-overview-of-samhsas-new-oral-fluid-testing-guidelines.aspx?admgarea=news&Page=5)
  (secondary overview; primary OFMG text still NEEDS-CITATION).
- **2020s — nonregulated workplace adoption expands.** The peer-reviewed
  oral-fluid review notes testing "is expanding at a rapid pace in nonregulated
  workplace testing" — employers outside the federal program adopt swabs on
  their own timeline, without waiting for federal lab certification.
  Source: [pmc_oral_fluid_review](https://pmc.ncbi.nlm.nih.gov/articles/PMC3165054/).
  *(Note: the review is from the early 2010s; current-year adoption figures are
  an Honest unknown.)*
- **2020-01-01 onward — federal lab certification pending.** Oral-fluid testing
  in federally regulated programs (including DOT-regulated employers) needs
  HHS-certified oral-fluid labs. As of mid-2026 the certification list had not
  materialized in the sources re-checked for this brief — the lab count stays an
  honest **unknown** until the HHS/Federal Register records are read.
- **Institutional normalization.** Texas CPS's own drug-testing handbook now
  carries an oral-fluid detection window table (THC at 18–24 h), showing how far
  swab reference windows have moved into everyday agency practice.
  Source: [tx_dfps_cps_drug_windows](https://dfps.texas.gov/handbooks/CPS/Files/CPS_px_1922_1.asp).

## Employment effects — what the shift actually does to workers

1. **A swab narrows the injustice urine created, then widens a different net.**
   Under urine testing, a weekend joint could cost a worker their job weeks
   later — long after any impairment ended. Oral fluid fixes that: detectable
   within ~15 minutes of use and spanning roughly the **3–10 hour marijuana
   impairment window**, a swab answers "are you impaired *now*, roughly?"
   rather than "did you use *this month*?"
   Source: [ndasa_marijuana_impairment_testing](https://ndasa.com/2021/11/09/marijuana-impairment-and-drug-testing/).
2. **But the net is still harsh for chronic users.** The same tables give
   chronic/heavy users an oral-fluid window of **~72 hours** — three full days.
   A daily user who hasn't smoked since Friday night can still fail a Monday
   swab with zero impairment. The swab is fairer than urine; it is not fair.
3. **Safety-sensitive jobs feel the strictest edge.** DOT-regulated and other
   safety-sensitive employers are exactly the employers most interested in
   swabs — a specimen that covers the impairment window is what they want. For
   workers in those jobs, swabbing means weekend use now carries real risk even
   when urine never would have caught it. That is the employment hook Brando
   flagged: the gate moves from "weeks of history" to "days of recency," and
   for weekend users in safety-sensitive roles the gate gets *stricter*, not
   looser.
4. **The job-search angle.** Brando links his own difficulty getting hired to
   cannabis swab testing. The honest framing: a swab cannot tell *off-duty*
   Saturday use from *on-the-clock* impairment — it only knows "within the last
   day or three." Any employer that treats a positive swab as proof of workplace
   impairment is reading more into the chemistry than the chemistry says.

## Honest unknowns (do not fill without sources)

- HHS-certified oral-fluid lab list and count, as of 2026 — pending primary
  Federal Register / HHS records.
- DOT's current oral-fluid rule status (proposed rules, adoption timeline) —
  not yet re-verified from DOT sources.
- Share of US employers drug-testing at all, and by specimen matrix — no
  repo-carried figure; do not quote industry-vendor numbers without a primary.
- Employment outcomes for cannabis-positive tests (fired vs. counseled vs.
  hired-anyway) — no repo-carried figure.
- The original urine-testing Mandatory Guidelines effective year — pending
  Federal Register read.
- Every "up to" detection-window ceiling — pending re-verification against the
  cited review tables before the datasets flip to `cross-checked`.

## Verification log

- 2026-09-09 — Brief seeded from repo-carried sources (OFMG overview, oral-fluid
  review, detection-window tables, TX CPS window table, NDASA impairment
  explainer). Federal Register OFMG text, HHS lab list, and DOT rule status
  remain unread — they gate every `cross-checked` flip on this file.
