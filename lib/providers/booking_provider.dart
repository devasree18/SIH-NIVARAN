import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/api_service.dart';

class BookingState {
  final bool isLoading;
  final String? activeTokenId;
  final Map<String, dynamic>? bookingData;
  final String? errorMessage;

  BookingState({
    this.isLoading = false,
    this.activeTokenId,
    this.bookingData,
    this.errorMessage,
  });

  BookingState copyWith({
    bool? isLoading,
    String? activeTokenId,
    Map<String, dynamic>? bookingData,
    String? errorMessage,
  }) {
    return BookingState(
      isLoading: isLoading ?? this.isLoading,
      activeTokenId: activeTokenId ?? this.activeTokenId,
      bookingData: bookingData ?? this.bookingData,
      errorMessage: errorMessage,
    );
  }
}

class BookingNotifier extends StateNotifier<BookingState> {
  BookingNotifier() : super(BookingState(activeTokenId: 'TKN-KNL-01-001'));

  Future<bool> bookSmartSlot({
    required String crop,
    required double quantity,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final res = await apiService.createBooking(
        farmerId: 'FARMER-HR-2026-101',
        centreId: 'centre-knl-01',
        crop: crop,
        quantity: quantity,
        preferredDate: DateTime.now().toIso8601String().split('T')[0],
      );

      final data = res['data'];
      final newTokenId = data != null ? (data['tokenId'] ?? 'TKN-KNL-01-042') : 'TKN-KNL-01-042';

      state = state.copyWith(
        isLoading: false,
        activeTokenId: newTokenId,
        bookingData: data,
      );
      return true;
    } catch (e) {
      // Demo fallback in offline/sim mode
      state = state.copyWith(
        isLoading: false,
        activeTokenId: 'TKN-KNL-01-042',
      );
      return true;
    }
  }
}

final bookingProvider = StateNotifierProvider<BookingNotifier, BookingState>((ref) {
  return BookingNotifier();
});
