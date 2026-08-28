import { csvParserService } from '../services/csv-parser.service';

async function runCsvTest() {
  console.log('[CSV/Text Upload Test] Starting Level 14 verification...');

  // Test 1: CSV format with header, duplicates, and invalid emails
  const mockCsv = `
Email,Name
"alice@example.com",Alice
bob@example.com,Bob
invalid-email-address,InvalidUser
alice@example.com,Alice Duplicate
charlie.smith+tag@work-domain.org,Charlie
another-bad@,BadUser
  `;

  console.log('\n[Test 1] Parsing sample CSV...');
  const csvResult = csvParserService.parseEmailsFromContent(mockCsv);
  console.log('CSV Result:', JSON.stringify(csvResult, null, 2));

  if (csvResult.unique !== 3) {
    throw new Error(`Expected 3 unique valid emails, got ${csvResult.unique}`);
  }
  if (!csvResult.emails.includes('alice@example.com') || !csvResult.emails.includes('bob@example.com')) {
    throw new Error('Missing expected parsed emails');
  }
  if (csvResult.invalid !== 2) {
    throw new Error(`Expected 2 invalid emails, got ${csvResult.invalid}`);
  }

  // Test 2: Plain text with multiple delimiters
  const mockText = `
    ceo@company.com; cto@company.com
    dev@company.com, marketing@company.com
    ceo@company.com
    invalid-string
  `;

  console.log('\n[Test 2] Parsing plain text content...');
  const textResult = csvParserService.parseEmailsFromContent(mockText);
  console.log('Text Result:', JSON.stringify(textResult, null, 2));

  if (textResult.unique !== 4) {
    throw new Error(`Expected 4 unique emails, got ${textResult.unique}`);
  }

  console.log('\n[CSV/Text Upload Test] Level 14 verification PASSED! 🚀');
  process.exit(0);
}

runCsvTest().catch((err) => {
  console.error('[CSV/Text Upload Test] Test failed:', err);
  process.exit(1);
});
