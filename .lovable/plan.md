
# AutoMate Core Monetization Enhancement Plan

## Overview

Enhance the current manual passcode payment system with a professional pricing page, clear bank transfer instructions, and streamlined payment-to-activation workflow while keeping the $5/month pricing model.

---

## Current State Analysis

**What exists:**
- Passcode redemption system via `CreditStatus` component
- Admin panel at `/admin` for generating passcodes manually
- `useCredits` hook managing credit tracking
- 3 free uses, then 100 credits/month for premium users
- `validate_passcode` database function for activation

**What needs improvement:**
- No pricing page to convert visitors
- No payment instructions for users
- No upgrade prompts when credits run low
- Passcode workflow requires manual admin intervention

---

## Implementation Plan

### Phase 1: Pricing Page

**New File: `src/pages/Pricing.tsx`**

Create a dedicated pricing page with:
- Hero section with value proposition
- Side-by-side comparison of Free vs Premium tiers
- Clear pricing: $5/month for 100 AI credits
- Feature checklist (VIN decoder, Damage AI, Fault Codes, Workshop Assistant, OCR)
- "Get Premium" button that opens payment instructions modal
- FAQ section addressing common questions
- Trust indicators (secure payment, instant activation)

**Route Addition:**
- Add `/pricing` route in `App.tsx`
- Add "Pricing" link to `Navbar.tsx` for non-authenticated users

---

### Phase 2: Payment Instructions Component

**New File: `src/components/payment/PaymentInstructions.tsx`**

A modal/dialog component showing:
- Bank transfer details (account name, number, bank)
- Amount: $5 USD (or local currency equivalent)
- Reference format: User's email address
- WhatsApp/Email contact for confirmation
- Estimated activation time (within 24 hours)
- Copy-to-clipboard for bank details

**Integration Points:**
- Triggered from Pricing page "Get Premium" button
- Triggered from Settings page upgrade section
- Triggered from credit exhaustion dialog

---

### Phase 3: Upgrade Prompts System

**New File: `src/components/credits/UpgradePrompt.tsx`**

Smart upgrade prompts that appear:
- When user reaches 1 credit remaining (soft nudge)
- When credits are exhausted (paywall with value proposition)
- After successful feature use (upsell moment)

**Features:**
- Show remaining credits prominently
- List what premium unlocks
- Direct link to payment instructions
- "Remind me later" option for soft nudges

**Hook Enhancement: `src/hooks/useCredits.tsx`**
- Add `showUpgradePrompt` state
- Add logic to trigger prompts based on credit thresholds

---

### Phase 4: Payment Tracking Table

**New Database Table: `payment_requests`**

```sql
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  email TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID
);
```

This allows:
- Users to submit payment requests after transfer
- Admins to see pending payments
- Track payment history
- Auto-generate passcodes upon confirmation

---

### Phase 5: Enhanced Admin Panel

**Updates to `src/pages/Admin.tsx`**

Add new sections:
1. **Pending Payments** - List of users who submitted payment confirmations
2. **Quick Confirm** - One-click to confirm payment and auto-generate/assign passcode
3. **Revenue Dashboard** - Total payments, active premium users, conversion rate

**New Admin Features:**
- View user email (not just ID) for easier payment matching
- Bulk passcode generation
- Payment confirmation workflow
- Auto-email user their passcode (optional future enhancement)

---

### Phase 6: Settings Page Enhancement

**Updates to `src/pages/Settings.tsx`**

Improve the Credits & Subscription section:
- Progress bar showing credits used vs remaining
- Days remaining for premium users
- Prominent "Upgrade to Premium" button for free users
- "Renew Subscription" for expiring premium users
- Payment history section

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Pricing.tsx` | Create | New pricing page with tiers and payment CTA |
| `src/components/payment/PaymentInstructions.tsx` | Create | Bank transfer modal with copy-able details |
| `src/components/credits/UpgradePrompt.tsx` | Create | Smart upgrade prompts component |
| `src/App.tsx` | Modify | Add /pricing route |
| `src/components/layout/Navbar.tsx` | Modify | Add Pricing link for visitors |
| `src/pages/Admin.tsx` | Modify | Add payment confirmation workflow |
| `src/pages/Settings.tsx` | Modify | Enhanced subscription section |
| `src/hooks/useCredits.tsx` | Modify | Add upgrade prompt logic |
| Database Migration | Create | Add payment_requests table with RLS |

---

## User Journey After Implementation

### Free User Upgrade Flow:
1. User runs out of credits or visits `/pricing`
2. Sees clear comparison: Free (3 uses) vs Premium ($5/100 uses)
3. Clicks "Get Premium" - opens payment instructions
4. Makes bank transfer with email as reference
5. Submits payment confirmation in app (optional)
6. Admin sees pending payment, confirms it
7. Passcode auto-generated and applied to user
8. User gets toast notification: "Premium activated!"

### Admin Workflow:
1. Receives bank alert for payment
2. Opens Admin panel, sees pending payment
3. Clicks "Confirm Payment" next to matching user
4. System auto-generates passcode and applies premium
5. User instantly gets 100 credits for 30 days

---

## Technical Details

### Payment Instructions Content (Configurable)

```typescript
const PAYMENT_CONFIG = {
  bankName: "FirstBank",
  accountName: "ISHOLA OLUWASEYI DAVID",
  accountNumber: "3218379018",
  amount: 5,
  currency: "USD",
  whatsapp: "+2348108102214",
  email: "neuralicstudio@gmail.com"
};
```

This can be stored in environment variables or a settings table for easy updates.

### Upgrade Prompt Triggers

```typescript
// In useCredits hook
const shouldShowSoftPrompt = !isPremium && remaining === 1;
const shouldShowHardPrompt = !isPremium && remaining === 0;
```

### RLS Policies for payment_requests

```sql
-- Users can insert their own payment requests
CREATE POLICY "Users can insert own requests" ON payment_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON payment_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view and update all requests
CREATE POLICY "Admins can manage requests" ON payment_requests
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

---

## Implementation Priority

1. **Pricing Page** - Essential for conversions (visitors need to see value)
2. **Payment Instructions** - Enable actual revenue collection
3. **Settings Enhancement** - Improve upgrade path for existing users
4. **Upgrade Prompts** - Convert free users at key moments
5. **Admin Enhancements** - Streamline payment confirmation
6. **Payment Tracking** - Full audit trail and automation
