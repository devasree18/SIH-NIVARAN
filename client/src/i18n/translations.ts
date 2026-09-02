export type Language = 'en' | 'hi' | 'pb';

export const translations = {
  en: {
    // Navigation
    appName: 'NIVARAN',
    appSubtitle: 'Smart Agricultural Procurement Management System',
    farmerDashboard: 'Farmer Portal',
    bookSlot: 'Book Mandi Slot',
    myTokens: 'My Tokens & Live Queue',
    myPayments: 'Payment & DBT Status',
    centreAdmin: 'Mandi Admin Control',
    queueOperator: 'Queue Counter Desk',
    qualityOfficer: 'Quality & Assay Lab',
    weighmentDesk: 'Weighbridge Terminal',
    financeDesk: 'PFMS Finance Portal',
    mandiBoard: 'Public Queue Display',
    cultivationCosts: 'Input Cost vs MSP',
    auditLogs: 'Audit Trail',
    switchRole: 'Switch Demonstration Role',
    logout: 'Sign Out',

    // Common Statuses
    active: 'Active',
    scheduled: 'Scheduled',
    checkedIn: 'Checked In',
    waiting: 'Waiting in Queue',
    called: 'Token Called',
    processing: 'Testing / Weighing',
    completed: 'Procurement Done',
    delayed: 'Centre Delay',
    extended: 'Validity Protected',
    cancelled: 'Cancelled',

    // Farmer Core Outcomes
    nextActionTitle: 'Your Next Action',
    tokenNumber: 'Token Number',
    queuePosition: 'Live Queue Position',
    farmersAhead: 'Farmers Ahead of You',
    estimatedWaitTime: 'Estimated Wait Time',
    centreName: 'Procurement Centre',
    allocatedQty: 'Allocated Quantity',
    procuredQty: 'Accepted Quantity',
    payableAmount: 'Total Payable Amount',
    qualityStatus: 'Assay Quality Status',
    paymentStatus: 'DBT Payment Status',
    checkInAction: 'Check-In Now (Arrival)',
    viewReceipt: 'Digital Receipt',

    // Timeline Steps
    stepRegistration: 'Registration',
    stepBooking: 'Slot Booked',
    stepToken: 'Token Issued',
    stepCheckIn: 'Mandi Check-In',
    stepQuality: 'Quality Assay',
    stepWeighment: 'Weighment',
    stepConfirmed: 'Procurement Done',
    stepPayment: 'DBT Payment',

    // Congestion & Delay
    congestionLow: 'Normal Flow (Arrival on schedule)',
    congestionModerate: 'Moderate Traffic (Keep sample ready)',
    congestionHigh: 'High Congestion (Token Auto-Protected)',
    congestionCritical: 'Critical Delay (Validity Extended)',
    delayProtectionNotice: 'Protected: Your appointment validity was automatically extended due to centre delay. You will not face cancellation.',
    
    // Notifications & Errors
    noAppointments: 'No procurement appointments scheduled today.',
    queueError: 'Unable to retrieve live queue status. Please try again.',
    slotBookedSuccess: 'Slot booked successfully! Your token has been issued.',
  },

  hi: {
    // Navigation
    appName: 'निवारण (NIVARAN)',
    appSubtitle: 'स्मार्ट कृषि खरीद एवं मंडी प्रबंधन प्रणाली',
    farmerDashboard: 'किसान पोर्टल',
    bookSlot: 'मंडी स्लॉट बुक करें',
    myTokens: 'मेरे टोकन एवं लाइव कतार',
    myPayments: 'भुगतान एवं डीबीटी स्थिति',
    centreAdmin: 'मंडी प्रबंधक नियंत्रण',
    queueOperator: 'कतार ऑपरेटर काउंटर',
    qualityOfficer: 'गुणवत्ता परख प्रयोगशाला',
    weighmentDesk: 'धर्मकांटा वजन केंद्र',
    financeDesk: 'वित्त एवं भुगतान प्रणाली',
    mandiBoard: 'सार्वजनिक कतार स्क्रीन',
    cultivationCosts: 'लागत मूल्य बनाम एमएसपी',
    auditLogs: 'ऑडिट लॉग',
    switchRole: 'डेमो भूमिका बदलें',
    logout: 'लॉग आउट',

    // Common Statuses
    active: 'सक्रिय',
    scheduled: 'निर्धारित',
    checkedIn: 'मंडी में उपस्थित',
    waiting: 'कतार में प्रतीक्षारत',
    called: 'टोकन बुलाया गया',
    processing: 'जांच / तौल जारी',
    completed: 'खरीद संपन्न',
    delayed: 'मंडी में विलंब',
    extended: 'सुरक्षा विस्तार लागू',
    cancelled: 'रद्द',

    // Farmer Core Outcomes
    nextActionTitle: 'अगला आवश्यक कदम',
    tokenNumber: 'टोकन क्रमांक',
    queuePosition: 'वर्तमान कतार स्थिति',
    farmersAhead: 'आपसे आगे किसान',
    estimatedWaitTime: 'अनुमानित प्रतीक्षा समय',
    centreName: 'खरीद केंद्र',
    allocatedQty: 'स्वीकृत स्लॉट मात्रा',
    procuredQty: 'अंतिम स्वीकृत मात्रा',
    payableAmount: 'कुल देय राशि',
    qualityStatus: 'गुणवत्ता परख स्थिति',
    paymentStatus: 'बैंक भुगतान (DBT) स्थिति',
    checkInAction: 'मंडी में आमद दर्ज करें (चेक-इन)',
    viewReceipt: 'डिजिटल खरीद रसीद',

    // Timeline Steps
    stepRegistration: 'पंजीकरण',
    stepBooking: 'स्लॉट बुकिंग',
    stepToken: 'टोकन जारी',
    stepCheckIn: 'मंडी आमद',
    stepQuality: 'गुणवत्ता जांच',
    stepWeighment: 'वजन तौल',
    stepConfirmed: 'खरीद पुष्टि',
    stepPayment: 'बैंक भुगतान',

    // Congestion & Delay
    congestionLow: 'सामान्य स्थिति (समय पर पहुंचें)',
    congestionModerate: 'मध्यम भीड़ (नमूना तैयार रखें)',
    congestionHigh: 'अधिक भीड़ (टोकन स्वतः सुरक्षित)',
    congestionCritical: 'गंभीर विलंब (वैधता स्वतः बढ़ाई गई)',
    delayProtectionNotice: 'सुरक्षा सूचना: मंडी में देरी के कारण आपकी टोकन वैधता स्वतः बढ़ा दी गई है। आपको कोई असुविधा नहीं होगी।',

    // Notifications & Errors
    noAppointments: 'आज के लिए कोई खरीद नियुक्ति निर्धारित नहीं है।',
    queueError: 'कतार स्थिति प्राप्त करने में असमर्थ। कृपया पुनः प्रयास करें।',
    slotBookedSuccess: 'स्लॉट सफलतापूर्वक बुक हो गया! आपका टोकन नंबर जारी कर दिया गया है।',
  },

  pb: {
    // Navigation
    appName: 'ਨਿਵਾਰਣ (NIVARAN)',
    appSubtitle: 'ਸਮਾਰਟ ਖੇਤੀਬਾੜੀ ਖਰੀਦ ਪ੍ਰਬੰਧਨ ਪ੍ਰਣਾਲੀ',
    farmerDashboard: 'ਕਿਸਾਨ ਪੋਰਟਲ',
    bookSlot: 'ਮੰਡੀ ਸਲਾਟ ਬੁੱਕ ਕਰੋ',
    myTokens: 'ਮੇਰੇ ਟੋਕਨ ਅਤੇ ਲਾਈਵ ਲਾਈਨ',
    myPayments: 'ਭੁਗਤਾਨ ਅਤੇ DBT ਸਥਿਤੀ',
    centreAdmin: 'ਮੰਡੀ ਪ੍ਰਬੰਧਕ ਕੰਟਰੋਲ',
    queueOperator: 'ਕਾਊਂਟਰ ਆਪਰੇਟਰ',
    qualityOfficer: 'ਗੁਣਵੱਤਾ ਪਰਖ ਲੈਬ',
    weighmentDesk: 'ਕੰਪਿਊਟਰੀ ਧਰਮਕੰਡਾ',
    financeDesk: 'ਵਿੱਤ ਅਤੇ ਭੁਗਤਾਨ ਡੈਸਕ',
    mandiBoard: 'ਪਬਲਿਕ ਲਾਈਨ ਡਿਸਪਲੇ',
    cultivationCosts: 'ਲਾਗਤ ਖਰਚਾ ਬਨਾਮ MSP',
    auditLogs: 'ਆਡਿਟ ਲੌਗ',
    switchRole: 'ਡੈਮੋ ਭੂਮਿਕਾ ਬਦਲੋ',
    logout: 'ਲਾਗ ਆਊਟ',

    // Common Statuses
    active: 'ਸਰਗਰਮ',
    scheduled: 'ਨਿਰਧਾਰਤ',
    checkedIn: 'ਮੰਡੀ ਪਹੁੰਚੇ',
    waiting: 'ਲਾਈਨ ਵਿੱਚ ਉਡੀਕ',
    called: 'ਟੋਕਨ ਸੱਦਿਆ ਗਿਆ',
    processing: 'ਪਰਖ / ਤੁਲਾਈ ਜਾਰੀ',
    completed: 'ਖਰੀਦ ਮੁਕੰਮਲ',
    delayed: 'ਮੰਡੀ ਵਿੱਚ ਦੇਰੀ',
    extended: 'ਮਿਆਦ ਵਧਾਈ ਗਈ',
    cancelled: 'ਰੱਦ',

    // Farmer Core Outcomes
    nextActionTitle: 'ਅਗਲਾ ਕਦਮ',
    tokenNumber: 'ਟੋਕਨ ਨੰਬਰ',
    queuePosition: 'ਮੌਜੂਦਾ ਲਾਈਨ ਨੰਬਰ',
    farmersAhead: 'ਤੁਹਾਡੇ ਤੋਂ ਅੱਗੇ ਕਿਸਾਨ',
    estimatedWaitTime: 'ਅੰਦਾਜ਼ਨ ਉਡੀਕ ਸਮਾਂ',
    centreName: 'ਖਰੀਦ ਕੇਂਦਰ',
    allocatedQty: 'ਬੁੱਕ ਕੀਤੀ ਮਾਤਰਾ',
    procuredQty: 'ਖਰੀਦੀ ਗਈ ਮਾਤਰਾ',
    payableAmount: 'ਕੁੱਲ ਰਕਮ (ਰੁਪਏ)',
    qualityStatus: 'ਗੁਣਵੱਤਾ ਪਰਖ ਰਿਪੋਰਟ',
    paymentStatus: 'ਬੈਂਕ ਖਾਤਾ ਭੁਗਤਾਨ (DBT)',
    checkInAction: 'ਮੰਡੀ ਆਮਦ ਦਰਜ ਕਰੋ (Check-In)',
    viewReceipt: 'ਡਿਜੀਟਲ ਖਰੀਦ ਰਸੀਦ',

    // Timeline Steps
    stepRegistration: 'ਰਜਿਸਟ੍ਰੇਸ਼ਨ',
    stepBooking: 'ਸਲਾਟ ਬੁਕਿੰਗ',
    stepToken: 'ਟੋਕਨ ਜਾਰੀ',
    stepCheckIn: 'ਮੰਡੀ ਹਾਜ਼ਰੀ',
    stepQuality: 'ਗੁਣਵੱਤਾ ਪਰਖ',
    stepWeighment: 'ਕੰਡੇ ਤੇ ਤੁਲਾਈ',
    stepConfirmed: 'ਖਰੀਦ ਪੁਸ਼ਟੀ',
    stepPayment: 'ਸਿੱਧਾ ਭੁਗਤਾਨ',

    // Congestion & Delay
    congestionLow: 'ਸਧਾਰਨ ਹਾਲਾਤ (ਸਮੇਂ ਸਿਰ ਪਹੁੰਚੋ)',
    congestionModerate: 'ਦਰਮਿਆਨੀ ਭੀੜ (ਸੈਂਪਲ ਤਿਆਰ ਰੱਖੋ)',
    congestionHigh: 'ਭਾਰੀ ਭੀੜ (ਟੋਕਨ ਆਪਣੇ ਆਪ ਸੁਰੱਖਿਅਤ)',
    congestionCritical: 'ਵੱਡੀ ਦੇਰੀ (ਮਿਆਦ ਵਧਾ ਦਿੱਤੀ ਗਈ)',
    delayProtectionNotice: 'ਸੁਰੱਖਿਆ ਸੂਚਨਾ: ਮੰਡੀ ਵਿੱਚ ਦੇਰੀ ਕਾਰਨ ਤੁਹਾਡੇ ਟੋਕਨ ਦੀ ਮਿਆਦ ਵਧਾ ਦਿੱਤੀ ਗਈ ਹੈ। ਤੁਹਾਡਾ ਟੋਕਨ ਰੱਦ ਨਹੀਂ ਹੋਵੇਗਾ।',

    // Notifications & Errors
    noAppointments: 'ਅੱਜ ਲਈ ਕੋਈ ਖਰੀਦ ਮੁਲਾਕਾਤ ਨਿਰਧਾਰਤ ਨਹੀਂ ਹੈ।',
    queueError: 'ਲਾਈਵ ਲਾਈਨ ਦੀ ਸਥਿਤੀ ਪ੍ਰਾਪਤ ਕਰਨ ਵਿੱਚ ਅਸਮਰੱਥ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    slotBookedSuccess: 'ਸਲਾਟ ਕਾਮਯਾਬੀ ਨਾਲ ਬੁੱਕ ਹੋ ਗਿਆ! ਤੁਹਾਡਾ ਟੋਕਨ ਨੰਬਰ ਜਾਰੀ ਕੀਤਾ ਗਿਆ ਹੈ।',
  },
};
