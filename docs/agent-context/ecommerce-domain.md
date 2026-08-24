# E-commerce Domain Context

This document describes the business domains, ownership boundaries, and important commerce rules for the Best Computer Hub frontend.

It exists to help coding agents understand the e-commerce business context before implementing storefront or administrative features.

The backend is Django REST Framework and remains authoritative for business-critical commerce data and rules.

---

## 1. Domain Overview

Best Computer Hub is an e-commerce platform focused on computers, computer components, laptops, accessories, networking equipment, gaming products, and related technology products.

The application is organized conceptually around the following domains:

```text
E-commerce
│
├── Catalog
│   ├── Category
│   ├── Brand
│   ├── Product
│   ├── Product Images
│   ├── Specifications
│   └── Product Origin
│
├── Discovery
│   ├── Search
│   ├── Filtering
│   ├── Sorting
│   ├── Product Comparison
│   └── Recommendations
│
├── Customer
│   ├── Authentication
│   ├── Profile
│   ├── Address
│   ├── Wishlist
│   └── Recently Viewed
│
├── Engagement
│   ├── Reviews
│   ├── Ratings
│   └── Product Q&A
│
├── Commerce
│   ├── Cart
│   ├── Pricing
│   ├── Inventory
│   ├── Checkout
│   ├── Payment
│   └── Orders
│
├── Marketing
│   ├── Promotions
│   ├── Coupons
│   ├── Offers
│   └── Campaigns
│
└── Content
    ├── Blog
    ├── Pages
    ├── Help Center
    └── Policies
```

Not every domain is fully implemented yet.

Do not assume that a planned domain already has a working backend API.

---

## 2. Backend Authority

Django REST Framework is the authoritative source for commerce-critical business data.

The frontend may present, cache, format, and temporarily hold this data for user experience purposes, but must not independently establish business truth.

The backend is authoritative for:

* product prices
* discounts
* inventory
* product availability
* cart validation
* promotion eligibility
* coupon validity
* shipping charges
* taxes
* checkout totals
* payment state
* order state
* customer permissions
* review moderation
* ratings and aggregates

For example:

```text
DRF Product Price
        ↓
Frontend displays price
```

not:

```text
Frontend calculates or invents price
        ↓
Customer sees it as authoritative
```

The same principle applies to inventory, discounts, checkout totals, ratings, warranties, and other commerce-critical information.

---

## 3. Catalog Domain

The catalog domain describes products and how customers browse them.

Primary entities include:

```text
Category
Brand
Product
Product Image
Product Specification
Product Origin
```

### Category

Categories organize products into a hierarchical catalog.

A category may contain:

* name
* slug
* description
* image
* parent category
* child categories
* display order
* active state
* SEO metadata

Categories may have multiple hierarchy levels.

The frontend must not assume categories are always limited to one parent and one child level.

When navigating or managing category trees (e.g. in Admin Tree views), the tree uses sibling-level accordion behavior: expanding a category collapses other expanded siblings at the same immediate hierarchy level, while all ancestor levels remain expanded.

Category URLs should use stable slugs.

### Brand

Brands identify product manufacturers or commercial brands.

A brand may contain:

* name
* slug
* logo
* description
* active state
* display order
* SEO metadata

Brand data should come from the brand domain/API rather than being manually duplicated inside product UI.

### Product

Product is the central catalog entity.

A product may include:

* id
* name
* slug
* SKU
* description
* category
* brand
* origin
* images
* pricing
* stock information
* specifications
* features
* availability
* rating summary
* review count
* SEO metadata

Do not assume the current frontend `Product` interface represents the final backend product contract.

The frontend product model may evolve as DRF APIs become more complete.

### Product Images

Products may contain multiple images.

The system should support:

* multiple product images
* one default/primary image
* deterministic display order
* missing-image fallback UI

The frontend must not assume that `images[0]` always exists.

### Product Specifications

Technical specifications should be represented as structured data whenever possible.

Examples include:

```text
Processor
Memory
Storage
Graphics
Display
Connectivity
Ports
Dimensions
Weight
Warranty
```

Avoid depending on large hard-coded HTML specification blocks when structured backend data is available.

Different product categories may have different specification structures.

---

## 4. Discovery Domain

Discovery helps customers find appropriate products.

It includes:

* product search
* category browsing
* filtering
* sorting
* product comparison
* related products
* recommendations

### Search

Search requests must use the actual DRF search contract.

Do not send multiple guessed query aliases such as:

```text
search
query
q
```

unless the backend explicitly supports them.

### Filtering

Filters may differ by category.

For example, laptop filters may include:

```text
Brand
Price
Processor
RAM
Storage
Graphics
Screen Size
Refresh Rate
```

