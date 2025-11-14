import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pinCode = searchParams.get('pinCode');
    const serialNumber = searchParams.get('serial');
    const examinationNumber = searchParams.get('examNumber');

    // Validate required fields
    if (!pinCode || !serialNumber || !examinationNumber) {
      return NextResponse.json(
        { error: 'Pin Code, Serial Number, and Examination Number are required.' },
        { status: 400 }
      );
    }

    // Query database
    const result = await prisma.result.findFirst({
      where: {
        pinCode,
        serialNumber,
        examinationNumber,
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

    // Header (centered)
    const headerY = height - 90;
    center("FEDERAL REPUBLIC OF NIGERIA", 16, headerY, bold);
    
    // Embed and draw Delta State logo (centered)
    const logoSize = 100;
    const logoX = (width - logoSize) / 2;
    const logoY = headerY - 100;
    
    try {
      // Try to load logo from public folder - you'll need to add delta-logo.png to your public folder
      const logoUrl = `${request.nextUrl.origin}/delta-logo.png`;
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoBytes = await logoResponse.arrayBuffer();
        const deltaLogo = await pdfDoc.embedPng(logoBytes);
        page.drawImage(deltaLogo, {
          x: logoX,
          y: logoY,
          width: logoSize,
          height: logoSize,
        });
      }
    } catch (error) {
      console.log('Logo not found, skipping');
    }
    
    center("MINISTRY OF PRIMARY EDUCATION ASABA,", 12, logoY - 15, bold);
    center("Delta State.", 11, logoY - 32, font);
    center("Cognitive/Placement Certification Result", 12, logoY - 55, bold);

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

    // Candidate info
    const infoY = logoY - 120;
    const leftX = 50;
    const lineH = 20;

    const info = [
      [`Year: ${result.year || 'N/A'}`, ""],
      ["", ""],
      [`Candidate Name: ${result.candidateName || 'N/A'}`, ""],
      ["", ""],
      [`Sex: ${result.sex || 'N/A'}`, ""],
      ["", ""],
      [`School: ${result.school || 'N/A'}`, ""],
      ["", ""],
      [`Local Government Area: ${result.lga || 'N/A'}`, ""],
      ["", ""],
      [`Examination Number: ${result.examinationNumber || 'N/A'}`, ""],
    ];

    let lineCount = 0;
    info.forEach(([left]) => {
      if (left) {
        const y = infoY - lineCount * lineH;
        page.drawText(left, { x: leftX, y, size: 10, font });
        lineCount++;
      }
    });

    // Separator line
    const separatorY = infoY - lineCount * lineH - 10;
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
      ["ENGLISH STUDIES", result.englishGrade],
      ["MATHEMATICS", result.mathGrade],
      ["GENERAL PAPER", result.generalPaperGrade],
      ["CHRISTIAN RELIGIOUS STUDIES", result.crsGrade],
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
        'Content-Disposition': `attachment; filename="Result_${result.examinationNumber}.pdf"`,
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
