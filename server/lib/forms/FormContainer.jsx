import React from 'react';

// Reset styles scoped to the container class so embedded mode doesn't leak into the parent app.
// In standalone mode the container IS the <body>, so the scoped selector still works.
const embeddedCss = `
  .form-container * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* Gray document-viewer background to frame the pages */
  .form-container {
    background: #e0e0e0;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /*
   * Each .page renders as a letter-sized (8.5" x 11") white sheet.
   * Padding mirrors the @page margins used in PDF generation so content
   * is positioned identically in both the browser preview and the PDF.
   * Higher specificity (.form-container .page) ensures these rules override
   * the form component's own .page rules.
   */
  .form-container .page {
    width: 8.5in;
    min-height: 11in;
    padding: 0.5in 0.5in 0.65in;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    margin-bottom: 24px;
    break-after: page;
    page-break-after: always;
  }

  /*
   * Form footers use position:absolute with a negative bottom offset so they
   * land in the PDF margin area. In the embedded preview the margins are
   * represented as padding, so we correct the offset to keep the footer
   * inside the page's bottom padding area (0.65in - 0.35in = 0.3in).
   */
  .form-container .footer {
    bottom: 0.3in;
  }

  /* When printing from the browser preview, restore PDF-appropriate appearance */
  @media print {
    .form-container {
      background: none;
      padding: 0;
    }

    .form-container .page {
      box-shadow: none;
      margin-bottom: 0;
    }

    .form-container .footer {
      bottom: -0.35in;
    }
  }
`;

// In standalone mode we can use the global selector freely since nothing else is on the page.
const standaloneCss = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
`;

/**
 * Shared document/page wrapper for all printable forms.
 *
 * - standalone=true  (default): renders a full <html> document suitable for
 *   server-side rendering and PDF generation via Puppeteer.
 * - standalone=false: renders a scoped <div class="form-container"> suitable
 *   for direct embedding inside a React client app without polluting its styles.
 *
 * Individual form components should:
 *   - Include their own form-specific <style> (using .form-container instead of
 *     body for font/layout rules so they work in both modes).
 *   - Render their content as plain JSX (no <html>/<head>/<body> wrapper).
 */
export default function FormContainer ({ children, standalone = true }) {
  if (standalone) {
    return (
      <html lang='en'>
        <head>
          <meta charSet='utf-8' />
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: standaloneCss }} />
        </head>
        <body className='form-container'>
          {children}
        </body>
      </html>
    );
  }

  return (
    <div className='form-container'>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: embeddedCss }} />
      {children}
    </div>
  );
}
