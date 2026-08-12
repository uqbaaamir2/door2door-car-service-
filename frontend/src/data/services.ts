import {
  BatteryCharging,
  Car,
  CircleGauge,
  Cog,
  Disc3,
  Snowflake,
  type LucideIcon,
} from "lucide-react";

export type Service = {
  icon: LucideIcon;
  title: string;
  description: string;
  price: string;
  points: string[];
  serviceType: "home" | "mobile";
  subcategory: string;
};

export const services: Service[] = [
  {
    icon: Cog,
    title: "Engine Diagnostics",
    description: "Full OBD scan and live sensor reading to find the real fault, not a guess.",
    price: "from Rs 2,500",
    points: ["OBD-II scan", "Compression check", "Written report"],
    serviceType: "home",
    subcategory: "engine-diagnostics",
  },
  {
    icon: BatteryCharging,
    title: "Battery & Electrical",
    description: "Jump start, alternator testing and same-visit battery replacement.",
    price: "from Rs 1,200",
    points: ["Load test", "Alternator check", "Battery swap"],
    serviceType: "home",
    subcategory: "battery-electrical",
  },
  {
    icon: Disc3,
    title: "Tyre & Wheel",
    description: "Puncture repair, rotation and balancing done right at your parking spot.",
    price: "from Rs 900",
    points: ["Puncture repair", "Balancing", "Pressure reset"],
    serviceType: "home",
    subcategory: "tyre-wheel",
  },
  {
    icon: CircleGauge,
    title: "Brake Service",
    description: "Pad and disc inspection with fluid top-up for confident stopping power.",
    price: "from Rs 3,400",
    points: ["Pad replacement", "Disc measure", "Fluid bleed"],
    serviceType: "home",
    subcategory: "brake-service",
  },
  {
    icon: Snowflake,
    title: "AC Repair",
    description: "Gas refill, leak detection and cabin filter change for real cooling.",
    price: "from Rs 4,000",
    points: ["Leak test", "Gas refill", "Filter change"],
    serviceType: "home",
    subcategory: "ac-repair",
  },
  {
    icon: Car,
    title: "Pre-Purchase Inspection",
    description: "70-point check before you buy a used car, with photos and honest verdict.",
    price: "from Rs 5,500",
    points: ["70-point check", "Photo report", "Price advice"],
    serviceType: "home",
    subcategory: "pre-purchase-inspection",
  },
];
