<!-- File: /pages/index.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useProductService } from '@/composables/useProductService';
import { useBrandService } from '@/composables/useBrandService';
import type { Brand, Product } from '@/types';

useSeoMeta({
  title: 'Best Computer Hub | Gaming PC, Laptop & Computer Accessories in Bangladesh',
  description: 'Best Computer Hub is your trusted destination for gaming PCs, laptops, computer components, networking devices, accessories, and enterprise hardware in Bangladesh. Shop authentic products at competitive prices with reliable support.'
});

// Explicitly use the composables
const productService = useProductService();
const brandService = useBrandService();

// Fetch Best Sellers via SSR-safe useAsyncData from real product API
const { 
  data: bestSellersResponse, 
  status: bestSellersStatus, 
  error: bestSellersError, 
  refresh: refreshBestSellers 
} = await useAsyncData(
  'storefront-best-sellers',
  () => productService.getProductsList({ page_size: 8 }),
  {
    lazy: false
  }
);

const bestSellerProducts = computed<Product[]>(() => bestSellersResponse.value?.results || []);

// Initialize brands with standard defaults from product service mapping for high SSR alignment and zero layout pop
const brandsList = ref<Brand[]>(
  productService.getBrands().map(b => ({
    ...b,
    is_active: b.is_active !== false
  }))
);

// On mount, poll the dynamic client / mock states to capture newly registered / edited administrative partner nodes
onMounted(async () => {
  try {
    const registry = await brandService.getBrandsList();
    if (registry && registry.length > 0) {
      brandsList.value = registry.filter(b => b.is_active !== false);
    }
  } catch (error) {
    console.error('Core Protocol Exception: Failed to poll partner registry on home page slide render.', error);
  }
});