while networking products may require completely different filters.

Do not hard-code one universal specification filter model for every category unless the backend domain explicitly defines it that way.

### Sorting

Supported sorting options must reflect the backend API contract.

Typical examples may include:

* relevance
* newest
* price ascending
* price descending
* popularity

Do not invent unsupported ordering fields.

---

## 5. Customer Domain

The customer domain represents customer identity and customer-specific functionality.

It includes:

* authentication
* customer profile
* addresses
* wishlist
* account settings
* order history
* recently viewed products

### Authentication

Authentication is provided by the backend.

The frontend must never determine a user's role or permissions from:

* email address
* username
* naming patterns
* route
* frontend-only state

For example, an email containing `admin` or `staff` must never automatically grant administrative access.

Roles and permissions must originate from trusted backend data.

Frontend authorization checks exist for user experience only.

DRF must enforce actual access control.

### Authorization Architecture (`useAdminPermissions`)

In administrative modules, user permissions returned from `GET /api/v1/users/me/` are processed by `useAdminPermissions()`. The frontend consumes this composable to filter sidebar navigation in `/layouts/admin.vue`, guard direct route access in `/middleware/auth.global.ts`, and conditionally hide action controls (Create/Edit/Delete buttons) in admin pages. DRF remains the authoritative security boundary.

#### Admin Access & Action-Authorization Model

Admin panel routing (`/admin/*`) and CRUD actions are restricted by a triple-gated authorization model:

```text
Authenticated user
        AND
User type is Owner OR Staff
        AND
User has the required action-specific permission
```

The system resolves access according to these precise definitions:

*   **Unauthenticated User**:
    *   Cannot access `/admin/*`.
    *   Must be redirected to the existing login flow automatically.
*   **Owner**:
    *   Has access to the `/admin/*` router.
    *   Action-level access is determined by the permission system. Users flagged with `is_superuser` or `is_superadmin` (typically Owners) bypass specific checks via the standard permission override.
*   **Staff**:
    *   Has access to the `/admin/*` router.
    *   Must possess the specific permission required for each individual CRUD action.
    *   Being Staff alone does not grant default CRUD or feature-level permissions.
*   **Other User Types (e.g., Customer)**:
    *   Cannot access Admin. Attempted routing results in a redirection to `/admin/forbidden`.

#### Permission Rules: Action-Specific and Non-Transitive

Permissions are strictly action-specific and non-transitive. Having one permission must never implicitly grant another. The project uses standard backend/frontend permission naming conventions:

*   **View Permission** (e.g., `product_api.view_product`): Grants read-only visibility to the data view and sidebar nodes.
*   **Create Permission** (e.g., `product_api.add_product`): Required to trigger creation actions or view creation forms/modals.
*   **Edit Permission** (e.g., `product_api.change_product`): Required to trigger update actions or view edit forms/modals.
*   **Delete Permission** (e.g., `product_api.delete_product`): Required to execute deletion operations.

#### Frontend vs Backend Responsibilities

*   **Frontend**: Permission checks control component visibility and user experience. The frontend must prevent unauthorized actions from being triggered or initiated in the UI. Frontend authorization is **not the security boundary**.
*   **Backend**: Django REST Framework (DRF) backend permissions remain the authoritative security boundary.

#### Centralized Permission Checking

All Admin permission checks must use the existing `useAdminPermissions` pattern/utilities to manage:
*   Sidebar visibility.
*   Route/module access (such as global route guards).
*   Page-level visibility.
*   View, Create, Edit, and Delete action controls.
*   Feature-specific validation checks.

Never create separate custom permission or role logic for individual Admin features. Use only `useAdminPermissions`.



---

## 6. Wishlist

Wishlist represents products a customer wants to save for later.

The frontend may provide immediate optimistic UI feedback where appropriate.

However, when a backend wishlist API exists, authenticated customer wishlist state should ultimately synchronize with the backend.

Wishlist functionality must not be mixed with cart business rules.

---

## 7. Reviews and Ratings

Reviews represent customer feedback about products.

The domain may include:

* rating
* title
* review body
* verified purchase status
* moderation status
* review author
* created date

Only backend-approved/eligible review data should contribute to public rating aggregates according to backend business rules.

The frontend must not calculate authoritative public ratings from arbitrary locally available review data.

Never fabricate:

* review text
* rating values
* review counts
* verified-purchase status

for production product pages.

---

## 8. Cart Domain

The cart represents products the customer intends to purchase.

A cart item generally contains:

```text
Product
Quantity
```

The frontend may maintain local cart state for responsive interaction.

However, frontend cart state is not authoritative for final commerce calculations.

