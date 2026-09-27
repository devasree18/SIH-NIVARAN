import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:go_router/go_router.dart';

class DigitalGatePassScreen extends StatelessWidget {
  final String tokenId;

  const DigitalGatePassScreen({super.key, required this.tokenId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Digital Gate Pass & Income Receipt', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF4F46E5),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF3730A3), width: 2),
            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)],
          ),
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Text(
                'MINISTRY OF AGRICULTURE • MANDISYNC',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 1),
              ),
              const SizedBox(height: 4),
              const Text(
                'Official Mandi Gate Pass Certificate',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const Text(
                'Karnal Central Mandi Hub (KNL-MANDI-01)',
                style: TextStyle(fontSize: 12, color: Color(0xFF475569)),
              ),

              const Divider(height: 30, thickness: 1),

              // QR Code
              QrImageView(
                data: 'MANDISYNC:$tokenId:RameshKumar:40Qtl:97000INR',
                version: QrVersions.auto,
                size: 160.0,
              ),

              const SizedBox(height: 12),
              Text(
                'Token ID: #$tokenId',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF3730A3)),
              ),

              const SizedBox(height: 20),

              // Summary Table
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Farmer Name:', style: TextStyle(fontWeight: FontWeight.bold)),
                        Text('Ramesh Kumar Chaudhary'),
                      ],
                    ),
                    SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Produce & Grade:', style: TextStyle(fontWeight: FontWeight.bold)),
                        Text('40.0 Qtl Wheat (Grade A)'),
                      ],
                    ),
                    SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('MSP Guaranteed Rate:', style: TextStyle(fontWeight: FontWeight.bold)),
                        Text('₹2,425.00 / Qtl'),
                      ],
                    ),
                    Divider(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Net DBT Payable:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF4338CA))),
                        Text('₹97,000.00', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF4338CA))),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('🖨️ Gate Pass Downloaded to Device Storage')),
                  );
                },
                icon: const Icon(Icons.download, color: Colors.white),
                label: const Text('Download Official PDF Pass', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
