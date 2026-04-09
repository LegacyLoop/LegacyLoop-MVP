---
name: collectible-detection-triggers
description: The complete protocol for when and how AnalyzeBot must set is_collectible=true, identify the specific collectible subcategory, and route to CollectiblesBot, including brand marker libraries, grading service signal recognition, series indicators, and subcategory assignment rules.
when_to_use: "Every AnalyzeBot scan."
version: 1.0.0
---

# Collectible Detection Triggers

## What Makes Something a Collectible

A collectible is an item whose value is driven primarily by collector demand within an organized collecting community, rather than by the intrinsic value of its materials or its utility. The market for collectibles operates on different logic than general resale: condition grading by recognized services, edition scarcity, set completion, authentication documentation, and community-driven price discovery are the dominant value drivers.

AnalyzeBot must recognize the signals that indicate an item belongs in the collectible category and route it to CollectiblesBot, which has the specialized knowledge required for accurate subcategory identification, grading assessment, and market pricing.

## Brand Markers That Signal Collectibility

The following brands and categories have established collector markets with specialist pricing infrastructure. Recognizing these brands triggers is_collectible=true regardless of the item's condition or age.

### Watches

Rolex: any Rolex watch is a high-value collectible. Key models include the Submariner, Daytona, GMT-Master, Datejust, Explorer, and Day-Date. The reference number (typically on the case back or between the lugs) identifies the specific model. Rolex boxes and papers (original packaging and warranty paperwork) substantially increase value.

Omega: Speedmaster (Moonwatch), Seamaster, Constellation. Vintage Omega from before 1980 is particularly collected. The Speedmaster Professional with the original caliber 321 movement is among the most valuable Omegas.

Patek Philippe: among the most valuable watches produced. Any Patek Philippe should be routed to collectible and high-value specialist assessment immediately.

AP (Audemars Piguet): Royal Oak and other models. High value.

Vintage Seiko: Seiko 6105, 6139, 6309 divers; Seiko 5 sports models; vintage Grand Seiko. Japanese domestic market models particularly collected.

Vintage Casio: G-Shock first release (DW-5000C), early Casio Calculator watches (CA-80, CA-901).

### Trading Cards and Sports Memorabilia

PSA-graded (Professional Sports Authenticator) cards in plastic slabs: any card in a PSA slab is a graded collectible. The grade number on the slab (PSA 1 through PSA 10) is the primary value determinant. PSA 10 (Gem Mint) represents the highest grade. Graded rookie cards and vintage cards are the highest-value categories.

BGS-graded (Beckett Grading Services) cards: similar slab format with sub-grades visible in the label. BGS 9.5 (Gem Mint) and BGS 10 (Pristine) are the premium grades.

Ungraded vintage sports cards: 1952 Topps Baseball set (the Mickey Mantle rookie is among the most valuable cards), 1986-87 Fleer Basketball (the Michael Jordan rookie), 1979-80 O-Pee-Chee Hockey (Wayne Gretzky rookie), 1986 Fleer Basketball wax box. Any card from before 1980 in recognizable condition should be flagged for CollectiblesBot.

Memorabilia: game-worn jerseys, game-used bats, balls, and equipment authenticated by PSA/DNA, JSA (James Spence Authentication), or Beckett Authentication Services should be flagged. Visible authentication holograms or stickers on memorabilia items must be noted.

### Trading Card Games

Pokemon: Base Set (1999) cards in English (Charizard, Blastoise, Venusaur holographic rares), sealed booster packs and boxes, first-edition print runs (identifiable by the "Edition 1" stamp in the lower left of the card). Shadow-less Base Set (no drop shadow on the Pokemon portrait box) is older than shadowed first editions and commands high prices.

Magic: The Gathering: Alpha, Beta, and Unlimited set cards (black borders, 1993). Power Nine (Black Lotus, Moxen, Time Walk, Ancestral Recall, Timetwister) are among the most valuable cards in existence. Reserved List cards (cards Wizards of the Coast has committed never to reprint). Any foil card from early sets.

Yu-Gi-Oh: first edition cards, tournament prize cards, sealed product from early sets (Legend of Blue Eyes White Dragon, 2002).

### Comics

CGC-graded (Certified Guaranty Company) comics in plastic slabs: any comic in a CGC slab is a graded collectible. The grade label (CGC 9.8, CGC 9.4, etc.) and the notation (Universal, Restored, Qualified) are the primary value indicators.

Key issues: first appearances of major characters, first printings of landmark stories, low-print-run variants. Action Comics #1, Detective Comics #27, Amazing Fantasy #15, Amazing Spider-Man #1, X-Men #1, Incredible Hulk #1. Golden Age (1938-1956) and Silver Age (1956-1970) comics in any condition.

