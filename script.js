/**
 * Image Splitter - メインスクリプト
 * 画像を指定したグリッドで分割し、ZIPでダウンロードする機能を提供
 */

// DOM要素の取得
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const editorSection = document.getElementById('editorSection');
const tilesSection = document.getElementById('tilesSection');
const previewImage = document.getElementById('previewImage');
const gridOverlay = document.getElementById('gridOverlay');
const imageInfo = document.getElementById('imageInfo');
const colSlider = document.getElementById('colSlider');
const rowSlider = document.getElementById('rowSlider');
const colInput = document.getElementById('colInput');
const rowInput = document.getElementById('rowInput');
const totalTiles = document.getElementById('totalTiles');
const tileSize = document.getElementById('tileSize');
const tilesGrid = document.getElementById('tilesGrid');
const tileCount = document.getElementById('tileCount');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const themeToggle = document.getElementById('themeToggle');
const loadingOverlay = document.getElementById('loadingOverlay');
const offsetXInput = document.getElementById('offsetX');
const offsetYInput = document.getElementById('offsetY');
const offsetResetBtn = document.getElementById('offsetResetBtn');

// 状態管理
let currentImage = null;
let originalFileName = '';

// Lucideアイコンの初期化
lucide.createIcons();

// ========================================
// テーマ管理
// ========================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

themeToggle.addEventListener('click', toggleTheme);
initTheme();
document.getElementById('fileSelectBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.value = '';
    fileInput.click();
});
// ========================================
// ファイルアップロード機能
// ========================================
uploadArea.addEventListener('click', (e) => {
    if (e.target === uploadArea || uploadArea.contains(e.target)) {
        fileInput.value = '';
        fileInput.click();
    }
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        handleImageUpload(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImageUpload(e.target.files[0]);
        fileInput.value = '';
    }
});

function handleImageUpload(file) {
    originalFileName = file.name.replace(/\.[^/.]+$/, '');

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            showEditor();
            updatePreview();
            updateGrid();
            generateTiles();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ========================================
// エディターの表示/非表示
// ========================================
function showEditor() {
    uploadSection.classList.add('hidden');
    editorSection.classList.remove('hidden');
    tilesSection.classList.remove('hidden');
}

function hideEditor() {
    uploadSection.classList.remove('hidden');
    editorSection.classList.add('hidden');
    tilesSection.classList.add('hidden');
    currentImage = null;
    originalFileName = '';
    fileInput.value = '';
    previewImage.src = '';
    gridOverlay.innerHTML = '';
    tilesGrid.innerHTML = '';
}

resetBtn.addEventListener('click', hideEditor);

// ========================================
// プレビュー更新
// ========================================
function updatePreview() {
    if (!currentImage) return;

    previewImage.src = currentImage.src;
    imageInfo.innerHTML = `
        <strong>${originalFileName}</strong> — 
        ${currentImage.naturalWidth} × ${currentImage.naturalHeight} px
    `;
}

// ========================================
// グリッド表示
// ========================================
function updateGrid() {
    if (!currentImage) return;

    const cols = parseInt(colInput.value) || 1;
    const rows = parseInt(rowInput.value) || 1;
    const offX = parseInt(offsetXInput.value) || 0;
    const offY = parseInt(offsetYInput.value) || 0;

    gridOverlay.innerHTML = '';

    // 表示上のオフセットをパーセントに変換
    const imgW = currentImage.naturalWidth;
    const imgH = currentImage.naturalHeight;
    const offXPercent = (offX / imgW) * 100;
    const offYPercent = (offY / imgH) * 100;

    // 有効な切り出し範囲
    const effectiveW = imgW - Math.abs(offX);
    const effectiveH = imgH - Math.abs(offY);

    // 水平線（行の区切り）
    for (let i = 1; i < rows; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line horizontal';
        const basePercent = (i / rows) * (effectiveH / imgH) * 100;
        line.style.top = `${basePercent + (offY > 0 ? offYPercent : 0)}%`;
        gridOverlay.appendChild(line);
    }

    // 垂直線（列の区切り）
    for (let i = 1; i < cols; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line vertical';
        const basePercent = (i / cols) * (effectiveW / imgW) * 100;
        line.style.left = `${basePercent + (offX > 0 ? offXPercent : 0)}%`;
        gridOverlay.appendChild(line);
    }

    // オフセット領域の表示（切り取られる部分をハイライト）
    if (offX !== 0 || offY !== 0) {
        // 上端のオフセット領域
        if (offY > 0) {
            const topShade = document.createElement('div');
            topShade.className = 'grid-offset-shade';
            topShade.style.top = '0';
            topShade.style.left = '0';
            topShade.style.width = '100%';
            topShade.style.height = `${offYPercent}%`;
            gridOverlay.appendChild(topShade);
        }
        // 左端のオフセット領域
        if (offX > 0) {
            const leftShade = document.createElement('div');
            leftShade.className = 'grid-offset-shade';
            leftShade.style.top = '0';
            leftShade.style.left = '0';
            leftShade.style.width = `${offXPercent}%`;
            leftShade.style.height = '100%';
            gridOverlay.appendChild(leftShade);
        }
        // 下端のオフセット領域（負のオフセット時）
        if (offY < 0) {
            const bottomShade = document.createElement('div');
            bottomShade.className = 'grid-offset-shade';
            bottomShade.style.bottom = '0';
            bottomShade.style.left = '0';
            bottomShade.style.width = '100%';
            bottomShade.style.height = `${Math.abs(offYPercent)}%`;
            gridOverlay.appendChild(bottomShade);
        }
        // 右端のオフセット領域（負のオフセット時）
        if (offX < 0) {
            const rightShade = document.createElement('div');
            rightShade.className = 'grid-offset-shade';
            rightShade.style.top = '0';
            rightShade.style.right = '0';
            rightShade.style.width = `${Math.abs(offXPercent)}%`;
            rightShade.style.height = '100%';
            gridOverlay.appendChild(rightShade);
        }
    }

    // 情報更新
    const total = cols * rows;
    totalTiles.textContent = total;

    const tileWidth = Math.floor(effectiveW / cols);
    const tileHeight = Math.floor(effectiveH / rows);
    tileSize.textContent = `${tileWidth} × ${tileHeight}`;
}

// ========================================
// タイル生成
// ========================================
function generateTiles() {
    if (!currentImage) return;

    const cols = parseInt(colInput.value) || 1;
    const rows = parseInt(rowInput.value) || 1;
    const offX = parseInt(offsetXInput.value) || 0;
    const offY = parseInt(offsetYInput.value) || 0;

    const startX = Math.max(0, offX);
    const startY = Math.max(0, offY);
    const effectiveW = currentImage.naturalWidth - Math.abs(offX);
    const effectiveH = currentImage.naturalHeight - Math.abs(offY);
    const tileWidth = Math.floor(effectiveW / cols);
    const tileHeight = Math.floor(effectiveH / rows);

    tilesGrid.innerHTML = '';

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const canvas = document.createElement('canvas');
            canvas.width = tileWidth;
            canvas.height = tileHeight;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(
                currentImage,
                startX + col * tileWidth,
                startY + row * tileHeight,
                tileWidth,
                tileHeight,
                0,
                0,
                tileWidth,
                tileHeight
            );

            const tileItem = document.createElement('div');
            tileItem.className = 'tile-item';

            const img = document.createElement('img');
            img.className = 'tile-image';
            img.src = canvas.toDataURL('image/png');
            img.alt = `Tile ${row + 1}-${col + 1}`;

            const label = document.createElement('div');
            label.className = 'tile-label';
            label.textContent = `R${row + 1} × C${col + 1}`;

            tileItem.appendChild(img);
            tileItem.appendChild(label);
            tilesGrid.appendChild(tileItem);
        }
    }

    tileCount.textContent = `${cols * rows}枚`;
}

