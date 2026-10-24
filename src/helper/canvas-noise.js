import paper from '@turbowarp/paper';
import {clearRaster, createCanvas, getRaster} from './layer';

const PROBE_SIZE = 16;
const PROBE_COLORS = [[0x4c, 0x97, 0xff, 0xff], [0xff, 0x8c, 0x1a, 0xff]];
const MAX_CLEAN_SNAPSHOTS = 20;
const MAX_CLEAN_SNAPSHOT_PIXELS = 16 * 1024 * 1024;
const MAX_CLEAN_EXPORTS = 8;
const MAX_CLEAN_EXPORT_PIXELS = 8 * 1024 * 1024;
const MAX_EXPORT_ALPHA_DRIFT = 2;
const MAX_EXPORT_PREMULTIPLIED_DRIFT = 8;
const NOISE_COLOR_TOLERANCE = 8;
const NOTICE_DISMISSED_KEY = 'mw:paint-canvas-noise-notice-dismissed';

let readbackNoisy = null;
const cleanSnapshots = new Map();
const cleanExports = new Map();

const isCanvasReadbackNoisy = function () {
    if (readbackNoisy !== null) return readbackNoisy;
    readbackNoisy = false;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = PROBE_SIZE;
        canvas.height = PROBE_SIZE;
        const context = canvas.getContext('2d', {willReadFrequently: true});
        if (!context) return readbackNoisy;
        const half = PROBE_SIZE / 2;
        PROBE_COLORS.forEach((color, index) => {
            context.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            context.fillRect(index * half, 0, half, PROBE_SIZE);
        });
        const data = context.getImageData(0, 0, PROBE_SIZE, PROBE_SIZE).data;
        for (let i = 0; i < data.length; i++) {
            const x = (i >> 2) % PROBE_SIZE;
            if (data[i] !== PROBE_COLORS[x < half ? 0 : 1][i % 4]) {
                readbackNoisy = true;
                break;
            }
        }
    } catch (e) {
        readbackNoisy = false;
    }
    return readbackNoisy;
};

const getFillColorTolerance = function () {
    return isCanvasReadbackNoisy() ? NOISE_COLOR_TOLERANCE : 0;
};

const pixelCount_ = function (entries) {
    let pixels = 0;
    for (const entry of entries.values()) {
        if (entry.canvas) pixels += entry.canvas.width * entry.canvas.height;
    }
    return pixels;
};

const trimCache_ = function (cache, maxEntries, maxPixels) {
    while (cache.size > 1 && (cache.size > maxEntries || pixelCount_(cache) > maxPixels)) {
        cache.delete(cache.keys().next().value);
    }
};

const rememberCleanSnapshot = function (snapshot, raster, hitBounds) {
    if (!raster.loaded || !isCanvasReadbackNoisy()) return;
    const bounds = hitBounds(raster);
    const empty = !bounds.width || !bounds.height;
    cleanSnapshots.set(snapshot, {
        canvas: empty ? null : raster.getSubCanvas(bounds),
        x: bounds.x,
        y: bounds.y
    });
    trimCache_(cleanSnapshots, MAX_CLEAN_SNAPSHOTS, MAX_CLEAN_SNAPSHOT_PIXELS);
};

const restoreCleanSnapshot = function (snapshot) {
    const entry = cleanSnapshots.get(snapshot);
    if (!entry) return;
    clearRaster();
    if (entry.canvas) getRaster().drawImage(entry.canvas, new paper.Point(entry.x, entry.y));
};

const forgetCleanSnapshots = function () {
    cleanSnapshots.clear();
};

const rememberCleanExport = function (imageId, raster, rect, imageData, rotationCenterX, rotationCenterY) {
    if (typeof imageId === 'undefined' || imageId === null || !isCanvasReadbackNoisy()) return;
    cleanExports.delete(imageId);
    cleanExports.set(imageId, {
        canvas: raster.getSubCanvas(rect),
        data: imageData.data,
        rotationCenterX,
        rotationCenterY
    });
    trimCache_(cleanExports, MAX_CLEAN_EXPORTS, MAX_CLEAN_EXPORT_PIXELS);
};

const matchesExport_ = function (exported, loaded) {
    for (let i = 0; i < exported.length; i += 4) {
        const exportedAlpha = exported[i + 3];
        const loadedAlpha = loaded[i + 3];
        if (Math.abs(exportedAlpha - loadedAlpha) > MAX_EXPORT_ALPHA_DRIFT) return false;
        if ((exportedAlpha === 0) !== (loadedAlpha === 0)) return false;
        for (let c = 0; c < 3; c++) {
            const drift = Math.abs((exported[i + c] * exportedAlpha) - (loaded[i + c] * loadedAlpha)) / 255;
            if (drift > MAX_EXPORT_PREMULTIPLIED_DRIFT) return false;
        }
    }
    return true;
};

const getCleanExport = function (imageId, image, rotationCenterX, rotationCenterY) {
    const entry = cleanExports.get(imageId);
    if (!entry) return null;
    const {width, height} = entry.canvas;
    if (entry.rotationCenterX !== rotationCenterX ||
        entry.rotationCenterY !== rotationCenterY ||
        image.width !== width ||
        image.height !== height) {
        return null;
    }
    const context = createCanvas(width, height).getContext('2d', {willReadFrequently: true});
    context.drawImage(image, 0, 0);
    const loaded = context.getImageData(0, 0, width, height).data;
    return matchesExport_(entry.data, loaded) ? entry.canvas : null;
};

const shouldShowNoiseNotice = function () {
    if (!isCanvasReadbackNoisy()) return false;
    try {
        return window.localStorage.getItem(NOTICE_DISMISSED_KEY) !== 'true';
    } catch (e) {
        return true;
    }
};

const dismissNoiseNotice = function () {
    try {
        window.localStorage.setItem(NOTICE_DISMISSED_KEY, 'true');
    } catch (e) {
        return;
    }
};

export {
    isCanvasReadbackNoisy,
    getFillColorTolerance,
    rememberCleanSnapshot,
    restoreCleanSnapshot,
    forgetCleanSnapshots,
    rememberCleanExport,
    getCleanExport,
    shouldShowNoiseNotice,
    dismissNoiseNotice
};
