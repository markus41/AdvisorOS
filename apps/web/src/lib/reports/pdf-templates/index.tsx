import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { ReportTemplate } from '../templates';
import { DataSource } from '../report-service';

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7.woff2', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 54,
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerText: {
    fontSize: 12,
    color: '#374151',
  },
  logo: {
    width: 120,
    height: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  text: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 1.5,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 10,
    marginBottom: 20,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    fontWeight: 'bold',
  },
  tableCell: {
    margin: 'auto',
    padding: 6,
    fontSize: 9,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 54,
    right: 54,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  kpiCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    width: '48%',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  kpiLabel: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  chartPlaceholder: {
    backgroundColor: '#f9fafb',
    border: '1px solid #d1d5db',
    padding: 40,
    textAlign: 'center',
    marginVertical: 15,
  },
  financialStatement: {
    marginVertical: 15,
  },
  statementHeader: {
    backgroundColor: '#1e40af',
    color: 'white',
    padding: 8,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statementRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  statementAccount: {
    flex: 2,
    fontSize: 9,
  },
  statementAmount: {
    flex: 1,
    textAlign: 'right',
    fontSize: 9,
  },
  totalRow: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
});

interface PDFReportProps {
  template: ReportTemplate;
  dataSources: Record<string, DataSource>;
  request: any;
}