// ========================================
// スライダーと入力の同期
// ========================================
function syncInputs(slider, input) {
    slider.addEventListener('input', () => {
        input.value = slider.value;
        updateGrid();
        generateTiles();
    });

    input.addEventListener('input', () => {
        let value = parseInt(input.value) || 1;
        value = Math.max(1, Math.min(20, value));
        input.value = value;
        slider.value = Math.min(value, 10);
        updateGrid();
        generateTiles();
    });
}

syncInputs(colSlider, colInput);
syncInputs(rowSlider, rowInput);

// プラス・マイナスボタン
document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        let value = parseInt(input.value) || 1;

        if (btn.classList.contains('plus')) {
            value = Math.min(20, value + 1);
        } else {
            value = Math.max(1, value - 1);
        }

        input.value = value;

        // スライダーも同期
        const sliderId = targetId.replace('Input', 'Slider');
        const slider = document.getElementById(sliderId);
        slider.value = Math.min(value, 10);

        updateGrid();
        generateTiles();
    });
});

// ========================================
// ファイル名のサニタイズ（日本語や特殊文字を除去）
// ========================================
function sanitizeFileName(name) {
    // 日本語や特殊文字をアンダースコアに置換
    return name
        .replace(/[^\x00-\x7F]/g, '_')  // 非ASCII文字を_に
        .replace(/[<>:"/\\|?*]/g, '_')   // Windowsで使えない文字を_に
        .replace(/_+/g, '_')             // 連続する_を1つに
        .replace(/^_|_$/g, '')           // 先頭・末尾の_を削除
        || 'image';                       // 空になった場合のフォールバック
}

// ========================================
// CanvasからBlobを取得するヘルパー関数
// ========================================
function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Canvas to Blob conversion failed'));
            }
        }, 'image/png');
    });
}

// BlobをUint8Arrayに変換するヘルパー関数
function blobToUint8Array(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(new Uint8Array(reader.result));
        };
        reader.onerror = () => {
            reject(new Error('Blob to Uint8Array conversion failed'));
        };
        reader.readAsArrayBuffer(blob);
    });
}