The backend must validate:

* current product price
* stock
* quantity limits
* product availability
* promotions
* discounts

before checkout/order creation.

### Guest Cart

Guest users may maintain cart state locally.

The exact persistence strategy may evolve.

### Authenticated Cart

When a backend cart API is available, authenticated cart state should synchronize with DRF.

A future authentication flow may need to merge:

```text
Guest Cart
    +
Existing Customer Cart
        ↓
Merged Authenticated Cart
```

The merge policy must be explicitly defined rather than invented by frontend code.

---

## 9. Pricing Domain

Pricing is backend-authoritative.

Possible price concepts may eventually include:

* regular price
* selling price
* sale price
* discount
* promotional price

The frontend is responsible for presentation.

The frontend must not invent missing prices or discounts.

A missing backend price must not silently become a fake fallback price.

Price formatting belongs to frontend presentation utilities.

Price calculation and eligibility belong to backend business logic.

---

## 10. Inventory Domain

Inventory determines whether and how a product can be purchased.

Possible states may include:

```text
In Stock
Out of Stock
Pre-order
Upcoming
Discontinued
```

The exact supported states must follow the backend contract.

The frontend should display backend-derived availability rather than independently determining inventory truth.

Do not assume that `stock > 0` is always the complete business rule for purchasability.

---

## 11. Checkout Domain

Checkout converts a valid cart into an order.

Checkout may include:

```text
Customer
    ↓
Address
    ↓
Shipping
    ↓
Payment
    ↓
Order Review
    ↓
Order Creation
```

The backend must revalidate all commerce-critical information before creating the order.

This includes:

* product availability
* quantities
* prices
* discounts
* coupons
* shipping
* taxes
* final totals

Never trust totals calculated only by the browser when creating an order.

---

## 12. Orders

Orders represent completed checkout submissions.

Possible order states may include:

```text
Pending
Confirmed
Processing
Packed
Shipped
Delivered
Completed
Cancelled
Refunded
```

The actual state machine must follow the backend implementation.

Do not create frontend-only order states without corresponding backend support.

Order data may include:

* order number
* customer
* items
* item prices
* totals
* shipping address
* payment status
* fulfillment status
* timestamps
* tracking information

Historical order items should display the values captured by the order rather than assuming the current product record still has the same price or information.

---

## 13. Payment

Payment is a backend-controlled commerce process.

The frontend may initiate or display payment flows but must not independently mark an order as paid.

Possible payment methods may eventually include Bangladesh-relevant providers and cash-on-delivery options.

Only implement payment providers that are actually supported by the backend/business.

Never expose private payment credentials in frontend runtime configuration.

---

## 14. Promotions and Coupons

Marketing rules may include:

* coupons
* product discounts
* category discounts
* promotional campaigns
* flash sales
* free shipping
* bundle promotions

Promotion eligibility and final discount calculations belong to the backend.

The frontend may display promotional information supplied by the backend.

Do not independently implement authoritative discount logic in Vue components.

---

## 15. Content Domain

The storefront also contains non-commerce content.

Current/planned content includes:

* blog
* About
* Careers
* Sustainability
* Help Center
* Shipping information
* Returns
* Warranty
* Privacy Policy
* Terms
* Cookie information

Public content pages should remain compatible with the project's SEO strategy.

Content should not be embedded into unrelated commerce components.

---

## 16. Commerce Data Integrity

Production UI must never fabricate business information merely to make a page appear complete.

Never invent:

* prices
* discounts
* inventory
* ratings
* reviews
* specifications
* certifications
* warranty terms
* shipping promises
* delivery dates
* product compatibility
* product features
* payment status
* order status

When data is unavailable, prefer an appropriate UI state such as:

```text
Unavailable
Not provided
Coming soon
Hidden section
Empty state
```

depending on the feature and UX requirement.

Mock/demo data is allowed only when clearly isolated from production API behavior.

---

## 17. Frontend Responsibility

The frontend is responsible for:

* presentation
* interaction
* responsive behavior
* accessibility
* route handling
* SEO rendering
* loading states
* empty states
* error states
* local UX state
* formatting backend data
* communicating user actions to DRF

The frontend is not responsible for becoming the authoritative implementation of backend commerce rules.

Use this principle when deciding where new logic belongs:

```text
Presentation concern
        → Frontend

User interaction concern
        → Frontend

Temporary UI state
        → Frontend / Pinia

Commerce business rule
        → Backend

Authoritative calculation
        → Backend

Permission enforcement
        → Backend

Persistent commerce state
        → Backend
```

When uncertain whether logic belongs in Nuxt or DRF, prefer keeping business-critical commerce rules in DRF.
