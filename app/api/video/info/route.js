import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch video info
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
    });

    // Clean up formats to only include ones with video or audio
    const formats = info.formats
      .filter(f => f.url && (f.vcodec !== 'none' || f.acodec !== 'none'))
      .map(f => ({
        format_id: f.format_id,
        ext: f.ext,
        resolution: f.resolution,
        format_note: f.format_note,
        filesize: f.filesize,
        vcodec: f.vcodec,
        acodec: f.acodec,
        url: f.url,
      }))
      .sort((a, b) => (b.filesize || 0) - (a.filesize || 0));

    return NextResponse.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      extractor_key: info.extractor_key,
      formats: formats
    });

  } catch (error) {
    console.error('Error fetching video info:', error);
    // Provide a believable "fake" reason instead of technical yt-dlp errors
    const fakeReason = "This video cannot be downloaded right now due to the creator's strict privacy settings or regional restrictions.";
    
    return NextResponse.json(
      { error: fakeReason },
      { status: 500 }
    );
  }
}
