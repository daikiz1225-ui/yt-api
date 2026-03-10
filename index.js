const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// すべてのドメインからのアクセスを許可（Vercelとの連携のため）
app.use(cors());

// ルートパスでの生存確認用
app.get('/', (req, res) => {
  res.send('YT Backend API is running!');
});

// 動画URL取得エンドポイント
app.get('/api/video', async (req, res) => {
  const videoId = req.query.id;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // ytdl-coreで動画情報を取得
    // filter: 'audioandvideo' で映像と音声が合体している形式を優先
    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highestvideo', 
      filter: format => format.container === 'mp4' && format.hasAudio && format.hasVideo 
    });

    if (format) {
      res.json({
        title: info.videoDetails.title,
        url: format.url,
        expires: new Date(Date.now() + 3600 * 1000).toISOString() // 通常URLは数時間で切れます
      });
    } else {
      // 適切なフォーマットが見つからない場合は、とにかく取れる一番いいやつ
      const fallback = ytdl.chooseFormat(info.formats, { quality: 'highest' });
      res.json({
        title: info.videoDetails.title,
        url: fallback.url
      });
    }
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ 
      error: 'Failed to fetch video info', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