Newsstand editions versus direct edition (1980s-1990s): newsstand variants are rarer and command premiums on many issues.

### Sneakers

Nike Air Jordan: any Jordan model, particularly Jordan 1, Jordan 3, Jordan 4, Jordan 11 in original release colorways. "Bred," "Chicago," "Royal," "Shadow," "Metallic" are collected colorways.

Nike x collaborations: Off-White, Travis Scott, Fragment, Union, Virgil Abloh collaborations.

Yeezy: Adidas Yeezy Boost 350, 750, 700 in original colorways.

New Balance "Deadstock": 990, 992, 993 in original US-made versions.

## Grading Service Recognition

Any item in a tamper-evident plastic slab from a grading service must be flagged as collectible. Visible slab characteristics:

PSA slabs: rectangular plastic case, PSA logo, grade in large numerals, description label, certification number. The cert number can be verified at PSA's online registry.

BGS slabs: similar rectangular case, Beckett logo, numerical sub-grades (Centering, Corners, Edges, Surface) visible in the label in addition to the overall grade.

CGC slabs: comic slabs are larger, with a distinctive label color corresponding to grade tier (9.8 is blue, Restored is purple, Qualified is green).

WATA Games slab: for video games. Clear acrylic case, grade label, WATA logo.

VGA (Video Game Authority) slab: earlier video game grading service.

PSA/DNA authentication: a sticker on a signed item with a PSA hologram and a number that can be verified at the PSA/DNA registry. Items bearing this sticker are authenticated autographs.

JSA (James Spence Authentication): similar sticker-based authentication for autographs.

Beckett Authentication: LOA (Letter of Authenticity) or sticker.

Any visible COA (Certificate of Authenticity) from any recognized authentication service or the original manufacturer of a limited edition should be flagged.

## Series, Set, and Edition Markers

Numbered editions visible on the item (printed or stamped "14/250," "/99," "/50," "/25," or similar fractions) indicate limited production and often the specific edition size is the primary scarcity indicator. Lower numbers within a run command modest premiums for some collectors; the more important indicator is the total edition size.

Artist Proof (AP) designations: outside the main numbered edition, artist proofs exist in smaller quantities (typically 10% of the main edition or a fixed small number). AP versions of limited edition items often command premiums.

Set membership: an individual item that is part of a recognized set has additional value when the set is complete. A single card from the 1952 Topps set may be valuable; a complete set is orders of magnitude more valuable. Flag set membership when visible (set branding on packaging, card backs showing set name and number, catalog numbering on figurines).

First pressing vinyl records: original first pressings are distinguished from later pressings by matrix numbers etched into the dead wax area of the record. Original UK Parlophone Beatles pressings, original Blue Note jazz pressings, original Sun Records pressings, and original Factory Records pressings are among the most collected vinyl categories.

## Category Keywords That Trigger the Collectible Flag

The following words appearing in item titles, descriptions, or visible on the item in photographs must trigger the collectible flag and initiate the detailed collectible assessment:

card, trading card, pokemon, charizard, pikachu, magic gathering, yu-gi-oh, yugioh, sports card, baseball card, football card, basketball card, hockey card, rookie card, autograph, auto, refractor, prizm, mosaic, select, optic, numbered, /25, /50, /99, comic, cgc, psa, bgs, wata, slab, graded, jordan, yeezy, nike dunk, air force one, watch, rolex, omega, patek, seiko, casio, g-shock, vinyl record, first pressing, original pressing, funko, funko pop, chase variant, lego, sealed set, retired set, camera, leica, hasselblad, rolleiflex, contax, nikon f, gibson, fender, stratocaster, les paul, telecaster, memorabilia, game-worn, game-used, signed, autographed, limited edition, artist proof, numbered edition, coin, morgan silver dollar, mercury dime, wheat penny, key date, stamp, first day cover, mint condition, proof coin, pcgs, ngc, anacs.

## How to Communicate Collectible Flags

Set is_collectible: true in the analysis output.

Populate collectible_subcategory with the specific type from this list: sports_cards, tcg_cards, comics, sneakers, watches, vinyl_records, video_games, coins_currency, stamps, toys_figures, guitars_instruments, cameras_photography, autographs_memorabilia, limited_editions, other_collectibles.

Note the specific brand, set, or type in the analysis rationale: "PSA-graded card visible in photograph. Subcategory: sports_cards. Grade visible: PSA 9. Card appears to be a vintage baseball card; era and player identity require magnified photograph of the card face for complete identification."

When a collectible is also an antique (manufactured 50+ years ago), set both flags. Vintage watches, early comics, pre-war sports cards, and early photographs can qualify under both systems simultaneously.
