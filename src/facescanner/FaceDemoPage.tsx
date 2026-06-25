import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import FaceScanner, { FaceScannerMode } from './FaceScanner';
import {
  FaceEnrollmentRecord,
  getEnrolledList,
  getEnrollment,
  saveEnrollment,
} from './faceEmbeddingCache';
import { enrollFace, verifyFace } from './faceDemoApi';

const FaceDemoPage = () => {
  const [employees, setEmployees] = useState<FaceEnrollmentRecord[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const [activeMode, setActiveMode] = useState<FaceScannerMode | null>(null);
  const [scannerKey, setScannerKey] = useState(0);
  const [status, setStatus] = useState(
    'Select an employee from the list to verify, or enter a new ID to enroll.',
  );
  const [result, setResult] = useState<{ text: string; success: boolean } | null>(null);
  const [processing, setProcessing] = useState(false);

  const refreshList = useCallback(() => {
    setEmployees(getEnrolledList());
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const showResult = (data: unknown, success: boolean) => {
    setResult({
      text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      success,
    });
  };

  const hideResult = () => setResult(null);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const selectEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setStatus(`Selected ${employeeId}. Click Verify Face to login.`);
  };

  const stopScanning = () => {
    setActiveMode(null);
    setScannerKey((k) => k + 1);
  };

  const startScanning = (mode: FaceScannerMode) => {
    hideResult();
    setActiveMode(mode);
    setScannerKey((k) => k + 1);
    setStatus(
      mode === 'enroll'
        ? 'Follow the pose prompts to enroll…'
        : 'Look at the camera and hold still…',
    );
  };

  const handleEnrollClick = () => {
    const id = employeeIdInput.trim();
    if (!id) {
      setStatus('Enter an employee ID to enroll.');
      return;
    }
    startScanning('enroll');
  };

  const handleVerifyClick = () => {
    if (!selectedEmployeeId) return;
    if (!getEnrollment(selectedEmployeeId)) {
      setStatus('No cached embedding for this employee. Enroll again.');
      return;
    }
    startScanning('verify');
  };

  const handleScanComplete = async (images: string[]) => {
    const mode = activeMode;
    stopScanning();
    setProcessing(true);
    setStatus('Processing images…');

    try {
      if (mode === 'enroll') {
        const id = employeeIdInput.trim();
        if (!id) return;

        const data = await enrollFace(id, images);
        saveEnrollment({
          employeeId: data.employeeId,
          embedding: data.embedding,
          dimension: data.dimension,
          enrolledAt: new Date().toISOString(),
          maxPoseDistance: data.maxPoseDistance,
        });
        setStatus(`Enrollment successful for ${id}`);
        showResult(data, true);
        setEmployeeIdInput('');
        selectEmployee(id);
        refreshList();
      } else if (mode === 'verify' && selectedEmployeeId) {
        const enrollment = getEnrollment(selectedEmployeeId);
        if (!enrollment) {
          setStatus('No cached embedding found. Please enroll first.');
          return;
        }

        const data = await verifyFace(selectedEmployeeId, enrollment.embedding, images);
        setStatus(data.match ? 'Login successful — face matched' : 'Login failed — no match');
        showResult(data, data.match);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Request failed');
      setStatus(`Request failed: ${message}`);
      showResult(message, false);
    } finally {
      setProcessing(false);
    }
  };

  const handleScanError = (message: string) => {
    setStatus(`Scanner error: ${message}`);
    stopScanning();
    showResult(message, false);
  };

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-[#2B3674] mb-1">Face ML Demo</h1>
      <p className="text-slate-500 text-sm mb-6">
        Select an enrolled employee to verify, or enroll a new one. Embeddings are stored in this
        browser session only.
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#2B3674]">Login — enrolled employees</h2>
          <button
            type="button"
            onClick={refreshList}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <ul className="border border-slate-200 rounded-lg overflow-hidden mb-4 max-h-52 overflow-y-auto">
          {employees.length === 0 ? (
            <li className="px-4 py-4 text-center text-slate-500 text-sm">
              No enrolled employees yet. Enroll one below.
            </li>
          ) : (
            employees.map((emp) => (
              <li key={emp.employeeId} className="border-b border-slate-200 last:border-b-0">
                <button
                  type="button"
                  onClick={() => selectEmployee(emp.employeeId)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    selectedEmployeeId === emp.employeeId
                      ? 'bg-blue-50 text-blue-800 shadow-[inset_3px_0_0_#3b82f6]'
                      : 'bg-white text-[#2B3674] hover:bg-slate-50'
                  }`}
                >
                  {emp.employeeId}
                  <span className="block text-xs text-slate-400 mt-1">
                    Enrolled {formatDate(emp.enrolledAt)}
                    {emp.dimension ? ` · ${emp.dimension}-d` : ''}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        {selectedEmployeeId && (
          <div className="inline-block px-3 py-1.5 mb-3 text-sm bg-blue-50 border border-blue-200 rounded-md text-blue-700">
            Logged in as: <strong>{selectedEmployeeId}</strong>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            type="button"
            onClick={handleVerifyClick}
            disabled={!selectedEmployeeId || !!activeMode || processing}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify Face (Login)
          </button>
        </div>

        <hr className="border-slate-200 my-5" />

        <h2 className="text-sm font-semibold text-[#2B3674] mb-3">Enroll new employee</h2>
        <label htmlFor="employeeId" className="block text-xs text-slate-500 mb-1.5">
          Employee ID
        </label>
        <input
          id="employeeId"
          type="text"
          value={employeeIdInput}
          onChange={(e) => setEmployeeIdInput(e.target.value)}
          placeholder="e.g. EMP001"
          autoComplete="off"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleEnrollClick}
            disabled={!!activeMode || processing}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enroll Face
          </button>
          {activeMode && (
            <button
              type="button"
              onClick={() => {
                stopScanning();
                setStatus('Scan cancelled.');
              }}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-500 text-white hover:bg-slate-600"
            >
              Cancel Scan
            </button>
          )}
        </div>

        <p className="mt-4 text-sm text-slate-600">{status}</p>

        {result && (
          <pre
            className={`mt-3 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap break-all ${
              result.success
                ? 'border border-green-300 bg-green-50 text-green-900'
                : 'border border-red-300 bg-red-50 text-red-900'
            }`}
          >
            {result.text}
          </pre>
        )}

        <p className="mt-3 text-xs text-slate-400">
          Enrollment uses 5 poses; verification uses 3 frames. Data is sent via NestJS to the Python
          face service.
        </p>
      </div>

      {activeMode && (
        <FaceScanner
          key={scannerKey}
          mode={activeMode}
          onComplete={handleScanComplete}
          onError={handleScanError}
        />
      )}
    </div>
  );
};

export default FaceDemoPage;
