import { BuckSlateGenerator, SlateData } from './slate-generator';

async function testSlateGenerator() {
  try {
    console.log('🚀 Starting slate generator test...');

    // 1. Create an instance
    const generator = new BuckSlateGenerator();

    // 2. Set up slate data
    const slateData: SlateData = {
      filename: 'my-video',
      resolution: '1920x1080',
      Title: 'My Amazing Video',
      Advertiser: 'ACME Corp',
      'AD-ID': 'ABC123',
      Length: '30 seconds',
      Audio: 'Stereo',
      Date: '2025/01/25',
      Copyright: '© 2025 ACME Corp',
    };

    console.log('📸 Generating slate image...');
    // 3. Generate a single slate image
    await generator.generateSlate(
      slateData,
      'buck',
      `/Users/benjamin/Desktop/Slates-test/${slateData.filename}.png`
    );
    console.log('✅ Slate image generated successfully!');

    // Uncomment to test batch processing:

    console.log('📁 Processing CSV batch...');
    const results = await generator.batchGenerateSlates(
      '/Users/benjamin/Desktop/slate-example.csv',
      'buck',
      '/Users/benjamin/Desktop/Slates-test',
      'image',
      (current, total, filename) => {
        console.log(`Processing ${current}/${total}: ${filename}`);
      }
    );

    results.forEach((result) => {
      if (result.success) {
        console.log(`✅ Generated: ${result.filename} at ${result.path}`);
      } else {
        console.log(`❌ Failed: ${result.filename} - ${result.error}`);
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSlateGenerator();
