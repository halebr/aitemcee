const DocumentParser = {
  async parseFile(file) {
    const name = file.name.toLowerCase();

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File exceeds 5MB limit');
    }

    if (name.endsWith('.txt')) {
      return await file.text();
    }

    if (name.endsWith('.pdf')) {
      return await this.parsePdf(file);
    }

    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      return await this.parseDocx(file);
    }

    throw new Error('Unsupported file type. Please use PDF, DOCX, or TXT.');
  },

  async parsePdf(file) {
    const arrayBuffer = await file.arrayBuffer();
    if (!window.pdfjsLib) {
      throw new Error('PDF parser not loaded. Please refresh and try again.');
    }

    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str).join(' ');
      pages.push(text);
    }

    const result = pages.join('\n').trim();
    if (!result || result.length < 10) {
      throw new Error('Could not extract meaningful text from this PDF. Try copy/paste instead.');
    }
    return result;
  },

  async parseDocx(file) {
    const arrayBuffer = await file.arrayBuffer();

    if (!window.mammoth) {
      throw new Error('DOCX parser not loaded. Please refresh and try again.');
    }

    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value.trim();

    if (!text || text.length < 10) {
      throw new Error('Could not extract meaningful text from this document. Try copy/paste instead.');
    }
    return text;
  },
};
