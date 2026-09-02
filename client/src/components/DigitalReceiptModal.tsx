import React from 'react';
import { Printer, CheckCircle, ShieldCheck, X } from 'lucide-react';

interface DigitalReceiptModalProps {
  receipt: any;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header Actions */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print / Download PDF
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            <X size={16} /> Close
          </button>
        </div>

        {/* Official Printable Receipt Document */}
        <div
          style={{
            border: '2px solid var(--color-primary-800)',
            borderRadius: '8px',
            padding: '24px',
            backgroundColor: '#ffffff',
            color: '#1f2937',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Emblem / Official Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-800)', letterSpacing: '0.05em' }}>
              GOVERNMENT OF INDIA • DEPARTMENT OF FOOD & PUBLIC DISTRIBUTION
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-900)', marginTop: '4px' }}>
              OFFICIAL MANDI PROCUREMENT & DBT REMITTANCE ADVICE
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', marginTop: '2px' }}>
              NIVARAN Smart Agricultural Procurement Management Platform
            </div>
          </div>

          {/* Receipt Meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '16px' }}>
            <div>
              <strong>Receipt No:</strong> {receipt.receiptNumber}<br />
              <strong>Date & Time:</strong> {new Date(receipt.issueDate).toLocaleString('en-IN')}
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>Token No:</strong> #{receipt.produceDetails.tokenNumber}<br />
              <strong>Status:</strong> <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>PROCURED & CONFIRMED</span>
            </div>
          </div>

          {/* Farmer & Centre Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.84rem', marginBottom: '20px', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-primary-900)', marginBottom: '4px' }}>FARMER DETAILS</div>
              <div><strong>Name:</strong> {receipt.farmer.fullName}</div>
              <div><strong>Farmer ID:</strong> {receipt.farmer.farmerId}</div>
              <div><strong>Village/District:</strong> {receipt.farmer.village}, {receipt.farmer.district}</div>
              <div><strong>Bank Account:</strong> {receipt.farmer.bankName} ({receipt.farmer.accountNumberMasked})</div>
              <div><strong>IFSC Code:</strong> {receipt.farmer.ifscCode}</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-primary-900)', marginBottom: '4px' }}>PROCUREMENT CENTRE</div>
              <div><strong>Centre Code:</strong> {receipt.procurementCentre.centreCode}</div>
              <div><strong>Name:</strong> {receipt.procurementCentre.name}</div>
              <div><strong>Location:</strong> {receipt.procurementCentre.address}</div>
              <div><strong>Quality Grade:</strong> {receipt.produceDetails.grade} (PASSED)</div>
            </div>
          </div>

          {/* Produce & Payment Breakdown Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '8px', border: '1px solid #d1d5db' }}>Description</th>
                <th style={{ padding: '8px', border: '1px solid #d1d5db' }}>Weight / Qty</th>
                <th style={{ padding: '8px', border: '1px solid #d1d5db' }}>MSP Rate (₹/Qtl)</th>
                <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                  {receipt.produceDetails.crop} (Certified Food Grain)
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                  {receipt.produceDetails.acceptedQuantity} Quintal
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                  ₹{receipt.produceDetails.procurementRatePerQuintal.toFixed(2)}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right', fontWeight: 700 }}>
                  ₹{receipt.produceDetails.payableAmount.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 800 }}>
                <td colSpan={3} style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                  TOTAL DIRECT BENEFIT TRANSFER (DBT) PAYABLE:
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right', color: 'var(--color-primary-800)', fontSize: '1rem' }}>
                  ₹{receipt.produceDetails.payableAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Payment & DBT Note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '20px' }}>
            <ShieldCheck size={20} color="#059669" />
            <div>
              <strong>DBT Settlement Status:</strong> {receipt.paymentStatus} (Reference: {receipt.paymentReference}). Funds are directly remitted to Aadhaar-seeded bank account under PFMS guidelines within 48 hours.
            </div>
          </div>

          {/* Signatures & Security Stamp */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '16px', borderTop: '1px dashed #9ca3af', fontSize: '0.8rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '40px' }} />
              <div style={{ borderTop: '1px solid #4b5563', paddingTop: '4px' }}>Farmer Signature / Thumb</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '40px' }} />
              <div style={{ borderTop: '1px solid #4b5563', paddingTop: '4px' }}>Weighbridge Operator</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '40px' }} />
              <div style={{ borderTop: '1px solid #4b5563', paddingTop: '4px' }}>Centre In-Charge / Official Stamp</div>
            </div>
          </div>

          {/* QR Verification String */}
          <div style={{ marginTop: '16px', fontSize: '0.7rem', color: '#6b7280', textAlign: 'center', wordBreak: 'break-all' }}>
            Digital Verification Hash: {receipt.qrVerificationData}
          </div>
        </div>
      </div>
    </div>
  );
};
