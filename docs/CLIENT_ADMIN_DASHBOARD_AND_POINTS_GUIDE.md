# Admin Dashboard — Client Guide

This document explains what the **Admin Dashboard** (separate admin web app) is for and how the **points (credits) system** works end-to-end, in plain language. Technical details match the behavior of the **main backend service** that powers the product.

---

## 1. What is the Admin Dashboard?

The Admin Dashboard is an internal tool for your team to:

- See a **high-level summary** (dashboard).
- Manage **subscription tiers** (“member levels”) and **promo / access codes** (“level codes”).
- Control **how many points each type of usage costs** (“points pricing”).
- Create **top-up codes** so users can add points to their account without going through a full purchase flow (if you use that feature).
- **Search and manage user accounts**.

Only users with an **administrator role** can sign in. Everyone else is turned away after login.

---

## 2. Main menu (what each section does)

| Section | Purpose (in simple terms) |
|--------|----------------------------|
| **Dashboard** | Quick snapshot: counts such as total users and member levels. Shortcuts to other areas. |
| **Member levels** | Define **plans/tiers** (name, price, how many **package points** come with the plan, duration, flags like “best value” or “top-up” style). |
| **Level codes** | Generate **codes** that can assign or upgrade a user to a **member level** (e.g. trials, partnerships, support). |
| **Points pricing** | Set **how expensive each kind of usage is** in points (see Section 4). |
| **Topup codes** | Generate **one-time codes** worth a fixed number of points; users redeem them in the main app (points go to their **top-up balance**). |
| **Users** | Find users, view details, create users with login codes, assign member levels, etc. |
| **Settings** | Admin’s own profile, password, and related preferences. |

*(Some legacy items may be hidden in the menu if they are no longer used.)*

---

## 3. How points work for a normal user (big picture)

Users spend **points** when they run AI features (text, images, audio, video, voice-over, etc.). Think of points as **prepaid credits**.

### 3.1 Two “wallets” of points

The system keeps two balances:

1. **Package (subscription) points**  
   - Usually granted when the user buys or is assigned a **member level**.  
   - Can have an **expiry date**. After expiry, those points are **not** counted toward what they can spend.

2. **Top-up points**  
   - Added when the user **redeems a top-up code** (or similar flows you enable).  
   - These are the typical “buy extra credits” bucket in the database.

### 3.2 What the user “really” has available

When the app checks “does this user have enough points?”, it uses:

**Available points = top-up points + package points (if not expired) − reserved points**

- **Reserved points** are points **temporarily set aside** while a job is starting or running, so the same balance cannot be spent twice at the same time.  
- When the job **finishes successfully**, reserved points turn into an **actual charge**.  
- If the job **does not go through**, the reservation is **released** and those points become available again.

So: **reserved** does not mean “lost”; it means **on hold** until the system knows the final outcome.

### 3.3 When a charge happens, which wallet is used first?

When points are **finally deducted** after a successful run:

- The system uses **package (subscription) points first**.  
- Only what is **left** of the bill is taken from **top-up points**.

That order is fixed in the backend and is intentional (subscription value is consumed before purchased top-ups).

---

## 4. Points pricing (Admin → “Points pricing” screen)

This is where you control **how fast users burn through points** for different kinds of usage.

### 4.1 One row per “metric type”

Each row is a **type of consumption**, for example:

| Metric (technical name) | Typical meaning (plain English) |
|---------------------------|----------------------------------|
| **TOKEN_IN** | User’s **input text** (prompts, etc.), estimated in “input token” units. |
| **TOKEN_OUT** | **Output text** from the model, in “output token” units. |
| **VOICE_OVER_TOKEN** | **Voice / TTS** usage (separate from normal text output). |
| **MB_AUDIO** | **Audio file size** processed, in megabytes. |
| **MB_VIDEO** | **Video file size** processed, in megabytes. |
| **IMAGE_GEN** | **Number of images** generated (or image-gen units your product sends). |

Inactive rows (**Active = off**) are **ignored** when calculating cost.

### 4.2 The two numbers you edit on each row

For each metric:

1. **Base cost per unit**  
   - How many points **per unit** of that metric (per token-unit, per MB, per image, etc.).

