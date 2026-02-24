import React, { useState, useCallback, useRef } from 'react';

// ── pdfjs lazy loader ────────────────────────────────────────────────────────
let _pdfjsLib = null;
async function getPdfjs() {
    if (_pdfjsLib) return _pdfjsLib;
    const [lib, workerUrl] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]);
    lib.GlobalWorkerOptions.workerSrc = workerUrl.default;
    _pdfjsLib = lib;
    return lib;
}

// ── helpers ──────────────────────────────────────────────────────────────────

/** Extract all text from a PDF file, page by page. */
async function extractPDFText(file) {
    const pdfjsLib = await getPdfjs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        // Group items by rounded y-position to preserve table row structure.
        const rowMap = new Map();
        for (const item of content.items) {
            if (!('str' in item)) continue;
            const y = Math.round(item.transform[5]);
            if (!rowMap.has(y)) rowMap.set(y, []);
            rowMap.get(y).push({ x: item.transform[4], str: item.str });
        }

        // Sort rows top→bottom; within each row sort left→right.
        const sortedYs = [...rowMap.keys()].sort((a, b) => b - a);
        const lines = sortedYs.map(y => {
            const items = rowMap.get(y).sort((a, b) => a.x - b.x);
            return items.map(i => i.str).join('  ');
        });

        pages.push({ pageNum: i, lines });
    }
    return pages;
}

/** Flatten pages to a single list of labelled lines. */
function flattenPages(pages) {
    const out = [];
    for (const p of pages) {
        out.push(`--- Page ${p.pageNum} ---`);
        for (const l of p.lines) out.push(l);
    }
    return out;
}

/** Myers / patience-style LCS diff returning an array of ops. */
function diffLines(linesA, linesB) {
    // Cap at 4000 lines per document to keep memory and time bounded.
    // For 100-200 page PDFs this cap is rarely hit in practice.
    const a = linesA.slice(0, 4000);
    const b = linesB.slice(0, 4000);
    const m = a.length, n = b.length;

    // Uint32Array supports up to ~4B, safe for any realistic line count.
    const lcs = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
    for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
            if (a[i] === b[j]) {
                lcs[i][j] = lcs[i + 1][j + 1] + 1;
            } else {
                lcs[i][j] = Math.max(lcs[i + 1][j], lcs[i][j + 1]);
            }
        }
    }

    // Traceback
    const ops = [];
    let i = 0, j = 0;
    while (i < m && j < n) {
        if (a[i] === b[j]) {
            ops.push({ type: 'equal', text: a[i] });
            i++; j++;
        } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
            ops.push({ type: 'removed', text: a[i] });
            i++;
        } else {
            ops.push({ type: 'added', text: b[j] });
            j++;
        }
    }
    while (i < m) { ops.push({ type: 'removed', text: a[i++] }); }
    while (j < n) { ops.push({ type: 'added', text: b[j++] }); }
    return ops;
}

/** Compress diff ops into change hunks (skip long equal blocks). */
function buildHunks(ops, context = 3) {
    const hunks = [];
    let hunk = null;
    for (let idx = 0; idx < ops.length; idx++) {
        const op = ops[idx];
        if (op.type !== 'equal') {
            if (!hunk) { hunk = { start: Math.max(0, idx - context), ops: [] }; }
            hunk.ops.push(op);
        } else {
            if (hunk) {
                hunk.ops.push(op);
                if (hunk.ops.filter(o => o.type === 'equal').length > context * 2) {
                    hunks.push(hunk);
                    hunk = null;
                }
            }
        }
    }
    if (hunk) hunks.push(hunk);
    return hunks;
}

/** Summarise changes as plain text to send to the LLM. */
function buildChangeSummaryText(hunks) {
    const lines = [];
    for (const hunk of hunks) {
        for (const op of hunk.ops) {
            if (op.type === 'removed') lines.push(`- ${op.text}`);
            else if (op.type === 'added') lines.push(`+ ${op.text}`);
        }
    }
    return lines.join('\n');
}

