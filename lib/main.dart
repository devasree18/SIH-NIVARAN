import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/localization/app_localizations.dart';
import 'screens/book_slot_screen.dart';
import 'screens/live_queue_screen.dart';
import 'screens/digital_gate_pass_screen.dart';

void main() {
  runApp(
    const ProviderScope(
      child: MandiSyncApp(),
    ),
  );
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const BookSlotScreen(),
    ),
    GoRoute(
      path: '/queue',
      builder: (context, state) => const LiveQueueScreen(),
    ),
    GoRoute(
      path: '/receipt/:tokenId',
      builder: (context, state) => DigitalGatePassScreen(
        tokenId: state.pathParameters['tokenId'] ?? 'TKN-KNL-01-001',
      ),
    ),
  ],
);

class MandiSyncApp extends ConsumerWidget {
  const MandiSyncApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'MandiSync Farmer App (SIH26032)',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4F46E5), // Modern Indigo Primary
          brightness: Brightness.light,
          primary: const Color(0xFF4F46E5),
          secondary: const Color(0xFF3730A3),
          surface: const Color(0xFFF8FAFC),
        ),
      ),
      routerConfig: _router,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
    );
  }
}
