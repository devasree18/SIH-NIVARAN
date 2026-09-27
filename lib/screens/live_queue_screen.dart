import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class LiveQueueScreen extends StatelessWidget {
  const LiveQueueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Mandi Queue Board', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF4F46E5),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Active Callout Card
            Card(
              elevation: 2,
              color: const Color(0xFFEEF2FF),
              shape: RoundedRectangleBorder(
                side: const BorderSide(color: Color(0xFFC7D2FE)),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Padding(
                padding: EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('🟢 Now Processing at Counter #1', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF3730A3), fontSize: 15)),
                        SizedBox(height: 4),
                        Text('#TKN-KNL-01-001 (Ramesh Kumar)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      ],
                    ),
                    Chip(
                      label: Text('Counter #1', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      backgroundColor: Color(0xFFEF4444),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            const Text('Physically Waiting in Pavilion', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 10),

            Expanded(
              child: ListView(
                children: const [
                  ListTile(
                    tileColor: Colors.white,
                    leading: CircleAvatar(backgroundColor: Color(0xFFE0E7FF), child: Text('1')),
                    title: Text('#TKN-KNL-01-002 - Gurpreet Singh'),
                    subtitle: Text('50 Qtl Wheat • Verified Arrival'),
                    trailing: Chip(label: Text('Position #1')),
                  ),
                  Divider(),
                  ListTile(
                    tileColor: Colors.white,
                    leading: CircleAvatar(backgroundColor: Color(0xFFE0E7FF), child: Text('2')),
                    title: Text('#TKN-KNL-01-003 - Harpal Singh'),
                    subtitle: Text('35 Qtl Mustard • Waiting'),
                    trailing: Chip(label: Text('Position #2')),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
