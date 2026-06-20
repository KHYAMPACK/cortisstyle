"use no memo";

import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ResolvedStyleGuide } from "@/types/style-guide";
import {
  formatFitGuidanceLine,
} from "@/lib/guideFormat";
import { resolveGuidePdfImagePath } from "@/lib/guideImages";

const palette = {
  page: "#0A0A0A",
  panel: "#111111",
  ink: "#E5E5E5",
  muted: "#737373",
  dim: "#525252",
  rule: "#262626",
  accent: "#A3A3A3",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: palette.page,
    color: palette.ink,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
  },
  headerBlock: {
    borderBottomWidth: 1,
    borderBottomColor: palette.rule,
    paddingBottom: 14,
    marginBottom: 16,
  },
  serifTitle: {
    fontFamily: "Times-Roman",
    fontSize: 17,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#F5F5F5",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 7,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: palette.muted,
    marginBottom: 8,
  },
  metadata: {
    fontSize: 6.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: palette.dim,
    borderTopWidth: 1,
    borderTopColor: palette.rule,
    paddingTop: 8,
  },
  itemBlock: {
    borderBottomWidth: 1,
    borderBottomColor: palette.rule,
    paddingTop: 10,
    paddingBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemLeftCol: {
    width: "70%",
  },
  itemRightCol: {
    width: "30%",
    alignItems: "center",
    justifyContent: "center",
  },
  itemAssetFrame: {
    width: 72,
    height: 72,
    borderWidth: 1,
    borderColor: palette.rule,
    backgroundColor: palette.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  itemAssetImage: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  itemHeaderSerif: {
    fontFamily: "Times-Roman",
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
  itemBrandSerif: {
    fontFamily: "Times-Roman",
    fontSize: 7,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#D4D4D4",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
    marginBottom: 2,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: "#404040",
    paddingVertical: 3,
    paddingHorizontal: 5,
    fontSize: 5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#D4D4D4",
    textDecoration: "none",
  },
  metaLine: {
    fontSize: 5.5,
    lineHeight: 1.45,
    letterSpacing: 0.5,
    color: "#A3A3A3",
    marginTop: 2,
  },
  bodyLine: {
    fontSize: 5.5,
    lineHeight: 1.45,
    color: "#D4D4D4",
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 5.5,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: palette.muted,
    marginTop: 4,
  },
  itemType: {
    fontFamily: "Times-Roman",
    fontSize: 8.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#F5F5F5",
    marginTop: 1,
  },
  fieldValue: {
    fontSize: 7,
    lineHeight: 1.45,
    color: "#D4D4D4",
    marginTop: 1,
  },
  shopLink: {
    fontSize: 6.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#D4D4D4",
    textDecoration: "underline",
    marginTop: 1,
  },
  vaultEyebrow: {
    fontSize: 6,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: palette.dim,
    marginBottom: 6,
  },
  vaultTitle: {
    fontFamily: "Times-Roman",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#F5F5F5",
    lineHeight: 1.35,
    marginBottom: 8,
  },
  issueLine: {
    fontSize: 6.5,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: palette.muted,
  },
  sectionLabel: {
    fontSize: 5.5,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: palette.muted,
    marginBottom: 6,
  },
  ledgerItem: {
    fontSize: 6.5,
    lineHeight: 1.5,
    color: "#D4D4D4",
    fontFamily: "Courier",
    marginBottom: 3,
  },
  ledgerTimestamp: {
    fontSize: 6.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#D4D4D4",
    fontFamily: "Courier",
    marginTop: 4,
  },
  synergySection: {
    borderTopWidth: 1,
    borderTopColor: palette.rule,
    paddingTop: 12,
    marginTop: 10,
  },
  synergyStat: {
    fontSize: 7,
    lineHeight: 1.45,
    color: "#D4D4D4",
  },
  qrFrame: {
    borderWidth: 1,
    borderColor: "#404040",
    backgroundColor: palette.panel,
    padding: 12,
    marginTop: 10,
    alignItems: "center",
  },
  qrGrid: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: "#525252",
    backgroundColor: palette.page,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  qrPlaceholder: {
    fontSize: 5,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: palette.muted,
  },
  qrSubtext: {
    fontSize: 6,
    lineHeight: 1.5,
    color: palette.muted,
    textAlign: "center",
    fontStyle: "italic",
  },
  footerQuote: {
    borderTopWidth: 1,
    borderTopColor: palette.rule,
    paddingTop: 10,
    marginTop: 14,
    fontSize: 6,
    letterSpacing: 1.2,
    color: palette.dim,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export interface GuideTemplateProps {
  guide: ResolvedStyleGuide;
}

function DirectoryItem({
  item,
}: {
  item: ResolvedStyleGuide["pageOne"]["directoryItems"][number];
}) {
  const imagePath = resolveGuidePdfImagePath(item);

  return (
    <View style={styles.itemBlock}>
      <View style={styles.itemRow}>
        <View style={styles.itemLeftCol}>
          <Text style={styles.itemHeaderSerif}>{item.itemType}</Text>
          <Text style={styles.itemBrandSerif}>{item.brandModel}</Text>

          <Text style={styles.fieldLabel}>Actions</Text>
          <View style={styles.actionRow}>
            <Link style={styles.actionButton} src={item.shopUrl}>
              Shop Original Source
            </Link>
            <Link
              style={styles.actionButton}
              src={item.budgetAlternativeLink.url}
            >
              Budget Alternative Direct Link
            </Link>
          </View>

          <Text style={styles.fieldLabel}>Sizing &amp; Fit</Text>
          <Text style={styles.metaLine}>
            {formatFitGuidanceLine(item.fitGuidance)}
          </Text>

          <Text style={styles.fieldLabel}>Styling &amp; Synergy</Text>
          <Text style={styles.bodyLine}>{item.stylingExecution.howToWear}</Text>
          <Text style={styles.bodyLine}>
            {item.stylingExecution.textureSynergy}
          </Text>

          <Text style={styles.fieldLabel}>Resale Directory</Text>
          <Text style={styles.bodyLine}>
            Search Keywords: {item.resaleKeywords.tags}
          </Text>
          <Text style={styles.metaLine}>
            Est. Market Value: {item.resaleKeywords.estPriceRange}
          </Text>
          <Text style={styles.metaLine}>
            Alt: {item.budgetAlternativeLink.name}
          </Text>
        </View>

        <View style={styles.itemRightCol}>
          <View style={styles.itemAssetFrame}>
            {imagePath ? (
              <Image src={imagePath} style={styles.itemAssetImage} />
            ) : (
              <Text style={styles.qrPlaceholder}>Asset</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

export function createGuideDocument({ guide }: GuideTemplateProps) {
  const { pageOne, pageTwo } = guide;

  return (
    <Document
      title={`Cortis Style Guide — ${pageOne.title}`}
      author="Cortis Style"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBlock}>
          <Text style={styles.serifTitle}>{pageOne.title}</Text>
          <Text style={styles.subtitle}>{pageOne.subtitle}</Text>
          <Text style={styles.metadata}>{pageOne.metadataLine}</Text>
        </View>

        {pageOne.directoryItems.map((item) => (
          <DirectoryItem key={item.itemId} item={item} />
        ))}
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.headerBlock}>
          <Text style={styles.vaultEyebrow}>Cortis Style — Digital Vault</Text>
          <Text style={styles.vaultTitle}>{pageTwo.vaultTitle}</Text>
          <Text style={styles.issueLine}>
            {`ISSUE NO. ${pageTwo.issueSerial} // STATUS: ${pageTwo.status}`}
          </Text>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Wardrobe Asset Receipt</Text>
          {pageTwo.ledgerAssets.map((asset) => (
            <Text key={asset} style={styles.ledgerItem}>
              {asset}
            </Text>
          ))}
          <Text style={styles.fieldLabel}>Ledger Logged</Text>
          <Text style={styles.ledgerTimestamp}>
            LEDGER LOGGED: {pageTwo.ledgerTimestamp}
          </Text>
        </View>

        <View style={styles.synergySection}>
          <Text style={styles.sectionLabel}>{pageTwo.synergySectionTitle}</Text>
          <Text style={styles.synergyStat}>{pageTwo.synergyStat}</Text>

          <View style={styles.qrFrame}>
            <View style={styles.qrGrid}>
              <Text style={styles.qrPlaceholder}>QR</Text>
            </View>
            <Text style={styles.qrSubtext}>{pageTwo.qrSubtext}</Text>
          </View>
        </View>

        <Text style={styles.footerQuote}>&ldquo;{pageTwo.closingQuote}&rdquo;</Text>
      </Page>
    </Document>
  );
}
