/**
 * Netlify API を直接使用してデプロイするスクリプト
 * CLI のバグを完全にバイパスする
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Netlify CLIの設定からトークンを取得
function getToken() {
  const configPath = path.join(process.env.APPDATA || '', 'netlify', 'Config', 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (config.users) {
      const userId = Object.keys(config.users)[0];
      return config.users[userId]?.auth?.token;
    }
  }
  // フォールバック: .netlify/state.json からサイトID取得
  return null;
}

// ディレクトリ内の全ファイルを再帰的に取得
function getAllFiles(dir, baseDir) {
  baseDir = baseDir || dir;
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, baseDir));
    } else {
      const relativePath = '/' + path.relative(baseDir, filePath).replace(/\\/g, '/');
      const content = fs.readFileSync(filePath);
      const sha1 = crypto.createHash('sha1').update(content).digest('hex');
      results.push({ path: relativePath, sha1, size: stat.size });
    }
  }
  return results;
}

// Netlify API呼び出し
function apiCall(method, endpoint, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.netlify.com',
      path: `/api/v1${endpoint}`,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseData) });
        } catch {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ファイルをアップロード
function uploadFile(deployId, filePath, token, content) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com',
      path: `/api/v1/deploys/${deployId}/files${filePath}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': content.length,
      },
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.on('error', reject);
    req.write(content);
    req.end();
  });
}

async function main() {
  const token = getToken();
  if (!token) {
    console.error('Netlifyトークンが見つかりません');
    process.exit(1);
  }
  console.log('✅ トークン取得成功');

  // サイトID取得
  const statePath = path.join(__dirname, '.netlify', 'state.json');
  let siteId;
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    siteId = state.siteId;
  }
  if (!siteId) {
    siteId = 'lisens-app';
  }
  console.log(`📌 サイトID: ${siteId}`);

  // outディレクトリの全ファイルをハッシュ
  const outDir = path.join(__dirname, 'out');
  console.log('📂 ファイルをスキャン中...');
  const files = getAllFiles(outDir);
  console.log(`📄 ${files.length} ファイル検出`);

  // ファイルハッシュマップ作成
  const fileHashMap = {};
  for (const file of files) {
    fileHashMap[file.path] = file.sha1;
  }

  // デプロイ作成（差分検出）
  console.log('🚀 デプロイ作成中...');
  const createResult = await apiCall('POST', `/sites/${siteId}/deploys`, token, {
    files: fileHashMap,
  });

  if (createResult.status !== 200) {
    console.error('デプロイ作成失敗:', createResult.status, JSON.stringify(createResult.data).substring(0, 200));
    process.exit(1);
  }

  const deployId = createResult.data.id;
  const required = createResult.data.required || [];
  console.log(`✅ デプロイ作成: ${deployId}`);
  console.log(`📤 アップロード必要ファイル: ${required.length} / ${files.length}`);

  // 必要なファイルのみアップロード
  const requiredSet = new Set(required);
  const filesToUpload = files.filter(f => requiredSet.has(f.sha1));

  let uploaded = 0;
  for (const file of filesToUpload) {
    const content = fs.readFileSync(path.join(outDir, file.path.substring(1)));
    const result = await uploadFile(deployId, file.path, token, content);
    uploaded++;
    if (uploaded % 10 === 0 || uploaded === filesToUpload.length) {
      console.log(`  📤 ${uploaded}/${filesToUpload.length} アップロード完了`);
    }
  }

  console.log('🎉 全ファイルアップロード完了！');
  console.log(`🌐 サイトURL: ${createResult.data.ssl_url || createResult.data.url}`);
}

main().catch(err => {
  console.error('エラー:', err);
  process.exit(1);
});
