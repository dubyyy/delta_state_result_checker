import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

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

    // Query database - Type assertion due to Prisma client being out of sync with schema
    const result: any = await prisma.result.findFirst({
      where: {
        accessPin: pinCode,
        examinationNo: examinationNumber,
      } as any,
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
    const centerText = (txt: string, size: number, y: number, f = font) => {
      const w = f.widthOfTextAtSize(txt, size);
      page.drawText(txt, { x: (width - w) / 2, y, size, font: f, color: rgb(0, 0, 0) });
    };

    // Draw outer border
    const margin = 40;
    page.drawRectangle({
      x: margin,
      y: margin,
      width: width - 2 * margin,
      height: height - 2 * margin,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });

    // Starting Y position
    let currentY = height - 60;

    // Header - FEDERAL REPUBLIC OF NIGERIA
    centerText('FEDERAL REPUBLIC OF NIGERIA', 12, currentY, bold);
    currentY -= 25;

    // Try to embed logo
    try {
      const logoPath = path.join(process.cwd(), 'public', 'delta-logo.png');
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const logoDims = logoImage.scale(0.15);
      
      page.drawImage(logoImage, {
        x: (width - logoDims.width) / 2,
        y: currentY - logoDims.height - 5,
        width: logoDims.width,
        height: logoDims.height,
      });
      currentY -= logoDims.height + 15;
    } catch (err) {
      console.error('Failed to load logo:', err);
      currentY -= 20;
    }

    // Ministry title
    centerText('MINISTRY OF PRIMARY EDUCATION ASABA,', 11, currentY, bold);
    currentY -= 15;
    centerText('Delta State.', 11, currentY, bold);
    currentY -= 15;
    centerText('Cognitive/Placement Certification Result', 10, currentY, font);
    currentY -= 25;

    // Dashed line separator
    for (let x = margin + 10; x < width - margin - 10; x += 10) {
      page.drawLine({
        start: { x, y: currentY },
        end: { x: x + 5, y: currentY },
        thickness: 1,
        color: rgb(0.6, 0.6, 0.6),
      });
    }
    currentY -= 20;

    // Helper function for drawing dashed lines
    const drawDashedLine = (y: number) => {
      for (let x = margin + 10; x < width - margin - 10; x += 10) {
        page.drawLine({
          start: { x, y },
          end: { x: x + 5, y },
          thickness: 0.8,
          color: rgb(0.7, 0.7, 0.7),
        });
      }
    };

    const leftMargin = margin + 15;
    const lineSpacing = 18;

    // Year and Date Printed (same line, left and right aligned)
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    page.drawText(`Year: `, { x: leftMargin, y: currentY, size: 9, font });
    page.drawText(`${result.sessionYr}`, { x: leftMargin + 30, y: currentY, size: 9, font: bold });
    
    const datePrintedText = `Date Printed: ${dateStr}`;
    const datePrintedWidth = font.widthOfTextAtSize(datePrintedText, 9);
    page.drawText(datePrintedText, { x: width - margin - 15 - datePrintedWidth, y: currentY, size: 9, font });
    currentY -= lineSpacing;
    
    drawDashedLine(currentY);
    currentY -= lineSpacing;

    // Candidate Name and Sex (same line)
    const candidateName = [result.fName, result.mName, result.lName]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();
    
    page.drawText(`Candidate Name: `, { x: leftMargin, y: currentY, size: 9, font });
    page.drawText(candidateName, { x: leftMargin + 95, y: currentY, size: 9, font: bold });
    
    page.drawText(`Sex: `, { x: width - margin - 80, y: currentY, size: 9, font });
    page.drawText(result.sexCd || 'N/A', { x: width - margin - 55, y: currentY, size: 9, font: bold });
    currentY -= lineSpacing;
    
    drawDashedLine(currentY);
    currentY -= lineSpacing;

    // School
    page.drawText(`School : `, { x: leftMargin, y: currentY, size: 9, font });
    page.drawText((result.schoolName || 'N/A').toUpperCase(), { x: leftMargin + 45, y: currentY, size: 9, font: bold });
    currentY -= lineSpacing;
    
    drawDashedLine(currentY);
    currentY -= lineSpacing;

    // Local Government Area
    page.drawText(`Local Government Area: `, { x: leftMargin, y: currentY, size: 9, font });
    page.drawText((result.lgaCd || 'N/A').toUpperCase(), { x: leftMargin + 130, y: currentY, size: 9, font: bold });
    currentY -= lineSpacing;
    
    drawDashedLine(currentY);
    currentY -= lineSpacing;

    // Examination Number
    page.drawText(`Examination Number: `, { x: leftMargin, y: currentY, size: 9, font });
    page.drawText(result.examinationNo, { x: leftMargin + 115, y: currentY, size: 9, font: bold });
    currentY -= lineSpacing;
    
    drawDashedLine(currentY);
    currentY -= 25;

    // Subject table
    const tableX = leftMargin;
    const tableWidth = width - 2 * margin - 30;
    const colWidth = tableWidth / 2;
    
    // Table header
    page.drawRectangle({
      x: tableX,
      y: currentY - 20,
      width: tableWidth,
      height: 20,
      borderColor: rgb(0.4, 0.4, 0.4),
      borderWidth: 1,
    });
    
    page.drawText('Subject(s)', { x: tableX + 10, y: currentY - 15, size: 9, font: bold });
    page.drawText('Grade', { x: tableX + colWidth + 10, y: currentY - 15, size: 9, font: bold });
    
    // Vertical line between columns
    page.drawLine({
      start: { x: tableX + colWidth, y: currentY },
      end: { x: tableX + colWidth, y: currentY - 20 },
      thickness: 1,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    currentY -= 20;

    // Subject rows
    const subjects: [string, string | null][] = [
      ["ENGLISH STUDIES", result.engGrd],
      ["MATHEMATICS", result.aritGrd],
      ["GENERAL PAPER", result.gpGrd],
      ["CHRISTIAN RELIGIOUS STUDIES", result.rgsGrd],
    ];

    subjects.forEach(([subject, grade], index) => {
      const rowHeight = 20;
      page.drawRectangle({
        x: tableX,
        y: currentY - rowHeight,
        width: tableWidth,
        height: rowHeight,
        borderColor: rgb(0.4, 0.4, 0.4),
        borderWidth: 1,
      });
      
      page.drawText(subject, { x: tableX + 10, y: currentY - 15, size: 9, font });
      page.drawText(grade || 'N/A', { x: tableX + colWidth + 10, y: currentY - 15, size: 9, font: bold });
      
      // Vertical line
      page.drawLine({
        start: { x: tableX + colWidth, y: currentY },
        end: { x: tableX + colWidth, y: currentY - rowHeight },
        thickness: 1,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      currentY -= rowHeight;
    });

    currentY -= 25;

    // Remark
    if (result.remark) {
      page.drawText('Remark: ', { x: leftMargin, y: currentY, size: 9, font });
      page.drawText(result.remark, { x: leftMargin + 50, y: currentY, size: 9, font: bold });
      currentY -= 15;

      // Dashed line
      for (let x = margin + 10; x < width - margin - 10; x += 10) {
        page.drawLine({
          start: { x, y: currentY },
          end: { x: x + 5, y: currentY },
          thickness: 0.8,
          color: rgb(0.7, 0.7, 0.7),
        });
      }
    }

    // Footer
    const footerY = margin + 35;
    
    // Dashed line above footer
    for (let x = margin + 10; x < width - margin - 10; x += 10) {
      page.drawLine({
        start: { x, y: footerY + 15 },
        end: { x: x + 5, y: footerY + 15 },
        thickness: 0.8,
        color: rgb(0.6, 0.6, 0.6),
      });
    }
    
    centerText('DELTA STATE MINISTRY OF PRIMARY EDUCATION PORTAL', 9, footerY, font);

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
