import { prisma } from '../prisma';
import { telephonyService, SupportedLanguage } from './telephonyService';
import { slotAllocationService } from './slotAllocationService';

export interface IVRWebhookPayload {
  CallSid: string;
  From: string;
  Digits?: string;
  Step?: string;
  Lang?: SupportedLanguage;
}

class IVRService {
  /**
   * Process incoming IVR call step and return TwiML/XML or JSON voice response
   */
  public async handleCallStep(payload: IVRWebhookPayload) {
    const phoneNumber = payload.From.replace(/[^0-9+]/g, '');
    const callSid = payload.CallSid || `CALL-${Date.now()}`;
    const dtmf = payload.Digits || '';

    // Find or create call session log
    let session = await prisma.iVRCallLog.findUnique({
      where: { callSid },
    });

    if (!session) {
      session = await prisma.iVRCallLog.create({
        data: {
          callSid,
          phoneNumber,
          language: 'hi',
          currentStep: 'WELCOME',
          dtmfInputs: JSON.stringify([]),
        },
      });
    }

    const currentInputs: string[] = JSON.parse(session.dtmfInputs || '[]');
    if (dtmf) {
      currentInputs.push(dtmf);
    }

    let nextStep = session.currentStep;
    let language: SupportedLanguage = (session.language as SupportedLanguage) || 'hi';
    let promptMessage = '';
    let responseAction = 'GATHER'; // GATHER, HANGUP

    // STEP 1: WELCOME & CROP SELECTION
    if (session.currentStep === 'WELCOME') {
      if (dtmf === '1') {
        language = 'en';
      } else if (dtmf === '2') {
        language = 'hi';
      } else if (dtmf === '3') {
        language = 'ta';
      } else if (dtmf === '4') {
        language = 'pb';
      }

      nextStep = 'CROP_SELECT';
      if (language === 'en') {
        promptMessage = 'Welcome to MandiSync Zero-UI Helpline. Press 1 for Wheat, 2 for Paddy, 3 for Mustard, 4 for Gram.';
      } else if (language === 'ta') {
        promptMessage = 'மண்டிசின்க் சேவைக்கு வரவேற்கிறோம். கோதுமைக்கு 1, நெல்லுக்கு 2, கடுகுக்கு 3 அழுத்தவும்.';
      } else if (language === 'pb') {
        promptMessage = 'ਮੰਡੀਸਿੰਕ ਵਿੱਚ ਸੁਆਗਤ ਹੈ। ਕਣਕ ਲਈ 1, ਝੋਨੇ ਲਈ 2, ਸਰ੍ਹੋਂ ਲਈ 3 ਦਬਾਓ।';
      } else {
        promptMessage = 'मंडीसिंक शून्य-यूआई हेल्पलाइन में आपका स्वागत है। गेहूं के लिए 1 दबाएं, धान के लिए 2 दबाएं, सरसों के लिए 3 दबाएं, चने के लिए 4 दबाएं।';
      }
    }
    // STEP 2: CROP SELECTED -> ENTER QUANTITY
    else if (session.currentStep === 'CROP_SELECT') {
      let cropName = 'Wheat';
      if (dtmf === '2') cropName = 'Paddy';
      else if (dtmf === '3') cropName = 'Mustard';
      else if (dtmf === '4') cropName = 'Gram';

      nextStep = 'QTY_ENTER';
      if (language === 'en') {
        promptMessage = `Crop ${cropName} selected. Please enter your estimated produce quantity in quintals followed by hash. For example 40 hash.`;
      } else if (language === 'ta') {
        promptMessage = `பயிர் ${cropName} தேர்ந்தெடுக்கப்பட்டது. அளவை உள்ளிட்டு ஹேஷ் அழுத்தவும் (उदा. 40#).`;
      } else if (language === 'pb') {
        promptMessage = `ਫ਼ਸਲ ${cropName} ਚੁਣੀ ਗਈ। ਮਾਤਰਾ ਦਰਜ ਕਰਕੇ ਹੈਸ਼ ਦਬਾਓ (ਜਿਵੇਂ 40#)।`;
      } else {
        promptMessage = `फसल ${cropName} चुनी गई। अपनी उपज की मात्रा क्विंटल में दर्ज करके हैश (#) दबाएं। उदाहरण के लिए 40 हैश।`;
      }
    }
    // STEP 3: QUANTITY ENTERED -> EXECUTE SMART SLOT ALLOCATION & SMS
    else if (session.currentStep === 'QTY_ENTER') {
      const quantityNum = parseFloat(dtmf.replace('#', '')) || 40.0;
      
      // Auto-fetch farmer or default demo farmer
      let farmer = await prisma.farmer.findUnique({
        where: { mobileNumber: phoneNumber },
      });

      if (!farmer) {
        farmer = await prisma.farmer.findFirst({
          where: { farmerId: 'FARMER-HR-2026-101' },
        });
      }

      const farmerId = farmer ? farmer.farmerId : 'FARMER-HR-2026-101';
      const centre = await prisma.procurementCentre.findFirst() || { id: 'centre-knl-01', name: 'Karnal Central Mandi Hub' };

      // Allocate smart slot concurrency safely
      const todayDate = new Date().toISOString().split('T')[0];
      const slotResult = await slotAllocationService.allocateSmartSlot({
        farmerId,
        centreId: centre.id,
        crop: 'Wheat',
        requestedQuantity: quantityNum,
        preferredDate: todayDate,
      });

      const tokenId = slotResult.booking.tokenId;
      nextStep = 'COMPLETED';
      responseAction = 'HANGUP';

      // Send Instant Dynamic SMS Notification
      await telephonyService.sendNotification({
        recipient: phoneNumber || farmer?.mobileNumber || '+919876543210',
        templateCode: 'TOKEN_CONFIRMATION',
        language,
        variables: {
          tokenId,
          crop: 'Wheat',
          quantity: quantityNum.toString(),
          centreName: centre.name,
          time: 'Today 08:30 AM',
          queueNum: slotResult.booking.queueNumber.toString(),
        },
      });

      if (language === 'en') {
        promptMessage = `Success! Your smart slot for ${quantityNum} Quintals has been confirmed. Token number ${tokenId} has been issued and sent via SMS. Thank you for calling MandiSync.`;
      } else if (language === 'ta') {
        promptMessage = `முன்பதிவு வெற்றி! ${quantityNum} குவிண்டால் தானியத்திற்கு டோக்கன் ${tokenId} வழங்கப்பட்டு எஸ்எம்எஸ் அனுப்பப்பட்டது. நன்றி.`;
      } else if (language === 'pb') {
        promptMessage = `ਸਫ਼ਲਤਾ! ${quantityNum} ਕੁਇੰਟਲ ਲਈ ਟੋਕਨ ${tokenId} ਜਾਰੀ ਕੀਤਾ ਗਿਆ ਅਤੇ ਐਸਐਮਐਸ ਭੇਜਿਆ ਗਿਆ। ਧੰਨਵਾਦ।`;
      } else {
        promptMessage = `सफलता! ${quantityNum} क्विंटल उपज के लिए आपका स्लॉट सुरक्षित कर लिया गया है। टोकन नंबर ${tokenId} जारी कर आपके मोबाइल पर एसएमएस भेज दिया गया है। मंडीसिंक में कॉल करने के लिए धन्यवाद।`;
      }

      // Update call log
      await prisma.iVRCallLog.update({
        where: { id: session.id },
        data: {
          tokenId,
          bookingId: slotResult.booking.id,
          callStatus: 'COMPLETED',
        },
      });
    }

    // Update log step state
    await prisma.iVRCallLog.update({
      where: { id: session.id },
      data: {
        currentStep: nextStep,
        language,
        dtmfInputs: JSON.stringify(currentInputs),
      },
    });

    return {
      callSid,
      step: nextStep,
      language,
      promptMessage,
      action: responseAction,
      twiml: `<Response><Say voice="alice" language="${language === 'hi' ? 'hi-IN' : 'en-IN'}">${promptMessage}</Say>${responseAction === 'GATHER' ? '<Gather numDigits="1" timeout="10"/>' : '<Hangup/>'}</Response>`,
    };
  }
}

export const ivrService = new IVRService();
