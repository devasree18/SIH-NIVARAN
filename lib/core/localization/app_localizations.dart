import 'package:flutter/material.dart';

class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  static const List<Locale> supportedLocales = [
    Locale('en', ''),
    Locale('hi', ''),
    Locale('ta', ''),
    Locale('pb', ''),
  ];

  static final Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'appName': 'MandiSync',
      'appSubtitle': 'Smart Procurement & Zero-UI Platform',
      'bookSlotTitle': 'Smart Concurrency Slot Booking',
      'selectCrop': 'Select MSP Crop',
      'produceQty': 'Produce Quantity (Quintals)',
      'confirmBooking': '⚡ Confirm Smart Slot & Issue Token',
      'liveQueue': 'Live Mandi Queue Position',
      'tokenNumber': 'Active Token Number',
      'queuePosition': 'Current Position in Line',
      'nowServing': 'Now Processing at Counter',
      'viewGatePass': 'View Digital Gate Pass',
      'trackQueue': 'Track Live Queue Status',
      'verifiedFarmer': 'PM-Kisan Verified Farmer',
    },
    'hi': {
      'appName': 'मंडीसिंक',
      'appSubtitle': 'स्मार्ट कृषि खरीद एवं शून्य-यूआई प्रणाली',
      'bookSlotTitle': 'स्मार्ट स्लॉट बुकिंग व एंटी-घोस्ट सुरक्षा',
      'selectCrop': 'एमएसपी फसल चुनें',
      'produceQty': 'उपज मात्रा (क्विंटल)',
      'confirmBooking': '⚡ स्मार्ट स्लॉट सुरक्षित करें व टोकन लें',
      'liveQueue': 'लाइव कतार स्थिति बोर्ड',
      'tokenNumber': 'सक्रिय टोकन संख्या',
      'queuePosition': 'वर्तमान कतार क्रम',
      'nowServing': 'काउंटर पर बुलावा',
      'viewGatePass': 'डिजिटल गेट पास देखें',
      'trackQueue': 'लाइव कतार स्थिति ट्रैक करें',
      'verifiedFarmer': 'पीएम-किसान सत्यापित किसान',
    },
    'ta': {
      'appName': 'மண்டிசின்க்',
      'appSubtitle': 'ஸ்மார்ட் கொள்முதல் & IVR சேவை',
      'bookSlotTitle': 'ஸ்மார்ட் முன்பதிவு தளம்',
      'selectCrop': 'பயிரைத் தேர்ந்தெடுக்கவும்',
      'produceQty': 'அளவு (குவிண்டால்)',
      'confirmBooking': '⚡ முன்பதிவு செய்து டோக்கன் பெறுக',
      'liveQueue': 'நேரடி வரிசை பலகை',
      'tokenNumber': 'டோக்கன் எண்',
      'queuePosition': 'வரிசை நிலை',
      'nowServing': 'கவுண்டர் அழைப்பு',
      'viewGatePass': 'நுழைவுச்சீட்டைப் பார்க்கவும்',
      'trackQueue': 'வரிசையைக் கண்காணிக்கவும்',
      'verifiedFarmer': 'PM-கிசான் சான்றளிக்கப்பட்ட விவசாயி',
    },
    'pb': {
      'appName': 'ਮੰਡੀਸਿੰਕ',
      'appSubtitle': 'ਸਮਾਰਟ ਖਰੀਦ ਪ੍ਰਬੰਧਨ ਪ੍ਰਣਾਲੀ',
      'bookSlotTitle': 'ਸਮਾਰਟ ਸਲਾਟ ਬੁਕਿੰਗ',
      'selectCrop': 'ਫ਼ਸਲ ਚੁਣੋ',
      'produceQty': 'ਮਾਤਰਾ (ਕੁਇੰਟਲ)',
      'confirmBooking': '⚡ ਸਮਾਰਟ ਸਲਾਟ ਬੁੱਕ ਕਰੋ ਅਤੇ ਟੋਕਨ ਲਵੋ',
      'liveQueue': 'ਲਾਈਵ ਕਤਾਰ ਬੋਰਡ',
      'tokenNumber': 'ਟੋਕਨ ਨੰਬਰ',
      'queuePosition': 'ਕਤਾਰ ਨੰਬਰ',
      'nowServing': 'ਕਾਊਂਟਰ ਸੱਦਾ',
      'viewGatePass': 'ਡਿਜੀਟਲ ਗੇਟ ਪਾਸ ਵੇਖੋ',
      'trackQueue': 'ਲਾਈਵ ਕਤਾਰ ਟਰੈਕ ਕਰੋ',
      'verifiedFarmer': 'ਪੀਐਮ-ਕਿਸਾਨ ਤਸਦੀਕਸ਼ੁਦਾ ਕਿਸਾਨ',
    },
  };

  String translate(String key) {
    return _localizedValues[locale.languageCode]?[key] ?? _localizedValues['en']?[key] ?? key;
  }
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'hi', 'ta', 'pb'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
