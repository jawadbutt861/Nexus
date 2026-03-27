import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import SignatureCanvas from 'react-signature-canvas';
import {
  Upload, FileText, Eye, Pen, Trash2, Download,
  CheckCircle, Clock, Edit3, X, File
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

type DocStatus = 'draft' | 'in_review' | 'signed';

interface Doc {
  id: string;
  name: string;
  size: string;
  type: string;
  status: DocStatus;
  uploadedAt: string;
  ownerId: string;
  dataUrl?: string;
  signatureDataUrl?: string;
}

const statusConfig: Record<DocStatus, { label: string; variant: 'gray' | 'warning' | 'success'; icon: React.ReactNode }> = {
  draft: { label: 'Draft', variant: 'gray', icon: <Edit3 size={12} /> },
  in_review: { label: 'In Review', variant: 'warning', icon: <Clock size={12} /> },
  signed: { label: 'Signed', variant: 'success', icon: <CheckCircle size={12} /> },
};

const initialDocs: Doc[] = [
  { id: 'd1', name: 'Term Sheet v2.pdf', size: '245 KB', type: 'pdf', status: 'in_review', uploadedAt: '2026-03-20', ownerId: 'e1' },
  { id: 'd2', name: 'NDA Agreement.pdf', size: '128 KB', type: 'pdf', status: 'signed', uploadedAt: '2026-03-15', ownerId: 'e1' },
  { id: 'd3', name: 'Pitch Deck.pdf', size: '3.2 MB', type: 'pdf', status: 'draft', uploadedAt: '2026-03-25', ownerId: 'i1' },
];

export const DocumentChamberPage: React.FC = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);
  const [signDoc, setSignDoc] = useState<Doc | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | DocStatus>('all');
  const sigRef = useRef<SignatureCanvas>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newDoc: Doc = {
          id: `d${Date.now()}`,
          name: file.name,
          size: file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`,
          type: file.name.split('.').pop() || 'file',
          status: 'draft',
          uploadedAt: new Date().toISOString().split('T')[0],
          ownerId: user?.id || '',
          dataUrl: reader.result as string,
        };
        setDocs(prev => [newDoc, ...prev]);
        toast.success(`${file.name} uploaded`);
      };
      reader.readAsDataURL(file);
    });
  }, [user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'image/*': ['.png', '.jpg', '.jpeg'] },
  });

  const updateStatus = (id: string, status: DocStatus) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    toast.success(`Document marked as ${statusConfig[status].label}`);
  };

  const deleteDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    toast.success('Document deleted');
  };

  const saveSignature = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error('Please draw your signature');
      return;
    }
    const sigDataUrl = sigRef.current.toDataURL();
    setDocs(prev => prev.map(d => d.id === signDoc?.id ? { ...d, status: 'signed', signatureDataUrl: sigDataUrl } : d));
    toast.success('Document signed successfully');
    setSignDoc(null);
  };

  const filtered = activeTab === 'all' ? docs : docs.filter(d => d.status === activeTab);
  const tabs: Array<'all' | DocStatus> = ['all', 'draft', 'in_review', 'signed'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Document Chamber</h1>
        <p className="text-gray-600">Upload, review, and sign deal documents</p>
      </div>

      {/* Upload zone */}
      <Card>
        <CardBody>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}`}
          >
            <input {...getInputProps()} />
            <Upload size={36} className={`mx-auto mb-3 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`} />
            <p className="text-gray-700 font-medium">
              {isDragActive ? 'Drop files here...' : 'Drag & drop files, or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX, PNG, JPG supported</p>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'all' ? 'All' : tab === 'in_review' ? 'In Review' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {tab === 'all' ? docs.length : docs.filter(d => d.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Document list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
            <p>No documents found</p>
          </div>
        )}
        {filtered.map(doc => (
          <Card key={doc.id}>
            <CardBody>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-primary-50 rounded-lg shrink-0">
                    <File size={20} className="text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.size} · Uploaded {doc.uploadedAt}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={statusConfig[doc.status].variant} size="sm">
                    <span className="flex items-center gap-1">
                      {statusConfig[doc.status].icon}
                      {statusConfig[doc.status].label}
                    </span>
                  </Badge>

                  <Button size="xs" variant="ghost" leftIcon={<Eye size={14} />} onClick={() => setPreviewDoc(doc)}>
                    Preview
                  </Button>

                  {doc.status !== 'signed' && (
                    <Button size="xs" variant="ghost" leftIcon={<Pen size={14} />} onClick={() => setSignDoc(doc)}>
                      Sign
                    </Button>
                  )}

                  {doc.status === 'draft' && (
                    <Button size="xs" variant="outline" onClick={() => updateStatus(doc.id, 'in_review')}>
                      Submit
                    </Button>
                  )}

                  <button onClick={() => deleteDoc(doc.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {doc.signatureDataUrl && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Signature:</p>
                  <img src={doc.signatureDataUrl} alt="Signature" className="h-10 border border-gray-200 rounded" />
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-gray-900">{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {previewDoc.dataUrl && previewDoc.type === 'pdf' ? (
                <iframe src={previewDoc.dataUrl} className="w-full h-96 rounded border" title="PDF Preview" />
              ) : previewDoc.dataUrl && previewDoc.type !== 'pdf' ? (
                <img src={previewDoc.dataUrl} alt={previewDoc.name} className="max-w-full rounded" />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <FileText size={64} className="mb-4" />
                  <p className="text-lg font-medium text-gray-600">{previewDoc.name}</p>
                  <p className="text-sm mt-1">{previewDoc.size} · {previewDoc.type.toUpperCase()}</p>
                  <Badge variant={statusConfig[previewDoc.status].variant} className="mt-3">
                    {statusConfig[previewDoc.status].label}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Signature modal */}
      {signDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Sign: {signDoc.name}</h3>
              <button onClick={() => setSignDoc(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Draw your signature below:</p>
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              <SignatureCanvas
                ref={sigRef}
                penColor="#1D4ED8"
                canvasProps={{ width: 460, height: 160, className: 'w-full' }}
              />
            </div>
            <div className="flex gap-3 mt-4">
              <Button fullWidth onClick={saveSignature} leftIcon={<CheckCircle size={16} />}>
                Sign Document
              </Button>
              <Button fullWidth variant="outline" onClick={() => sigRef.current?.clear()}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
