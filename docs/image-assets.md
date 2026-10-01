# Generated website image assets

Created 2026-09-25 with the built-in image_gen tool. Original artifacts copied to output/imagegen; WebP copies use format compression only, without content edits. Concept art, not actual offices/products/client work.

P-0004 approved 2026-09-25. Preserved production copies: `public/images/brand-connections.webp` (115,010 bytes) and `public/images/creative-materials.webp` (91,240 bytes). Both preserve the generated 1536×1024 dimensions. At that release the connection artwork appeared on home/about, and materials on home/business/careers. P-0006 placed the connection artwork only on Company with a brand-concept label. In v2.2.3 the artwork remains there, with a neutral scene alt instead of visitor-facing generation disclaimers; the unused materials asset is retained for rollback/reuse. Original prompts below are preserved for future revisions.

## P-0006 / v2.2.0 — provided operational captures

Approved 2026-09-30. These three captures already existed in the provided company
deck and in the approved P-0006 preview. This update received no new product image
attachment, so no new raster generation or editing was performed. The original
screens, product labels, prices and logos were not changed. Ivory frames, balanced
contain crops and factual captions apply the approved site tone without fabricating
products. Deck prices/assortment are historical reference, not a live catalog.

| Source / deck page | Public copy | Dimensions / bytes | v2.2.0 / v2.2.1 placement (v2.2.2 retained only) |
|---|---|---|---|
| `tmp/p5-assets/product-portfolio.webp`, p34 | `public/images/commerce/product-portfolio.webp` | 1200×1000 / 75,336 | Home PET chapter, Business PET |
| `tmp/p5-assets/store-screen.webp`, p33 | `public/images/commerce/store-screen.webp` | 646×1400 / 84,234 | Business own-store example |
| `tmp/p5-assets/content-hub.webp`, p35 | `public/images/commerce/content-hub.webp` | 1200×675 / 42,096 | Home In Action |

Source and public copy SHA-256 are identical:

- portfolio: `5c21e8818b64a47e5b77a7d55225617ebc4f5667f569ce7435c0f9f77312098d`
- store: `8689e486597425cfffd104b1bd18696cd7f119a25953da60dfd67ef1736b8baf`
- hub: `c61dd93007ca09e68ab2fa8029258efb2d502220ec2879257c190be630079062`

PRINT, exhibitions and workplace are described with editorial operational panels,
not fabricated warehouse/employee/product photographs. New actual product images
must follow `docs/image-workflow.md` and active rule R-0001.

## P-0009 / v2.2.2 — approved generated category concepts

Created with built-in image_gen and approved by the user on 2026-09-30, including
the combined editorial/parallax preview. These are generic category concepts, not
actual Moguchon products, PRINT SKUs, company customers, employees or locations.
The user supplied no new actual product photograph to preserve in this request.
At v2.2.2, the six placements displayed generation/non-product disclaimers. The user
requested their removal on 2026-10-01; v2.2.3 keeps neutral scene alt text and useful
home category captions instead. Generated classification, original prompts, approvals
and hashes remain in internal records. The customer image is not presented as a
testimonial or event proof, and none of the generic images is newly attributed to a
real company product, customer or location.
Existing deck facts and their dates/scopes are unchanged and are not derived from imagery.

| Public copy | Original generator artifact ID | Dimensions / bytes | Placement |
|---|---|---|---|
| `public/images/commerce/pet-commerce.webp` | `exec-498d0580-dd24-463a-8f4f-a05401f12e64.png` | 1536×1024 / 160,170 | Home PET / Business PET |
| `public/images/commerce/print-commerce.webp` | `exec-d1777f82-46eb-4549-be7a-6f3ff97590a7.png` | 1536×1024 / 106,502 | Home PRINT / Business PRINT |
| `public/images/commerce/pet-customer.webp` | `exec-7acbc245-e8c5-46c7-9a52-973972a5a367.png` | 1536×1024 / 129,336 | Home customer / Business own-store & content |

The original PNGs and approved self-contained preview are preserved locally under
`.leerness/previews/P-0009-assets/`. No new raster generation/edit, resizing or crop
was performed during implementation. WebPs match the approved preview assets
byte-for-byte; quality88/method6 format encoding only. The public site loads these
WebPs itself, not the private preview or PNGs. The three earlier screenshots remain
in `public/images/commerce/` for rollback and are not displayed in the new home/business.

Full generation prompts, original/result hashes, approval and placements:
[`image-provenance-p0009.json`](image-provenance-p0009.json).

## brand-connections

- Original: `output/imagegen/brand-connections.png`
- Web: `output/imagegen/brand-connections.webp` (1536×1024)
- Intended placement: home parallax brand panel and about editorial image

Prompt:

Use case: stylized-concept. Asset type: wide editorial image for the ONSHIVE Korean business website, a visual about connecting strategy, creativity and commerce. Generate a refined photoreal 3D still life, landscape 3:2 framing. A single wide matte honey-gold ribbon curves through and connects three sculptural objects: an ivory paper arch, a charcoal brushed-metal cylinder and a translucent warm amber glass slab, all on a warm ivory architectural plinth. Confident asymmetrical composition, sculptural geometry, tactile paper edges, satin metal, real amber caustics, physically plausible contact shadows. Strong late-afternoon sidelight from upper left, a warm minimalist art-gallery setting. Palette strictly warm off-white #f5f4ef, near charcoal #191b18, muted honey gold #d6a223 and soft stone. Objects span the middle and right, left third quiet ivory negative space for separate HTML typography. Sophisticated architectural editorial photography, medium-format clarity, subtle film grain, very high material realism. No people, no office, no computer screens, no text, no letters, no logos, no watermarks, no hexagons, no stock handshakes. This is a brand concept artwork, not a photograph of a real company location.

## creative-materials

- Original: `output/imagegen/creative-materials.png`
- Web: `output/imagegen/creative-materials.webp` (1536×1024)
- Intended placement: business materials showcase and careers editorial image

Prompt:

Use case: product-mockup. Asset type: wide conceptual image for a premium Korean branding and ecommerce company website ONSHIVE, to accompany business services and creative culture. Generate a sophisticated editorial still-life photograph in landscape 3:2 framing. On a warm ivory studio table, an artfully composed set of completely unbranded cream packaging boxes, thick blank paper samples, a folded charcoal card, a small translucent amber glass sphere and a single broad mustard-gold paper strip weaving through the composition. One large upright blank cream packaging form on the right, smaller geometric packaging forms staggered near the middle, elegant diagonal long shadows on the left. Tangible paper fibres, slightly imperfect folds, satin surfaces, precisely controlled natural window light. Quiet confident creative studio atmosphere, medium-format product photography, premium magazine art direction. Palette warm off-white #f5f4ef, charcoal #191b18 and honey gold #d6a223 only. Fill the image with a balanced substantial arrangement and enough calm negative space; no people, no actual office claims, no readable text, no brands, no screens, no watermark, no hexagons, no fake typography. Conceptual branding materials only.
