'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { useAppStore } from '@/store';
import Link from 'next/link';

export default function ImportPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const EXPECTED_FIELDS = ['name', 'email', 'phone', 'tier', 'city'];

  const processFile = (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);
    setHeaders([]);
    setPreviewData([]);
    
    if (selectedFile.size === 0) {
      setError("File is empty.");
      setFile(null);
      return;
    }

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (ext === 'csv') {
      Papa.parse(selectedFile, {
        header: true,
        preview: 10,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.meta.fields || results.meta.fields.length === 0) {
            setError("No headers detected in CSV file.");
            setFile(null);
            return;
          }
          setHeaders(results.meta.fields);
          setPreviewData(results.data);
          autoMap(results.meta.fields);
        },
        error: () => {
          setError("Error parsing CSV file.");
          setFile(null);
        }
      });
    } else if (ext === 'xlsx') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const XLSX = await import('xlsx');
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json: any[] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          if (json.length === 0 || json[0].length === 0) {
            setError("No headers detected in XLSX file.");
            setFile(null);
            return;
          }
          
          const parsedHeaders = json[0] as string[];
          const dataRows = json.slice(1, 11).map((row: any[]) => {
            let obj: any = {};
            parsedHeaders.forEach((h, i) => { obj[h] = row[i]; });
            return obj;
          });
          
          setHeaders(parsedHeaders);
          setPreviewData(dataRows);
          autoMap(parsedHeaders);
        } catch (err) {
          setError("Error parsing XLSX file.");
          setFile(null);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      setError("Unsupported file format. Please use CSV or XLSX.");
      setFile(null);
    }
  };

  const autoMap = (detectedHeaders: string[]) => {
    const initialMapping: Record<string, string> = {};
    detectedHeaders.forEach(h => {
      const lower = h.toLowerCase();
      if (lower.includes('name')) initialMapping[h] = 'name';
      else if (lower.includes('email')) initialMapping[h] = 'email';
      else if (lower.includes('phone') || lower.includes('mobile')) initialMapping[h] = 'phone';
      else if (lower.includes('tier') || lower.includes('level')) initialMapping[h] = 'tier';
      else if (lower.includes('city') || lower.includes('location')) initialMapping[h] = 'city';
      else initialMapping[h] = '';
    });
    setMapping(initialMapping);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const { addNotification, addAuditLog } = useAppStore();

  const handleGenerateMockData = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/mock-data', { method: 'POST' });
      if (res.ok) {
        addNotification({ title: 'Data Imported', message: 'Mock data was successfully generated.' });
        addAuditLog({ action: 'Data Import', details: 'Generated Mock Data' });
        router.push('/dashboard?showShoppers=true');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.details || data.error || "Internal Server Error");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate mock data: " + String(err));
    } finally {
      setGenerating(false);
    }
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setFile(null);
      setHeaders([]);
      setPreviewData([]);
      addNotification({ title: 'File Uploaded', message: 'Data ingestion successful.' });
      addAuditLog({ action: 'File Uploaded', details: 'Imported local file' });
      router.push('/dashboard');
    }, 2000);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-margin-mobile md:p-margin-desktop w-full pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div>
          <h1 className="font-display-lg text-display-lg font-bold text-on-surface">Data Ingestion</h1>
          <p className="text-on-surface-variant mt-xs">Import external audience datasets into your intelligence terminal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Main Upload Zone */}
        <div className="lg:col-span-2 space-y-lg">
          {error && (
            <div className="bg-error-container text-error px-md py-sm rounded-lg border border-error/50 flex items-center gap-sm">
              <span className="material-symbols-outlined text-sm">error</span>
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <div 
            className={`glass-card rounded-xl p-xl flex flex-col items-center justify-center text-center border-2 border-dashed transition-all duration-300 min-h-[320px] relative ${
              isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-outline-variant'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".csv, .xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {!file ? (
              <>
                <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center text-primary mb-md shadow-lg shadow-background/50">
                  <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">Drop your dataset here</h3>
                <p className="text-on-surface-variant mb-md">Supports CSV and XLSX formats.</p>
                <button 
                  onClick={handleBrowseClick}
                  className="px-lg py-sm bg-surface-container border border-outline-variant text-on-surface font-bold rounded hover:bg-surface-container-high transition-colors"
                >
                  Browse Local Files
                </button>
              </>
            ) : (
              <div className="w-full flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container mb-md">
                  <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>description</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-xs truncate max-w-sm">{file.name}</h3>
                <p className="font-data-tabular text-data-tabular text-tertiary mb-lg">{(file.size / 1024).toFixed(1)} KB • Parsed Successfully</p>
                
                {isUploading ? (
                  <div className="w-full max-w-sm space-y-sm">
                    <div className="flex justify-between text-label-xs">
                      <span className="text-primary font-bold uppercase tracking-wider">Importing Data...</span>
                      <span className="font-data-tabular">76%</span>
                    </div>
                    <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[76%] animate-pulse"></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-md w-full max-w-sm">
                    <button 
                      onClick={() => { setFile(null); setHeaders([]); setPreviewData([]); }} 
                      className="flex-1 py-sm bg-surface-container text-on-surface-variant border border-outline-variant rounded hover:text-error hover:border-error/50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={simulateUpload}
                      className="flex-1 py-sm bg-primary text-on-primary font-bold rounded hover:bg-primary/90 transition-colors flex items-center justify-center gap-xs"
                    >
                      <span className="material-symbols-outlined text-sm">rocket_launch</span> Start Import
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mapping UI & Preview */}
          {file && headers.length > 0 && !isUploading && (
            <div className="glass-card rounded-xl p-lg animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Column Mapping</h3>
              <p className="text-on-surface-variant text-sm mb-lg">Map your file columns to standard <Link href="/" className="text-primary hover:underline transition-colors">Synara</Link> fields.</p>
              
              <div className="grid md:grid-cols-2 gap-md mb-xl">
                {headers.map(h => (
                  <div key={h} className="flex items-center justify-between bg-surface-container-low p-sm rounded border border-outline-variant/50">
                    <span className="text-sm font-bold truncate max-w-[50%]">{h}</span>
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">arrow_right_alt</span>
                    <select 
                      className="bg-surface border border-outline-variant rounded text-xs p-1"
                      value={mapping[h] || ''}
                      onChange={e => setMapping({...mapping, [h]: e.target.value})}
                    >
                      <option value="">-- Ignore --</option>
                      {EXPECTED_FIELDS.map(f => (
                        <option key={f} value={f}>{f.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Data Preview</h3>
              <div className="overflow-x-auto rounded border border-outline-variant/30">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container/50">
                    <tr>
                      <th className="p-sm text-outline font-bold tracking-wider w-10">#</th>
                      {headers.map(h => (
                        <th key={h} className="p-sm text-outline font-bold tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {previewData.map((row, i) => (
                      <tr key={i} className="hover:bg-surface-container-low/50">
                        <td className="p-sm font-mono text-xs text-on-surface-variant">{i + 1}</td>
                        {headers.map(h => (
                          <td key={h} className="p-sm truncate max-w-[150px]">{row[h] || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Requirements & Info Sidebar */}
        <div className="lg:col-span-1 space-y-lg">
          <div className="glass-card rounded-xl p-lg">
            <div className="flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined text-on-surface-variant">info</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Data Guidelines</h3>
            </div>
            <ul className="space-y-md">
              <li className="flex gap-sm">
                <span className="material-symbols-outlined text-tertiary text-sm mt-1">check_circle</span>
                <div>
                  <p className="text-body-md font-bold text-on-surface">Required Fields</p>
                  <p className="text-on-surface-variant text-sm mt-xs">Email or Phone Number is strictly required to resolve identity.</p>
                </div>
              </li>
              <li className="flex gap-sm">
                <span className="material-symbols-outlined text-tertiary text-sm mt-1">check_circle</span>
                <div>
                  <p className="text-body-md font-bold text-on-surface">Date Formats</p>
                  <p className="text-on-surface-variant text-sm mt-xs">Use ISO 8601 (YYYY-MM-DD) for guaranteed parsing.</p>
                </div>
              </li>
              <li className="flex gap-sm">
                <span className="material-symbols-outlined text-error text-sm mt-1">warning</span>
                <div>
                  <p className="text-body-md font-bold text-on-surface">Size Limits</p>
                  <p className="text-on-surface-variant text-sm mt-xs">Maximum 50MB per file. For larger datasets, use the API.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Test Drive Workspace Card */}
          <div className="glass-card rounded-xl p-lg bg-surface-container-high border border-outline-variant/30">
            <div className="flex items-center gap-sm mb-sm">
              <span className="material-symbols-outlined text-primary">science</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Test Drive <Link href="/" className="hover:text-primary transition-colors">Synara</Link></h3>
            </div>
            <p className="text-body-md text-on-surface-variant mb-md">
              Don't have real data handy? Populate your workspace with realistic mock data tailored to your industry segment.
            </p>
            <button 
              type="button"
              onClick={handleGenerateMockData}
              disabled={generating}
              className="w-full bg-surface-variant text-on-surface px-lg py-sm rounded-lg font-bold hover:border-primary border border-outline-variant/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-sm"
            >
              {generating ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">database</span>
                  Generate Mock Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}