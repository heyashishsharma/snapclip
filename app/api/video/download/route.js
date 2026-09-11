import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';

export const maxDuration = 60; // Max execution time for vercel hobby

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const format_id = searchParams.get('format_id');

    if (!url || !format_id) {
      return NextResponse.json({ error: 'URL and format_id are required' }, { status: 400 });
    }

    // Get the direct URL of the video format
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      format: format_id,
      noWarnings: true,
      noCheckCertificate: true,
    });

    let downloadUrl = info.url;
    
    // If not found at the root, find the specific format URL
    if (!downloadUrl && info.formats) {
      const selectedFormat = info.formats.find(f => String(f.format_id) === String(format_id));
      if (selectedFormat && selectedFormat.url) {
        downloadUrl = selectedFormat.url;
      }
    }

    if (!downloadUrl) {
      // Fallback: proxy the stream through youtube-dl-exec if direct URL is completely unavailable
      const subprocess = youtubedl.exec(url, {
        format: format_id,
        output: '-',
      }, {
        stdio: ['ignore', 'pipe', 'ignore']
      });

      const stream = new ReadableStream({
        start(controller) {
          subprocess.stdout.on('data', (chunk) => controller.enqueue(chunk));
          subprocess.stdout.on('end', () => controller.close());
          subprocess.stdout.on('error', (err) => controller.error(err));
        },
        cancel() {
          subprocess.kill();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Disposition': `attachment; filename="video-${format_id}.mp4"`,
          'Content-Type': 'application/octet-stream',
        },
      });
    }

    // MAXIMUM OPTIMIZATION: Redirect the client directly to the media server edge node.
    // This provides native download speeds and 0 server bottleneck/bandwidth usage on Vercel.
    return NextResponse.redirect(downloadUrl, 302);

  } catch (error) {
    console.error('Error in download route:', error);
    const fakeReason = "The media server is temporarily unreachable or the link has expired. Please try fetching the video again.";
    return NextResponse.json(
      { error: fakeReason },
      { status: 500 }
    );
  }
}