// ========================================
// ZIPダウンロード
// ========================================
async function downloadAsZip() {
    if (!currentImage) return;

    loadingOverlay.classList.remove('hidden');

    try {
        const cols = parseInt(colInput.value) || 1;
        const rows = parseInt(rowInput.value) || 1;
        const offX = parseInt(offsetXInput.value) || 0;
        const offY = parseInt(offsetYInput.value) || 0;
        const startX = Math.max(0, offX);
        const startY = Math.max(0, offY);
        const effectiveW = currentImage.naturalWidth - Math.abs(offX);
        const effectiveH = currentImage.naturalHeight - Math.abs(offY);
        const tileWidth = Math.floor(effectiveW / cols);
        const tileHeight = Math.floor(effectiveH / rows);

        // ファイル名をサニタイズ
        const safeFileName = sanitizeFileName(originalFileName);

        const zip = new JSZip();

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const canvas = document.createElement('canvas');
                canvas.width = tileWidth;
                canvas.height = tileHeight;
                const ctx = canvas.getContext('2d');

                ctx.drawImage(
                    currentImage,
                    startX + col * tileWidth,
                    startY + row * tileHeight,
                    tileWidth,
                    tileHeight,
                    0,
                    0,
                    tileWidth,
                    tileHeight
                );

                // Canvas → Blob → Uint8Array（base64を経由しない安全な方法）
                const blob = await canvasToBlob(canvas);
                const uint8Array = await blobToUint8Array(blob);

                // 行と列の番号をゼロパディング
                const rowNum = String(row + 1).padStart(2, '0');
                const colNum = String(col + 1).padStart(2, '0');
                const fileName = `tile_${rowNum}_${colNum}.png`;

                // Uint8Arrayとして直接追加（base64変換なし）
                zip.file(fileName, uint8Array, { binary: true });
            }
        }

        // ZIP生成（DEFLATE圧縮）
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        // ダウンロード用のタイムスタンプを追加
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const zipFileName = `${safeFileName}_${rows}x${cols}_${timestamp}.zip`;

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = zipFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 少し遅延してからURLを解放
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

    } catch (error) {
        console.error('ZIP生成エラー:', error);
        alert('ダウンロード中にエラーが発生しました。\n詳細: ' + error.message);
    } finally {
        loadingOverlay.classList.add('hidden');
    }
}

if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadAsZip);
}

// ========================================
// 個別ダウンロード機能（ZIPが開けない場合の代替）
// ========================================
async function downloadIndividually() {
    if (!currentImage) return;

    loadingOverlay.classList.remove('hidden');

    try {
        const cols = parseInt(colInput.value) || 1;
        const rows = parseInt(rowInput.value) || 1;
        const offX = parseInt(offsetXInput.value) || 0;
        const offY = parseInt(offsetYInput.value) || 0;
        const startX = Math.max(0, offX);
        const startY = Math.max(0, offY);
        const effectiveW = currentImage.naturalWidth - Math.abs(offX);
        const effectiveH = currentImage.naturalHeight - Math.abs(offY);
        const tileWidth = Math.floor(effectiveW / cols);
        const tileHeight = Math.floor(effectiveH / rows);

        const safeFileName = sanitizeFileName(originalFileName);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const canvas = document.createElement('canvas');
                canvas.width = tileWidth;
                canvas.height = tileHeight;
                const ctx = canvas.getContext('2d');

                ctx.drawImage(
                    currentImage,
                    startX + col * tileWidth,
                    startY + row * tileHeight,
                    tileWidth,
                    tileHeight,
                    0,
                    0,
                    tileWidth,
                    tileHeight
                );

                const dataUrl = canvas.toDataURL('image/png');
                const rowNum = String(row + 1).padStart(2, '0');
                const colNum = String(col + 1).padStart(2, '0');
                const fileName = `${safeFileName}_${rowNum}_${colNum}.png`;

                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // 少し待機（ブラウザの負荷軽減）
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        alert(`${rows * cols}枚の画像をダウンロードしました。\nダウンロードフォルダを確認してください。`);

    } catch (error) {
        console.error('個別ダウンロードエラー:', error);
        alert('ダウンロード中にエラーが発生しました。\n詳細: ' + error.message);
    } finally {
        loadingOverlay.classList.add('hidden');
    }
}

// 個別ダウンロードボタンのイベント
const individualBtn = document.getElementById('individualBtn');
if (individualBtn) {
    individualBtn.addEventListener('click', downloadIndividually);
}

// ========================================
// オフセット調整ボタンのイベント
// ========================================
document.querySelectorAll('[data-offset]').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.offset;
        const dir = parseInt(btn.dataset.dir);
        const input = document.getElementById(targetId);
        input.value = parseInt(input.value || 0) + dir;
        updateGrid();
        generateTiles();
    });
});

// オフセット入力の直接変更
offsetXInput.addEventListener('input', () => {
    updateGrid();
    generateTiles();
});

offsetYInput.addEventListener('input', () => {
    updateGrid();
    generateTiles();
});

// オフセットリセットボタン
offsetResetBtn.addEventListener('click', () => {
    offsetXInput.value = 0;
    offsetYInput.value = 0;
    updateGrid();
    generateTiles();
});

// ========================================
// 初期化完了後にアイコンを再生成
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
});
