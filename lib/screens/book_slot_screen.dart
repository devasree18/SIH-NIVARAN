import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/booking_provider.dart';

class BookSlotScreen extends ConsumerStatefulWidget {
  const BookSlotScreen({super.key});

  @override
  ConsumerState<BookSlotScreen> createState() => _BookSlotScreenState();
}

class _BookSlotScreenState extends ConsumerState<BookSlotScreen> {
  String selectedCrop = 'Wheat';
  double quantity = 40.0;
  final TextEditingController _qtyController = TextEditingController(text: '40');

  final List<Map<String, String>> crops = [
    {'name': 'Wheat', 'hindi': 'गेहूं', 'msp': '₹2,425 / Qtl'},
    {'name': 'Paddy', 'hindi': 'धान', 'msp': '₹2,320 / Qtl'},
    {'name': 'Mustard', 'hindi': 'सरसों', 'msp': '₹5,650 / Qtl'},
    {'name': 'Gram', 'hindi': 'चना', 'msp': '₹5,440 / Qtl'},
  ];

  @override
  Widget build(BuildContext context) {
    final bookingState = ref.watch(bookingProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.agriculture, color: Colors.white),
            SizedBox(width: 8),
            Text(
              'MandiSync',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF4F46E5),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code, color: Colors.white),
            onPressed: () => context.push('/receipt/TKN-KNL-01-001'),
          ),
          IconButton(
            icon: const Icon(Icons.format_list_numbered, color: Colors.white),
            onPressed: () => context.push('/queue'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Farmer Verified Profile Header Card
            Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4F46E5), Color(0xFF312E81)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [
                  BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4)),
                ],
              ),
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Expanded(
                        child: Text(
                          'Ramesh Kumar Chaudhary',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          '✓ PM-Kisan 100% Verified',
                          style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'PMK-HR-8910234 • Village Taraori, Karnal',
                    style: TextStyle(color: Color(0xFFC7D2FE), fontSize: 13),
                  ),
                  const Divider(color: Colors.white24, height: 24),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Land: 8.5 Acres', style: TextStyle(color: Colors.white, fontSize: 12)),
                      Text('Max Yield Cap: 212.5 Qtl', style: TextStyle(color: Colors.white, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Booking Form Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Smart Slot Booking & Anti-Ghost Protection',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 16),

                    // Crop Selection Dropdown
                    const Text('Select Crop (MSP Guaranteed)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      value: selectedCrop,
                      decoration: InputDecoration(
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                      items: crops.map((c) {
                        return DropdownMenuItem<String>(
                          value: c['name'],
                          child: Text('${c['name']} (${c['hindi']}) - ${c['msp']}'),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => selectedCrop = val);
                      },
                    ),

                    const SizedBox(height: 16),

                    // Quantity Input
                    const Text('Produce Quantity (Quintals)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _qtyController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        suffixText: 'Qtl',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onChanged: (val) {
                        setState(() {
                          quantity = double.tryParse(val) ?? 40.0;
                        });
                      },
                    ),

                    const SizedBox(height: 20),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4F46E5),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: bookingState.isLoading
                            ? null
                            : () async {
                                final success = await ref
                                    .read(bookingProvider.notifier)
                                    .bookSmartSlot(crop: selectedCrop, quantity: quantity);

                                if (success && mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('✓ Smart Slot Confirmed for $selectedCrop! Token #${ref.read(bookingProvider).activeTokenId} issued.'),
                                      backgroundColor: const Color(0xFF10B981),
                                    ),
                                  );
                                  context.push('/receipt/${ref.read(bookingProvider).activeTokenId}');
                                }
                              },
                        child: bookingState.isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Text(
                                '⚡ Confirm Smart Slot & Issue Token',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
