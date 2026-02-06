const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createTitleDeed() {
    try {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Header
        page.drawText('REPUBLIC OF CAMEROON', {
            x: 50,
            y: height - 50,
            size: 20,
            font: boldFont,
            color: rgb(0, 0.5, 0), // Green
        });

        page.drawText('Peace - Work - Fatherland', {
            x: 50,
            y: height - 75,
            size: 12,
            font: font,
        });

        page.drawText('MINISTRY OF STATE PROPERTY AND LAND TENURE', {
            x: 50,
            y: height - 100,
            size: 14,
            font: boldFont,
        });

        // Title
        page.drawText('LAND TITLE DEED', {
            x: 180,
            y: height - 180,
            size: 30,
            font: boldFont,
            color: rgb(0, 0, 0),
        });

        // Body Content
        const drawField = (label, value, y) => {
            page.drawText(`${label}:`, { x: 50, y, size: 12, font: boldFont });
            page.drawText(value, { x: 200, y, size: 12, font: font });
        };

        drawField('Deed Number', '{{DEED_NUMBER}}', height - 250);
        drawField('Property Owner', '{{OWNER_NAME}}', height - 280);
        drawField('Location', '{{LOCATION_NAME}}', height - 310);
        drawField('Surface Area', '{{SURFACE_AREA}} m2', height - 340);
        drawField('Date Issued', '{{ISSUE_DATE}}', height - 370);

        // Official Seal Placeholder
        page.drawCircle({
            x: width - 100,
            y: 100,
            size: 50,
            borderColor: rgb(0.8, 0, 0),
            borderWidth: 2,
            opacity: 0.5,
        });
        page.drawText('OFFICIAL', {
            x: width - 130,
            y: 100,
            size: 14,
            font: boldFont,
            color: rgb(0.8, 0, 0),
            opacity: 0.5,
            rotate: { type: 'degrees', angle: 45 }
        });

        // Footer
        page.drawText('This document is a digital representation for verification purposes.', {
            x: 50,
            y: 30,
            size: 10,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
        });

        const pdfBytes = await pdfDoc.save();

        // Output path
        const outputPath = path.join(__dirname, '..', 'public', 'assets', 'title_deed_sample.pdf');

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, pdfBytes);
        console.log(`PDF created successfully at: ${outputPath}`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        process.exit(1);
    }
}

createTitleDeed();