// Static rich-text storefront overview content (ready to be replaced by backend/CMS API later)
const homepageRichText = `
  <p><strong>Best Computer Hub Ltd (BCHL)</strong> is a growing technology retailer and online IT solutions provider in Bangladesh. Established in <strong>2024</strong>, BCHL offers genuine <strong>Laptops, Desktop PCs, Gaming PCs, Monitors, Printers, Routers, Networking Products, Server Equipment, CCTV Cameras, UPS, Smart TVs, Mobile Phones, Computer Components, Computer Accessories, Office Equipment, eReaders, Enterprise WiFi, Firewall Solutions, Smart Gadgets, and Enterprise IT Infrastructure</strong> from leading global brands.With competitive pricing, professional support, and nationwide delivery, <a href="https://bestcomputerhub.com/">Best Computer Hub Ltd</a> proudly serves customers across <strong>all 64 districts of Bangladesh</strong>.</p>
  <h4>Best Laptop Shop in Bangladesh</h4>
  <p>Best Computer Hub Ltd is a trusted destination for customers seeking the latest <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/">Laptop Price in Bangladesh</a>. Our extensive collection includes <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/hp-laptop-brand-laptop-pc/">HP Laptop</a>, Dell Laptop, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/lenovo-laptop-brand-laptop-pc/">Lenovo Laptop</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/asus/">ASUS Laptop</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/acer/">Acer Laptop</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/msi/">MSI Laptop</a>, Gigabyte Laptop, Apple <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/apple-laptop-brand-laptop-pc/">MacBook</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/microsoft-laptop-brand-laptop-pc/">Microsoft Surface</a>, Huawei Laptop, and premium Gaming Laptop models from leading global brands.Whether you need a <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/microsoft-laptop-brand-laptop-pc/">Student Laptop</a>,<a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/microsoft-laptop-brand-laptop-pc/">Business Laptop</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/microsoft-laptop-brand-laptop-pc/">Freelancing Laptop</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/microsoft-laptop-brand-laptop-pc/">Programming Laptop</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/microsoft-laptop-brand-laptop-pc/">Graphic Design Laptop</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/microsoft-laptop-brand-laptop-pc/">Video Editing Laptop</a>, Workstation Laptop, or <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/microsoft-laptop-brand-laptop-pc/">Gaming Laptop</a>, we offer solutions for every requirement and budget. Powered by the latest Intel Processor and AMD Ryzen Processor platforms, our laptops deliver reliable performance for study, work, creativity, and gaming.</p>
  <h4>Best Desktop PC Shop in Bangladesh</h4>
  <p><a href="https://bestcomputerhub.com/">Best Computer</a> Hub Ltd is a trusted destination for <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/desktop-pc/">Desktop PC</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/desktop-pc/">Brand PC</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/all-in-one-pc/">All-in-One PC</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/mini-pc/">Mini PC</a>, Custom PC, Gaming PC, and Workstation PC.Build your dream PC in <a href="https://bestcomputerhub.com/pc-builder/">PC Builder</a> with premium Processor, Motherboard, Graphics Card, RAM, SSD, Power Supply, CPU Cooler, PC Case, and Case Fan from leading brands. Whether you are building a gaming setup, editing workstation, engineering workstation, or office computer, we provide complete PC building solutions.</p>
  <h4>Best Gaming PC Shop in Bangladesh</h4>
  <p>We at Best Computer Hub are passionate about gaming. Our gaming PC shop offers one of the widest ranges in the country. From custom Gaming PCs and high-performance Gaming Laptops to the latest <a href="https://bestcomputerhub.com/product-category/gaming-component/component/console/">Game Consoles</a> from <a href="https://bestcomputerhub.com/product-category/gaming-component/component/console/xbox/">Xbox</a> and <a href="https://bestcomputerhub.com/product-category/gaming-component/component/console/playstation/">PlayStation</a>, we have everything gaming enthusiasts need. The store is stocked with essential components including Gaming Motherboards, Liquid Coolers, Custom Water Cooling systems, stylish Gaming Casings, high-speed RAM Kits, and powerful Graphics Cards.Beyond the core components, we also provide an extensive selection of gaming accessories. These include comfortable Gaming Chairs, luxurious Gaming Sofas, RGB Mousepads, premium Gaming Headphones, Headphone Stands, and vibrant RGB Gaming PC Light-Strips. Thanks to our strong partnerships with leading global brands, customers can find authentic products from Razer, PNY, ASRock, Asus, Zadak, GALAX, Noctua, Antec, Lian Li, CRYORIG, EKWB, Gamdias, KWG, and XFX. We also carry popular gaming gear from A4Tech Bloody, SteelSeries, Logitech, Corsair, Redragon, Cooler Master, Fantech, DeepCool, Cougar, Gigabyte, and Elgato.</p>
  <h4>Best Computer Components Shop in Bangladesh</h4>
  <p>Upgrade your computer with premium Intel Processor,AMD Processor, Motherboard, DDR5 RAM, Gaming RAM, NVMe SSD, SATA SSD, Hard Disk Drive, <a href="https://bestcomputerhub.com/product-category/pc-component/graphics-processing-unit/">Graphics Card</a>, Power Supply, <a href="https://bestcomputerhub.com/product-category/gaming-component/desktop-pc-component/cpu-cooler/">CPU Cooler</a>, Liquid Cooler, PC Case, and Thermal Paste.We provide genuine products from Intel, AMD, MSI, ASUS, Gigabyte, ASRock, Crucial, Kingston, Corsair, Transcend, Samsung SSD, and Western Digital.</p>
  <h4>Best Monitor Shop in Bangladesh</h4>
  <p>Best Computer Hub Ltd offers a complete range of <a href="https://bestcomputerhub.com/product-category/pc-component/monitor/">Monitor</a>, <a href="https://bestcomputerhub.com/product-category/pc-component/monitor/">Gaming Monitor</a>, Professional Monitor, <a href="https://bestcomputerhub.com/product-category/pc-component/monitor/curved-monitor/">Curved Monitor</a>, <a href="https://bestcomputerhub.com/product-category/pc-component/monitor/4k-monitor/">4K Monitor</a>, Ultrawide Monitor, and Business Monitor solutions for gamers, professionals, designers, and corporate users. Browse leading brands including LG Monitor, Samsung Monitor, ASUS Monitor, MSI Monitor, Gigabyte Monitor, AOC Monitor, ViewSonic Monitor, BenQ Monitor, and Dell Monitor. Whether you need a monitor for gaming, office work, video editing, or graphic design, we provide the best monitor price in Bangladesh.</p>
  <h4>Best Networking Shop in Bangladesh</h4>
  <p>Best Computer Hub Ltd is a trusted supplier of enterprise and ISP networking products.Browse <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/wi-fi-router/">Router</a>, WiFi Router, <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/wifi-access-point-rang-extender/">Access Point</a>, Enterprise WiFi, <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/switch/managed/">Managed Switch</a>, <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/switch/poe/">PoE Switch</a>, <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/firewall/">Firewall</a>, OLT, ONU, Fiber Optic Products, SFP Module, Network Cable, and Wireless Bridge.We proudly offer <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/wifi-access-point-rang-extender/wifi-6-wifi-access-point-rang-extender/cisco-wifi-6-wifi-access-point-rang-extender/">Cisco</a>, <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/wifi-access-point-rang-extender/wifi-6-wifi-access-point-rang-extender/ubiquiti/">Ubiquiti</a>, <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/mikrotik-products/">MikroTik</a>, <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/wi-fi-router/wifi-6/tp-link/">TP-Link</a>, Totolink, Mercusys, Ruijie, Cambium, Grandstream, D-Link, and Palo Alto products.</p>
  <h4>Best Printer &amp; Office Equipment Shop in Bangladesh</h4>
  <p>Discover a wide range of <a href="https://bestcomputerhub.com/product-category/pc-component/office-equipment/printer/">Printer</a>, Laser Printer, Inkjet Printer, <a href="https://bestcomputerhub.com/product-category/pc-component/office-equipment/photocopier/">Photocopier</a>, <a href="https://bestcomputerhub.com/product-category/pc-component/office-equipment/scanner/">Scanner</a>, Barcode Scanner, <a href="https://bestcomputerhub.com/product-category/pc-component/office-equipment/pos-printer/">POS Printer</a>, Receipt Printer, Attendance Machine, Biometric Device, <a href="https://bestcomputerhub.com/product-category/pc-component/office-equipment/toner/">Toner</a> , <a href="https://bestcomputerhub.com/product-category/pc-component/office-equipment/toner/">Office equipment</a> trusted brands like HP Printer, Canon Printer, Epson Printer, Brother Printer, Pantum Printer, Zebra, Rongta, and <a href="https://bestcomputerhub.com/product/zkteco-ts2000-pro-tripod-turnstile/">ZKTeco</a>.</p>
  <h4>Best Security &amp; Surveillance Shop in Bangladesh</h4>
  <p>Protect your home and business with advanced security solutions from Best Computer Hub Ltd. Our collection includes <a href="https://bestcomputerhub.com/product-category/surveillance-security/camera-surveillance-security/cc-camera/">CCTV Camera</a>, <a href="https://bestcomputerhub.com/product-category/surveillance-security/camera-surveillance-security/ip-camera/">IP Camera</a>, NVR, DVR, Video Door Phone, <a href="https://bestcomputerhub.com/product-category/surveillance-security/access-control-system/">Access Control System</a>, Attendance System, Biometric Device, and Security Accessories. We supply products from Hikvision, Dahua, UNV, ZKTeco, <a href="https://bestcomputerhub.com/product-category/surveillance-security/camera-surveillance-security/portable-wifi-camera/ezviz/">EZVIZ</a>, and other leading security brands.</p>
  <h4>Best Smart TV &amp; Entertainment Shop in Bangladesh</h4>
  <p>Discover the latest <a href="https://bestcomputerhub.com/product-category/smart-home-appliance/smart-tv/">Smart TV</a>, Android TV, <a href="https://bestcomputerhub.com/product/haier-h75p7ux-75-inch-voice-control-hqled-4k-smart-google-tv/">Google TV</a>, <a href="https://bestcomputerhub.com/product/samsung-77s90c-77-oled-4k-smart-tv/">4K TV</a>, OLED TV, <a href="https://bestcomputerhub.com/product/samsung-odyssey-g9-ls49cg930swx-gaming-monitor/">QLED TV</a>, Bluetooth Speaker, Soundbar, and Home Theater System at Best Computer Hub Ltd. We offer premium entertainment products from Samsung, LG, Sony, Haier, Xiaomi, Walton, and Hisense.</p>
  <h4>Best Mobile &amp; Gadget Shop in Bangladesh</h4>
  <p>Find the latest <a href="https://bestcomputerhub.com/product-category/gadget/phone-tablet/">Smartphone</a>, Android Phone, iPhone, <a href="https://bestcomputerhub.com/product-category/gadget/smart-watch/">Smart Watch</a>, <a href="https://bestcomputerhub.com/product/openfit-2-earbuds/">Earbuds</a>, <a href="https://bestcomputerhub.com/product/thunderobot-thor-s10-pro-bluetooth-speaker/">Bluetooth Speaker</a>, <a href="https://bestcomputerhub.com/product-category/gadget/mobile-tablet-accessories/power-bank/">Power Bank</a>, <a href="https://bestcomputerhub.com/product-category/gadget/drones/">Drone</a>, <a href="https://bestcomputerhub.com/product-category/gadget/content-creator-studio/gimbal-content-creator-studio/">Gimbal</a>, and Mobile Accessories.We offer products from Apple, Samsung, Google Pixel, Motorola, OnePlus, Xiaomi, DJI, Anker, Amazfit, and Huawei.</p>
  <h4>Best UPS &amp; Power Backup Shop in Bangladesh</h4>
  <p>Power protection is essential for computers, networking equipment, and business operations. Best Computer Hub Ltd offers <a href="https://bestcomputerhub.com/product-category/pc-component/ups-ips/offline-ups/">Offline UPS</a>, <a href="https://bestcomputerhub.com/product-category/pc-component/ups-ips/online-ups/">Online UPS</a>, Line Interactive UPS, Rackmount UPS, Industrial UPS, <a href="https://bestcomputerhub.com/product-category/gadget/portable-power-stations/">Portable Power Station</a>, and Power Backup Solutions. Explore products from APC, UNV UPS, Power Guard, MaxGreen, Santak, and other trusted brands.</p>
  <h4>Best eReader &amp; Digital Reading Shop in Bangladesh</h4>
  <p>Best Computer Hub Ltd is one of the few technology retailers in Bangladesh offering premium <a href="https://bestcomputerhub.com/product-category/gadget/e-ink-device/ereader/">eReader</a> devices. Browse genuine <a href="https://bestcomputerhub.com/product-category/gadget/e-ink-device/ereader/amazon-kindle/">Amazon Kindle</a>, <a href="https://bestcomputerhub.com/product-category/gadget/e-ink-device/ereader/boox/">BOOX</a> eReader, Android eReader, Digital Note Taking Tablet, and <a href="https://bestcomputerhub.com/product-category/gadget/e-ink-device/">E Ink Tablet</a> solutions for students, professionals, and book lovers.</p>
  <h4>Corporate, Enterprise &amp; Government IT Solutions</h4>
  <p>Best Computer Hub Ltd supplies complete Corporate IT Solution, <a href="https://bestcomputerhub.com/product-category/server-storage/server/">Server Solution</a>, Data Center Solution, Network Infrastructure, Enterprise WiFi, IP Telephony, Cloud Networking, Cyber Security Solution, and Corporate Procurement Services across Bangladesh.</p>
  <h4>Best Corporate &amp; Wholesale IT Supplier in Bangladesh</h4>
  <p>Best Computer Hub Ltd supplies IT products and technology solutions to corporate offices, educational institutions, government organizations, banks, NGOs, factories, and ISPs throughout Bangladesh. Our enterprise offerings include Server Solution, Network Infrastructure, Enterprise WiFi, <a href="https://bestcomputerhub.com/product/grandstream-grp2604p-3-line-6-sip/">IP Telephony</a>, Data Center Equipment, <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/firewall/palo-alto/">Firewall Solution</a>, Cloud Networking, and Corporate Procurement Services.</p>
  <h4>Authorized Brands Available at Best Computer Hub Ltd</h4>
  <p>Best Computer Hub Ltd proudly offers products from leading technology brands including <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/hp-laptop-brand-laptop-pc/">HP</a>, Dell, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/lenovo-laptop-brand-laptop-pc/">Lenovo</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/asus/">ASUS</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/acer/">Acer</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/msi/">MSI</a>, Gigabyte, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/apple-laptop-brand-laptop-pc/">Apple</a>, <a href="https://bestcomputerhub.com/product-category/brand-laptop-pc/laptop-brand-laptop-pc/microsoft-laptop-brand-laptop-pc/">Microsoft</a>, <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/switch/poe/cisco-poe/">Cisco</a>, Ubiquiti, MikroTik, TP-Link, <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/wi-fi-router/wifi-6/totolink-wifi-6/">Totolink</a>, Mercusys, <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/wifi-access-point-rang-extender/wifi-6-wifi-access-point-rang-extender/ruijie-wifi-6-wifi-access-point-rang-extender/">Ruijie</a>, <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/wifi-access-point-rang-extender/ac-wifi-access-point-rang-extender/cambrium/">Cambium</a>, <a href="https://bestcomputerhub.com/product-category/networking-component/active-network-devices/firewall/palo-alto/">Palo Alto</a>, <a href="https://bestcomputerhub.com/product-category/pc-component/office-equipment/printer/canon/">Canon</a>, <a href="https://bestcomputerhub.com/product-category/pc-component/office-equipment/printer/epson/">Epson</a>, <a href="https://bestcomputerhub.com/product-category/pc-component/office-equipment/pos-printer/brother/">Brother</a>, <a href="https://bestcomputerhub.com/product-category/pc-component/office-equipment/printer/pantum/">Pantum</a>, <a href="https://bestcomputerhub.com/product-category/gaming-component/desktop-pc-component/ssd-desktop-pc-component/samsung-ssd-desktop-pc-component/">Samsung</a>, <a href="https://bestcomputerhub.com/product-category/gaming-component/desktop-pc-component/ssd-desktop-pc-component/kingston-ssd-desktop-pc-component/">Kingston</a>, <a href="https://bestcomputerhub.com/product-category/gaming-component/desktop-pc-component/ssd-desktop-pc-component/crucial-ssd-desktop-pc-component/">Crucial</a>, <a href="https://bestcomputerhub.com/product-category/gaming-component/desktop-pc-component/ssd-desktop-pc-component/transcend-ssd-desktop-pc-component/">Transcend</a>, <a href="https://bestcomputerhub.com/product-category/gaming-component/desktop-pc-component/power-supply/deepcool-power-supply/">DeepCool</a>, <a href="https://bestcomputerhub.com/product-category/pc-component/sound-system-pc-component/headphone/corsair-headphone/">Corsair</a>, <a href="https://bestcomputerhub.com/product-category/pc-component/office-equipment/conference-systems/logitech-conference-systems/">Logitech</a>, <a href="https://bestcomputerhub.com/product-category/pc-component/keyboard-pc-component/fantech-keyboard-pc-component/">Fantech</a>, <a href="https://bestcomputerhub.com/product-category/pc-component/keyboard-pc-component/razer-keyboard-pc-component/">Razer</a>, <a href="https://bestcomputerhub.com/product-category/gadget/content-creator-studio/action-camera/dji-action-camera/">DJI</a>, <a href="https://bestcomputerhub.com/product-category/gadget/ear-buds/anker-ear-buds/">Anker</a>, <a href="https://bestcomputerhub.com/product-category/surveillance-security/camera-surveillance-security/portable-wifi-camera/xiaomi-portable-wifi-camera/">Xiaomi</a>, <a href="https://bestcomputerhub.com/product-category/gadget/smart-watch/amazfit/">Amazfit</a>, <a href="https://bestcomputerhub.com/product/hikvision-ds-2cd1347g2h-liu-camera/">Hikvision</a>, <a href="https://bestcomputerhub.com/product-category/networking-component/passive-network-devices/network-cable/utp/dahua-utp/">Dahua</a>, <a href="https://bestcomputerhub.com/product-category/surveillance-security/camera-surveillance-security/ip-camera/uniview/">UNV</a>, and many more.</p>
  <h4>Leading E-Commerce Website for Technology Products in Bangladesh</h4>
  <p>Best Computer Hub Ltd cares most about customer satisfaction. We launched our e-commerce website to meet the rising demand for online shopping in Bangladesh. Our online shop is now one of the most trusted and most visited <a href="https://bestcomputerhub.com/">e-commerce</a> websites in the country.We run many campaigns and special deals on different occasions. Some popular events are: Flash Sale, Special <a href="https://bestcomputerhub.com/">Offer</a>, Daily Lucky Winner, Anniversary Offer, New Year Offer, 11.11, and 12.12 Campaign.We also organize eSports tournaments for Bangladeshi gamers.</p>
  <h4>Genuine Product • Affordable Price • Fastest Delivery • Reliable After-Sales Support</h4>
  <p>Since its beginning, Best Computer Hub Ltd has always placed customer satisfaction at the heart of everything we do. We give every customer our full attention and priority, whether they are making a purchase or simply making an inquiry.We deliver genuine products at competitive prices, along with dependable after-sales support and outstanding <a href="https://bestcomputerhub.com/">customer service</a>. Thanks to our strong nationwide coverage, we provide fast delivery across all 64 districts of <a href="https://bestcomputerhub.com/">Bangladesh</a>.We are proud to introduce Bangladesh’s first computer home service and are steadily expanding our presence to more cities across the country.</p>
`;
</script>

