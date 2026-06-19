"use no memo";

import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ResolvedStyleGuide } from "@/types/style-guide";

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
    borderTopWidth: 1,
    borderTopColor: palette.rule,
    paddingTop: 10,
    paddingBottom: 2,
    gap: 2,
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
  certPage: {
    backgroundColor: "#0A0A0A",
    color: "#FFFFFF",
    padding: 28,
    fontFamily: "Helvetica",
  },
  certFrame: {
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    minHeight: "100%",
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 26,
    justifyContent: "space-between",
  },
  certCrosshair: {
    position: "absolute",
    fontSize: 7,
    color: "rgba(255,255,255,0.35)",
    fontFamily: "Courier",
  },
  certHeader: {
    alignItems: "center",
    marginBottom: 18,
  },
  certTitle: {
    fontFamily: "Times-Roman",
    fontSize: 13,
    letterSpacing: 3.2,
    textTransform: "uppercase",
    color: "#FFFFFF",
    textAlign: "center",
  },
  certSubtitle: {
    marginTop: 8,
    fontSize: 6,
    letterSpacing: 2.6,
    textTransform: "uppercase",
    color: "#737373",
    textAlign: "center",
  },
  certDivider: {
    marginTop: 12,
    width: 72,
    height: 1,
    backgroundColor: "#262626",
    alignSelf: "center",
  },
  certOwnershipBlock: {
    alignItems: "center",
    marginBottom: 16,
  },
  certOwnershipEyebrow: {
    fontSize: 5.5,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#737373",
    textAlign: "center",
  },
  certHolder: {
    marginTop: 10,
    fontFamily: "Times-Roman",
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#FFFFFF",
    textAlign: "center",
  },
  certSerial: {
    marginTop: 8,
    fontSize: 5.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#A3A3A3",
    textAlign: "center",
  },
  certAssetBlock: {
    alignItems: "center",
    marginBottom: 16,
  },
  certAssetItem: {
    fontSize: 6.5,
    letterSpacing: 0.6,
    color: "#D4D4D4",
    textAlign: "center",
    marginBottom: 4,
  },
  certLedger: {
    marginTop: 8,
    fontSize: 5.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#737373",
    textAlign: "center",
  },
  certColumns: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  certColumn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#262626",
    backgroundColor: "#0D0D0D",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 108,
  },
  certQrBox: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderColor: "#525252",
    backgroundColor: "#0A0A0A",
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  certQrLabel: {
    fontSize: 4.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#737373",
    textAlign: "center",
    lineHeight: 1.45,
  },
  certEmblemOuter: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  certEmblemMid: {
    position: "absolute",
    width: 52,
    height: 52,
    borderWidth: 1,
    borderColor: "#404040",
    borderRadius: 26,
  },
  certEmblemInner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 20,
    backgroundColor: "#111111",
  },
  certEmblemLabel: {
    fontSize: 4.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#D4D4D4",
    textAlign: "center",
  },
  certEmblemSignature: {
    marginTop: 3,
    fontSize: 4,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#525252",
    textAlign: "center",
  },
  certFooterQuote: {
    borderTopWidth: 1,
    borderTopColor: "#262626",
    paddingTop: 10,
    fontSize: 5,
    letterSpacing: 1.4,
    color: "#525252",
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
  return (
    <View style={styles.itemBlock}>
      <Text style={styles.fieldLabel}>Item Type</Text>
      <Text style={styles.itemType}>{item.itemType}</Text>

      <Text style={styles.fieldLabel}>Brand &amp; Model</Text>
      <Text style={styles.fieldValue}>{item.brandModel}</Text>

      <Text style={styles.fieldLabel}>Action</Text>
      <Link style={styles.shopLink} src={item.shopUrl}>
        Shop Source →
      </Link>

      <Text style={styles.fieldLabel}>Pro-Proportion Tip</Text>
      <Text style={styles.fieldValue}>{item.proportionTip}</Text>

      <Text style={styles.fieldLabel}>Budget Alternative</Text>
      <Text style={styles.fieldValue}>{item.budgetAlternative}</Text>
    </View>
  );
}

function CertificatePage({ guide }: { guide: ResolvedStyleGuide }) {
  const { pageTwo } = guide;

  return (
    <Page size="A4" style={styles.certPage}>
      <View style={styles.certFrame}>
        <Text style={[styles.certCrosshair, { top: 6, left: 8 }]}>+</Text>
        <Text style={[styles.certCrosshair, { top: 6, right: 8 }]}>+</Text>
        <Text style={[styles.certCrosshair, { bottom: 6, left: 8 }]}>+</Text>
        <Text style={[styles.certCrosshair, { bottom: 6, right: 8 }]}>+</Text>

        <View>
          <View style={styles.certHeader}>
            <Text style={styles.certTitle}>{pageTwo.certificateTitle}</Text>
            <Text style={styles.certSubtitle}>{pageTwo.certificateSubtitle}</Text>
            <View style={styles.certDivider} />
          </View>

          <View style={styles.certOwnershipBlock}>
            <Text style={styles.certOwnershipEyebrow}>
              This official digital asset is proudly issued and registered to:
            </Text>
            <Text style={styles.certHolder}>HOLDER: {pageTwo.holderName}</Text>
            <Text style={styles.certSerial}>
              {`SERIAL REGISTER NO: ${pageTwo.serialRegisterLine} // STATUS: ${pageTwo.status}`}
            </Text>
          </View>

          <View style={styles.certAssetBlock}>
            {pageTwo.assetReceiptItems.map((asset) => (
              <Text key={asset} style={styles.certAssetItem}>
                • {asset}
              </Text>
            ))}
            <Text style={styles.certLedger}>
              {`LOGGED ON THE BLOCKCHAIN/LEDGER: ${pageTwo.ledgerTimestamp}`}
            </Text>
          </View>

          <View style={styles.certColumns}>
            <View style={styles.certColumn}>
              <View style={styles.certQrBox}>
                <Text style={styles.qrPlaceholder}>QR</Text>
              </View>
              <Text style={styles.certQrLabel}>{pageTwo.qrColumnLabel}</Text>
            </View>

            <View style={styles.certColumn}>
              <View style={styles.certEmblemOuter}>
                <View style={styles.certEmblemMid} />
                <View style={styles.certEmblemInner} />
                <View>
                  <Text style={styles.certEmblemLabel}>{pageTwo.emblemLabel}</Text>
                  <Text style={styles.certEmblemSignature}>
                    {pageTwo.curatorSignature}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.certFooterQuote}>
          &ldquo;{pageTwo.closingQuote}&rdquo;
        </Text>
      </View>
    </Page>
  );
}

export function createGuideDocument({ guide }: GuideTemplateProps) {
  const { pageOne } = guide;

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

      <CertificatePage guide={guide} />
    </Document>
  );
}
