"use no memo";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ClothingItem } from "@/types/item";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: "#0A0A0A",
    padding: 48,
    fontFamily: "Times-Roman",
  },
  certificateFrame: {
    borderWidth: 1,
    borderColor: "#0A0A0A",
    padding: 40,
    minHeight: "100%",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#737373",
    marginBottom: 24,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 28,
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: "Times-Roman",
  },
  subtitle: {
    fontSize: 11,
    color: "#525252",
    marginBottom: 40,
    fontFamily: "Helvetica",
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 1.7,
    color: "#171717",
    marginBottom: 16,
  },
  detailBlock: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingTop: 24,
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  detailLabel: {
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#A3A3A3",
    fontFamily: "Helvetica",
    width: 120,
  },
  detailValue: {
    fontSize: 11,
    flex: 1,
    textAlign: "right",
    fontFamily: "Times-Roman",
  },
  footer: {
    marginTop: 48,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingTop: 16,
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#A3A3A3",
    textAlign: "center",
    fontFamily: "Helvetica",
  },
  guideHeader: {
    marginBottom: 28,
  },
  guideTitle: {
    fontSize: 22,
    marginBottom: 6,
    fontFamily: "Times-Roman",
  },
  guideSubtitle: {
    fontSize: 10,
    color: "#525252",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica",
  },
  itemCard: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingTop: 18,
    paddingBottom: 18,
    gap: 6,
  },
  itemName: {
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "Times-Roman",
  },
  itemMeta: {
    fontSize: 9,
    color: "#737373",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Helvetica",
  },
  itemDescription: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#262626",
    marginTop: 4,
  },
  itemUrl: {
    fontSize: 9,
    color: "#0A0A0A",
    marginTop: 4,
    fontFamily: "Helvetica",
  },
});

export interface GuideTemplateProps {
  buyerName: string;
  dateOfPurchase: string;
  lookTitle: string;
  certificateSerial: string;
  items: ClothingItem[];
}

export function createGuideDocument({
  buyerName,
  dateOfPurchase,
  lookTitle,
  certificateSerial,
  items,
}: GuideTemplateProps) {
  return (
    <Document
      title={`Cortis Style Guide — ${lookTitle}`}
      author="Cortis Style"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.certificateFrame}>
          <View>
            <Text style={styles.eyebrow}>Cortis Style — Official Document</Text>
            <Text style={styles.title}>Certificate of Styling Authenticity</Text>
            <Text style={styles.subtitle}>
              A registered record of editorial curation
            </Text>

            <Text style={styles.bodyText}>
              This document confirms that {buyerName} is an official curator of{" "}
              {lookTitle}, authenticated under the Cortis Style archive and issued
              as a printable certificate of styling authenticity.
            </Text>

            <Text style={styles.bodyText}>
              The bearer is granted access to the complete unlocked style guide
              accompanying this certificate, including verified sourcing notes and
              direct commerce references for each documented garment and accessory.
            </Text>

            <View style={styles.detailBlock}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Curator</Text>
                <Text style={styles.detailValue}>{buyerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Look</Text>
                <Text style={styles.detailValue}>{lookTitle}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date of Issue</Text>
                <Text style={styles.detailValue}>{dateOfPurchase}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Certificate No.</Text>
                <Text style={styles.detailValue}>{certificateSerial}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.footer}>
            Cortis Style — Lookbook Authentication System
          </Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View>
          <View style={styles.guideHeader}>
            <Text style={styles.guideTitle}>Unlocked Style Guide</Text>
            <Text style={styles.guideSubtitle}>
              {lookTitle} — Full Item Registry
            </Text>
          </View>

          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>
                {item.brand} — {item.category}
              </Text>
              <Text style={styles.itemDescription}>
                {item.unlockedDescription}
              </Text>
              <Text style={styles.itemUrl}>{item.shopUrl}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
