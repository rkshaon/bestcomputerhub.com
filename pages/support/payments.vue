<script setup lang="ts">
import { 
  CreditCard, 
  Landmark, 
  Receipt, 
  Lock, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  FileCheck 
} from 'lucide-vue-next';

// Define interactive PO calculator mock helper if enterprise users want to estimate surcharge/exemption limits
const poSurchargeRate = 0.00; // Po payments are free of extra processing surcharges
const estimatedOrderAmount = ref<number | ''>('');
const estimatedProcessingSurcharge = computed(() => {
  if (!estimatedOrderAmount.value || isNaN(estimatedOrderAmount.value)) return 0;
  return Number(estimatedOrderAmount.value) * poSurchargeRate;
});

const billingFeatures = [
  {
    icon: CreditCard,
    title: 'Digital Payments & Cards',
    desc: 'Support for Visa, Mastercard, American Express, Apple Pay, and Google Pay with zero external processor redirection.'
  },
  {
    icon: Landmark,
    title: 'ACH / Wire Transfers',
    desc: 'Preferred for high-value transactions above $5,000. Real-time bank matching via automated settlement protocols.'
  },
  {
    icon: Receipt,
    title: 'Corporate Purchase Orders',
    desc: 'Exclusively for verified corporate nodes. Direct upload of PO files with validation within 4 business hours.'
  },
  {
    icon: Clock,
    title: 'Net-30 / Net-60 Terms',
    desc: 'Flexible credit lines mapped to institutional scorecards. Eligible for tier-1 supply chain contractors.'
  }
];

const paymentCertifications = [
  { icon: ShieldCheck, val: 'PCI-DSS L1', label: 'Security Level' },
  { icon: Lock, val: '256-Bit SSL', label: 'Payload Encryption' },
  { icon: DollarSign, val: 'Multi-Cur', label: '15+ Base Currencies' },
  { icon: FileCheck, val: 'SaaS Compliance', label: 'SOC2 Type II Audit' }
];
</script>

<template>
  <div class="min-h-screen pt-32 pb-20 animate-in fade-in duration-700">
    <div class="container mx-auto px-4 max-w-4xl">
      <!-- Header banner -->
      <div class="space-y-6 text-center mb-16">
        <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <CreditCard class="w-8 h-8 text-primary" />
        </div>
        <h1 class="text-4xl md:text-5xl font-display font-bold tracking-tight">Payments & <span class="text-primary italic">Billing</span></h1>
        <p class="text-lg text-muted-foreground">Industrial checkout security and enterprise credit lines streamlined for operations.</p>
      </div>

      <!-- Security and Trust row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
        <div v-for="cert in paymentCertifications" :key="cert.label" class="p-6 bg-muted/20 rounded-3xl text-center space-y-2 border">
          <component :is="cert.icon" class="w-6 h-6 text-primary mx-auto opacity-50" />
          <p class="text-2xl font-display font-bold">{{ cert.val }}</p>
          <p class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{{ cert.label }}</p>
        </div>
      </div>

      <!-- Core Channels Grid -->
      <div class="space-y-8 mb-20">
        <h2 class="text-3xl font-display font-bold">Billing <span class="text-primary">Options</span></h2>
        <div class="grid gap-6">
          <div v-for="feature in billingFeatures" :key="feature.title" class="p-8 bg-card border rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 hover:border-primary/30 transition-all">
            <div class="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
              <component :is="feature.icon" class="w-7 h-7 text-primary" />
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-3">
                <h3 class="text-xl font-bold">{{ feature.title }}</h3>
                <span v-if="feature.title.includes('Terms')" class="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Premium</span>
              </div>
              <p class="text-muted-foreground text-sm leading-relaxed">{{ feature.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- PO Surcharge Quick Calculator -->
      <div class="bg-muted rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 mb-20">
        <div class="max-w-xl space-y-4">
          <h3 class="text-xl font-display font-bold">Enterprise Transaction Surcharge Estimator</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            TechCore implements zero corporate processing surcharges on purchase orders (PO) or ACH settlement routing configurations. Enter transaction value to audit compliance.
          </p>
          <div class="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <div class="relative w-full">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">$</span>
              <input 
                v-model="estimatedOrderAmount" 
                type="number"
                placeholder="Convert invoice amount e.g. 50000"
                class="w-full h-12 pl-8 pr-4 bg-background border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
              />
            </div>
            <div class="w-full sm:w-auto bg-card border rounded-2xl px-6 h-12 flex items-center justify-between gap-6 shrink-0">
              <span class="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Processing Surcharge:</span>
              <span class="text-sm font-black text-emerald-500">$0.00 USD (FREE)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Specific Guidelines section -->
      <div class="bg-muted rounded-[3rem] p-12 space-y-8">
        <div class="max-w-2xl">
          <h2 class="text-3xl font-display font-bold mb-4">Institutional <span class="text-primary">Compliance</span></h2>
          <p class="text-muted-foreground">Our payment architecture ensures complete isolation of payment instrument keys and follows NIST cryptographic standards to guarantee sovereign financial safety.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-4">
            <h4 class="font-bold border-l-4 border-primary pl-4">VAT & Tax Exemption Nodes</h4>
            <p class="text-sm text-muted-foreground leading-relaxed">Tax-exempt entities inside the EU, US, and UK can submit tax registration numbers during account setup. Verification is completed instantly at checkout via VIES/IRS REST nodes.</p>
          </div>
          <div class="space-y-4">
            <h4 class="font-bold border-l-4 border-primary pl-4">Instant Ledger Receipts</h4>
            <p class="text-sm text-muted-foreground leading-relaxed">System invoices are automatically dispatched as cryptographically signed PDF records. These contain purchase order references, TAA classifications, and harmonized system commodity tracking codes corresponding to global customs.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
