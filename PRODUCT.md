# Product Brief — ainodeats

> **Why this file exists.** ainodeats is a personal learning project: there is no
> paying customer and no external deadline. That freedom is also a trap — without a
> consumer, every design decision becomes equally defensible and therefore
> paralysing. This brief invents *one committed client* so that design questions
> ("embed the category or just its id?", "do we need API versioning?") can be
> **derived** from concrete needs instead of debated in the abstract.
>
> When a decision feels arbitrary, come back here and ask: *what does this client
> actually need?* If the answer is "nothing", that is your answer — don't build it.

## The product

A REST API for **personal recipe management and meal planning**. A home cook keeps
a catalogue of ingredients, writes recipes from them, plans meals for the week, and
gets a shopping list. (Not restaurants, not food delivery.)

## The client (the forcing function)

A **single-user SPA that the owner controls**, talking to this API over JSON. There
is exactly one user (the owner), and the SPA is the *only* consumer.

That single fact decides a lot:

- **One user, owner-operated** → no auth, accounts, roles or multi-tenancy *yet*.
  Don't build user/permission machinery until a screen needs it.
- **Owner controls the only client** → there are **no third parties** to keep
  compatible. Breaking API changes are cheap ("two-way doors"): change the contract
  and update the SPA in the same breath. No premature versioning, no HATEOAS, no
  `?expand=` flexibility until a real screen demands it.
- **It's a SPA rendering screens** → read representations should be shaped for the
  screens below. If a screen renders a field, the read model should hand it over in
  one call (avoid client-side N+1).

## The screens (where requirements come from)

1. **Ingredients** — a table of ingredients, filterable by category, showing each
   ingredient's category **name**.
   → reads embed `category: { id, name }`; writes accept `categoryId`.
2. **Categories** — simple CRUD list, alphabetical by name.
3. **Recipe editor** *(future)* — pick ingredients with quantity + unit.
4. **Weekly meal planner** *(future)* — assign recipes to days of the week.
5. **Shopping list** *(future)* — aggregate ingredients across the week's recipes.

## Decision heuristics

Derived from the above; use them before reaching for a pattern:

- **"Does a screen render this field?"** → if yes, include it in the read model; if
  no, leave it out.
- **"Would the SPA need N calls to paint one list?"** → if yes, embed enough to do
  it in one call.
- **"Is there a consumer asking for this flexibility?"** → there is exactly one
  consumer, and it's ours. If it isn't asking, it's YAGNI.
- **"Is this a one-way or two-way door?"** → reversible (most things here): decide
  fast, learn from the result. Irreversible (data migrations, anything with real
  persisted data at stake): that's where deliberation is worth it.

## Two modes — be honest about which you're in

- **Shipping mode** — the goal is to deliver the screens above. YAGNI rules; build
  the minimum that serves the client.
- **Learning mode** — the goal is to *feel a pattern in your hands* (e.g. build
  `?expand=` just to learn sparse fieldsets). Legitimate — **as long as you say so**.
  The only real mistake is doing learning-mode work while telling yourself it's a
  shipping-mode necessity.

## Non-goals (for now)

Authentication & users · multi-tenancy · API versioning · public/third-party
consumers · pagination beyond what a screen needs · caching/performance tuning
without a measured problem. Each of these is unlocked the day a screen or a real
constraint asks for it — not before.
