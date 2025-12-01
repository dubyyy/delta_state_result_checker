import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { drawPDFHeader } from '@/lib/pdf-header';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pinCode = searchParams.get('pinCode');
    const serialNumber = searchParams.get('serial');
    const examinationNumber = searchParams.get('examNumber');

    // Validate required fields
    if (!pinCode || !examinationNumber) {
      return NextResponse.json(
        { error: 'Access Pin and Examination Number are required.' },
        { status: 400 }
      );
    }

    // Query database
    const result = await prisma.result.findFirst({
      where: {
        accessPin: pinCode,
        examinationNo: examinationNumber,
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: 'No result found with the provided credentials.' },
        { status: 404 }
      );
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    
    // Load fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Helper function - center text
    const center = (txt: string, size: number, y: number, f = font) => {
      const w = f.widthOfTextAtSize(txt, size);
      page.drawText(txt, { x: (width - w) / 2, y, size, font: f, color: rgb(0, 0, 0) });
    };

    // Parse school and LGA information
    const schoolName = result.schoolName || '';
    const lgaName = result.lgaCd || '';
    
    // Try to extract school code and LGA code from examination number or use defaults
    let lgaCode = '1';
    let schoolCode = '1';
    
    // If we can extract codes from the examination number (e.g., format: LGACODE-SCHOOLCODE-NUMBER)
    if (result.examinationNo) {
      const parts = result.examinationNo.split('-');
      if (parts.length >= 2) {
        lgaCode = parts[0] || '1';
        schoolCode = parts[1] || '1';
      }
    }

    // Draw outer border
    const margin = 30;
    page.drawRectangle({
      x: margin,
      y: margin,
      width: width - 2 * margin,
      height: height - 2 * margin,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });

    // Draw standardized header
    const contentStartY = drawPDFHeader(page, bold, font, {
      lgaCode,
      lgaName: lgaName.toUpperCase().replace(/\s+/g, '-'),
      schoolCode,
      schoolName: schoolName.toUpperCase(),
      year: result.sessionYr,
    });

    // Draw data table header (like in the image)
    const tableHeaderY = contentStartY - 20;
    const colExamNo = 50;
    const colNames = 150;
    const colSex = 500;
    
    // Table header background
    page.drawRectangle({
      x: colExamNo - 5,
      y: tableHeaderY - 5,
      width: width - 2 * margin - 40,
      height: 25,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    
    // Table headers
    page.drawText('EXAMINATION NO.', { x: colExamNo, y: tableHeaderY + 3, size: 9, font: bold });
    page.drawText('NAMES', { x: colNames, y: tableHeaderY + 3, size: 9, font: bold });
    page.drawText('SEX', { x: colSex, y: tableHeaderY + 3, size: 9, font: bold });
    
    // Student data row
    const dataRowY = tableHeaderY - 30;
    page.drawRectangle({
      x: colExamNo - 5,
      y: dataRowY - 5,
      width: width - 2 * margin - 40,
      height: 25,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    
    const candidateName = [result.fName, result.mName, result.lName]
      .filter(Boolean)
      .join(' ');
    
    page.drawText(result.examinationNo || '', { x: colExamNo, y: dataRowY + 3, size: 9, font });
    page.drawText(candidateName, { x: colNames, y: dataRowY + 3, size: 9, font });
    page.drawText(result.sexCd || '', { x: colSex, y: dataRowY + 3, size: 9, font });

    // Passport photo (top-left corner)
    const photoSize = 110;
    const photoX = margin + 5;
    const photoY = height - margin - photoSize - 5;
    
    // Draw border for passport photo
    page.drawRectangle({
      x: photoX - 4,
      y: photoY - 4,
      width: photoSize + 8,
      height: photoSize + 8,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.5,
    });
    
    // Add placeholder for passport - you can replace this with actual candidate photo later
    page.drawRectangle({
      x: photoX,
      y: photoY,
      width: photoSize,
      height: photoSize,
      color: rgb(0.9, 0.9, 0.9),
    });
    
    // Add "PHOTO" text in the placeholder
    page.drawText("PHOTO", {
      x: photoX + 30,
      y: photoY + photoSize / 2,
      size: 14,
      font: bold,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Additional candidate info below table
    const infoY = dataRowY - 50;
    const leftX = 50;
    const lineH = 18;

    const info = [
      `Year: ${result.sessionYr || 'N/A'}`,
      `School: ${result.schoolName || 'N/A'}`,
      `Local Government Area: ${result.lgaCd || 'N/A'}`,
    ];

    info.forEach((text, index) => {
      const y = infoY - index * lineH;
      page.drawText(text, { x: leftX, y, size: 10, font });
    });

    // Separator line
    const separatorY = infoY - info.length * lineH - 10;
    page.drawLine({
      start: { x: 40, y: separatorY },
      end: { x: width - 40, y: separatorY },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Subject table
    const tableTop = separatorY - 30;
    const col1 = 50;
    const col2 = 400;
    const rowH = 20;

    // Header
    page.drawText("Subject(s)", { x: col1, y: tableTop, size: 11, font: bold });
    page.drawText("Grade", { x: col2, y: tableTop, size: 11, font: bold });
    page.drawLine({
      start: { x: col1, y: tableTop - 8 },
      end: { x: width - 40, y: tableTop - 8 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Rows
    const subjects: [string, string | null][] = [
      ["ENGLISH STUDIES", result.engGrd],
      ["MATHEMATICS", result.aritGrd],
      ["GENERAL PAPER", result.gpGrd],
      ["RELIGIOUS STUDIES", result.rgsGrd],
    ];

    subjects.forEach(([subj, grade], i) => {
      const y = tableTop - 30 - i * rowH;
      page.drawText(subj, { x: col1, y, size: 10, font });

      const gradeStr = grade || 'N/A';
      const gradeColor = gradeStr === "A" ? rgb(0, 0.5, 0) : rgb(0.8, 0.4, 0);
      page.drawText(gradeStr, { x: col2 + 5, y, size: 11, font: bold, color: gradeColor });

      // Faint row line
      page.drawLine({
        start: { x: col1, y: y - 5 },
        end: { x: width - 40, y: y - 5 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      });
    });

    // Remark
    if (result.remark) {
      const remarkY = tableTop - 30 - subjects.length * rowH - 30;
      page.drawText("Remark:", { x: col1, y: remarkY, size: 11, font: bold });
      
      // Yellow highlight background
      const remarkTextX = col1 + 80;
      const remarkTextWidth = bold.widthOfTextAtSize(result.remark, 11);
      page.drawRectangle({
        x: remarkTextX - 2,
        y: remarkY - 3,
        width: remarkTextWidth + 4,
        height: 16,
        color: rgb(1, 1, 0.7),
      });
      
      page.drawText(result.remark, {
        x: remarkTextX,
        y: remarkY,
        size: 11,
        font: bold,
        color: rgb(0, 0, 0),
      });
    }

    // Footer + signature
    const footerY = 70;
    page.drawLine({
      start: { x: 40, y: footerY + 15 },
      end: { x: width - 40, y: footerY + 15 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    const footerText = "DELTA STATE MINISTRY OF PRIMARY EDUCATION PORTAL - Powered by Vennad Limited";
    page.drawText(footerText, {
      x: 40,
      y: footerY,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Signature
    page.drawText("_________________________", { x: width - 220, y: footerY, size: 10, font });
    page.drawText("Authorized Signature", { 
      x: width - 220, 
      y: footerY - 15, 
      size: 9, 
      font, 
      color: rgb(0.3, 0.3, 0.3) 
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Result_${result.examinationNo}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
