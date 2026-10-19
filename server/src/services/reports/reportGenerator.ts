import PDFDocument from 'pdfkit';
import { Sample, AnalysisRun, RegulatoryStandard, SubIndexTrace } from '@metalsense/shared';

export interface ReportItem {
  sample: Sample;
  analysis?: AnalysisRun;
}

export interface ReportOptions {
  workspaceName: string;
  reportId?: string;
  standard?: RegulatoryStandard;
  generatedBy?: string;
}

/**
 * Generates an RFC-4180 compliant CSV matrix of samples, monitored metals, and calculated pollution indices.
 */
export function generateWorkspaceCsv(items: ReportItem[]): string {
  const headers = [
    'Sample ID',
    'Sample Code',
    'Sample Matrix',
    'Collection Date',
    'Location Name',
    'District',
    'State',
    'Latitude',
    'Longitude',
    'Laboratory Name',
    'HPI Value',
    'HPI Classification',
    'HEI Value',
    'HEI Classification',
    'Cd Value',
    'Cd Classification',
    'Standard Code',
    'Standard Citation',
    'LOD Strategy',
    'Evaluated Metals Count',
    'Analyte Measurements (Symbol:mg/L)',
  ];

  const rows = items.map(({ sample, analysis }) => {
    const coords = sample.location.coordinates;
    const lat = coords?.latitude ?? '';
    const lng = coords?.longitude ?? '';
    const measurementsStr = sample.measurements
      .map((m) => `${m.symbol}:${m.value}${m.qualifier === '<' ? '(<LOD)' : ''}`)
      .join('; ');

    return [
      `"${sample.id}"`,
      `"${sample.sampleCode}"`,
      `"${sample.sampleMatrix}"`,
      `"${sample.collectionDate}"`,
      `"${sample.location.name.replace(/"/g, '""')}"`,
      `"${(sample.location.district || '').replace(/"/g, '""')}"`,
      `"${(sample.location.state || '').replace(/"/g, '""')}"`,
      lat,
      lng,
      `"${(sample.laboratory?.name || '').replace(/"/g, '""')}"`,
      analysis ? analysis.hpi.value.toFixed(2) : '',
      analysis ? `"${analysis.hpi.classification}"` : '',
      analysis ? analysis.hei.value.toFixed(2) : '',
      analysis ? `"${analysis.hei.classification}"` : '',
      analysis ? analysis.cd.value.toFixed(2) : '',
      analysis ? `"${analysis.cd.classification}"` : '',
      analysis ? `"${analysis.standardUsed.code}"` : '',
      analysis ? `"${analysis.standardUsed.citation}"` : '',
      analysis ? `"${analysis.lodStrategy}"` : '',
      sample.measurements.length,
      `"${measurementsStr}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generates an auditable, high-resolution PDF compliance dossier using PDFKit.
 * Preserves mathematical traces, weights, regulatory citations, and scientific disclaimers.
 */
export async function generateAuditPdf(
  items: ReportItem[],
  options: ReportOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `MetalSense Report — ${options.workspaceName}`,
          Author: 'MetalSense Environmental Intelligence SaaS',
          Subject: 'Heavy Metal Pollution Audit Dossier',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));

      // Header Banner
      doc
        .rect(40, 40, 515, 65)
        .fill('#0f172a'); // Navy background

      doc
        .fillColor('#14b8a6')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('METALSENSE ENVIRONMENTAL INTELLIGENCE', 55, 52);

      doc
        .fillColor('#ffffff')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Heavy Metal Pollution Assessment Dossier', 55, 67);

      doc
        .fillColor('#94a3b8')
        .fontSize(8)
        .font('Helvetica')
        .text('Deterministic Numerical Audit • Legal Traceability & Scientific Rigor', 55, 87);

      let y = 120;

      // Metadata Grid
      doc
        .fillColor('#0f172a')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('DOSSIER METADATA', 40, y);

      y += 15;
      doc
        .rect(40, y, 515, 42)
        .fill('#f8fafc')
        .stroke('#cbd5e1');

      doc
        .fillColor('#475569')
        .fontSize(8)
        .font('Helvetica')
        .text(`Workspace: ${options.workspaceName}`, 50, y + 8)
        .text(`Report ID: ${options.reportId || 'MS-REP-' + Date.now().toString(36).toUpperCase()}`, 50, y + 22)
        .text(`Generated: ${new Date().toUTCString()}`, 280, y + 8)
        .text(`Calculation Standard: ${options.standard?.title || 'IS 10500:2012 Drinking Water Specification'}`, 280, y + 22);

      y += 55;

      // Executive Summary Table
      doc
        .fillColor('#0f172a')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('EXECUTIVE SAMPLES & POLLUTION INDICES SUMMARY', 40, y);

      y += 15;

      // Table Header
      doc
        .rect(40, y, 515, 20)
        .fill('#0284c7'); // Cyan header

      doc
        .fillColor('#ffffff')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('Sample Code', 45, y + 6)
        .text('Monitoring Station', 125, y + 6)
        .text('HPI Index', 270, y + 6)
        .text('HEI Index', 335, y + 6)
        .text('Cd Index', 400, y + 6)
        .text('Status', 465, y + 6);

      y += 20;

      items.forEach((item, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f1f5f9';
        doc.rect(40, y, 515, 18).fill(bg);

        const a = item.analysis;
        const hpiVal = a ? a.hpi.value.toFixed(1) : '—';
        const heiVal = a ? a.hei.value.toFixed(2) : '—';
        const cdVal = a ? a.cd.value.toFixed(2) : '—';
        const status = a ? a.hpi.classification.toUpperCase() : 'PENDING';

        const statusColor =
          status === 'HIGH' || status === 'CRITICAL'
            ? '#e11d48'
            : status === 'MEDIUM' || status === 'MODERATE'
            ? '#d97706'
            : '#059669';

        doc
          .fillColor('#0f172a')
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text(item.sample.sampleCode, 45, y + 5)
          .font('Helvetica')
          .text(item.sample.location.name.substring(0, 26), 125, y + 5)
          .text(hpiVal, 270, y + 5)
          .text(heiVal, 335, y + 5)
          .text(cdVal, 400, y + 5)
          .fillColor(statusColor)
          .font('Helvetica-Bold')
          .text(status, 465, y + 5);

        y += 18;
      });

      y += 15;

      // Per-sample Detailed Trace Breakdown
      items.forEach((item) => {
        if (y > 680) {
          doc.addPage();
          y = 40;
        }

        doc
          .fillColor('#0f172a')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(`SAMPLE TRACE DOSSIER: ${item.sample.sampleCode} (${item.sample.location.name})`, 40, y);

        y += 14;

        if (item.analysis && item.analysis.hpi.traces) {
          // Trace table
          doc
            .rect(40, y, 515, 16)
            .fill('#334155');

          doc
            .fillColor('#ffffff')
            .fontSize(7)
            .font('Helvetica-Bold')
            .text('Metal', 45, y + 4)
            .text('Monitored (mg/L)', 90, y + 4)
            .text('Permissible Si', 170, y + 4)
            .text('Acceptable Ii', 245, y + 4)
            .text('Unit Weight Wi', 315, y + 4)
            .text('Sub-index Qi', 390, y + 4)
            .text('Weighted (Wi * Qi)', 460, y + 4);

          y += 16;

          item.analysis.hpi.traces.forEach((row: SubIndexTrace, rIdx: number) => {
            const rowBg = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
            doc.rect(40, y, 515, 14).fill(rowBg);

            doc
              .fillColor('#0f172a')
              .fontSize(7)
              .font('Helvetica-Bold')
              .text(row.symbol, 45, y + 3)
              .font('Helvetica')
              .text(row.monitoredConcentration.toFixed(4), 90, y + 3)
              .text(row.permissibleLimit.toFixed(4), 170, y + 3)
              .text(row.acceptableLimit.toFixed(4), 245, y + 3)
              .text(row.unitWeight.toFixed(4), 315, y + 3)
              .text(row.subIndex.toFixed(2), 390, y + 3)
              .text(row.weightedSubIndex.toFixed(4), 460, y + 3);

            y += 14;
          });

          y += 6;
          doc
            .fillColor('#475569')
            .fontSize(7)
            .font('Helvetica-Oblique')
            .text(
              `Index Trace: Sum(Wi) = ${item.analysis.hpi.sumWi.toFixed(4)} | Sum(Wi*Qi) = ${item.analysis.hpi.sumWiQi.toFixed(4)} | Calculated HPI = ${item.analysis.hpi.value.toFixed(2)} [Classification: ${item.analysis.hpi.classification.toUpperCase()}]`,
              45,
              y
            );

          y += 16;
        }
      });

      // Scientific Integrity & Regulatory Disclaimer footer
      if (y > 700) {
        doc.addPage();
        y = 40;
      }

      y += 10;
      doc
        .rect(40, y, 515, 60)
        .fill('#f8fafc')
        .stroke('#e2e8f0');

      doc
        .fillColor('#0f172a')
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text('SCIENTIFIC INTEGRITY & REGULATORY AUDIT STATEMENTS', 50, y + 8);

      doc
        .fillColor('#64748b')
        .fontSize(6.5)
        .font('Helvetica')
        .text(
          '1. Deterministic Calculation Guarantee: All indices (HPI, HEI, Cd) are evaluated using pure, versioned functions strictly per published scientific methodologies (Mohan et al., 1996; Edet & Offiong, 2002; Backman et al., 1998). No non-deterministic neural networks or generative AI are involved in numerical calculations.',
          50,
          y + 20,
          { width: 495 }
        )
        .text(
          '2. Traceability & Detection Limit: Analytes flagged below LOD are substituted per EPA 0.5x LOD method. MetalSense reports are technical analytical dossiers and do not constitute certified statutory water-potability licenses without certified accredited laboratory verification.',
          50,
          y + 38,
          { width: 495 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