export const PDFReport: React.FC<PDFReportProps> = ({ template, dataSources, request }) => {
  const renderSection = (section: any) => {
    const data = dataSources[section.dataSource]?.data || [];

    switch (section.type) {
      case 'narrative':
        return (
          <View key={section.id}>
            <Text style={styles.sectionTitle}>{section.name}</Text>
            <Text style={styles.text}>
              {section.config.aiGenerated
                ? generateNarrative(section, data)
                : 'Narrative content would be generated here based on the data and AI insights.'
              }
            </Text>
          </View>
        );

      case 'table':
        return (
          <View key={section.id}>
            <Text style={styles.sectionTitle}>{section.name}</Text>
            {renderTable(data)}
          </View>
        );

      case 'financial_statement':
        return (
          <View key={section.id}>
            <Text style={styles.sectionTitle}>{section.name}</Text>
            {renderFinancialStatement(data, section.config)}
          </View>
        );

      case 'chart':
        return (
          <View key={section.id}>
            <Text style={styles.sectionTitle}>{section.name}</Text>
            <View style={styles.chartPlaceholder}>
              <Text>Chart: {section.name}</Text>
              <Text style={{ fontSize: 8, marginTop: 4 }}>
                Chart visualization would be rendered here
              </Text>
            </View>
          </View>
        );

      default:
        return (
          <View key={section.id}>
            <Text style={styles.sectionTitle}>{section.name}</Text>
            <Text style={styles.text}>Section content for {section.name}</Text>
          </View>
        );
    }
  };

  const renderTable = (data: any[]) => {
    if (data.length === 0) {
      return <Text style={styles.text}>No data available</Text>;
    }

    const headers = Object.keys(data[0]);

    return (
      <View style={styles.table}>
        {/* Header row */}
        <View style={styles.tableRow}>
          {headers.map((header, index) => (
            <View key={index} style={[styles.tableCell, styles.tableHeader]}>
              <Text>{header.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
          ))}
        </View>

        {/* Data rows */}
        {data.slice(0, 20).map((row, rowIndex) => (
          <View key={rowIndex} style={styles.tableRow}>
            {headers.map((header, cellIndex) => (
              <View key={cellIndex} style={styles.tableCell}>
                <Text>{formatCellValue(row[header])}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderFinancialStatement = (data: any[], config: any) => {
    return (
      <View style={styles.financialStatement}>
        <View style={styles.statementHeader}>
          <Text>{config.statementType?.replace(/_/g, ' ').toUpperCase() || 'FINANCIAL STATEMENT'}</Text>
        </View>

        {data.map((item, index) => (
          <View
            key={index}
            style={[
              styles.statementRow,
              item.isTotal && styles.totalRow
            ]}
          >
            <Text style={styles.statementAccount}>{item.account || item.description}</Text>
            <Text style={styles.statementAmount}>
              {formatCurrency(item.amount || item.value)}
            </Text>
            {config.includeComparisons && (
              <Text style={styles.statementAmount}>
                {formatCurrency(item.previousAmount || item.previousValue)}
              </Text>
            )}
            {config.showVariance && (
              <Text style={styles.statementAmount}>
                {formatPercentage((item.variance || 0) * 100)}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      if (value > 1000000 || value < -1000000) {
        return formatCurrency(value);
      }
      return value.toLocaleString();
    }
    return String(value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const generateNarrative = (section: any, data: any[]) => {
    // Simple narrative generation based on section type
    switch (section.id) {
      case 'executive-summary':
        return `This executive summary provides an overview of the financial performance and key metrics for the reporting period. Based on the analysis of the financial data, the organization demonstrates strong performance in key areas with opportunities for continued growth and optimization.`;

      case 'management-commentary':
        return `Management notes that the current financial position reflects strategic investments in growth initiatives. The organization continues to focus on operational efficiency while maintaining strong cash flow management and debt service capabilities.`;

      default:
        return `Analysis for ${section.name} shows positive trends and performance indicators that align with organizational objectives and industry benchmarks.`;
    }
  };

  return (
    <Document>
      {/* Cover Page */}
      {template.layout.coverPage?.enabled && (
        <Page size={template.layout.pageSize} style={styles.page}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={[styles.title, { fontSize: 32, textAlign: 'center' }]}>
              {request.name}
            </Text>
            <Text style={[styles.subtitle, { fontSize: 18, textAlign: 'center', marginTop: 20 }]}>
              {template.description}
            </Text>
            <Text style={[styles.text, { fontSize: 12, textAlign: 'center', marginTop: 40 }]}>
              Generated on {new Date().toLocaleDateString()}
            </Text>
          </View>
        </Page>
      )}

      {/* Table of Contents */}
      {template.layout.tableOfContents?.enabled && (
        <Page size={template.layout.pageSize} style={styles.page}>
          <Text style={styles.title}>Table of Contents</Text>
          {template.sections.map((section, index) => (
            <View key={section.id} style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Text style={styles.text}>{section.name}</Text>
              <View style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: '#d1d5db', marginHorizontal: 10, marginBottom: 2 }} />
              <Text style={styles.text}>{index + 3}</Text>
            </View>
          ))}
        </Page>
      )}

      {/* Content Pages */}
      <Page size={template.layout.pageSize} style={styles.page}>
        {template.layout.header?.enabled && (
          <View style={styles.header}>
            <Text style={styles.headerText}>
              {template.layout.header.content
                .replace('{{client.businessName}}', request.clientNames?.[0] || 'Client')
                .replace('{{reportDate}}', new Date().toLocaleDateString())
              }
            </Text>
            {request.branding?.logo && (
              <Image style={styles.logo} src={request.branding.logo} />
            )}
          </View>
        )}

        <Text style={styles.title}>{request.name}</Text>
        <Text style={styles.subtitle}>{template.description}</Text>

        {template.sections
          .filter(section => section.required || dataSources[section.dataSource]?.data?.length > 0)
          .sort((a, b) => a.order - b.order)
          .map(renderSection)}

        {template.layout.footer?.enabled && (
          <Text style={styles.footer}>
            {template.layout.footer.content
              .replace('{{pageNumber}}', '1')
              .replace('{{totalPages}}', '1')
            }
          </Text>
        )}
      </Page>
    </Document>
  );
};

export const createPDFReport = (
  template: ReportTemplate,
  dataSources: Record<string, DataSource>,
  request: any
) => {
  return <PDFReport template={template} dataSources={dataSources} request={request} />;
};