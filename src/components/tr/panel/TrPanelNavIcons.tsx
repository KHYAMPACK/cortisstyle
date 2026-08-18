"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Home,
  Package,
  Percent,
  Receipt,
  Settings,
  ShoppingBag,
  Users,
  Warehouse,
} from "lucide-react";
import {
  trPanelCampaignsPath,
  trPanelCustomersPath,
  trPanelInvoicesPath,
  trPanelOrdersPath,
  trPanelPath,
  trPanelProductsPath,
  trPanelReportsPath,
  trPanelSettingsPath,
  trPanelStockPath,
} from "@/lib/tr/paths";

const ICONS: Record<string, LucideIcon> = {
  [trPanelPath()]: Home,
  [trPanelOrdersPath()]: ShoppingBag,
  [trPanelProductsPath()]: Package,
  [trPanelStockPath()]: Warehouse,
  [trPanelCustomersPath()]: Users,
  [trPanelCampaignsPath()]: Percent,
  [trPanelReportsPath()]: BarChart3,
  [trPanelSettingsPath()]: Settings,
  [trPanelInvoicesPath()]: Receipt,
};

export function panelNavIcon(href: string): LucideIcon {
  return ICONS[href] ?? Home;
}