2. **Profit multiplier**  
   - A factor applied on top of the base cost.  
   - **Example:** base `2` × multiplier `1.5` behaves like `3` points per unit for that metric.

**Rough formula (conceptually):**

> **Points for that metric** ≈ **units used × base cost × profit multiplier**  
> (then the system rounds **up** to a whole number of points so you never accidentally under-charge.)

**Total charge** for one job is the **sum** of the costs of **all** active metrics that apply to that job (e.g. input tokens + output tokens + video MB, …).

### 4.3 Why the app sometimes “holds” more than the final bill

Before starting work, the system often **reserves** points using an **estimate** (e.g. how long the reply might be, or file size). Estimates can include a **safety buffer** (configured on the server, default idea: ~**20% extra** so a job doesn’t fail mid-way if reality is slightly higher than the estimate).

So:

- User might see **more points reserved** than **finally charged** if the job used **less** than estimated.  
- The **difference** is released back to **available** balance after the real cost is known.

You do **not** set that buffer in the Points pricing table; your technical team adjusts it in server configuration if needed.

### 4.4 What you can and cannot do in the UI today

- You can **edit** existing metrics: base cost, profit multiplier, and **active / inactive**.  
- **Creating entirely new metric types** from the admin UI is **not** the normal workflow; new product features usually need a **developer** to wire a new metric type in the backend, then it appears as a new row.

Deleting a row may be possible in the UI but should be done **only with care**; if in doubt, set **Active = off** instead of deleting.

---

## 5. Top-up codes (Admin → “Topup codes”)

**Purpose:** Your team generates **codes** (like gift vouchers). Each code is worth a **fixed number of points**. When a user redeems a valid code in the **main customer app**:

- Points are added to their **top-up** balance.  
- The code is marked **used** (and cannot be reused).  
- Optional: expiry date and assignment rules can apply (depending how codes were generated).

**Typical admin workflow:**

1. Choose **how many points** each code is worth.  
2. Choose **how many codes** to generate.  
3. Optionally set a **prefix**, **expiry**, etc.  
4. **Copy** the generated codes and distribute them securely (email, CRM, support ticket, etc.).

---

## 6. Member levels & level codes (short)

- **Member levels** define **what subscribers get** (including how many **package points** they receive and for how long).  
- **Level codes** let you **grant** a level (e.g. promo, enterprise pilot) without the user going through the normal checkout.

Points from a level go to the **package** side of the balance (subject to the level’s rules and expiry).

---

## 7. Users screen (short)

Use **Users** to:

- Search by email.  
- Inspect a user’s account.  
- Perform allowed admin actions (create user with login code, delete user where policy allows, assign member level — **exact buttons depend on your deployed version**).

Direct editing of raw point balances may exist via API; the **primary** levers for “giving points” in product terms are usually **top-up codes** and **member levels**.

---

## 8. Glossary (quick reference)

| Term | Meaning |
|------|--------|
| **Points / credits** | Prepaid units spent on AI features. |
| **Package points** | Points tied to a **subscription / member level**; may **expire**. |
| **Top-up points** | Points from **codes** (or similar); used **after** package points when both apply to a charge. |
| **Reserved points** | Temporarily **blocked** while a job is in progress; released or converted to a real charge when the job ends. |
| **Available balance** | What the user can still spend **right now** (see formula in §3.2). |
| **Metric type** | One category of usage (tokens, MB video, images, …). |
| **Base cost / unit** | Points per unit for that category. |
| **Profit multiplier** | Business markup factor on that category. |

---

## 9. Who to contact for changes

- **Pricing strategy** (what users should pay): your product/business team decides target numbers; you adjust **base cost** and **profit multiplier** per metric in **Points pricing**.  
- **New kinds of billing** (new metric, new feature): requires **development** in the main service and main app, not only admin changes.  
- **Buffers, rounding, and edge cases**: **technical team** / backend configuration.

---

*This guide reflects the intended behavior of the points subsystem (pricing, reservation, package vs top-up deduction) as implemented in the main service. If your deployed environment uses custom configuration, your technical team should confirm buffer values and any feature-specific exceptions.*