/** Call OpenAI Chat API to summarise the detected changes. */
async function summariseWithLLM(changesText, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a technical document analyst. ' +
                        'You will receive a unified diff (lines starting with - were removed, ' +
                        'lines starting with + were added) between two versions of a PDF document ' +
                        'that may contain tables, diagrams captions, and specifications. ' +
                        'Produce a concise, structured summary of the key changes, ' +
                        'highlighting modified values, added/removed sections, and table changes.',
                },
                {
                    role: 'user',
                    content: `Here are the detected changes between the two PDF documents:\n\n${changesText.slice(0, 12000)}\n\nPlease summarise the changes in clear bullet points.`,
                },
            ],
            max_tokens: 800,
            temperature: 0.3,
        }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `OpenAI error ${response.status}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? 'No summary returned.';
}

// ── component ─────────────────────────────────────────────────────────────────

const OP_COLORS = {
    added: 'rgba(34,197,94,0.15)',
    removed: 'rgba(239,68,68,0.15)',
    equal: 'transparent',
};
const OP_TEXT_COLORS = {
    added: '#4ade80',
    removed: '#f87171',
    equal: '#94a3b8',
};

function FileDropZone({ label, file, onFile }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handle = useCallback(
        (f) => { if (f && f.type === 'application/pdf') onFile(f); },
        [onFile]
    );

    return (
        <div
            style={{
                flex: 1,
                border: `2px dashed ${dragging ? '#3b82f6' : 'rgba(148,163,184,0.3)'}`,
                borderRadius: 12,
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? 'rgba(59,130,246,0.07)' : 'rgba(15,23,42,0.5)',
                transition: 'all .2s',
            }}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
                e.preventDefault();
                setDragging(false);
                handle(e.dataTransfer.files[0]);
            }}
        >
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={e => handle(e.target.files[0])}
            />
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{label}</div>
            {file
                ? <div style={{ color: '#4ade80', fontSize: 13 }}>✓ {file.name} ({(file.size / 1024).toFixed(0)} KB)</div>
                : <div style={{ color: '#64748b', fontSize: 13 }}>Drag & drop or click to upload PDF</div>
            }
        </div>
    );
}

export default function PDFDiffPanel() {
    const [fileA, setFileA] = useState(null);
    const [fileB, setFileB] = useState(null);
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState('idle'); // idle | extracting | diffing | summarising | done | error
    const [errorMsg, setErrorMsg] = useState('');
    const [hunks, setHunks] = useState([]);
    const [totalChanges, setTotalChanges] = useState({ added: 0, removed: 0 });
    const [summary, setSummary] = useState('');
    const [showEqual, setShowEqual] = useState(false);

    const run = useCallback(async () => {
        if (!fileA || !fileB) return;
        setStatus('extracting');
        setErrorMsg('');
        setSummary('');
        setHunks([]);
        try {
            // 1. Extract text
            setStatus('extracting');
            const [pagesA, pagesB] = await Promise.all([
                extractPDFText(fileA),
                extractPDFText(fileB),
            ]);

            // 2. Flatten to line arrays
            setStatus('diffing');
            const linesA = flattenPages(pagesA);
            const linesB = flattenPages(pagesB);

            // 3. Diff
            const ops = diffLines(linesA, linesB);
            const addedCount = ops.filter(o => o.type === 'added').length;
            const removedCount = ops.filter(o => o.type === 'removed').length;
            setTotalChanges({ added: addedCount, removed: removedCount });
            const h = buildHunks(ops);
            setHunks(h);

            // 4. LLM summary (optional)
            if (apiKey.trim()) {
                setStatus('summarising');
                const changeText = buildChangeSummaryText(h);
                if (changeText.trim()) {
                    const s = await summariseWithLLM(changeText, apiKey.trim());
                    setSummary(s);
                } else {
                    setSummary('No changes detected between the two documents.');
                }
            }

            setStatus('done');
        } catch (e) {
            console.error(e);
            setErrorMsg(e.message);
            setStatus('error');
        }
    }, [fileA, fileB, apiKey]);

    const canRun = fileA && fileB && status !== 'extracting' && status !== 'diffing' && status !== 'summarising';

    const statusLabel = {
        idle: '',
        extracting: '📖 Extracting text from PDFs…',
        diffing: '🔍 Computing changes…',
        summarising: '🤖 Generating LLM summary…',
        done: '',
        error: '',
    }[status];

    return (
        <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
            {/* Title */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ color: '#f1f5f9', margin: 0, fontSize: 22, fontWeight: 700 }}>
                    📋 PDF Change Detection
                </h2>
                <p style={{ color: '#94a3b8', margin: '6px 0 0', fontSize: 14 }}>
                    Upload two PDF documents, detect every change (text, tables, values), and get an AI-generated summary.
                </p>
            </div>

            {/* Upload row */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <FileDropZone label="Document A (Original)" file={fileA} onFile={setFileA} />
                <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: 20 }}>→</div>
                <FileDropZone label="Document B (Revised)" file={fileB} onFile={setFileB} />
            </div>

            {/* API key + run button */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>
                        OpenAI API Key <span style={{ color: '#64748b' }}>(optional — for AI summary)</span>
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        style={{
                            width: '100%',
                            background: 'rgba(15,23,42,0.8)',
                            border: '1px solid rgba(148,163,184,0.2)',
                            borderRadius: 8,
                            padding: '8px 12px',
                            color: '#f1f5f9',
                            fontSize: 14,
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
                <button
                    onClick={run}
                    disabled={!canRun}
                    style={{
                        padding: '9px 28px',
                        background: canRun ? '#3b82f6' : '#1e3a5f',
                        color: canRun ? '#fff' : '#64748b',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: canRun ? 'pointer' : 'not-allowed',
                        transition: 'background .2s',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {status === 'extracting' || status === 'diffing' || status === 'summarising'
                        ? '⏳ Processing…'
                        : '▶ Detect Changes'}
                </button>
            </div>

            {/* Status bar */}
            {statusLabel && (
                <div style={{ color: '#60a5fa', fontSize: 14, marginBottom: 16 }}>{statusLabel}</div>
            )}

            {/* Error */}
            {status === 'error' && (
                <div style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    color: '#f87171',
                    marginBottom: 16,
                }}>
                    ⚠ {errorMsg}
                </div>
            )}

            {/* Stats */}
            {status === 'done' && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Lines Added', value: totalChanges.added, color: '#4ade80' },
                        { label: 'Lines Removed', value: totalChanges.removed, color: '#f87171' },
                        { label: 'Change Hunks', value: hunks.length, color: '#60a5fa' },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: 'rgba(15,23,42,0.7)',
                            border: '1px solid rgba(148,163,184,0.15)',
                            borderRadius: 10,
                            padding: '12px 20px',
                            minWidth: 130,
                        }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                            <div style={{ color: '#94a3b8', fontSize: 13 }}>{s.label}</div>
                        </div>
                    ))}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 14, cursor: 'pointer', marginLeft: 'auto' }}>
                        <input type="checkbox" checked={showEqual} onChange={e => setShowEqual(e.target.checked)} />
                        Show unchanged lines
                    </label>
                </div>
            )}

            {/* AI Summary */}
            {summary && (
                <div style={{
                    background: 'rgba(59,130,246,0.07)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: 12,
                    padding: '16px 20px',
                    marginBottom: 24,
                }}>
                    <h3 style={{ color: '#60a5fa', margin: '0 0 10px', fontSize: 16 }}>🤖 AI Change Summary</h3>
                    <pre style={{
                        margin: 0,
                        color: '#e2e8f0',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 14,
                        lineHeight: 1.7,
                    }}>{summary}</pre>
                </div>
            )}

            {/* No changes */}
            {status === 'done' && hunks.length === 0 && (
                <div style={{
                    background: 'rgba(34,197,94,0.07)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    borderRadius: 10,
                    padding: '16px 20px',
                    color: '#4ade80',
                    fontSize: 15,
                }}>
                    ✅ No differences found — the two documents are identical.
                </div>
            )}

            {/* Diff view */}
            {hunks.length > 0 && (
                <div>
                    <h3 style={{ color: '#f1f5f9', fontSize: 16, marginBottom: 12 }}>
                        Detected Changes ({hunks.length} hunk{hunks.length !== 1 ? 's' : ''})
                    </h3>
                    <div style={{
                        background: 'rgba(15,23,42,0.8)',
                        border: '1px solid rgba(148,163,184,0.15)',
                        borderRadius: 10,
                        overflow: 'auto',
                        maxHeight: 520,
                    }}>
                        {hunks.map((hunk, hi) => (
                            <div key={hi} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                                <div style={{
                                    background: 'rgba(59,130,246,0.12)',
                                    padding: '4px 12px',
                                    color: '#60a5fa',
                                    fontSize: 12,
                                    fontFamily: 'JetBrains Mono, monospace',
                                }}>
                                    @@ Change hunk {hi + 1}
                                </div>
                                {hunk.ops
                                    .filter(op => showEqual || op.type !== 'equal')
                                    .map((op, oi) => (
                                        <div
                                            key={oi}
                                            style={{
                                                display: 'flex',
                                                background: OP_COLORS[op.type],
                                                padding: '2px 12px',
                                                fontFamily: 'JetBrains Mono, monospace',
                                                fontSize: 13,
                                                lineHeight: 1.6,
                                                wordBreak: 'break-all',
                                            }}
                                        >
                                            <span style={{
                                                color: OP_TEXT_COLORS[op.type],
                                                minWidth: 16,
                                                userSelect: 'none',
                                            }}>
                                                {op.type === 'added' ? '+' : op.type === 'removed' ? '-' : ' '}
                                            </span>
                                            <span style={{ color: op.type === 'equal' ? '#64748b' : '#e2e8f0' }}>
                                                {op.text}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
