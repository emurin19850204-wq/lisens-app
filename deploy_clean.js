/**
 * 詰まったデプロイをキャンセルし、クリーンに再デプロイするスクリプト
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// トークン取得
const configPath = path.join(process.env.APPDATA, 'netlify', 'Config', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const userId = Object.keys(config.users)[0];
const TOKEN = config.users[userId].auth.token;
const SITE_ID = 'f38878cb-55fa-4629-af6e-c469f4802c40';

function apiRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.netlify.com',
      path: `/api/v1${endpoint}`,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

function uploadFile(deployId, filePath, content) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com',
      path: `/api/v1/deploys/${deployId}/files${filePath}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': content.length,
      },
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(content);
    req.end();
  });
}

function getAllFiles(dir, baseDir) {
  baseDir = baseDir || dir;
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const fp = path.join(dir, file);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fp, baseDir));
    } else {
      const rel = '/' + path.relative(baseDir, fp).replace(/\\/g, '/');
      const content = fs.readFileSync(fp);
      const sha1 = crypto.createHash('sha1').update(content).digest('hex');
      results.push({ path: rel, sha1, size: stat.size });
    }
  }
  return results;
}

async function main() {
  // ステップ1: 詰まったデプロイを全てキャンセル
  console.log('🧹 詰まったデプロイをキャンセル中...');
  const deploysRes = await apiRequest('GET', `/sites/${SITE_ID}/deploys?per_page=10`);
  if (deploysRes.status === 200 && Array.isArray(deploysRes.data)) {
    for (const deploy of deploysRes.data) {
      if (['uploading', 'preparing', 'building', 'enqueued', 'processing'].includes(deploy.state)) {
        console.log(`  ❌ キャンセル: ${deploy.id} (${deploy.state})`);
        await apiRequest('POST', `/deploys/${deploy.id}/cancel`);
      }
    }
  }
  console.log('✅ キャンセル完了');

  // ステップ2: outディレクトリのファイルスキャン
  const outDir = path.join(__dirname, 'out');
  console.log('📂 ファイルスキャン中...');
  const files = getAllFiles(outDir);
  console.log(`📄 ${files.length} ファイル検出`);

  // ステップ3: 新しいデプロイ作成
  const fileHashMap = {};
  for (const f of files) fileHashMap[f.path] = f.sha1;

  console.log('🚀 新規デプロイ作成中...');
  const createRes = await apiRequest('POST', `/sites/${SITE_ID}/deploys`, {
    files: fileHashMap,
    draft: false,
  });

  if (createRes.status !== 200) {
    console.error('❌ デプロイ作成失敗:', createRes.status, JSON.stringify(createRes.data).substring(0, 300));
    process.exit(1);
  }

  const deployId = createRes.data.id;
  const required = createRes.data.required || [];
  console.log(`✅ デプロイ作成成功: ${deployId}`);
  console.log(`📤 アップロード必要: ${required.length} / ${files.length} ファイル`);

  // ステップ4: 必要ファイルをアップロード
  const requiredSet = new Set(required);
  const toUpload = files.filter(f => requiredSet.has(f.sha1));

  let done = 0;
  const BATCH = 3;
  for (let i = 0; i < toUpload.length; i += BATCH) {
    const batch = toUpload.slice(i, i + BATCH);
    await Promise.all(batch.map(async (file) => {
      const content = fs.readFileSync(path.join(outDir, file.path.substring(1)));
      for (let retry = 0; retry < 3; retry++) {
        try {
          const res = await uploadFile(deployId, file.path, content);
          done++;
          if (res.status !== 200) {
            console.error(`  ⚠️ エラー: ${file.path} (${res.status})`);
          }
          break;
        } catch (e) {
          if (retry < 2) {
            console.log(`  🔄 リトライ: ${file.path}`);
            await new Promise(r => setTimeout(r, 2000));
          } else {
            console.error(`  ❌ 失敗: ${file.path}`);
            done++;
          }
        }
      }
    }));
    console.log(`  📤 ${done}/${toUpload.length} 完了`);
  }

  console.log('✅ 全ファイルアップロード完了！');

  // ステップ5: デプロイ状態確認
  let attempts = 0;
  while (attempts < 30) {
    const statusRes = await apiRequest('GET', `/deploys/${deployId}`);
    const state = statusRes.data.state;
    console.log(`  📡 デプロイ状態: ${state}`);
    if (state === 'ready') {
      console.log(`🎉 デプロイ完了！`);
      console.log(`🌐 URL: ${statusRes.data.ssl_url}`);
      return;
    }
    if (state === 'error') {
      console.error('❌ デプロイエラー:', statusRes.data.error_message);
      process.exit(1);
    }
    attempts++;
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log('⏰ タイムアウト - Netlifyダッシュボードで確認してください');
}

main().catch(err => { console.error('致命的エラー:', err); process.exit(1); });
