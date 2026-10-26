"use client";

import React, { useEffect, useState } from "react";
import { Printer, X, ShieldCheck, CheckCircle2 } from "lucide-react";

interface COAModalProps {
  coaId: string | null;
  onClose: () => void;
}

export function COAModal({ coaId, onClose }: COAModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coaId) return;
    setLoading(true);
    fetch(`/api/qc/coa/${coaId}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [coaId]);

  if (!coaId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-300 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none">
        {/* Actions bar (hidden in print) */}
        <div className="bg-slate-900 px-6 py-3 flex items-center justify-between text-white print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">Official Analytical Certificate Viewer</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (High quality printable layout) */}
        <div className="p-8 font-sans text-slate-900">
          {loading ? (
            <div className="py-20 text-center text-slate-500 font-medium">
              Generating Certificate of Analysis...
            </div>
          ) : data && !data.error ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                  Nagdev Products
                </h1>
                <p className="text-xs uppercase tracking-widest font-semibold text-amber-800 mt-0.5">
                  Castor Oil Manufacturing & Derivatives Processing Complex
                </p>
                <p className="text-xs text-slate-600 mt-1">{data.facility?.address}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{data.facility?.license}</p>
              </div>

              {/* Certificate Title */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-lg font-bold uppercase text-slate-900">
                    Certificate of Analysis (COA)
                  </h2>
                  <p className="text-xs text-slate-500">Conforming to Bureau of Indian Standards (IS 435:1973)</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-500 uppercase">COA Number</div>
                  <div className="font-mono text-sm font-bold text-amber-700">{data.coaNumber}</div>
                  <div className="text-xs text-slate-500">Date: {data.date}</div>
                </div>
              </div>

              {/* Sample Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500">Product Name:</span>{" "}
                  <strong className="text-slate-900">{data.productName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Quality Grade:</span>{" "}
                  <strong className="text-slate-900">{data.grade}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Batch / Lot Reference:</span>{" "}
                  <strong className="text-slate-900 font-mono">{data.batchReference}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Lab Sample Code:</span>{" "}
                  <strong className="text-slate-900 font-mono">{data.sampleCode}</strong>
                </div>
              </div>

              {/* Analysis Parameters Table */}
              <div>
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold">
                      <th className="p-2.5 border border-slate-700">Analytical Parameter</th>
                      <th className="p-2.5 border border-slate-700">Test Method</th>
                      <th className="p-2.5 border border-slate-700">Unit</th>
                      <th className="p-2.5 border border-slate-700">IS 435 Standard Limit</th>
                      <th className="p-2.5 border border-slate-700">Observed Result</th>
                      <th className="p-2.5 border border-slate-700 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.specifications?.map((spec: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                        <td className="p-2.5 border border-slate-200 font-medium text-slate-900">
                          {spec.parameter}
                        </td>
                        <td className="p-2.5 border border-slate-200 text-slate-500">{spec.testMethod}</td>
                        <td className="p-2.5 border border-slate-200 text-slate-600">{spec.unit}</td>
                        <td className="p-2.5 border border-slate-200 font-mono text-slate-700">
                          {spec.standardLimit}
                        </td>
                        <td className="p-2.5 border border-slate-200 font-mono font-bold text-slate-900">
                          {spec.actualResult}
                        </td>
                        <td className="p-2.5 border border-slate-200 text-center">
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {spec.compliance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Remarks */}
              <div className="text-xs p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
                <span className="font-bold text-amber-900">Analytical Remarks: </span>
                <span className="text-slate-700">{data.remarks}</span>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
                <div className="text-center">
                  <div className="border-b border-dashed border-slate-400 pb-8 text-slate-400 italic">
                    [Digitally Signed by Testing Chemist]
                  </div>
                  <div className="mt-2 font-bold text-slate-900">{data.testedBy}</div>
                  <div className="text-slate-500">Quality Control Analytical Chemist</div>
                </div>
                <div className="text-center">
                  <div className="border-b border-dashed border-slate-400 pb-8 text-slate-400 italic">
                    [Approved & Authenticated by Chief Quality Officer]
                  </div>
                  <div className="mt-2 font-bold text-slate-900">{data.approvedBy}</div>
                  <div className="text-slate-500">Head of Plant Quality & Technical Compliance</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-rose-600 py-10">
              Unable to load Certificate of Analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
