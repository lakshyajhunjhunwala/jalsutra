import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split into lines for structured archival reading
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let tableLines: string[] = [];
  let inTable = false;

  const flushTable = (key: number) => {
    if (tableLines.length === 0) return null;
    const headerRow = tableLines[0];
    const dataRows = tableLines.slice(2); // Skip separator row

    const headers = headerRow
      .split('|')
      .map(c => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    const rows = dataRows.map(row =>
      row
        .split('|')
        .map(c => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
    );

    tableLines = [];
    inTable = false;

    return (
      <div key={`table-${key}`} className="my-6 overflow-x-auto border border-[#E0D8CB] rounded bg-[#FAF7F0] shadow-2xs">
        <table className="min-w-full divide-y divide-[#E0D8CB] text-xs sm:text-sm">
          <thead className="bg-[#EFE9DC]">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-left font-serif font-semibold text-[#3D332A] uppercase tracking-wider">
                  {formatInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE4D7] bg-[#FDFBF7]">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-[#FCFAF5]' : 'bg-[#FAF6EE]'}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-2 text-[#4A4036] align-top">
                    {formatInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const formatInline = (text: string): React.ReactNode => {
    // Highlight Evidence Tags
    if (text.includes('[CONFIRMED HISTORICAL EVIDENCE]')) {
      const parts = text.split('[CONFIRMED HISTORICAL EVIDENCE]');
      return (
        <span>
          {parts[0]}
          <span className="font-semibold text-[#1F5435] bg-[#EAF5EE] px-1.5 py-0.5 rounded text-xs border border-[#C5E5D1]">
            ✓ CONFIRMED HISTORICAL EVIDENCE
          </span>
          {parts[1]}
        </span>
      );
    }
    if (text.includes('[ARCHAEOLOGICAL EVIDENCE]')) {
      const parts = text.split('[ARCHAEOLOGICAL EVIDENCE]');
      return (
        <span>
          {parts[0]}
          <span className="font-semibold text-[#7D3C1B] bg-[#FAEDE8] px-1.5 py-0.5 rounded text-xs border border-[#F2D1C4]">
            ARCHAEOLOGICAL EVIDENCE
          </span>
          {parts[1]}
        </span>
      );
    }
    if (text.includes('[REASONABLE ENGINEERING INFERENCE]') || text.includes('[SCHOLARLY INTERPRETATION]')) {
      return (
        <span className="text-[#32527B] italic">
          {text}
        </span>
      );
    }

    // Bold text
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={match.index} className="font-semibold text-[#251F19]">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Table detection
    if (line.startsWith('|') && line.endsWith('|')) {
      inTable = true;
      tableLines.push(line);
      continue;
    } else if (inTable) {
      elements.push(flushTable(i));
    }

    if (!line) {
      elements.push(<div key={`blank-${i}`} className="h-3" />);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-lg font-serif font-bold text-[#3B3026] mt-5 mb-2 border-b border-[#EAE3D5] pb-1">
          {formatInline(line.replace('### ', ''))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-xl font-serif font-bold text-[#2B231C] mt-6 mb-3 border-b-2 border-[#D8CEBC] pb-1.5">
          {formatInline(line.replace('## ', ''))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-2xl font-serif font-bold text-[#1F1914] mt-6 mb-4">
          {formatInline(line.replace('# ', ''))}
        </h1>
      );
      continue;
    }

    // Callout boxes for reconstruction
    if (line.startsWith('DOCUMENTED:')) {
      elements.push(
        <div key={i} className="p-3 my-2 bg-[#F2F7F2] border-l-3 border-[#2E6B47] text-sm text-[#1B422B] rounded-r">
          <strong className="block text-xs uppercase tracking-wider font-sans text-[#2E6B47] mb-1">
            Archaeological & Inscriptional Documentation
          </strong>
          {formatInline(line.replace('DOCUMENTED:', '').trim())}
        </div>
      );
      continue;
    }
    if (line.startsWith('INFERRED:')) {
      elements.push(
        <div key={i} className="p-3 my-2 bg-[#F3F6FA] border-l-3 border-[#3B6699] text-sm text-[#233F61] rounded-r">
          <strong className="block text-xs uppercase tracking-wider font-sans text-[#3B6699] mb-1">
            Civil Engineering Deduction & Hydrostatic Inference
          </strong>
          {formatInline(line.replace('INFERRED:', '').trim())}
        </div>
      );
      continue;
    }
    if (line.startsWith('HYPOTHETICAL:')) {
      elements.push(
        <div key={i} className="p-3 my-2 bg-[#FDF6F0] border-l-3 border-[#A4572E] text-sm text-[#663519] rounded-r">
          <strong className="block text-xs uppercase tracking-wider font-sans text-[#A4572E] mb-1">
            Hypothetical / Conjectural Reconstruction
          </strong>
          {formatInline(line.replace('HYPOTHETICAL:', '').trim())}
        </div>
      );
      continue;
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={i} className="ml-4 list-disc text-sm text-[#3E352B] leading-relaxed my-1">
          {formatInline(line.substring(2))}
        </li>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      elements.push(
        <div key={i} className="flex gap-2 text-sm text-[#3E352B] leading-relaxed my-1.5">
          <span className="font-mono text-xs font-semibold text-[#8B3A1C] pt-0.5">
            {line.match(/^\d+\./)?.[0]}
          </span>
          <span className="flex-1">
            {formatInline(line.replace(/^\d+\.\s*/, ''))}
          </span>
        </div>
      );
      continue;
    }

    // Standard Paragraph
    elements.push(
      <p key={i} className="text-sm sm:text-base text-[#3A3127] leading-relaxed my-2">
        {formatInline(line)}
      </p>
    );
  }

  if (inTable) {
    elements.push(flushTable(lines.length));
  }

  return <div className="space-y-1">{elements}</div>;
};