<template>
  <div class="space-y-20 pb-20">
    <!-- Hero Section -->
    <HomeHeroSection />

    <!-- Quick Links -->
    <HomeQuickLinks />

    <!-- Featured Categories -->
    <HomeFeaturedCategories />

    <!-- Best Sellers -->
    <HomeProductSection
      title="Best Sellers"
      title-highlight="Sellers"
      subtitle="Top performing hardware & enterprise solutions chosen by our clients."
      view-all-route="/products/"
      view-all-text="Explore All Products"
      :products="bestSellerProducts"
      :is-loading="bestSellersStatus === 'pending'"
      :error="bestSellersError"
      :error-message="bestSellersError?.message || 'Unable to retrieve catalog products.'"
      :on-retry="() => refreshBestSellers()"
      @retry="() => refreshBestSellers()"
    />

    <!-- Brand Marquee -->
    <HomeBrandMarquee :brands="brandsList" />

    <!-- TEMPORARILY DISABLED: Enterprise Offer Promo Banner -->
    <!--
    <HomePromoBanner />
    -->

    <!-- Storefront Overview & SEO Rich Text -->
    <section class="container mx-auto px-4" aria-label="Best Computer Hub Overview">
      <div class="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xs">
        <div
          class="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-4 [&_strong]:text-foreground [&_strong]:font-semibold [&_h4]:font-display [&_h4]:font-bold [&_h4]:text-foreground [&_h4]:text-base sm:[&_h4]:text-lg [&_h4]:tracking-tight [&_h4]:pt-5 [&_h4]:border-t [&_h4]:border-border/60 first:[&_h4]:border-0 first:[&_h4]:pt-0 [&_h4]:mt-6 [&_h4]:mb-2.5 [&_a]:text-primary [&_a]:font-medium [&_a]:underline underline-offset-2 hover:[&_a]:text-primary-hover hover:[&_a]:underline [&_a]:transition-colors [&_p]:leading-relaxed [&_p]:mb-3"
          v-html="homepageRichText"
        />
      </div>
    </section>
  </div>
</template>
